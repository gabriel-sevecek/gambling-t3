import * as userRepository from "~/server/repositories/user.repository";

interface UserDependencies {
	repository: typeof userRepository;
}

export const createUserService = (deps: UserDependencies) => ({
	getUserById: async (userId: string) => {
		return await deps.repository.findUserById(userId);
	},

	getAllUsers: async () => {
		return await deps.repository.findAllUsers();
	},

	updateUser: async (
		userId: string,
		data: { name?: string; email?: string },
	) => {
		return await deps.repository.updateUser(userId, data);
	},

	deactivateUser: async (userId: string) => {
		return await deps.repository.deactivateUser(userId);
	},
});

export const userService = createUserService({
	repository: userRepository,
});
