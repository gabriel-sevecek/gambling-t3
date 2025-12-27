import Image from "next/image";
import { BetButtons } from "./bet-buttons";

type Team = {
	name: string;
	tla: string;
	crestUrl: string;
};

type MatchBet = {
	id: number;
	prediction: "HOME" | "DRAW" | "AWAY";
};

type Match = {
	id: number;
	date: Date;
	status: string;
	homeTeamGoals: number | null;
	awayTeamGoals: number | null;
	homeTeam: Team;
	awayTeam: Team;
	matchBets: MatchBet[];
};

type FinishedMatch = Match & {
	homeTeamGoals: number;
	awayTeamGoals: number;
};

type MatchRowProps = {
	match: Match;
};

function TeamCrest({ team }: { team: Team }) {
	return (
		<Image
			alt={`${team.name} crest`}
			className="object-contain"
			height={24}
			src={team.crestUrl}
			width={24}
		/>
	);
}

function TeamInfo({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex w-[60px] justify-between gap-[2px]">{children}</div>
	);
}

function TeamShortName({ team }: { team: Team }) {
	return <span className="font-medium">{team.tla}</span>;
}

function isFinished(match: Match): match is FinishedMatch {
	return (
		match.status === "FINISHED" &&
		match.homeTeamGoals !== null &&
		match.awayTeamGoals !== null
	);
}

function MatchResult({
	homeTeamGoals,
	awayTeamGoals,
}: {
	homeTeamGoals: number;
	awayTeamGoals: number;
}) {
	return (
		<div className="rounded bg-muted px-3 py-1">
			{`${homeTeamGoals} - ${awayTeamGoals}`}
		</div>
	);
}


export function MatchRow({ match }: MatchRowProps) {
	return (
		<div
			className="flex items-center gap-4 rounded-lg border p-4 md:gap-10"
			key={match.id}
		>
			<div className="flex items-center gap-4">
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
					<div className="rounded border px-2 py-1 text-sm">
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
			<BetButtons matchBets={match.matchBets} matchId={match.id} />
		</div>
	);
}
