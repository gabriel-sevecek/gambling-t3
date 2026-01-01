"use client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import type { LeaderboardEntry } from "~/types/competition";

type LeaderboardProps = {
	competitionId: number;
	currentUserId: string;
};

function FormIndicator({ recentForm }: { recentForm: boolean[] }) {
	return (
		<div className="flex items-center gap-1">
			{recentForm.slice(0, 10).map((isCorrect, index) => (
				<div
					className={`size-2 rounded-full ${
						isCorrect ? "bg-green-500" : "bg-red-500"
					}`}
					// biome-ignore lint/suspicious/noArrayIndexKey: array of booleans
					key={index}
				/>
			))}
		</div>
	);
}

function LeaderboardRow({
	entry,
	rank,
	isCurrentUser,
}: {
	entry: LeaderboardEntry;
	rank: number;
	isCurrentUser: boolean;
}) {
	return (
		<div
			className={`flex items-center gap-4 border-b p-4 ${
				isCurrentUser ? "bg-blue-50/50" : ""
			}`}
		>
			{/* Rank */}
			<div className="w-8 text-center font-bold text-lg">{rank}</div>

			{/* User */}
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Avatar className="size-8">
					<AvatarFallback className="text-sm">
						{entry.user.name.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<div className="truncate font-medium">{entry.user.name}</div>
					{isCurrentUser && <div className="text-blue-600 text-xs">You</div>}
				</div>
			</div>

			{/* Desktop Stats */}
			<div className="grid hidden max-w-[400px] grid-cols-5 text-center text-sm md:grid">
				{/* Overall */}
				<div className="w-20">
					<div className="font-semibold text-base">
						{entry.correctPredictions}/{entry.totalBets}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.successPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Home */}
				<div className="w-16 text-muted-foreground">
					<div className="font-medium">
						{entry.homeBets.correct}/{entry.homeBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.homeSuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Away */}
				<div className="w-16 text-muted-foreground">
					<div className="font-medium">
						{entry.awayBets.correct}/{entry.awayBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.awaySuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Draw */}
				<div className="w-16 text-muted-foreground">
					<div className="font-medium">
						{entry.drawBets.correct}/{entry.drawBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.drawSuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Form */}
				<div className="flex w-28 justify-center">
					<FormIndicator recentForm={entry.recentForm} />
				</div>
			</div>

			{/* Mobile Stats */}
			<div className="flex flex-col gap-2 text-right text-sm md:hidden">
				<div>
					<span className="font-medium">
						{entry.correctPredictions}/{entry.totalBets}
					</span>
					<span className="ml-2 text-muted-foreground">
						({entry.successPercentage.toFixed(1)}%)
					</span>
				</div>
				<FormIndicator recentForm={entry.recentForm} />
			</div>
		</div>
	);
}

export function Leaderboard({
	competitionId,
	currentUserId,
}: LeaderboardProps) {
	const { data: leaderboard, isLoading } =
		api.competition.getCompetitionLeaderboard.useQuery({
			competitionId,
		});

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton className="h-16 w-full" key={i} />
				))}
			</div>
		);
	}

	if (!leaderboard || leaderboard.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-12 text-center">
				<p className="text-muted-foreground">No leaderboard data available.</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			{/* Header */}
			<div className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background p-4 font-medium text-sm">
				<div className="w-8 text-center">Rank</div>
				<div className="min-w-0 flex-1">User</div>
				<div className="grid hidden max-w-[400px] grid-cols-5 text-center md:grid">
					<div className="w-20 font-semibold">Overall</div>
					<div className="w-16 text-muted-foreground">Home</div>
					<div className="w-16 text-muted-foreground">Away</div>
					<div className="w-16 text-muted-foreground">Draw</div>
					<div className="w-28">Form</div>
				</div>
				<div className="text-right md:hidden">Stats</div>
			</div>

			{/* Leaderboard Entries */}
			<div>
				{leaderboard.map((entry, index) => (
					<LeaderboardRow
						entry={entry}
						isCurrentUser={entry.user.id === currentUserId}
						key={entry.user.id}
						rank={index + 1}
					/>
				))}
			</div>
		</div>
	);
}
