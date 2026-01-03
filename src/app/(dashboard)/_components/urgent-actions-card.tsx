"use client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { BetButtons } from "../competition/[id]/_components/bet-buttons";

export function UrgentActionsCard() {
	const { data: upcomingMatches, isLoading } =
		api.dashboard.getUpcomingMatches.useQuery();
	const [hiddenMatches, setHiddenMatches] = useState<Set<number>>(new Set());

	const placeBetMutation = api.competition.placeBet.useMutation({
		onSuccess: (_, variables) => {
			toast.success("Bet placed successfully!");
			setHiddenMatches(prev => new Set(prev).add(variables.matchId));
		},
		onError: () => {
			toast.error("Failed to place bet. Please try again.");
		},
	});

	if (isLoading) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<Skeleton className="mb-4 h-6 w-48" />
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<Skeleton className="h-16 w-full" key={i} />
					))}
				</div>
			</div>
		);
	}

	const visibleMatches = upcomingMatches?.filter(match => !hiddenMatches.has(match.id)) ?? [];

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

	if (visibleMatches.length === 0) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<h2 className="mb-4 font-semibold text-lg">Urgent Actions</h2>
				<p className="text-muted-foreground text-sm">
					All upcoming matches have been bet on. Great job!
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
					{visibleMatches.length} pending
				</span>
			</div>
			<div className="space-y-3">
				{visibleMatches.slice(0, 5).map((match) => (
					<div 
						className={`rounded-md border p-3 transition-opacity duration-300 ${
							hiddenMatches.has(match.id) ? 'opacity-0' : 'opacity-100'
						}`} 
						key={match.id}
					>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
								<div className="flex items-center gap-2">
									<Image
										alt={match.homeTeam.name}
										className="object-contain"
										height={20}
										src={match.homeTeam.crestUrl}
										width={20}
									/>
									<span className="font-medium text-sm">
										{match.homeTeam.tla}
									</span>
									<span className="text-muted-foreground text-xs">vs</span>
									<span className="font-medium text-sm">
										{match.awayTeam.tla}
									</span>
									<Image
										alt={match.awayTeam.name}
										className="object-contain"
										height={20}
										src={match.awayTeam.crestUrl}
										width={20}
									/>
									<span
										className={`ml-2 rounded px-2 py-1 font-medium text-xs ${getUrgencyColor(match.date)}`}
									>
										{getTimeUntilMatch(match.date)}
									</span>
								</div>
								<span className="text-muted-foreground text-xs">
									in {match.competition.name}
								</span>
							</div>
							<div className="flex items-center gap-2 sm:flex-shrink-0">
								<BetButtons
									currentUserBet={null}
									matchId={match.id}
									competitionId={match.competition.id}
									placeBetMutation={placeBetMutation}
								/>
							</div>
						</div>
					</div>
				))}
			</div>
			{visibleMatches.length > 5 && (
				<div className="mt-4 text-center">
					<p className="text-muted-foreground text-sm">
						+{visibleMatches.length - 5} more matches need your attention
					</p>
				</div>
			)}
		</div>
	);
}
