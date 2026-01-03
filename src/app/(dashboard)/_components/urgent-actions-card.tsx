"use client";
import Image from "next/image";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function UrgentActionsCard() {
	const { data: upcomingMatches, isLoading } = api.dashboard.getUpcomingMatches.useQuery();

	if (isLoading) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<Skeleton className="mb-4 h-6 w-48" />
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-16 w-full" />
					))}
				</div>
			</div>
		);
	}

	if (!upcomingMatches || upcomingMatches.length === 0) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<h2 className="mb-4 font-semibold text-lg">Urgent Actions</h2>
				<p className="text-muted-foreground text-sm">
					No upcoming matches requiring bets in the next 48 hours.
				</p>
			</div>
		);
	}

	const getTimeUntilMatch = (date: Date) => {
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
		
		if (hours < 1) {
			return `${minutes}m`;
		}
		return `${hours}h ${minutes}m`;
	};

	const getUrgencyColor = (date: Date) => {
		const now = new Date();
		const diff = date.getTime() - now.getTime();
		const hours = diff / (1000 * 60 * 60);
		
		if (hours < 6) return "text-red-600 bg-red-50";
		if (hours < 24) return "text-amber-600 bg-amber-50";
		return "text-blue-600 bg-blue-50";
	};

	return (
		<div className="rounded-lg border bg-card p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-lg">Urgent Actions</h2>
				<span className="rounded-full bg-red-100 px-2 py-1 font-medium text-red-800 text-xs">
					{upcomingMatches.length} pending
				</span>
			</div>
			<div className="space-y-3">
				{upcomingMatches.slice(0, 5).map((match) => (
					<div key={match.id} className="flex items-center justify-between rounded-md border p-3">
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2">
								<Image
									src={match.homeTeam.crestUrl}
									alt={match.homeTeam.name}
									width={20}
									height={20}
									className="object-contain"
								/>
								<span className="font-medium text-sm">{match.homeTeam.tla}</span>
								<span className="text-muted-foreground text-xs">vs</span>
								<span className="font-medium text-sm">{match.awayTeam.tla}</span>
								<Image
									src={match.awayTeam.crestUrl}
									alt={match.awayTeam.name}
									width={20}
									height={20}
									className="object-contain"
								/>
							</div>
							<span className="text-muted-foreground text-xs">
								in {match.competition.name}
							</span>
						</div>
						<div className="flex items-center gap-2">
							<span className={`rounded px-2 py-1 font-medium text-xs ${getUrgencyColor(match.date)}`}>
								{getTimeUntilMatch(match.date)}
							</span>
							<Button asChild size="sm" variant="outline">
								<Link href={`/competition/${match.competition.id}`}>
									Bet Now
								</Link>
							</Button>
						</div>
					</div>
				))}
			</div>
			{upcomingMatches.length > 5 && (
				<div className="mt-4 text-center">
					<p className="text-muted-foreground text-sm">
						+{upcomingMatches.length - 5} more matches need your attention
					</p>
				</div>
			)}
		</div>
	);
}
