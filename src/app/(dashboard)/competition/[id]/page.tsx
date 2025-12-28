import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/server";
import { Matchday } from "./_components/matchday";

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

	//TODO: Error handling
	if (!competition) {
		redirect("/dashboard");
	}

	return (
		<div className="rounded-lg border bg-card p-4">
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
						<Matchday competitionId={competitionId} />
					</div>
				</TabsContent>
				<TabsContent value="table">Table info</TabsContent>
			</Tabs>
		</div>
	);
}
