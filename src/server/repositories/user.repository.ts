import { db } from "~/server/db";

export class UserRepository {
	static async findUserById(userId: string) {
		return await db.user.findUnique({
			where: {
				id: userId,
			},
		});
	}

	static async findAllUsers() {
		return await db.user.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});
	}

	static async updateUser(
		userId: string,
		data: { name?: string; email?: string },
	) {
		return await db.user.update({
			where: {
				id: userId,
			},
			data,
		});
	}

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
