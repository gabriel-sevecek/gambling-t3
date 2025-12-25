import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
	getUserById: protectedProcedure
		.input(z.object({ userId: z.string() }))
		.query(async ({ ctx, input }) => {
			return await ctx.db.user.findUnique({
				where: {
					id: input.userId,
				},
			});
		}),

	getAllUsers: publicProcedure.query(async ({ ctx }) => {
		return await ctx.db.user.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});
	}),

	updateUser: protectedProcedure
		.input(
			z.object({
				name: z.string().optional(),
				email: z.string().email().optional(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return await ctx.db.user.update({
				where: {
					id: ctx.session.user.id,
				},
				data: input,
			});
		}),

	deactivateUser: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx.db.user.update({
			where: {
				id: ctx.session.user.id,
			},
			data: {
				// Assuming there's an isActive field, adjust as needed
				// isActive: false,
			},
		});
	}),
});
