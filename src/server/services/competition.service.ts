import { CompetitionRepository } from "~/server/repositories/competition.repository";

export class CompetitionService {
	static async getUserCompetitions(userId: string) {
		return await CompetitionRepository.findUserCompetitions(userId);
	}

	static async getAvailableCompetitions() {
		return await CompetitionRepository.findAvailableCompetitions();
	}

	static async joinCompetition(userId: string, competitionId: number) {
		return await CompetitionRepository.upsertCompetitionUser(
			userId,
			competitionId,
		);
	}

	static async leaveCompetition(userId: string, competitionId: number) {
		return await CompetitionRepository.deactivateCompetitionUser(
			userId,
			competitionId,
		);
	}
}
