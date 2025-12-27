import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/server";

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

	return (
		<div className="rounded-lg border bg-card p-6">
			<h1 className="mb-6 font-bold text-2xl">{competition.name}</h1>
			<Tabs defaultValue="Matchday">
				<TabsList>
					<TabsTrigger className="cursor-pointer" value="matchday">
						Matchday
					</TabsTrigger>
					<TabsTrigger className="cursor-pointer" value="table">
						Table
					</TabsTrigger>
				</TabsList>
				<TabsContent value="matchday">Matchday info</TabsContent>
				<TabsContent value="table">Table info</TabsContent>
			</Tabs>
		</div>
	);
}
