"use client";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import { api } from "~/trpc/react";
import type { LeaderboardEntry } from "~/types/competition";

type LeaderboardProps = {
	competitionId: number;
	currentUserId: string;
};

function ProgressBar({ percentage }: { percentage: number }) {
	return (
		<div className="h-2 w-full rounded-full bg-gray-200">
			<div
				className="h-2 rounded-full bg-green-500 transition-all duration-300"
				style={{ width: `${Math.min(percentage, 100)}%` }}
			/>
		</div>
	);
}

function FormIndicator({ recentForm }: { recentForm: boolean[] }) {
	return (
		<div className="flex gap-1">
			{recentForm.slice(0, 10).map((isCorrect, index) => (
				<div
					key={index}
					className={`size-2 rounded-full ${
						isCorrect ? "bg-green-500" : "bg-red-500"
					}`}
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
			<div className="w-8 text-center font-bold text-lg">
				{rank}
			</div>

			{/* User */}
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<Avatar className="size-8">
					<AvatarFallback className="text-sm">
						{entry.user.name.charAt(0)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium">{entry.user.name}</div>
					{isCurrentUser && (
						<div className="text-blue-600 text-xs">You</div>
					)}
				</div>
			</div>

			{/* Desktop Stats */}
			<div className="hidden grid-cols-7 gap-4 text-center text-sm md:grid">
				{/* Overall */}
				<div>
					<div className="font-medium">
						{entry.correctPredictions}/{entry.totalBets}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.successPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Home */}
				<div>
					<div className="font-medium">
						{entry.homeBets.correct}/{entry.homeBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.homeSuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Away */}
				<div>
					<div className="font-medium">
						{entry.awayBets.correct}/{entry.awayBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.awaySuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Draw */}
				<div>
					<div className="font-medium">
						{entry.drawBets.correct}/{entry.drawBets.total}
					</div>
					<div className="text-muted-foreground text-xs">
						{entry.drawSuccessPercentage.toFixed(1)}%
					</div>
				</div>

				{/* Success Rate Progress */}
				<div className="flex flex-col justify-center">
					<ProgressBar percentage={entry.successPercentage} />
				</div>

				{/* Form */}
				<div className="flex justify-center">
					<FormIndicator recentForm={entry.recentForm} />
				</div>

				{/* Form Percentage */}
				<div className="font-medium">
					{entry.recentFormPercentage.toFixed(0)}%
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

export function Leaderboard({ competitionId, currentUserId }: LeaderboardProps) {
	const { data: leaderboard, isLoading } = api.competition.getCompetitionLeaderboard.useQuery({
		competitionId,
	});

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3, 4, 5].map((i) => (
					<Skeleton key={i} className="h-16 w-full" />
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
				<div className="hidden grid-cols-7 gap-4 text-center md:grid">
					<div>Overall</div>
					<div>Home</div>
					<div>Away</div>
					<div>Draw</div>
					<div>Success</div>
					<div>Form</div>
					<div>Form %</div>
				</div>
				<div className="text-right md:hidden">Stats</div>
			</div>

			{/* Leaderboard Entries */}
			<div>
				{leaderboard.map((entry, index) => (
					<LeaderboardRow
						key={entry.user.id}
						entry={entry}
						rank={index + 1}
						isCurrentUser={entry.user.id === currentUserId}
					/>
				))}
			</div>
		</div>
	);
}
