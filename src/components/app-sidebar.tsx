"use client";

import {
	AudioWaveform,
	Command,
	GalleryVerticalEnd,
	LayoutDashboard,
	Settings2,
} from "lucide-react";
import type * as React from "react";

import { NavMain } from "~/components/nav-main";
import {
	NavCompetitions,
	type SidebarCompetition,
} from "~/components/nav-projects";
import { NavUser, type SidebarUser } from "~/components/nav-user";
import { TeamSwitcher } from "~/components/team-switcher";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarRail,
} from "~/components/ui/sidebar";

const data = {
	teams: [
		{
			name: "Acme Inc",
			logo: GalleryVerticalEnd,
			plan: "Enterprise",
		},
		{
			name: "Acme Corp.",
			logo: AudioWaveform,
			plan: "Startup",
		},
		{
			name: "Evil Corp.",
			logo: Command,
			plan: "Free",
		},
	],
	navMain: [
		{
			title: "Home",
			url: "/",
			icon: LayoutDashboard,
			isActive: true,
		},
		{
			title: "Settings",
			url: "/settings",
			icon: Settings2,
		},
	],
};

export function AppSidebar({
	user,
	competitions,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user: SidebarUser;
	competitions: SidebarCompetition[];
}) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<TeamSwitcher teams={data.teams} />
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavCompetitions competitions={competitions} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
