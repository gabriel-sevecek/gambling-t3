"use client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { ResultsTable } from "./results-table";

type MatchdayGroup = {
	matchday: number;
	totalMatches: number;
	dateGroups: {
		date: string;
		matches: any[];
	}[];
};

type ResultsProps = {
	currentUserId: string;
	competitionId: number;
};

export function Results({ competitionId, currentUserId }: ResultsProps) {
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
		api.competition.getCompeitionPastMatches.useInfiniteQuery(
			{
				competitionId,
				limit: 10,
			},
			{
				getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
			},
		);

	if (isLoading) {
		return (
			<div className="space-y-6">
				{[1, 2, 3].map((i) => (
					<div key={i}>
						<Skeleton className="mb-4 h-6 w-32" />
						<div className="space-y-3">
							{[1, 2].map((j) => (
								<Skeleton className="h-16 w-full" key={j} />
							))}
						</div>
					</div>
				))}
			</div>
		);
	}

	const allMatchdays =
		data?.pages.flatMap((page) => page?.matchdays ?? []) ?? [];

	const groupedMatchdays = allMatchdays.reduce((acc, matchdayGroup) => {
		const existing = acc.find(
			(group) => group.matchday === matchdayGroup.matchday,
		);

		if (existing) {
			for (const dateGroup of matchdayGroup.dateGroups) {
				const existingDateGroup = existing.dateGroups.find(
					(dg) => dg.date === dateGroup.date,
				);
				if (existingDateGroup) {
					existingDateGroup.matches.push(...dateGroup.matches);
				} else {
					existing.dateGroups.push(dateGroup);
				}
			}
			existing.totalMatches = matchdayGroup.totalMatches;
		} else {
			acc.push({
				matchday: matchdayGroup.matchday,
				totalMatches: matchdayGroup.totalMatches,
				dateGroups: matchdayGroup.dateGroups.map((dg) => ({
					date: dg.date,
					matches: [...dg.matches],
				})),
			});
		}

		return acc;
	}, [] as MatchdayGroup[]);

	groupedMatchdays.forEach((matchdayGroup) => {
		matchdayGroup.dateGroups.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateB.getTime() - dateA.getTime();
		});

		matchdayGroup.dateGroups.forEach((dateGroup) => {
			dateGroup.matches.sort((a, b) => b.date.getTime() - a.date.getTime());
		});
	});

	groupedMatchdays.sort((a, b) => b.matchday - a.matchday);

	if (groupedMatchdays.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">No past matches found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{groupedMatchdays.map((matchdayGroup) => {
				const currentMatches = matchdayGroup.dateGroups.reduce(
					(total, dateGroup) => total + dateGroup.matches.length,
					0,
				);
				const isComplete = currentMatches === matchdayGroup.totalMatches;

				return (
					<div key={matchdayGroup.matchday}>
						<h2 className="mb-6 font-bold text-2xl">
							Matchday {matchdayGroup.matchday}
							{!isComplete && (
								<span className="ml-2 font-normal text-muted-foreground text-sm">
									({currentMatches} of {matchdayGroup.totalMatches} matches)
								</span>
							)}
						</h2>
						<div className="space-y-6">
							{matchdayGroup.dateGroups.map((dateGroup) => (
								<div key={dateGroup.date}>
									<h3 className="mb-2 font-medium text-muted-foreground text-sm">
										{dateGroup.date}
									</h3>
									<ResultsTable
										currentUserId={currentUserId}
										matches={dateGroup.matches}
									/>
								</div>
							))}
						</div>
					</div>
				);
			})}
			{hasNextPage && (
				<div className="flex justify-center pt-4">
					<Button
						className="cursor-pointer"
						disabled={isFetchingNextPage}
						onClick={() => fetchNextPage()}
						variant="outline"
					>
						{isFetchingNextPage ? "Loading..." : "Load More"}
					</Button>
				</div>
			)}
		</div>
	);
}
