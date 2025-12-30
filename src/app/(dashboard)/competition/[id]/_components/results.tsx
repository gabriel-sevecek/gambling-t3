"use client";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import { ResultsTable } from "./results-table";

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

	const matches = data?.pages.flatMap((page) => page?.matches ?? []) ?? [];

	if (matches.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">No past matches found.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<ResultsTable currentUserId={currentUserId} matches={matches} />
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
