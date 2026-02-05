export type PermissionKey =
	| "dashboard.view"
	| "profile.manage"
	| "projects.view"
	| "projects.manage"
	| "projects.settings"
	| "hours.view"
	| "learnings.manage"
	| "financial.view"
	| "global_tasks.manage"
	| "documents.manage"
	| "calendar.view"
	| "quotations.manage"
	| "admin.access"
	| "admin.manage_access"
	| "project.view"
	| "project.manage"
	| "project.tasks.manage"
	| "project.files.manage"
	| "project.meetings.manage"
	| "project.members.manage"
	| "project.finance.manage";

export const GLOBAL_NAV_PERMISSIONS: Array<{ key: PermissionKey; route: string }> = [
	{ key: "dashboard.view", route: "/dashboard" },
	{ key: "profile.manage", route: "/dashboard/profile" },
	{ key: "projects.view", route: "/dashboard/projects" },
	{ key: "hours.view", route: "/dashboard/hours" },
	{ key: "learnings.manage", route: "/dashboard/learnings" },
	{ key: "financial.view", route: "/dashboard/financial" },
	{ key: "global_tasks.manage", route: "/dashboard/global-tasks" },
	{ key: "calendar.view", route: "/dashboard/calendar" },
	{ key: "documents.manage", route: "/dashboard/documents" },
	{ key: "quotations.manage", route: "/dashboard/quotations/create" },
	{ key: "admin.access", route: "/dashboard/admin" },
];
