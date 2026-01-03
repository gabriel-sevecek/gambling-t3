import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
	getUpcomingMatches: protectedProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

		const userCompetitions = await ctx.db.competition.findMany({
			where: {
				competitionUsers: {
					some: {
						userId: ctx.session.user.id,
						isActive: true,
					},
				},
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				footballSeasonId: true,
			},
		});

		const upcomingMatches = await ctx.db.footballMatch.findMany({
			where: {
				seasonId: {
					in: userCompetitions.map((c) => c.footballSeasonId),
				},
				date: {
					gt: now,
					lte: next48Hours,
				},
				matchBets: {
					none: {
						userId: ctx.session.user.id,
						competitionId: {
							in: userCompetitions.map((c) => c.id),
						},
					},
				},
			},
			include: {
				homeTeam: true,
				awayTeam: true,
			},
			orderBy: {
				date: "asc",
			},
			take: 10,
		});

		const matchesWithCompetition = upcomingMatches.map((match) => {
			const competition = userCompetitions.find(
				(c) => c.footballSeasonId === match.seasonId,
			);
			return {
				...match,
				competition: competition!,
			};
		});

		return matchesWithCompetition;
	}),

	getUserStats: protectedProcedure.query(async ({ ctx }) => {
		const userCompetitions = await ctx.db.competition.findMany({
			where: {
				competitionUsers: {
					some: {
						userId: ctx.session.user.id,
						isActive: true,
					},
				},
				isActive: true,
			},
			select: {
				id: true,
				footballSeasonId: true,
			},
		});

		const finishedMatches = await ctx.db.footballMatch.findMany({
			where: {
				seasonId: {
					in: userCompetitions.map((c) => c.footballSeasonId),
				},
				status: "FINISHED",
				homeTeamGoals: { not: null },
				awayTeamGoals: { not: null },
			},
			include: {
				matchBets: {
					where: {
						userId: ctx.session.user.id,
						competitionId: {
							in: userCompetitions.map((c) => c.id),
						},
					},
				},
			},
		});

		let totalBets = 0;
		let correctPredictions = 0;

		for (const match of finishedMatches) {
			const bet = match.matchBets[0];
			if (!bet) continue;

			totalBets++;
			const actualResult =
				match.homeTeamGoals! > match.awayTeamGoals!
					? "HOME"
					: match.homeTeamGoals! < match.awayTeamGoals!
						? "AWAY"
						: "DRAW";

			if (bet.prediction === actualResult) {
				correctPredictions++;
			}
		}

		const successRate =
			totalBets > 0 ? (correctPredictions / totalBets) * 100 : 0;

		return {
			totalBets,
			correctPredictions,
			successRate,
		};
	}),

	getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
		const userCompetitions = await ctx.db.competition.findMany({
			where: {
				competitionUsers: {
					some: {
						userId: ctx.session.user.id,
						isActive: true,
					},
				},
				isActive: true,
			},
			select: {
				id: true,
				name: true,
				footballSeasonId: true,
			},
		});

		const recentMatches = await ctx.db.footballMatch.findMany({
			where: {
				seasonId: {
					in: userCompetitions.map((c) => c.footballSeasonId),
				},
				status: "FINISHED",
				homeTeamGoals: { not: null },
				awayTeamGoals: { not: null },
			},
			include: {
				homeTeam: true,
				awayTeam: true,
				matchBets: {
					where: {
						userId: ctx.session.user.id,
						competitionId: {
							in: userCompetitions.map((c) => c.id),
						},
					},
				},
			},
			orderBy: {
				date: "desc",
			},
			take: 5,
		});

		const activities = recentMatches
			.filter((match) => match.matchBets.length > 0)
			.map((match) => {
				const bet = match.matchBets[0]!;
				const competition = userCompetitions.find(
					(c) => c.footballSeasonId === match.seasonId,
				);
				const actualResult =
					match.homeTeamGoals! > match.awayTeamGoals!
						? "HOME"
						: match.homeTeamGoals! < match.awayTeamGoals!
							? "AWAY"
							: "DRAW";
				const isCorrect = bet.prediction === actualResult;

				return {
					match: {
						id: match.id,
						homeTeam: match.homeTeam,
						awayTeam: match.awayTeam,
						homeTeamGoals: match.homeTeamGoals,
						awayTeamGoals: match.awayTeamGoals,
						date: match.date,
					},
					bet: {
						prediction: bet.prediction,
						isCorrect,
					},
					competition: competition!,
				};
			});

		return activities;
	}),
});
