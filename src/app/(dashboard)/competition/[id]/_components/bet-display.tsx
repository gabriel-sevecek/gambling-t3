import type { Match } from "~/types/competition";

type BetDisplayProps = {
	match: Match;
};

function getPredictionResult(
	prediction: "HOME" | "DRAW" | "AWAY",
	homeGoals: number | null,
	awayGoals: number | null,
): "correct" | "incorrect" | "unknown" {
	if (homeGoals === null || awayGoals === null) {
		return "unknown";
	}

	const actualResult =
		homeGoals > awayGoals ? "HOME" : homeGoals < awayGoals ? "AWAY" : "DRAW";

	return prediction === actualResult ? "correct" : "incorrect";
}

function getPredictionText(prediction: "HOME" | "DRAW" | "AWAY"): string {
	switch (prediction) {
		case "HOME":
			return "1";
		case "AWAY":
			return "2";
		case "DRAW":
			return "X";
	}
}

export function BetDisplay({ match }: BetDisplayProps) {
	const bet = match.currentUserBet;

	if (!bet) {
		return <div className="text-muted-foreground text-xs">-</div>;
	}

	const result = getPredictionResult(
		bet.prediction,
		match.homeTeamGoals,
		match.awayTeamGoals,
	);

	const textColorClass =
		result === "correct"
			? "text-green-600"
			: result === "incorrect"
				? "text-red-600"
				: "text-muted-foreground";

	return (
		<div className={`font-medium text-xs ${textColorClass}`}>
			{getPredictionText(bet.prediction)}
		</div>
	);
}
