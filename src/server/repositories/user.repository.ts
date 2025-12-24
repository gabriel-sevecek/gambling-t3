import { db } from "~/server/db";

export const findUserById = async (userId: string) => {
	return await db.user.findUnique({
		where: {
			id: userId,
		},
	});
};

export const findAllUsers = async () => {
	return await db.user.findMany({
		orderBy: {
			createdAt: "desc",
		},
	});
};

export const updateUser = async (
	userId: string,
	data: { name?: string; email?: string },
) => {
	return await db.user.update({
		where: {
			id: userId,
		},
		data,
	});
};

export const deactivateUser = async (userId: string) => {
	return await db.user.update({
		where: {
			id: userId,
		},
		data: {
			// Assuming there's an isActive field, adjust as needed
			// isActive: false,
		},
	});
};
