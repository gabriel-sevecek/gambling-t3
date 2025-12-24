import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import { competitionService } from "~/server/services/competition.service";
import { userService } from "~/server/services/user.service";

export const userRouter = createTRPCRouter({
	getUserById: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ input }) => {
			return await userService.getUserById(input.userId);
		}),

	getCurrentUserWithCompetitions: protectedProcedure.query(async ({ ctx }) => {
		const user = ctx.session.user;
		const competitions = await competitionService.getUserCompetitions(
			ctx.session.user.id,
		);

		return {
			user,
			competitions,
		};
	}),

	getAllUsers: publicProcedure.query(async () => {
		return await userService.getAllUsers();
	}),

	updateUser: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
				email: z.string().email().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await userService.updateUser(ctx.session.user.id, input);
		}),

	deactivateUser: protectedProcedure.mutation(async ({ ctx }) => {
		return await userService.deactivateUser(ctx.session.user.id);
	}),
});
