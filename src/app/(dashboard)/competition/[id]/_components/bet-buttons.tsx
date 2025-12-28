"use client";
import type { Match, PlaceBetMutation } from "~/types/competition";

const BET_DISPLAY = {
	HOME: "1",
	DRAW: "X",
	AWAY: "2",
} as const;

export function BetButtons({
	currentUserBet,
	matchId,
	competitionId,
	placeBetMutation,
}: {
	currentUserBet: Match["currentUserBet"];
	matchId: number;
	competitionId: number;
	placeBetMutation: PlaceBetMutation;
}) {
	const bets = ["HOME", "DRAW", "AWAY"] as const;
	const selectedBet = currentUserBet?.prediction;
	const isLoading = placeBetMutation.isPending;

	const handleBetClick = (bet: "HOME" | "DRAW" | "AWAY") => {
		if (isLoading) return;

		placeBetMutation.mutate({
			matchId,
			competitionId,
			prediction: bet,
		});
	};

	return (
		<div className="flex gap-2">
			{bets.map((bet) => (
				<button
					className={`flex aspect-square w-6 items-center justify-center rounded border text-sm transition-colors ${
						selectedBet === bet
							? "bg-primary text-primary-foreground"
							: "hover:bg-muted"
					} ${isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
					disabled={isLoading}
					key={bet}
					onClick={() => handleBetClick(bet)}
					type="button"
				>
					{BET_DISPLAY[bet]}
				</button>
			))}
		</div>
	);
}
