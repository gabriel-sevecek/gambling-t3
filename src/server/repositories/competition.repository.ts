import { db } from "~/server/db";

export class CompetitionRepository {
	/**
	 * Find competitions that a user has joined
	 */
	static async findUserCompetitions(userId: string) {
		return await db.competition.findMany({
			where: {
				competitionUsers: {
					some: {
						userId: userId,
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
						userId: userId,
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
	}

	/**
	 * Find all active competitions
	 */
	static async findAvailableCompetitions() {
		return await db.competition.findMany({
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
	}

	/**
	 * Create or update a competition user relationship
	 */
	static async upsertCompetitionUser(userId: string, competitionId: number) {
		return await db.competitionUser.upsert({
			where: {
				userId_competitionId: {
					userId,
					competitionId,
				},
			},
			update: {
				isActive: true,
			},
			create: {
				userId,
				competitionId,
				isActive: true,
			},
		});
	}

	/**
	 * Deactivate a competition user relationship
	 */
	static async deactivateCompetitionUser(
		userId: string,
		competitionId: number,
	) {
		return await db.competitionUser.update({
			where: {
				userId_competitionId: {
					userId,
					competitionId,
				},
			},
			data: {
				isActive: false,
			},
		});
	}
}
