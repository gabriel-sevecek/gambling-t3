"use client";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import type { Match } from "~/types/competition";

type MatchdayGroup = {
	matchday: number;
	totalMatches: number;
	dateGroups: {
		date: string;
		matches: Match[];
	}[];
};
import { MatchRow } from "./match-row";

type FixturesProps = {
	competitionId: number;
};

export function Fixtures({ competitionId }: FixturesProps) {
	const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading } =
		api.competition.getCompetitionFutureMatches.useInfiniteQuery(
			{
				competitionId,
				limit: 10,
			},
			{
				getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
			},
		);
	const utils = api.useUtils();

	const placeBetMutation = api.competition.placeBet.useMutation({
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		onMutate: async ({ matchId, prediction }) => {
			await utils.competition.getCompetitionFutureMatches.cancel({
				competitionId,
				limit: 10,
			});

			const previousData =
				utils.competition.getCompetitionFutureMatches.getInfiniteData({
					competitionId,
					limit: 10,
				});

			utils.competition.getCompetitionFutureMatches.setInfiniteData(
				{ competitionId, limit: 10 },
				(old) => {
					if (!old) return old;

					return {
						...old,
						pages: old.pages.map((page) => {
							if (!page) return page;
							return {
								...page,
								matchdays: page.matchdays.map((matchdayGroup) => ({
									...matchdayGroup,
									dateGroups: matchdayGroup.dateGroups.map((dateGroup) => ({
										...dateGroup,
										matches: dateGroup.matches.map((match) => {
											if (match.id === matchId) {
												return {
													...match,
													currentUserBet: {
														id: 0,
														competitionId,
														createdAt: new Date(),
														updatedAt: new Date(),
														userId: "",
														footballMatchId: matchId,
														prediction,
													},
												};
											}
											return match;
										}),
									})),
								})),
							};
						}),
					};
				},
			);

			return { previousData };
		},
		onError: (_, _variables, context) => {
			if (context?.previousData) {
				utils.competition.getCompetitionFutureMatches.setInfiniteData(
					{ competitionId, limit: 10 },
					context.previousData,
				);
			}
			toast.error("Failed to place bet. Please try again.");
		},
		onSuccess: () => {
			toast.success("Bet placed successfully!");
		},
		onSettled: () => {
			utils.competition.getCompetitionFutureMatches.invalidate({
				competitionId,
				limit: 10,
			});
		},
	});

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

	const allMatchdays = data?.pages.flatMap((page) => page?.matchdays ?? []) ?? [];
	
	const groupedMatchdays = allMatchdays.reduce((acc, matchdayGroup) => {
		const existing = acc.find(group => group.matchday === matchdayGroup.matchday);
		
		if (existing) {
			for (const dateGroup of matchdayGroup.dateGroups) {
				const existingDateGroup = existing.dateGroups.find(dg => dg.date === dateGroup.date);
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
				dateGroups: matchdayGroup.dateGroups.map(dg => ({
					date: dg.date,
					matches: [...dg.matches],
				})),
			});
		}
		
		return acc;
	}, [] as MatchdayGroup[]);

	groupedMatchdays.forEach(matchdayGroup => {
		matchdayGroup.dateGroups.sort((a, b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA.getTime() - dateB.getTime();
		});
		
		matchdayGroup.dateGroups.forEach(dateGroup => {
			dateGroup.matches.sort((a, b) => a.date.getTime() - b.date.getTime());
		});
	});

	groupedMatchdays.sort((a, b) => a.matchday - b.matchday);

	if (groupedMatchdays.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">No upcoming matches found.</p>
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
						<h2 className="mb-6 font-bold text-xl">
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
									<h3 className="mb-4 font-semibold text-lg">{dateGroup.date}</h3>
									<div className="space-y-3">
										{dateGroup.matches.map((match) => (
											<MatchRow
												competitionId={competitionId}
												key={match.id}
												match={match}
												placeBetMutation={placeBetMutation}
											/>
										))}
									</div>
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
						{isFetchingNextPage ? "Loading..." : "Load More Matches"}
					</Button>
				</div>
			)}
		</div>
	);
}
