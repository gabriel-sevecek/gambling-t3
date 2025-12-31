import { redirect } from "next/navigation";
import { AppSidebar } from "~/components/app-sidebar";
import { DynamicBreadcrumbs } from "~/components/dynamic-breadcrumbs";
import type { SidebarCompetition } from "~/components/nav-projects";
import type { SidebarUser } from "~/components/nav-user";
import { Separator } from "~/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "~/components/ui/sidebar";
import { getSession } from "~/server/better-auth/server";
import { api } from "~/trpc/server";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();

	if (!session) {
		redirect("/sign-in");
	}

	const { user } = session;

	const navUser: SidebarUser = {
		name: user.name,
		email: user.email,
		avatar: user.image ?? "",
	};

	const userCompetitions = await api.competition.getUserCompetitions();
	console.log(userCompetitions);
	const competitions: SidebarCompetition[] = userCompetitions.map((comp) => ({
		id: comp.id,
		code: comp.footballSeason.footballCompetition.code,
		name: comp.name,
	}));

	return (
		<SidebarProvider>
			<AppSidebar competitions={competitions} user={navUser} />
			<SidebarInset>
				<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
					<div className="flex items-center gap-2 px-4">
						<SidebarTrigger className="-ml-1" />
						<Separator
							className="mr-2 data-[orientation=vertical]:h-4"
							orientation="vertical"
						/>
						<DynamicBreadcrumbs />
					</div>
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
