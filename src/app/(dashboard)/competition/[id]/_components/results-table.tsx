"use client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { RouterOutputs } from "~/trpc/react";

type PastMatch = NonNullable<
	RouterOutputs["competition"]["getCompeitionPastMatches"]
>["matches"][0];

type ResultsTableProps = {
	matches: PastMatch[];
};

function getMatchResult(homeGoals: number | null, awayGoals: number | null) {
	if (homeGoals === null || awayGoals === null) return null;
	if (homeGoals > awayGoals) return "HOME";
	if (homeGoals < awayGoals) return "AWAY";
	return "DRAW";
}

function getBetOutcome(
	prediction: "HOME" | "DRAW" | "AWAY",
	actualResult: "HOME" | "DRAW" | "AWAY" | null,
) {
	if (actualResult === null) return "pending";
	return prediction === actualResult ? "success" : "failure";
}

function BetResultCell({
	bet,
	actualResult,
}: {
	bet: PastMatch["matchBets"][0] | undefined;
	actualResult: "HOME" | "DRAW" | "AWAY" | null;
}) {
	if (!bet) {
		return (
			<div className="flex h-6 w-10 items-center justify-center rounded bg-gray-100 text-gray-600 text-xs">
				-
			</div>
		);
	}

	const outcome = getBetOutcome(bet.prediction, actualResult);
	const bgColor =
		outcome === "success"
			? "bg-green-100 text-green-800"
			: outcome === "failure"
				? "bg-red-100 text-red-800"
				: "bg-gray-100 text-gray-600";

	const displayText =
		bet.prediction === "HOME" ? "H" : bet.prediction === "AWAY" ? "A" : "D";

	return (
		<div
			className={`flex h-6 w-10 items-center justify-center rounded font-medium text-xs ${bgColor}`}
		>
			{displayText}
		</div>
	);
}

export function ResultsTable({ matches }: ResultsTableProps) {
	const allUsers = Array.from(
		new Map(
			matches
				.flatMap((match) => match.matchBets)
				.map((bet) => [bet.user.id, bet.user]),
		).values(),
	);

	return (
		<div className="overflow-x-auto">
			<div className="min-w-fit">
				<div className="sticky top-0 z-10 flex bg-background">
					<div className="flex w-64 shrink-0 items-center border-r border-b bg-background px-4 py-3">
						<span className="font-medium text-sm">Match</span>
					</div>
					<div className="flex">
						{allUsers.map((user) => (
							<div
								className="flex w-16 shrink-0 flex-col items-center border-r border-b bg-background px-2 py-2"
								key={user.id}
							>
								<Avatar className="size-6">
									<AvatarFallback className="text-xs">
										{user.name?.charAt(0) ?? "?"}
									</AvatarFallback>
								</Avatar>
								<span className="mt-1 truncate text-xs">{user.name}</span>
							</div>
						))}
					</div>
				</div>

				<div className="divide-y">
					{matches.map((match) => {
						const actualResult = getMatchResult(
							match.homeTeamGoals,
							match.awayTeamGoals,
						);
						const userBetsMap = new Map(
							match.matchBets.map((bet) => [bet.user.id, bet]),
						);

						return (
							<div className="flex" key={match.id}>
								<div className="flex w-64 shrink-0 flex-col border-r px-4 py-3">
									<div className="flex items-center gap-2 text-sm">
										<span className="font-medium">{match.homeTeam.tla}</span>
										<div className="rounded bg-muted px-1 py-0.5 text-xs">
											{match.homeTeamGoals} - {match.awayTeamGoals}
										</div>
										<div className="flex items-center gap-1">
											<span className="font-medium">{match.awayTeam.tla}</span>
											<Image
												alt={`${match.awayTeam.name} crest`}
												className="object-contain"
												height={16}
												src={match.awayTeam.crestUrl}
												width={16}
											/>
										</div>
									</div>
									<div className="mt-1 text-muted-foreground text-xs">
										{match.date.toLocaleDateString()}
									</div>
								</div>
								<div className="flex">
									{allUsers.map((user) => (
										<div
											className="flex w-16 shrink-0 items-center justify-center border-r py-3"
											key={user.id}
										>
											<BetResultCell
												actualResult={actualResult}
												bet={userBetsMap.get(user.id)}
											/>
										</div>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
