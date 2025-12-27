import type { api, RouterOutputs } from "~/trpc/react";

export type Match = NonNullable<
	RouterOutputs["competition"]["getCompetitionMatchdayMatches"]
>["matches"][number];

export type PlaceBetMutation = ReturnType<
	typeof api.competition.placeBet.useMutation
>;
