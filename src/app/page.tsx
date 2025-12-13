import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AuthForm } from "~/app/_components/auth-form";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient } from "~/trpc/server";
import { api } from "~/trpc/server";

export default async function Home() {
	const session = await getSession();
	
	// Fetch user's competitions if logged in
	const userCompetitions = session?.user?.id 
		? await api.competition.getUserCompetitions({ userId: session.user.id })
		: [];

	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center bg-white text-gray-800">
				<div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
					<div className="flex flex-col items-center gap-2">
						<div className="flex flex-col items-center justify-center gap-4">
							<p className="text-center text-2xl text-gray-800">
								{session && (
									<span className="text-gray-800">
										Logged in as {session.user?.name}
									</span>
								)}
							</p>
							{!session ? (
								<AuthForm />
							) : (
								<div className="flex flex-col items-center gap-6">
									{/* User's Competitions */}
									<div className="w-full max-w-2xl">
										<h2 className="text-xl font-semibold text-gray-800 mb-4">
											Your Competitions
										</h2>
										{userCompetitions.length > 0 ? (
											<div className="grid gap-4">
												{userCompetitions.map((competition) => (
													<div
														key={competition.id}
														className="border border-gray-200 rounded-lg p-4 bg-gray-50"
													>
														<h3 className="font-medium text-gray-800">
															{competition.name}
														</h3>
														{competition.description && (
															<p className="text-sm text-gray-600 mt-1">
																{competition.description}
															</p>
														)}
														{competition.footballCompetition && (
															<p className="text-xs text-gray-500 mt-2">
																Football Competition: {competition.footballCompetition.name}
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
							)}
						</div>
					</div>
				</div>
			</main>
		</HydrateClient>
	);
}
