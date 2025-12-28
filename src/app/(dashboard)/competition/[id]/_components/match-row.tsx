import Image from "next/image";
import type { Match, PlaceBetMutation } from "~/types/competition";
import { BetButtons } from "./bet-buttons";
import { BetDisplay } from "./bet-display";

type Team = {
	name: string;
	tla: string;
	crestUrl: string;
};

type FinishedMatch = Match & {
	homeTeamGoals: number;
	awayTeamGoals: number;
};

type MatchRowProps = {
	match: Match;
	competitionId: number;
	placeBetMutation: PlaceBetMutation;
};

function TeamCrest({ team }: { team: Team }) {
	return (
		<Image
			alt={`${team.name} crest`}
			className="object-contain"
			height={18}
			src={team.crestUrl}
			width={18}
		/>
	);
}

function TeamInfo({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-[50px] justify-between gap-[2px]">{children}</div>
	);
}

function TeamShortName({ team }: { team: Team }) {
	return <span className="font-medium text-sm">{team.tla}</span>;
}

function isFinished(match: Match): match is FinishedMatch {
	return (
		match.status === "FINISHED" &&
		match.homeTeamGoals !== null &&
		match.awayTeamGoals !== null
	);
}

function isMatchInPast(matchDate: Date): boolean {
	const now = new Date();
	return matchDate < now;
}

function MatchResult({
	homeTeamGoals,
	awayTeamGoals,
}: {
	homeTeamGoals: number;
	awayTeamGoals: number;
}) {
	return (
		<div className="rounded bg-muted px-1 py-1 text-xs">
			{`${homeTeamGoals} - ${awayTeamGoals}`}
		</div>
	);
}

export function MatchRow({
	match,
	competitionId,
	placeBetMutation,
}: MatchRowProps) {
	const isPastMatch = isMatchInPast(match.date);

	return (
		<div
			className="flex items-center gap-4 rounded-lg border p-3 md:gap-6"
			key={match.id}
		>
			<div className="flex items-center gap-2">
				<TeamInfo>
					<TeamShortName team={match.homeTeam} />
					<TeamCrest team={match.homeTeam} />
				</TeamInfo>
				{isFinished(match) ? (
					<MatchResult
						awayTeamGoals={match.awayTeamGoals}
						homeTeamGoals={match.homeTeamGoals}
					/>
				) : (
					<div className="rounded border px-0.5 py-0.5 text-xs">
						{match.date.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
							hour12: false,
						})}
					</div>
				)}
				<TeamInfo>
					<TeamCrest team={match.awayTeam} />
					<TeamShortName team={match.awayTeam} />
				</TeamInfo>
			</div>
			{isPastMatch ? (
				<BetDisplay match={match} />
			) : (
				<BetButtons
					competitionId={competitionId}
					currentUserBet={match.currentUserBet}
					matchId={match.id}
					placeBetMutation={placeBetMutation}
				/>
			)}
		</div>
	);
}
