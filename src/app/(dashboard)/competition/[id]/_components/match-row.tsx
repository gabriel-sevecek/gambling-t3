import Image from "next/image";

type MatchRowTeam = {
	name: string;
	tla: string;
	crestUrl: string;
};

type MatchRowProps = {
	match: {
		id: number;
		date: Date;
		homeTeam: MatchRowTeam;
		awayTeam: MatchRowTeam;
	};
};

function TeamCrest({ team }: { team: MatchRowTeam }) {
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

export function MatchRow({ match }: MatchRowProps) {
	return (
		<div
			className="flex items-center gap-4 rounded-lg border p-4"
			key={match.id}
		>
			<div className="flex items-center gap-2">
				<span className="font-medium">{match.homeTeam.tla}</span>
				<TeamCrest team={match.homeTeam} />
			</div>
			<div className="font-mono text-sm">
				{match.date.toLocaleTimeString([], {
					hour: "2-digit",
					minute: "2-digit",
					hour12: false,
				})}
			</div>
			<div className="flex items-center gap-2">
				<TeamCrest team={match.awayTeam} />
				<span className="font-medium">{match.awayTeam.tla}</span>
			</div>
		</div>
	);
}
