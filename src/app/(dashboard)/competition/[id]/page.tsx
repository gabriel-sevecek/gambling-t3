import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/server";
import { Fixtures } from "./_components/fixtures";
import { Results } from "./_components/results";

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
			<Tabs defaultValue="fixtures">
				<TabsList>
					<TabsTrigger className="cursor-pointer" value="fixtures">
						Fixtures
					</TabsTrigger>
					<TabsTrigger className="cursor-pointer" value="table">
						Results
					</TabsTrigger>
				</TabsList>
				<TabsContent value="fixtures">
					<div className="space-y-6">
						<Fixtures competitionId={competitionId} />
					</div>
				</TabsContent>
				<TabsContent value="table">
					<div className="space-y-6">
						<Results competitionId={competitionId} />
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
