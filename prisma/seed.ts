import { PrismaClient } from "../generated/prisma";
import { auth } from "../src/server/better-auth/config";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	// Create a football competition
	const footballCompetition = await prisma.footballCompetition.upsert({
		where: { code: "PL" },
		update: {},
		create: {
			name: "Premier League",
			areaId: 2072, // England
			code: "PL",
			lastUpdated: new Date(),
		},
	});

	// Create a football season
	const footballSeason = await prisma.footballSeason.upsert({
		where: {
			footballCompetitionId_startDate: {
				footballCompetitionId: footballCompetition.id,
				startDate: new Date("2024-08-17"),
			},
		},
		update: {},
		create: {
			footballCompetitionId: footballCompetition.id,
			startDate: new Date("2024-08-17"),
			endDate: new Date("2025-05-25"),
			currentMatchday: 15,
		},
	});

	// Update the football competition to set current season
	await prisma.footballCompetition.update({
		where: { id: footballCompetition.id },
		data: { currentSeasonId: footballSeason.id },
	});

	// Create a competition
	const competition = await prisma.competition.upsert({
		where: { id: 1 },
		update: {},
		create: {
			name: "Piarg 25/26",
			description:
				"Predict the outcomes of Premier League matches for the 2024/25 season",
			footballSeasonId: footballSeason.id,
			footballCompetitionId: footballCompetition.id,
			isActive: true,
		},
	});

	// Create test user using Better Auth API
	const signUpResult = await auth.api.signUpEmail({
		body: {
			name: "Test User",
			email: "test@example.com",
			password: "password",
		},
	});

	if (!signUpResult.user) {
		throw new Error("Failed to create test user");
	}

	const user = signUpResult.user;

	// Mark email as verified
	await prisma.user.update({
		where: { id: user.id },
		data: { emailVerified: true },
	});

	// Join the user to the competition
	await prisma.competitionUser.upsert({
		where: {
			userId_competitionId: {
				userId: user.id,
				competitionId: competition.id,
			},
		},
		update: {},
		create: {
			userId: user.id,
			competitionId: competition.id,
			isActive: true,
		},
	});

	const signUpResult2 = await auth.api.signUpEmail({
		body: {
			name: "Jane Smith",
			email: "jane@example.com",
			password: "password",
		},
	});

	if (!signUpResult2.user) {
		throw new Error("Failed to create second test user");
	}

	const user2 = signUpResult2.user;

	// Mark email as verified
	await prisma.user.update({
		where: { id: user2.id },
		data: { emailVerified: true },
	});

	// Join the second user to the competition
	await prisma.competitionUser.upsert({
		where: {
			userId_competitionId: {
				userId: user2.id,
				competitionId: competition.id,
			},
		},
		update: {},
		create: {
			userId: user2.id,
			competitionId: competition.id,
			isActive: true,
		},
	});

	console.log("✅ Seeding completed!");
	console.log(`👤 Created user: ${user.name} (${user.email})`);
	console.log(`👤 Created user: ${user2.name} (${user2.email})`);
	console.log(`🏆 Created competition: ${competition.name}`);
	console.log(`🔗 Both users joined competition successfully`);
	console.log(`🔑 Login credentials: test@example.com / password`);
	console.log(`🔑 Login credentials: jane@example.com / password`);
}

main()
	.catch((e) => {
		console.error("❌ Seeding failed:", e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
