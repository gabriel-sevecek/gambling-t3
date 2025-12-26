export interface BreadcrumbItem {
	label: string;
	href: string;
}

const breadcrumbConfig: Record<string, string> = {
	"/": "Home",
	"/sign-in": "Sign In",
};

export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
	const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean);

	const breadcrumbs: BreadcrumbItem[] = [
		{
			label: "Home",
			href: "/",
		},
	];

	let currentPath = "";
	for (const segment of segments) {
		currentPath += `/${segment}`;

		const label = breadcrumbConfig[currentPath] ?? formatSegment(segment);

		breadcrumbs.push({
			label,
			href: currentPath,
		});
	}

	return breadcrumbs;
}

function formatSegment(segment: string): string {
	return segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}
