import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

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

	getCompetitionMatchdayMatches: protectedProcedure
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
					footballSeason: true,
				},
			});

			if (!competition) {
				return null;
			}

			const currentMatchdayMatches = await ctx.db.footballMatch.findMany({
				where: {
					seasonId: competition.footballSeasonId,
					matchday: competition.footballSeason.currentMatchday,
				},
				include: {
					homeTeam: true,
					awayTeam: true,
					matchBets: {
						where: {
							competitionId: input.id,
						},
					},
				},
				orderBy: {
					date: "asc",
				},
			});

			const now = new Date();

			const processedMatches = currentMatchdayMatches.map((match) => {
				const currentUserBet = match.matchBets.find(
					(bet) => bet.userId === ctx.session.user.id,
				);

				const otherUsersBets =
					match.date <= now
						? match.matchBets.filter(
								(bet) => bet.userId !== ctx.session.user.id,
							)
						: [];

				const { matchBets: _, ...matchWithoutBets } = match;

				return {
					...matchWithoutBets,
					currentUserBet: currentUserBet || null,
					otherUsersBets,
				};
			});

			return {
				matches: processedMatches,
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
			const competition = await ctx.db.competition.findFirst({
				where: {
					id: input.competitionId,
					competitionUsers: {
						some: {
							userId: ctx.session.user.id,
							isActive: true,
						},
					},
					isActive: true,
				},
				include: {
					footballSeason: true,
				},
			});

			if (!competition) {
				return null;
			}

			const now = new Date();

			let cursorDate: Date | undefined;
			let cursorId: number | undefined;

			if (input.cursor) {
				try {
					const [dateStr, idStr] = input.cursor.split('_');
					if (dateStr && idStr) {
						cursorDate = new Date(dateStr);
						cursorId = parseInt(idStr, 10);
					}
				} catch {
					// Invalid cursor, ignore and start from beginning
				}
			}

			const whereClause: any = {
				seasonId: competition.footballSeasonId,
				date: {
					gt: now,
				},
			};

			if (cursorDate && cursorId) {
				whereClause.OR = [
					{
						date: {
							gt: cursorDate,
						},
					},
					{
						date: cursorDate,
						id: {
							gt: cursorId,
						},
					},
				];
				delete whereClause.date;
			}

			const matches = await ctx.db.footballMatch.findMany({
				where: whereClause,
				take: input.limit + 1,
				orderBy: [
					{ date: "asc" },
					{ id: "asc" },
				],
			});

			const hasNextPage = matches.length > input.limit;
			const items = hasNextPage ? matches.slice(0, -1) : matches;

			return {
				matches: items,
				nextCursor: hasNextPage ? `${items[items.length - 1]!.date.toISOString()}_${items[items.length - 1]!.id}` : null,
			};
		}),
});
