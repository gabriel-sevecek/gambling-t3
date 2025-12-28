import type { Prisma, PrismaClient } from "generated/prisma";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

type FutureMatchWithBets = Prisma.FootballMatchGetPayload<{
	include: {
		homeTeam: true;
		awayTeam: true;
		matchBets: {
			where: {
				competitionId: number;
				userId: string;
			};
		};
	};
}>;

type ProcessedFutureMatch = Omit<FutureMatchWithBets, "matchBets"> & {
	currentUserBet: FutureMatchWithBets["matchBets"][0] | null;
};

async function validateCompetitionAccess(
	db: PrismaClient,
	competitionId: number,
	userId: string,
): Promise<Prisma.CompetitionGetPayload<{
	include: {
		footballSeason: true;
	};
}> | null> {
	return await db.competition.findFirst({
		where: {
			id: competitionId,
			competitionUsers: {
				some: {
					userId: userId,
					isActive: true,
				},
			},
			isActive: true,
		},
		include: {
			footballSeason: true,
		},
	});
}

function parseCursor(cursor?: string): number | undefined {
	if (!cursor) {
		return undefined;
	}

	try {
		return parseInt(cursor, 10);
	} catch {
		return undefined;
	}
}

function processFutureMatches(
	matches: FutureMatchWithBets[],
): ProcessedFutureMatch[] {
	return matches.map((match) => {
		const currentUserBet = match.matchBets[0] || null;
		const { matchBets: _, ...matchWithoutBets } = match;

		return {
			...matchWithoutBets,
			currentUserBet,
		};
	});
}

function buildMatchQuery(
	db: PrismaClient,
	seasonId: number,
	dateFilter: { lt: Date } | { gt: Date },
	orderBy:
		| [{ date: "asc" }, { id: "asc" }]
		| [{ date: "desc" }, { id: "desc" }],
	cursorId: number | undefined,
	limit: number,
	includeOptions: {
		matchBets?: {
			where: {
				competitionId: number;
				userId?: string;
			};
			include?: {
				user: {
					select: {
						id: true;
						name: true;
						image: true;
					};
				};
			};
		};
	},
) {
	return db.footballMatch.findMany({
		where: {
			seasonId,
			date: dateFilter,
		},
		cursor: cursorId ? { id: cursorId } : undefined,
		skip: cursorId ? 1 : 0,
		take: limit + 1,
		orderBy,
		include: {
			homeTeam: true,
			awayTeam: true,
			...includeOptions,
		},
	});
}

function buildPaginationResult<T extends { id: number }, P>(
	items: T[],
	limit: number,
	processedItems: P[],
) {
	const hasNextPage = items.length > limit;
	const finalItems = hasNextPage ? items.slice(0, -1) : items;

	return {
		matches: processedItems,
		nextCursor: hasNextPage ? (finalItems.at(-1)?.id.toString() ?? null) : null,
	};
}

export const competitionRouter = createTRPCRouter({
	getUserCompetitions: protectedProcedure.query(async ({ ctx }) => {
		return await ctx.db.competition.findMany({
			where: {
				competitionUsers: {
					some: {
						userId: ctx.session.user.id,
						isActive: true,
					},
				},
				isActive: true,
			},
			include: {
				footballCompetition: true,
				footballSeason: true,
				competitionUsers: {
					where: {
						userId: ctx.session.user.id,
					},
				},
				_count: {
					select: {
						competitionUsers: {
							where: {
								isActive: true,
							},
						},
						matchBets: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}),

	getCompetitionById: protectedProcedure
		.input(z.object({ id: z.number() }))
		.query(async ({ ctx, input }) => {
			const competition = await ctx.db.competition.findFirst({
				where: {
					id: input.id,
					competitionUsers: {
						some: {
							userId: ctx.session.user.id,
							isActive: true,
						},
					},
					isActive: true,
				},
				include: {
					footballCompetition: true,
					footballSeason: true,
					competitionUsers: {
						where: {
							userId: ctx.session.user.id,
						},
					},
					_count: {
						select: {
							competitionUsers: {
								where: {
									isActive: true,
								},
							},
						},
					},
				},
			});

			return competition;
		}),

	getCompeitionPastMatches: protectedProcedure
		.input(
			z.object({
				competitionId: z.number(),
				cursor: z.string().optional(),
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const competition = await validateCompetitionAccess(
				ctx.db,
				input.competitionId,
				ctx.session.user.id,
			);

			if (!competition) {
				return null;
			}

			const now = new Date();

			const cursorId = parseCursor(input.cursor);

			const matches = await buildMatchQuery(
				ctx.db,
				competition.footballSeasonId,
				{ lt: now },
				[{ date: "desc" }, { id: "desc" }],
				cursorId,
				input.limit,
				{
					matchBets: {
						where: {
							competitionId: input.competitionId,
						},
						include: {
							user: {
								select: {
									id: true,
									name: true,
									image: true,
								},
							},
						},
					},
				},
			);

			const items =
				matches.length > input.limit ? matches.slice(0, -1) : matches;

			return buildPaginationResult(matches, input.limit, items);
		}),

	getAvailableCompetitions: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.competition.findMany({
			where: {
				isActive: true,
			},
			include: {
				footballCompetition: true,
				footballSeason: true,
				_count: {
					select: {
						competitionUsers: {
							where: {
								isActive: true,
							},
						},
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});
	}),

	joinCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.competitionUser.upsert({
				where: {
					userId_competitionId: {
						userId: ctx.session.user.id,
						competitionId: input.competitionId,
					},
				},
				update: {
					isActive: true,
				},
				create: {
					userId: ctx.session.user.id,
					competitionId: input.competitionId,
					isActive: true,
				},
			});
		}),

	leaveCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.competitionUser.update({
				where: {
					userId_competitionId: {
						userId: ctx.session.user.id,
						competitionId: input.competitionId,
					},
				},
				data: {
					isActive: false,
				},
			});
		}),

	placeBet: protectedProcedure
		.input(
			z.object({
				matchId: z.number(),
				competitionId: z.number(),
				prediction: z.enum(["HOME", "DRAW", "AWAY"]),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.matchBet.upsert({
				where: {
					userId_footballMatchId_competitionId: {
						userId: ctx.session.user.id,
						footballMatchId: input.matchId,
						competitionId: input.competitionId,
					},
				},
				update: {
					prediction: input.prediction,
				},
				create: {
					userId: ctx.session.user.id,
					footballMatchId: input.matchId,
					competitionId: input.competitionId,
					prediction: input.prediction,
				},
			});
		}),

	getCompetitionFutureMatches: protectedProcedure
		.input(
			z.object({
				competitionId: z.number(),
				cursor: z.string().optional(),
				limit: z.number().min(1).max(50).default(10),
			}),
		)
		.query(async ({ ctx, input }) => {
			const competition = await validateCompetitionAccess(
				ctx.db,
				input.competitionId,
				ctx.session.user.id,
			);

			if (!competition) {
				return null;
			}

			const now = new Date();

			const cursorId = parseCursor(input.cursor);

			const matches = await buildMatchQuery(
				ctx.db,
				competition.footballSeasonId,
				{ gt: now },
				[{ date: "asc" }, { id: "asc" }],
				cursorId,
				input.limit,
				{
					matchBets: {
						where: {
							competitionId: input.competitionId,
							userId: ctx.session.user.id,
						},
					},
				},
			);

			const items =
				matches.length > input.limit ? matches.slice(0, -1) : matches;
			const processedMatches = processFutureMatches(items);

			return buildPaginationResult(matches, input.limit, processedMatches);
		}),
});
