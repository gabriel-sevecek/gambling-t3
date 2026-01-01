import Image from "next/image";
import type { ProcessedFutureMatch } from "~/server/api/routers/competition";
import type { PlaceBetMutation } from "~/types/competition";
import { BetButtons } from "./bet-buttons";

type Team = {
	name: string;
	tla: string;
	crestUrl: string;
};

type MatchRowProps = {
	match: ProcessedFutureMatch;
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

export function MatchRow({
	match,
	competitionId,
	placeBetMutation,
}: MatchRowProps) {
	return (
		<div
			className="flex items-center gap-4 rounded-lg border p-2 md:gap-6"
			key={match.id}
		>
			<div className="flex items-center gap-2">
				<TeamInfo>
					<TeamCrest team={match.homeTeam} />
					<TeamShortName team={match.homeTeam} />
				</TeamInfo>
				<div className="rounded border px-0.5 py-0.5 text-xs">
					{match.date.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
						hour12: false,
					})}
				</div>
				<TeamInfo>
					<TeamShortName team={match.awayTeam} />
					<TeamCrest team={match.awayTeam} />
				</TeamInfo>
			</div>
			<BetButtons
				competitionId={competitionId}
				currentUserBet={match.currentUserBet}
				matchId={match.id}
				placeBetMutation={placeBetMutation}
			/>
		</div>
	);
}
