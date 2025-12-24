import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	const userCompetitions = await api.competition.getUserCompetitions();

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<div className="flex flex-col items-center gap-2">
						<div className="flex flex-col items-center justify-center gap-4">
							<p className="text-center text-2xl text-gray-800">
								<span className="text-gray-800">
									Logged in as {session!.user?.name}
								</span>
							</p>
							<div className="flex flex-col items-center gap-6">
								{/* User's Competitions */}
								<div className="w-full max-w-2xl">
									<h2 className="mb-4 font-semibold text-gray-800 text-xl">
										Your Competitions
									</h2>
									{userCompetitions.length > 0 ? (
										<div className="grid gap-4">
											{userCompetitions.map((competition) => (
												<div
													className="rounded-lg border border-gray-200 bg-gray-50 p-4"
													key={competition.id}
												>
													<h3 className="font-medium text-gray-800">
														{competition.name}
													</h3>
													{competition.description && (
														<p className="mt-1 text-gray-600 text-sm">
															{competition.description}
														</p>
													)}
													{competition.footballCompetition && (
														<p className="mt-2 text-gray-500 text-xs">
															Football Competition:{" "}
															{competition.footballCompetition.name}
														</p>
													)}
												</div>
											))}
										</div>
									) : (
										<p className="text-gray-600">
											You haven't joined any competitions yet.
										</p>
									)}
								</div>

								<form
									action={async () => {
										"use server";
										await auth.api.signOut({
											headers: await headers(),
										});
										redirect("/");
									}}
								>
									<button
										className="rounded-full bg-gray-800 px-10 py-3 font-semibold text-white no-underline transition hover:bg-gray-700"
										type="submit"
									>
										Sign out
									</button>
								</form>
							</div>
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
