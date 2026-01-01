import type { api, RouterOutputs } from "~/trpc/react";

export type PlaceBetMutation = ReturnType<
	typeof api.competition.placeBet.useMutation
>;

export type LeaderboardEntry = NonNullable<
	RouterOutputs["competition"]["getCompetitionLeaderboard"]
>[number];
