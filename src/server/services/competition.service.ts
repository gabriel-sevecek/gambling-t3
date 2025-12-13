import { CompetitionRepository } from "~/server/repositories/competition.repository";

export class CompetitionService {
	/**
	 * Get all competitions that a user has joined
	 */
	static async getUserCompetitions(userId: string) {
		return await CompetitionRepository.findUserCompetitions(userId);
	}

	/**
	 * Get all available competitions (for joining)
	 */
	static async getAvailableCompetitions() {
		return await CompetitionRepository.findAvailableCompetitions();
	}

	/**
	 * Join a competition
	 */
	static async joinCompetition(userId: string, competitionId: number) {
		// Business logic could go here (validation, notifications, etc.)
		return await CompetitionRepository.upsertCompetitionUser(
			userId,
			competitionId,
		);
	}

	/**
	 * Leave a competition
	 */
	static async leaveCompetition(userId: string, competitionId: number) {
		// Business logic could go here (validation, cleanup, etc.)
		return await CompetitionRepository.deactivateCompetitionUser(
			userId,
			competitionId,
		);
	}
}
