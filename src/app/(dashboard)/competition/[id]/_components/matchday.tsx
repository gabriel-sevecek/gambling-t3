"use client";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { Match } from "~/types/competition";
import { MatchRow } from "./match-row";

type MatchdayProps = {
	competitionId: number;
};

export function Matchday({ competitionId }: MatchdayProps) {
	const { data } = api.competition.getCompetitionMatchdayMatches.useQuery({
		id: competitionId,
	});
	const utils = api.useUtils();

	const placeBetMutation = api.competition.placeBet.useMutation({
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		onMutate: async ({ matchId, prediction }) => {
			await utils.competition.getCompetitionMatchdayMatches.cancel({
				id: competitionId,
			});

			const previousData =
				utils.competition.getCompetitionMatchdayMatches.getData({
					id: competitionId,
				});

			utils.competition.getCompetitionMatchdayMatches.setData(
				{ id: competitionId },
				(old) => {
					if (!old) return old;

					return {
						...old,
						matches: old.matches.map((match) => {
							if (match.id === matchId) {
								return {
									...match,
									matchBets: [
										{
											id: 0,
											competitionId,
											createdAt: new Date(),
											updatedAt: new Date(),
											userId: "",
											footballMatchId: matchId,
											prediction,
										},
									],
								};
							}
							return match;
						}),
					};
				},
			);

			return { previousData };
		},
		onError: (_, _variables, context) => {
			if (context?.previousData) {
				utils.competition.getCompetitionMatchdayMatches.setData(
					{ id: competitionId },
					context.previousData,
				);
			}
			toast.error("Failed to place bet. Please try again.");
		},
		onSuccess: () => {
			toast.success("Bet placed successfully!");
		},
		onSettled: () => {
			utils.competition.getCompetitionMatchdayMatches.invalidate({
				id: competitionId,
			});
		},
	});

	const matches = data?.matches ?? [];
	const matchesByDate = matches.reduce(
		(acc, match) => {
			const dateKey = match.date.toDateString();
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(match);
			return acc;
		},
		{} as Record<string, Match[]>,
	);

	return (
		<div className="space-y-6">
			{Object.entries(matchesByDate).map(([date, matches]) => (
				<div key={date}>
					<h3 className="mb-4 font-semibold text-lg">{date}</h3>
					<div className="space-y-3">
						{matches.map((match) => (
							<MatchRow
								competitionId={competitionId}
								key={match.id}
								match={match}
								placeBetMutation={placeBetMutation}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}
