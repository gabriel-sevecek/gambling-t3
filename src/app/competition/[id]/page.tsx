import { redirect } from "next/navigation";
import { api } from "~/trpc/server";

export default async function CompetitionPage({
	params,
}: {
	params: { id: string };
}) {
	const userCompetitions = await api.competition.getUserCompetitions();
	const competitionId = parseInt(params.id, 10);
	const currentCompetition = userCompetitions.find(
		(comp) => comp.id === competitionId,
	);

	if (!currentCompetition) {
		redirect("/dashboard");
	}

	return (
		<div className="rounded-lg border bg-card p-6">
			<h1 className="font-bold text-2xl">{currentCompetition.name}</h1>
		</div>
	);
}
