import { db } from "~/server/db";

export const findUserCompetitions = async (userId: string) => {
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
};

export const findAvailableCompetitions = async () => {
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
};

export const upsertCompetitionUser = async (
	userId: string,
	competitionId: number,
) => {
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
};

export const deactivateCompetitionUser = async (
	userId: string,
	competitionId: number,
) => {
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
};
