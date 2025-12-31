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

type FinishedMatchWithBets = Prisma.FootballMatchGetPayload<{
	include: {
		matchBets: {
			where: {
				competitionId: number;
			};
			include: {
				user: {
					select: {
						id: true;
						name: true;
						image: true;
					};
				};
			};
		};
	};
}> & {
	homeTeamGoals: number;
	awayTeamGoals: number;
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

function createNextCursor<T extends { id: number }>(
	items: T[],
	limit: number,
): string | null {
	const hasNextPage = items.length > limit;
	const finalItems = hasNextPage ? items.slice(0, -1) : items;
	const lastElementAsString = finalItems.at(-1)?.id.toString();

	return hasNextPage ? (lastElementAsString ?? null) : null;
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

			const matches = await ctx.db.footballMatch.findMany({
				where: {
					seasonId: competition.footballSeasonId,
					date: { lt: now },
				},
				cursor: cursorId ? { id: cursorId } : undefined,
				skip: cursorId ? 1 : 0,
				take: input.limit + 1,
				orderBy: [{ date: "desc" }, { id: "desc" }],
				include: {
					homeTeam: true,
					awayTeam: true,
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
			});

			const pageOfMatches =
				matches.length > input.limit ? matches.slice(0, -1) : matches;

			return {
				matches: pageOfMatches,
				nextCursor: createNextCursor(matches, input.limit),
			};
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

			const matches = await ctx.db.footballMatch.findMany({
				where: {
					seasonId: competition.footballSeasonId,
					date: { gt: now },
				},
				cursor: cursorId ? { id: cursorId } : undefined,
				skip: cursorId ? 1 : 0,
				take: input.limit + 1,
				orderBy: [{ date: "asc" }, { id: "asc" }],
				include: {
					homeTeam: true,
					awayTeam: true,
					matchBets: {
						where: {
							competitionId: input.competitionId,
							userId: ctx.session.user.id,
						},
					},
				},
			});

			const pageOfMatches =
				matches.length > input.limit ? matches.slice(0, -1) : matches;
			const processedMatches = processFutureMatches(pageOfMatches);

			return {
				matches: processedMatches,
				nextCursor: createNextCursor(matches, input.limit),
			};
		}),

	getCompetitionLeaderboard: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.query(async ({ ctx, input }) => {
			const competition = await validateCompetitionAccess(
				ctx.db,
				input.competitionId,
				ctx.session.user.id,
			);

			if (!competition) {
				return [];
			}

			const finishedMatches = (await ctx.db.footballMatch.findMany({
				where: {
					seasonId: competition.footballSeasonId,
					status: "FINISHED",
					homeTeamGoals: { not: null },
					awayTeamGoals: { not: null },
				},
				include: {
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
				orderBy: [{ date: "desc" }, { id: "desc" }],
			})) as FinishedMatchWithBets[];

			const userStatsMap = new Map<
				string,
				{
					user: { id: string; name: string; image: string | null };
					totalBets: number;
					correctPredictions: number;
					homeBets: { total: number; correct: number };
					awayBets: { total: number; correct: number };
					drawBets: { total: number; correct: number };
					recentForm: boolean[];
				}
			>();

			for (const match of finishedMatches) {
				const actualResult =
					match.homeTeamGoals > match.awayTeamGoals
						? "HOME"
						: match.homeTeamGoals < match.awayTeamGoals
							? "AWAY"
							: "DRAW";

				for (const bet of match.matchBets) {
					let userStats = userStatsMap.get(bet.userId);

					if (!userStats) {
						userStats = {
							user: bet.user,
							totalBets: 0,
							correctPredictions: 0,
							homeBets: { total: 0, correct: 0 },
							awayBets: { total: 0, correct: 0 },
							drawBets: { total: 0, correct: 0 },
							recentForm: [],
						};
						userStatsMap.set(bet.userId, userStats);
					}

					const isCorrect = bet.prediction === actualResult;

					userStats.totalBets++;
					if (isCorrect) {
						userStats.correctPredictions++;
					}

					if (bet.prediction === "HOME") {
						userStats.homeBets.total++;
						if (isCorrect) userStats.homeBets.correct++;
					} else if (bet.prediction === "AWAY") {
						userStats.awayBets.total++;
						if (isCorrect) userStats.awayBets.correct++;
					} else {
						userStats.drawBets.total++;
						if (isCorrect) userStats.drawBets.correct++;
					}

					if (userStats.recentForm.length < 10) {
						userStats.recentForm.unshift(isCorrect);
					} else {
						userStats.recentForm.pop();
						userStats.recentForm.unshift(isCorrect);
					}
				}
			}

			const leaderboard = Array.from(userStatsMap.values())
				.map((stats) => ({
					user: stats.user,
					totalBets: stats.totalBets,
					correctPredictions: stats.correctPredictions,
					successPercentage:
						stats.totalBets > 0
							? (stats.correctPredictions / stats.totalBets) * 100
							: 0,
					homeBets: stats.homeBets,
					homeSuccessPercentage:
						stats.homeBets.total > 0
							? (stats.homeBets.correct / stats.homeBets.total) * 100
							: 0,
					awayBets: stats.awayBets,
					awaySuccessPercentage:
						stats.awayBets.total > 0
							? (stats.awayBets.correct / stats.awayBets.total) * 100
							: 0,
					drawBets: stats.drawBets,
					drawSuccessPercentage:
						stats.drawBets.total > 0
							? (stats.drawBets.correct / stats.drawBets.total) * 100
							: 0,
					recentForm: stats.recentForm,
				}))
				.sort((a, b) => {
					if (a.correctPredictions !== b.correctPredictions) {
						return b.correctPredictions - a.correctPredictions;
					}
					return a.totalBets - b.totalBets;
				});

			return leaderboard;
		}),
});
