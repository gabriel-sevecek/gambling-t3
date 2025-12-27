const BET_DISPLAY = {
	HOME: "1",
	DRAW: "X",
	AWAY: "2",
} as const;

type MatchBet = {
	id: number;
	prediction: "HOME" | "DRAW" | "AWAY";
};

export function BetButtons({
	matchBets,
	matchId,
}: {
	matchBets: MatchBet[];
	matchId: number;
}) {
	const bets = ["HOME", "DRAW", "AWAY"] as const;
	const selectedBet = matchBets[0]?.prediction;

	const handleBetClick = (bet: "HOME" | "DRAW" | "AWAY") => {
		console.log(`Placing bet: ${bet} for match ${matchId}`);
		// TODO: Add mutation call here
	};

	return (
		<div className="flex gap-2">
			{bets.map((bet) => (
				<button
					className={`flex aspect-square w-6 cursor-pointer items-center justify-center rounded border text-sm ${
						selectedBet === bet
							? "bg-primary text-primary-foreground"
							: "hover:bg-muted"
					}`}
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
