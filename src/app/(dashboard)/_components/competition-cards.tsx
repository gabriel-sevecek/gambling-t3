"use client";
import Link from "next/link";
import { Users, Trophy, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function CompetitionCards() {
	const { data: competitions, isLoading } = api.competition.getUserCompetitions.useQuery();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-48 w-full" />
				))}
			</div>
		);
	}

	if (!competitions || competitions.length === 0) {
		return (
			<div className="rounded-lg border bg-card p-6 text-center">
				<h3 className="mb-2 font-semibold text-lg">No Competitions Yet</h3>
				<p className="mb-4 text-muted-foreground text-sm">
					Join a competition to start making predictions!
				</p>
				<Button asChild>
					<Link href="/competitions">Browse Competitions</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{competitions.map((competition) => {
				const { dashboardData } = competition;
				const hasUrgentMatches = dashboardData.upcomingMatchesCount > 0;
				
				return (
					<div key={competition.id} className="rounded-lg border bg-card p-6">
						<div className="mb-4">
							<h3 className="font-semibold text-lg">{competition.name}</h3>
							<p className="text-muted-foreground text-sm">
								{competition.footballSeason.footballCompetition.name}
							</p>
						</div>
						
						<div className="mb-4 space-y-2">
							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2">
									<Trophy className="h-4 w-4 text-muted-foreground" />
									<span>Rank</span>
								</div>
								<span className="font-medium">
									{dashboardData.userRank ? `#${dashboardData.userRank}` : "N/A"}
								</span>
							</div>
							
							<div className="flex items-center justify-between text-sm">
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<span>Participants</span>
								</div>
								<span className="font-medium">{competition._count.competitionUsers}</span>
							</div>
							
							<div className="flex items-center justify-between text-sm">
								<span>Recent Form</span>
								<span className="font-medium">
									{dashboardData.recentForm.total > 0 
										? `${dashboardData.recentForm.correct}/${dashboardData.recentForm.total}`
										: "N/A"
									}
								</span>
							</div>
						</div>
						
						{hasUrgentMatches && (
							<div className="mb-4 rounded-md bg-red-50 p-3">
								<div className="flex items-center gap-2 text-red-800">
									<Clock className="h-4 w-4" />
									<span className="font-medium text-sm">
										{dashboardData.upcomingMatchesCount} match{dashboardData.upcomingMatchesCount !== 1 ? 'es' : ''} need{dashboardData.upcomingMatchesCount === 1 ? 's' : ''} betting
									</span>
								</div>
							</div>
						)}
						
						<Button asChild className="w-full" variant={hasUrgentMatches ? "default" : "outline"}>
							<Link href={`/competition/${competition.id}`}>
								{hasUrgentMatches ? "Place Bets" : "View Competition"}
							</Link>
						</Button>
					</div>
				);
			})}
		</div>
	);
}
