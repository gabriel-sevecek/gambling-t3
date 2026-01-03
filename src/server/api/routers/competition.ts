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

export type ProcessedFutureMatch = Omit<FutureMatchWithBets, "matchBets"> & {
	currentUserBet: FutureMatchWithBets["matchBets"][0] | null;
};

type MatchdayGroup = {
	matchday: number;
	totalMatches: number;
	dateGroups: {
		date: string;
		matches: ProcessedFutureMatch[];
	}[];
};

export type FinishedMatchWithBets = Prisma.FootballMatchGetPayload<{
	include: {
		homeTeam: true;
		awayTeam: true;
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

type PastMatchdayGroup = {
	matchday: number;
	totalMatches: number;
	dateGroups: {
		date: string;
		matches: FinishedMatchWithBets[];
	}[];
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

async function getMatchdayTotals(
	db: PrismaClient,
	seasonId: number,
	matchdays: number[],
): Promise<Map<number, number>> {
	const totals = await db.footballMatch.groupBy({
		by: ["matchday"],
		where: {
			seasonId,
			matchday: { in: matchdays },
		},
		_count: {
			id: true,
		},
	});

	return new Map(totals.map((item) => [item.matchday, item._count.id]));
}

function groupMatchesByMatchday(
	matches: ProcessedFutureMatch[],
	matchdayTotals: Map<number, number>,
): MatchdayGroup[] {
	const matchdayMap = new Map<number, ProcessedFutureMatch[]>();

	for (const match of matches) {
		const existing = matchdayMap.get(match.matchday) || [];
		existing.push(match);
		matchdayMap.set(match.matchday, existing);
	}

	return Array.from(matchdayMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([matchday, matches]) => {
			const dateGroups = matches.reduce(
				(acc, match) => {
					const dateKey = match.date.toDateString();
					const existing = acc.find((group) => group.date === dateKey);

					if (existing) {
						existing.matches.push(match);
					} else {
						acc.push({
							date: dateKey,
							matches: [match],
						});
					}

					return acc;
				},
				[] as { date: string; matches: ProcessedFutureMatch[] }[],
			);

			dateGroups.forEach((group) => {
				group.matches.sort((a, b) => a.date.getTime() - b.date.getTime());
			});

			dateGroups.sort((a, b) => {
				const dateA = new Date(a.date);
				const dateB = new Date(b.date);
				return dateA.getTime() - dateB.getTime();
			});

			return {
				matchday,
				totalMatches: matchdayTotals.get(matchday) || matches.length,
				dateGroups,
			};
		});
}

function groupPastMatchesByMatchday(
	matches: FinishedMatchWithBets[],
	matchdayTotals: Map<number, number>,
): PastMatchdayGroup[] {
	const matchdayMap = new Map<number, FinishedMatchWithBets[]>();

	for (const match of matches) {
		const existing = matchdayMap.get(match.matchday) || [];
		existing.push(match);
		matchdayMap.set(match.matchday, existing);
	}

	return Array.from(matchdayMap.entries())
		.sort(([a], [b]) => b - a)
		.map(([matchday, matches]) => {
			const dateGroups = matches.reduce(
				(acc, match) => {
					const dateKey = match.date.toDateString();
					const existing = acc.find((group) => group.date === dateKey);

					if (existing) {
						existing.matches.push(match);
					} else {
						acc.push({
							date: dateKey,
							matches: [match],
						});
					}

					return acc;
				},
				[] as { date: string; matches: FinishedMatchWithBets[] }[],
			);

			dateGroups.forEach((group) => {
				group.matches.sort((a, b) => b.date.getTime() - a.date.getTime());
			});

			dateGroups.sort((a, b) => {
				const dateA = new Date(a.date);
				const dateB = new Date(b.date);
				return dateB.getTime() - dateA.getTime();
			});

			return {
				matchday,
				totalMatches: matchdayTotals.get(matchday) || matches.length,
				dateGroups,
			};
		});
}

async function getUserRankInCompetition(
	db: PrismaClient,
	competitionId: number,
	userId: string,
): Promise<number | null> {
	const competition = await db.competition.findUnique({
		where: { id: competitionId },
		include: { footballSeason: true },
	});

	if (!competition) return null;

	const finishedMatches = await db.footballMatch.findMany({
		where: {
			seasonId: competition.footballSeasonId,
			status: "FINISHED",
			homeTeamGoals: { not: null },
			awayTeamGoals: { not: null },
		},
		include: {
			matchBets: {
				where: { competitionId },
				include: { user: { select: { id: true } } },
			},
		},
	});

	const userStatsMap = new Map<string, { correct: number; total: number }>();

	for (const match of finishedMatches) {
		const actualResult =
			match.homeTeamGoals! > match.awayTeamGoals!
				? "HOME"
				: match.homeTeamGoals! < match.awayTeamGoals!
					? "AWAY"
					: "DRAW";

		for (const bet of match.matchBets) {
			const stats = userStatsMap.get(bet.userId) || { correct: 0, total: 0 };
			stats.total++;
			if (bet.prediction === actualResult) {
				stats.correct++;
			}
			userStatsMap.set(bet.userId, stats);
		}
	}

	const sortedUsers = Array.from(userStatsMap.entries())
		.sort(([, a], [, b]) => {
			if (a.correct !== b.correct) return b.correct - a.correct;
			return a.total - b.total;
		});

	const userIndex = sortedUsers.findIndex(([id]) => id === userId);
	return userIndex === -1 ? null : userIndex + 1;
}

async function getUserRecentForm(
	db: PrismaClient,
	seasonId: number,
	competitionId: number,
	userId: string,
): Promise<{ correct: number; total: number }> {
	const recentMatches = await db.footballMatch.findMany({
		where: {
			seasonId,
			status: "FINISHED",
			homeTeamGoals: { not: null },
			awayTeamGoals: { not: null },
		},
		include: {
			matchBets: {
				where: {
					competitionId,
					userId,
				},
			},
		},
		orderBy: [{ date: "desc" }],
		take: 5,
	});

	let correct = 0;
	let total = 0;

	for (const match of recentMatches) {
		const bet = match.matchBets[0];
		if (!bet) continue;

		total++;
		const actualResult =
			match.homeTeamGoals! > match.awayTeamGoals!
				? "HOME"
				: match.homeTeamGoals! < match.awayTeamGoals!
					? "AWAY"
					: "DRAW";

		if (bet.prediction === actualResult) {
			correct++;
		}
	}

	return { correct, total };
}

export const competitionRouter = createTRPCRouter({
	getUserCompetitions: protectedProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const next72Hours = new Date(now.getTime() + 72 * 60 * 60 * 1000);

		const competitions = await ctx.db.competition.findMany({
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
				footballSeason: {
					include: {
						footballCompetition: true,
					},
				},
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

		const competitionsWithDashboardData = await Promise.all(
			competitions.map(async (competition) => {
				const upcomingMatchesCount = await ctx.db.footballMatch.count({
					where: {
						seasonId: competition.footballSeasonId,
						date: {
							gt: now,
							lte: next72Hours,
						},
						matchBets: {
							none: {
								userId: ctx.session.user.id,
								competitionId: competition.id,
							},
						},
					},
				});

				const userRank = await getUserRankInCompetition(
					ctx.db,
					competition.id,
					ctx.session.user.id,
				);

				const recentForm = await getUserRecentForm(
					ctx.db,
					competition.footballSeasonId,
					competition.id,
					ctx.session.user.id,
				);

				return {
					...competition,
					dashboardData: {
						upcomingMatchesCount,
						userRank,
						recentForm,
					},
				};
			}),
		);

		return competitionsWithDashboardData;
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
					footballSeason: {
						include: {
							footballCompetition: true,
						},
					},
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

			const uniqueMatchdays = [
				...new Set(pageOfMatches.map((m) => m.matchday)),
			];
			const matchdayTotals = await getMatchdayTotals(
				ctx.db,
				competition.footballSeasonId,
				uniqueMatchdays,
			);

			const matchdays = groupPastMatchesByMatchday(
				pageOfMatches as FinishedMatchWithBets[],
				matchdayTotals,
			);

			return {
				matchdays,
				nextCursor: createNextCursor(matches, input.limit),
			};
		}),

	getAvailableCompetitions: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.competition.findMany({
			where: {
				isActive: true,
			},
			include: {
				footballSeason: {
					include: {
						footballCompetition: true,
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

			const uniqueMatchdays = [
				...new Set(processedMatches.map((m) => m.matchday)),
			];
			const matchdayTotals = await getMatchdayTotals(
				ctx.db,
				competition.footballSeasonId,
				uniqueMatchdays,
			);

			const matchdays = groupMatchesByMatchday(
				processedMatches,
				matchdayTotals,
			);

			return {
				matchdays,
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
					recentForm: {
						matchday: number;
						correct: number;
						total: number;
						rate: number;
					}[];
				}
			>();

			// Group matches by matchday for recent form calculation
			const matchesByMatchday = new Map<number, FinishedMatchWithBets[]>();
			for (const match of finishedMatches) {
				const existing = matchesByMatchday.get(match.matchday) || [];
				existing.push(match);
				matchesByMatchday.set(match.matchday, existing);
			}

			// Get last 3 matchdays
			const sortedMatchdays = Array.from(matchesByMatchday.keys()).sort(
				(a, b) => b - a,
			);
			const recentMatchdays = sortedMatchdays.slice(0, 3);

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
				}
			}

			// Calculate recent form by matchday
			for (const [userId, userStats] of userStatsMap) {
				const matchdayStats = new Map<
					number,
					{ correct: number; total: number }
				>();

				for (const matchday of recentMatchdays) {
					const matchdayMatches = matchesByMatchday.get(matchday) || [];
					let correct = 0;
					let total = 0;

					for (const match of matchdayMatches) {
						const actualResult =
							match.homeTeamGoals > match.awayTeamGoals
								? "HOME"
								: match.homeTeamGoals < match.awayTeamGoals
									? "AWAY"
									: "DRAW";

						const userBet = match.matchBets.find(
							(bet) => bet.userId === userId,
						);
						if (userBet) {
							total++;
							if (userBet.prediction === actualResult) {
								correct++;
							}
						}
					}

					if (total > 0) {
						matchdayStats.set(matchday, { correct, total });
					}
				}

				userStats.recentForm = Array.from(matchdayStats.entries())
					.sort(([a], [b]) => b - a)
					.map(([matchday, stats]) => ({
						matchday,
						correct: stats.correct,
						total: stats.total,
						rate: (stats.correct / stats.total) * 100,
					}));
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
