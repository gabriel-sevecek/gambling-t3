import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { CompetitionService } from "~/server/services/competition.service";

export const competitionRouter = createTRPCRouter({
	getUserCompetitions: protectedProcedure.query(async ({ ctx }) => {
		return await CompetitionService.getUserCompetitions(ctx.session.user.id);
	}),

	getAvailableCompetitions: publicProcedure.query(async () => {
		return await CompetitionService.getAvailableCompetitions();
	}),

	joinCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await CompetitionService.joinCompetition(
				ctx.session.user.id,
				input.competitionId,
			);
		}),

	leaveCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await CompetitionService.leaveCompetition(
				ctx.session.user.id,
				input.competitionId,
			);
		}),
});
