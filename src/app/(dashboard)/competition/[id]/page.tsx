import { redirect } from "next/navigation";
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
			<h1 className="font-bold text-2xl">{competition.name}</h1>
		</div>
	);
}
