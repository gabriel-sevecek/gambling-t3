"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";

export function PerformanceSummary() {
	const { data: userStats, isLoading } = api.dashboard.getUserStats.useQuery();

	if (isLoading) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<Skeleton className="mb-4 h-6 w-32" />
				<div className="grid grid-cols-3 gap-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="text-center">
							<Skeleton className="mx-auto mb-2 h-8 w-16" />
							<Skeleton className="mx-auto h-4 w-20" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!userStats) {
		return (
			<div className="rounded-lg border bg-card p-6">
				<h2 className="mb-4 font-semibold text-lg">Your Performance</h2>
				<p className="text-muted-foreground text-sm">
					No betting data available yet.
				</p>
			</div>
		);
	}

	const getTrendIcon = (rate: number) => {
		if (rate >= 60) return <TrendingUp className="h-4 w-4 text-green-600" />;
		if (rate >= 40) return <Minus className="h-4 w-4 text-yellow-600" />;
		return <TrendingDown className="h-4 w-4 text-red-600" />;
	};

	const getTrendColor = (rate: number) => {
		if (rate >= 60) return "text-green-600";
		if (rate >= 40) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<div className="rounded-lg border bg-card p-6">
			<div className="mb-4 flex items-center justify-between">
				<h2 className="font-semibold text-lg">Your Performance</h2>
				{getTrendIcon(userStats.successRate)}
			</div>
			<div className="grid grid-cols-3 gap-4 text-center">
				<div>
					<div className="font-bold text-2xl">{userStats.totalBets}</div>
					<div className="text-muted-foreground text-sm">Total Bets</div>
				</div>
				<div>
					<div className="font-bold text-2xl">{userStats.correctPredictions}</div>
					<div className="text-muted-foreground text-sm">Correct</div>
				</div>
				<div>
					<div className={`font-bold text-2xl ${getTrendColor(userStats.successRate)}`}>
						{userStats.successRate.toFixed(1)}%
					</div>
					<div className="text-muted-foreground text-sm">Success Rate</div>
				</div>
			</div>
		</div>
	);
}
