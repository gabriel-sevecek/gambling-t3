import { db } from "~/server/db";

export class UserRepository {
	/**
	 * Find user by ID
	 */
	static async findUserById(userId: string) {
		return await db.user.findUnique({
			where: {
				id: userId,
			},
		});
	}

	/**
	 * Find all active users
	 */
	static async findAllUsers() {
		return await db.user.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	/**
	 * Update user profile
	 */
	static async updateUser(userId: string, data: { name?: string; email?: string }) {
		return await db.user.update({
			where: {
				id: userId,
			},
			data,
		});
	}

	/**
	 * Deactivate user
	 */
	static async deactivateUser(userId: string) {
		return await db.user.update({
			where: {
				id: userId,
			},
			data: {
				// Assuming there's an isActive field, adjust as needed
				// isActive: false,
			},
		});
	}
}
