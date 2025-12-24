import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { competitionService } from "~/server/services/competition.service";

export const competitionRouter = createTRPCRouter({
	getUserCompetitions: protectedProcedure.query(async ({ ctx }) => {
		return await competitionService.getUserCompetitions(ctx.session.user.id);
	}),

	getAvailableCompetitions: publicProcedure.query(async () => {
		return await competitionService.getAvailableCompetitions();
	}),

	joinCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await competitionService.joinCompetition(
				ctx.session.user.id,
				input.competitionId,
			);
		}),

	leaveCompetition: protectedProcedure
		.input(z.object({ competitionId: z.number() }))
		.mutation(async ({ ctx, input }) => {
			return await competitionService.leaveCompetition(
				ctx.session.user.id,
				input.competitionId,
			);
		}),
});
