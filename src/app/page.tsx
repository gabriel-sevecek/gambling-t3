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

	// If user is logged in, redirect to dashboard
	redirect("/dashboard");
}
