"use client";

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";

export type SidebarCompetition = {
	id: number;
	code: string;
	name: string;
};

export function NavCompetitions({
	competitions,
}: {
	competitions: SidebarCompetition[];
}) {
	return (
		<SidebarGroup className="group-data-[collapsible=icon]:hidden">
			<SidebarGroupLabel>Competitions</SidebarGroupLabel>
			<SidebarMenu>
				{competitions.map((competition) => (
					<SidebarMenuItem key={competition.name}>
						<SidebarMenuButton asChild>
							<a href={`/competition/${competition.id}`}>
								<span>{competition.code}</span>
								<span>{competition.name}</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
