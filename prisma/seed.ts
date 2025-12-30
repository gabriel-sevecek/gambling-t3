import { PrismaClient } from "../generated/prisma";
import { auth } from "../src/server/better-auth/config";

const prisma = new PrismaClient();

async function createUser(name: string, email: string, password: string, competitionId: number) {
	const signUpResult = await auth.api.signUpEmail({
		body: {
			name,
			email,
			password,
		},
	});

	if (!signUpResult.user) {
		throw new Error(`Failed to create user: ${email}`);
	}

	const user = signUpResult.user;

	await prisma.user.update({
		where: { id: user.id },
		data: { emailVerified: true },
	});

	await prisma.competitionUser.upsert({
		where: {
			userId_competitionId: {
				userId: user.id,
				competitionId,
			},
		},
		update: {},
		create: {
			userId: user.id,
			competitionId,
			isActive: true,
		},
	});

	return user;
}

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
				startDate: new Date("2025-08-17"),
			},
		},
		update: {},
		create: {
			footballCompetitionId: footballCompetition.id,
			startDate: new Date("2025-08-17"),
			endDate: new Date("2026-05-25"),
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
				"Predict the outcomes of Premier League matches for the 2025/26 season",
			footballSeasonId: footballSeason.id,
			footballCompetitionId: footballCompetition.id,
			isActive: true,
		},
	});

	const user = await createUser("Test User", "test@example.com", "password", competition.id);
	const user2 = await createUser("Jane Smith", "jane@example.com", "password", competition.id);

	// Create teams
	const teams = await Promise.all([
		prisma.footballTeam.upsert({
			where: { tla: "ARS" },
			update: {},
			create: {
				name: "Arsenal FC",
				shortName: "Arsenal",
				tla: "ARS",
				crestUrl: "https://crests.football-data.org/57.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "CHE" },
			update: {},
			create: {
				name: "Chelsea FC",
				shortName: "Chelsea",
				tla: "CHE",
				crestUrl: "https://crests.football-data.org/61.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "LIV" },
			update: {},
			create: {
				name: "Liverpool FC",
				shortName: "Liverpool",
				tla: "LIV",
				crestUrl: "https://crests.football-data.org/64.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "MCI" },
			update: {},
			create: {
				name: "Manchester City FC",
				shortName: "Man City",
				tla: "MCI",
				crestUrl: "https://crests.football-data.org/65.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "MUN" },
			update: {},
			create: {
				name: "Manchester United FC",
				shortName: "Man United",
				tla: "MUN",
				crestUrl: "https://crests.football-data.org/66.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "TOT" },
			update: {},
			create: {
				name: "Tottenham Hotspur FC",
				shortName: "Tottenham",
				tla: "TOT",
				crestUrl: "https://crests.football-data.org/73.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "BUR" },
			update: {},
			create: {
				name: "Burnley FC",
				shortName: "Burnley",
				tla: "BUR",
				crestUrl: "https://crests.football-data.org/328.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "CRY" },
			update: {},
			create: {
				name: "Crystal Palace FC",
				shortName: "Crystal Palace",
				tla: "CRY",
				crestUrl: "https://crests.football-data.org/354.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "BHA" },
			update: {},
			create: {
				name: "Brighton & Hove Albion FC",
				shortName: "Brighton",
				tla: "BHA",
				crestUrl: "https://crests.football-data.org/397.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "WHU" },
			update: {},
			create: {
				name: "West Ham United FC",
				shortName: "West Ham",
				tla: "WHU",
				crestUrl: "https://crests.football-data.org/563.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "NEW" },
			update: {},
			create: {
				name: "Newcastle United FC",
				shortName: "Newcastle",
				tla: "NEW",
				crestUrl: "https://crests.football-data.org/67.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "AVL" },
			update: {},
			create: {
				name: "Aston Villa FC",
				shortName: "Aston Villa",
				tla: "AVL",
				crestUrl: "https://crests.football-data.org/58.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "EVE" },
			update: {},
			create: {
				name: "Everton FC",
				shortName: "Everton",
				tla: "EVE",
				crestUrl: "https://crests.football-data.org/62.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "FUL" },
			update: {},
			create: {
				name: "Fulham FC",
				shortName: "Fulham",
				tla: "FUL",
				crestUrl: "https://crests.football-data.org/63.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "LEI" },
			update: {},
			create: {
				name: "Leicester City FC",
				shortName: "Leicester",
				tla: "LEI",
				crestUrl: "https://crests.football-data.org/338.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "WOL" },
			update: {},
			create: {
				name: "Wolverhampton Wanderers FC",
				shortName: "Wolves",
				tla: "WOL",
				crestUrl: "https://crests.football-data.org/76.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "SOU" },
			update: {},
			create: {
				name: "Southampton FC",
				shortName: "Southampton",
				tla: "SOU",
				crestUrl: "https://crests.football-data.org/340.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "BRE" },
			update: {},
			create: {
				name: "Brentford FC",
				shortName: "Brentford",
				tla: "BRE",
				crestUrl: "https://crests.football-data.org/402.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "NFO" },
			update: {},
			create: {
				name: "Nottingham Forest FC",
				shortName: "Nottingham",
				tla: "NFO",
				crestUrl: "https://crests.football-data.org/351.png",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballTeam.upsert({
			where: { tla: "BOU" },
			update: {},
			create: {
				name: "AFC Bournemouth",
				shortName: "Bournemouth",
				tla: "BOU",
				crestUrl: "https://crests.football-data.org/1044.png",
				lastUpdated: new Date(),
			},
		}),
	]);

	// Create matches for matchday 15
	const matches = await Promise.all([
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[0].id, // Arsenal
				awayTeamId: teams[1].id, // Chelsea
				homeTeamGoals: 1,
				awayTeamGoals: 0,
				date: new Date("2025-12-21T15:00:00Z"),
				status: "FINISHED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[2].id, // Liverpool
				awayTeamId: teams[3].id, // Man City
				homeTeamGoals: 1,
				awayTeamGoals: 3,
				date: new Date("2025-12-21T17:30:00Z"),
				status: "FINISHED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[6].id, // Burnley
				awayTeamId: teams[8].id, // Brighton
				homeTeamGoals: 2,
				awayTeamGoals: 2,
				date: new Date("2025-12-21T20:00:00Z"),
				status: "FINISHED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[4].id, // Man United
				awayTeamId: teams[5].id, // Tottenham
				date: new Date("2026-02-22T14:00:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[7].id, // Crystal Palace
				awayTeamId: teams[9].id, // West Ham
				date: new Date("2026-02-22T16:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[10].id, // Newcastle
				awayTeamId: teams[11].id, // Aston Villa
				date: new Date("2026-02-21T12:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[12].id, // Everton
				awayTeamId: teams[13].id, // Fulham
				date: new Date("2026-02-21T15:00:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[14].id, // Leicester
				awayTeamId: teams[15].id, // Wolves
				date: new Date("2026-02-21T17:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[16].id, // Southampton
				awayTeamId: teams[17].id, // Brentford
				date: new Date("2026-02-22T12:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 15,
				homeTeamId: teams[18].id, // Nottingham
				awayTeamId: teams[19].id, // Bournemouth
				date: new Date("2026-02-22T17:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
	]);

	// Create matches for matchday 16 (following weekend)
	const matchday16Matches = await Promise.all([
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[1].id, // Chelsea
				awayTeamId: teams[10].id, // Newcastle
				date: new Date("2026-02-28T12:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[3].id, // Man City
				awayTeamId: teams[0].id, // Arsenal
				date: new Date("2026-02-28T15:00:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[5].id, // Tottenham
				awayTeamId: teams[2].id, // Liverpool
				date: new Date("2026-02-28T17:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[9].id, // West Ham
				awayTeamId: teams[4].id, // Man United
				date: new Date("2026-03-01T14:00:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[8].id, // Brighton
				awayTeamId: teams[7].id, // Crystal Palace
				date: new Date("2026-03-01T16:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[11].id, // Aston Villa
				awayTeamId: teams[6].id, // Burnley
				date: new Date("2026-02-28T12:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[13].id, // Fulham
				awayTeamId: teams[14].id, // Leicester
				date: new Date("2026-02-28T15:00:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[15].id, // Wolves
				awayTeamId: teams[12].id, // Everton
				date: new Date("2026-02-28T17:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[17].id, // Brentford
				awayTeamId: teams[18].id, // Nottingham
				date: new Date("2026-03-01T12:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
		prisma.footballMatch.create({
			data: {
				seasonId: footballSeason.id,
				matchday: 16,
				homeTeamId: teams[19].id, // Bournemouth
				awayTeamId: teams[16].id, // Southampton
				date: new Date("2026-03-01T17:30:00Z"),
				status: "SCHEDULED",
				lastUpdated: new Date(),
			},
		}),
	]);

	// Create bets for test user on past matches
	const arsenalVsChelseaMatch = matches[0]; // Arsenal vs Chelsea (Arsenal won 1-0)
	await prisma.matchBet.create({
		data: {
			userId: user.id,
			footballMatchId: arsenalVsChelseaMatch.id,
			competitionId: competition.id,
			prediction: "HOME", // Betting on Arsenal (home team) to win - CORRECT
		},
	});

	const liverpoolVsManCityMatch = matches[1]; // Liverpool vs Man City (Man City won 1-3)
	await prisma.matchBet.create({
		data: {
			userId: user.id,
			footballMatchId: liverpoolVsManCityMatch.id,
			competitionId: competition.id,
			prediction: "HOME", // Betting on Liverpool (home team) to win - INCORRECT
		},
	});

	console.log("✅ Seeding completed!");
	console.log(`👤 Created user: ${user.name} (${user.email})`);
	console.log(`👤 Created user: ${user2.name} (${user2.email})`);
	console.log(`🏆 Created competition: ${competition.name}`);
	console.log(`🔗 Both users joined competition successfully`);
	console.log(`⚽ Created ${teams.length} teams`);
	console.log(`🏟 Created ${matches.length} matches for matchday 15`);
	console.log(`🏟 Created ${matchday16Matches.length} matches for matchday 16`);
	console.log(
		`🎲 Created bet: ${user.email} betting on Arsenal to win vs Chelsea (CORRECT)`,
	);
	console.log(
		`🎲 Created bet: ${user.email} betting on Liverpool to win vs Man City (INCORRECT)`,
	);

	// Create bets for user2 on all matches
	await prisma.matchBet.create({
		data: {
			userId: user2.id,
			footballMatchId: arsenalVsChelseaMatch.id,
			competitionId: competition.id,
			prediction: "AWAY", // Betting on Chelsea to win - INCORRECT
		},
	});

	await prisma.matchBet.create({
		data: {
			userId: user2.id,
			footballMatchId: liverpoolVsManCityMatch.id,
			competitionId: competition.id,
			prediction: "AWAY", // Betting on Man City to win - CORRECT
		},
	});

	const burnleyVsBrightonMatch = matches[2]; // Burnley vs Brighton (2-2 draw)
	await prisma.matchBet.create({
		data: {
			userId: user2.id,
			footballMatchId: burnleyVsBrightonMatch.id,
			competitionId: competition.id,
			prediction: "DRAW", // Betting on draw - CORRECT
		},
	});

	const manUnitedVsTottenhamMatch = matches[3]; // Man United vs Tottenham (scheduled)
	await prisma.matchBet.create({
		data: {
			userId: user2.id,
			footballMatchId: manUnitedVsTottenhamMatch.id,
			competitionId: competition.id,
			prediction: "HOME", // Betting on Man United to win
		},
	});

	const crystalPalaceVsWestHamMatch = matches[4]; // Crystal Palace vs West Ham (scheduled)
	await prisma.matchBet.create({
		data: {
			userId: user2.id,
			footballMatchId: crystalPalaceVsWestHamMatch.id,
			competitionId: competition.id,
			prediction: "AWAY", // Betting on West Ham to win
		},
	});
	console.log(
		`🎲 Created bet: ${user2.email} betting on Chelsea to win vs Arsenal (INCORRECT)`,
	);
	console.log(
		`🎲 Created bet: ${user2.email} betting on Man City to win vs Liverpool (CORRECT)`,
	);
	console.log(
		`🎲 Created bet: ${user2.email} betting on draw for Burnley vs Brighton (CORRECT)`,
	);
	console.log(
		`🎲 Created bet: ${user2.email} betting on Man United to win vs Tottenham`,
	);
	console.log(
		`🎲 Created bet: ${user2.email} betting on West Ham to win vs Crystal Palace`,
	);
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
