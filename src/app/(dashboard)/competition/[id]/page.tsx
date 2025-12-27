import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/server";
import { MatchRow } from "./_components/match-card";

export default async function CompetitionPage({
	params,
}: {
	params: { id: string };
}) {
	const { id: idString } = await params;
	const competitionId = parseInt(idString, 10);
	const competition = await api.competition.getCompetitionById({
		id: competitionId,
	});

	if (!competition) {
		redirect("/dashboard");
	}

	const matchesByDate = competition.currentMatchdayMatches.reduce(
		(acc, match) => {
			const dateKey = match.date.toDateString();
			if (!acc[dateKey]) {
				acc[dateKey] = [];
			}
			acc[dateKey].push(match);
			return acc;
		},
		{} as Record<string, typeof competition.currentMatchdayMatches>,
	);

	return (
		<div className="rounded-lg border bg-card p-6">
			<h1 className="mb-6 font-bold text-2xl">{competition.name}</h1>
			<Tabs defaultValue="matchday">
				<TabsList>
					<TabsTrigger className="cursor-pointer" value="matchday">
						Matchday
					</TabsTrigger>
					<TabsTrigger className="cursor-pointer" value="table">
						Table
					</TabsTrigger>
				</TabsList>
				<TabsContent value="matchday">
					<div className="space-y-6">
						{Object.entries(matchesByDate).map(([date, matches]) => (
							<div key={date}>
								<h3 className="mb-4 font-semibold text-lg">{date}</h3>
								<div className="space-y-3">
									{matches.map((match) => (
										<MatchRow key={match.id} match={match} />
									))}
								</div>
							</div>
						))}
					</div>
				</TabsContent>
				<TabsContent value="table">Table info</TabsContent>
			</Tabs>
		</div>
	);
}
