import { UrgentActionsCard } from "./urgent-actions-card";
import { PerformanceSummary } from "./performance-summary";
import { CompetitionCards } from "./competition-cards";

export function DashboardOverview() {
	return (
		<div className="space-y-8">
			<div className="grid gap-6 md:grid-cols-2">
				<UrgentActionsCard />
				<PerformanceSummary />
			</div>
			
			<div>
				<h2 className="mb-4 font-semibold text-xl">Your Competitions</h2>
				<CompetitionCards />
			</div>
		</div>
	);
}
