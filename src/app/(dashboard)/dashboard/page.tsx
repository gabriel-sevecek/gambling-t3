import { redirect } from "next/navigation";
import { getSession } from "~/server/better-auth/config";
import { DashboardOverview } from "../_components/dashboard-overview";

export default async function DashboardPage() {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="font-bold text-3xl">Dashboard</h1>
				<p className="text-muted-foreground">
					Overview of your competitions and upcoming matches
				</p>
			</div>
			
			<DashboardOverview />
		</div>
	);
}
