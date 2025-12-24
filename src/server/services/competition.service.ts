import * as competitionRepository from "~/server/repositories/competition.repository";

interface CompetitionDependencies {
	repository: typeof competitionRepository;
}

export const createCompetitionService = (deps: CompetitionDependencies) => ({
	getUserCompetitions: async (userId: string) => {
		return await deps.repository.findUserCompetitions(userId);
	},

	getAvailableCompetitions: async () => {
		return await deps.repository.findAvailableCompetitions();
	},

	joinCompetition: async (userId: string, competitionId: number) => {
		return await deps.repository.upsertCompetitionUser(userId, competitionId);
	},

	leaveCompetition: async (userId: string, competitionId: number) => {
		return await deps.repository.deactivateCompetitionUser(
			userId,
			competitionId,
		);
	},
});

export const competitionService = createCompetitionService({
	repository: competitionRepository,
});
