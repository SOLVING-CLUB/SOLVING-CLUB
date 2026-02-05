import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/lib/toast";
import type { PermissionKey } from "@/lib/access/permissions";

type AdminUserRow = {
	id: string;
	full_name: string | null;
	email: string | null;
	is_admin: boolean | null;
};

type RoleRow = { id: string; name: string; scope: "global" | "project" };
type BundleRow = { id: string; name: string; scope: "global" | "project" };
type PermissionRow = { id: string; key: PermissionKey; scope: "global" | "project" };
type ProjectRow = { id: string; name: string };
type UserRoleRow = { user_id: string; role_id: string; project_id: string | null };
type UserPermissionRow = { user_id: string; permission_id: string; project_id: string | null };
type RoleBundleRow = { role_id: string; bundle_id: string };

function formatPermissionLabel(key: string) {
	return key
		.replace(/[_]/g, " ")
		.replace(/[.]/g, " ")
		.replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function AdminPage() {
	const { has, loading } = usePermissions();
	const [rows, setRows] = useState<AdminUserRow[]>([]);
	const [roles, setRoles] = useState<RoleRow[]>([]);
	const [bundles, setBundles] = useState<BundleRow[]>([]);
	const [permissions, setPermissions] = useState<PermissionRow[]>([]);
	const [projects, setProjects] = useState<ProjectRow[]>([]);
	const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
	const [userPermissions, setUserPermissions] = useState<UserPermissionRow[]>([]);
	const [roleBundles, setRoleBundles] = useState<RoleBundleRow[]>([]);
	const [busy, setBusy] = useState(false);
	const [assignGlobalRole, setAssignGlobalRole] = useState({
		userId: "",
		roleId: "",
	});
	const [assignProjectRole, setAssignProjectRole] = useState({
		userId: "",
		roleId: "",
		projectId: "",
	});
	const [assignPermission, setAssignPermission] = useState({
		userId: "",
		permissionId: "",
		projectId: "",
		scope: "global" as "global" | "project",
	});
	const [assignBundleToRole, setAssignBundleToRole] = useState({
		roleId: "",
		bundleId: "",
	});
	const [addUserEmail, setAddUserEmail] = useState("");
	const [addUserIsAdmin, setAddUserIsAdmin] = useState(false);
	const [addUserPermissions, setAddUserPermissions] = useState<Set<PermissionKey>>(new Set());
	const [editingUserId, setEditingUserId] = useState<string | null>(null);
	const [editingPermissions, setEditingPermissions] = useState<Set<PermissionKey>>(new Set());
	const supabase = getSupabaseClient();
	const canAccess = has("admin.access");
	const canManage = has("admin.manage_access");

	useEffect(() => {
		async function load() {
			if (!canAccess) return;
			const { data, error } = await supabase
				.from("profiles")
				.select("id, full_name, email, is_admin")
				.order("full_name", { ascending: true });
			if (error) {
				console.error("Failed to load users:", error);
				toast.error("Failed to load users");
				return;
			}
			setRows(data ?? []);

			const [rolesRes, bundlesRes, permsRes, projectsRes, userRolesRes, userPermsRes, roleBundlesRes] = await Promise.all([
				supabase.from("access_roles").select("id, name, scope").order("name"),
				supabase.from("access_bundles").select("id, name, scope").order("name"),
				supabase.from("access_permissions").select("id, key, scope").order("key"),
				supabase.from("projects").select("id, name").order("created_at", { ascending: false }),
				supabase.from("access_user_roles").select("user_id, role_id, project_id"),
				supabase.from("access_user_permissions").select("user_id, permission_id, project_id"),
				supabase.from("access_role_bundles").select("role_id, bundle_id"),
			]);

			if (rolesRes.error || bundlesRes.error || permsRes.error || projectsRes.error) {
				toast.error("Failed to load access data");
				return;
			}

			setRoles((rolesRes.data ?? []) as RoleRow[]);
			setBundles((bundlesRes.data ?? []) as BundleRow[]);
			setPermissions((permsRes.data ?? []) as PermissionRow[]);
			setProjects((projectsRes.data ?? []) as ProjectRow[]);
			setUserRoles((userRolesRes.data ?? []) as UserRoleRow[]);
			setUserPermissions((userPermsRes.data ?? []) as UserPermissionRow[]);
			setRoleBundles((roleBundlesRes.data ?? []) as RoleBundleRow[]);
		}
		load();
	}, [canAccess, supabase]);

	async function toggleAdmin(userId: string, next: boolean) {
		setBusy(true);
		const { error } = await supabase
			.from("profiles")
			.update({ is_admin: next })
			.eq("id", userId);
		if (error) {
			console.error("Failed to update admin:", error);
			toast.error("Failed to update admin access");
			setBusy(false);
			return;
		}
		setRows((prev) =>
			prev.map((row) => (row.id === userId ? { ...row, is_admin: next } : row))
		);
		toast.success("Admin access updated");
		setBusy(false);
	}

	if (loading) {
		return <div className="p-6">Loading...</div>;
	}

	if (!canAccess) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>Admin Access Required</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">
							You do not have permission to view this page.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const roleOptions = roles.map((r) => ({ label: r.name, value: r.id, scope: r.scope }));
	const bundleOptions = bundles.map((b) => ({ label: b.name, value: b.id, scope: b.scope }));
	const permissionOptions = permissions.map((p) => ({ label: p.key, value: p.id, scope: p.scope }));
	const userOptions = rows.map((r) => ({ label: r.full_name || r.email || r.id, value: r.id }));

	const globalRoles = roleOptions.filter((r) => r.scope === "global");
	const projectRoles = roleOptions.filter((r) => r.scope === "project");
	const globalBundles = bundleOptions.filter((b) => b.scope === "global");
	const projectBundles = bundleOptions.filter((b) => b.scope === "project");
	const globalPermissions = permissionOptions.filter((p) => p.scope === "global");
	const projectPermissions = permissionOptions.filter((p) => p.scope === "project");

	const projectOptions = projects.map((p) => ({ label: p.name, value: p.id }));

	function findUserLabel(id: string) {
		return userOptions.find((u) => u.value === id)?.label ?? id;
	}
	function findRoleLabel(id: string) {
		return roleOptions.find((r) => r.value === id)?.label ?? id;
	}
	function findPermLabel(id: string) {
		return permissionOptions.find((p) => p.value === id)?.label ?? id;
	}
	function findBundleLabel(id: string) {
		return bundleOptions.find((b) => b.value === id)?.label ?? id;
	}
	function findProjectLabel(id: string | null) {
		if (!id) return "Global";
		return projectOptions.find((p) => p.value === id)?.label ?? id;
	}

	function userGlobalPermissions(userId: string) {
		const ids = userPermissions
			.filter((p) => p.user_id === userId && p.project_id == null)
			.map((p) => p.permission_id);
		const keys = permissions
			.filter((p) => ids.includes(p.id))
			.map((p) => p.key);
		return new Set(keys);
	}

	async function onAddUser() {
		if (!addUserEmail.trim()) {
			toast.error("Email is required");
			return;
		}
		setBusy(true);
		const { data: profile, error: profileError } = await supabase
			.from("profiles")
			.select("id, email")
			.eq("email", addUserEmail.trim())
			.maybeSingle();
		if (profileError || !profile?.id) {
			toast.error("User not found in profiles");
			setBusy(false);
			return;
		}

		if (addUserIsAdmin) {
			const { error } = await supabase
				.from("profiles")
				.update({ is_admin: true })
				.eq("id", profile.id);
			if (error) {
				toast.error("Failed to update admin status");
				setBusy(false);
				return;
			}
		}

		const selectedIds = permissions
			.filter((p) => addUserPermissions.has(p.key))
			.map((p) => ({ user_id: profile.id, permission_id: p.id, project_id: null }));

		if (selectedIds.length > 0) {
			const { error } = await supabase
				.from("access_user_permissions")
				.upsert(selectedIds, { onConflict: "user_id,permission_id,project_id" });
			if (error) {
				toast.error("Failed to assign permissions");
				setBusy(false);
				return;
			}
		}

		setAddUserEmail("");
		setAddUserIsAdmin(false);
		setAddUserPermissions(new Set());
		toast.success("User access updated");
		setBusy(false);
	}

	async function onSaveUserPermissions(userId: string) {
		setBusy(true);
		const { error: delError } = await supabase
			.from("access_user_permissions")
			.delete()
			.eq("user_id", userId)
			.is("project_id", null);
		if (delError) {
			toast.error("Failed to clear permissions");
			setBusy(false);
			return;
		}

		const selectedIds = permissions
			.filter((p) => editingPermissions.has(p.key))
			.map((p) => ({ user_id: userId, permission_id: p.id, project_id: null }));

		if (selectedIds.length > 0) {
			const { error } = await supabase
				.from("access_user_permissions")
				.upsert(selectedIds, { onConflict: "user_id,permission_id,project_id" });
			if (error) {
				toast.error("Failed to save permissions");
				setBusy(false);
				return;
			}
		}

		setUserPermissions((prev) => prev.filter((p) => !(p.user_id === userId && p.project_id == null)));
		setUserPermissions((prev) => [
			...prev,
			...selectedIds.map((p) => ({ user_id: p.user_id, permission_id: p.permission_id, project_id: null })),
		]);
		setEditingUserId(null);
		setEditingPermissions(new Set());
		toast.success("Permissions saved");
		setBusy(false);
	}

	async function addUserRole(userId: string, roleId: string, projectId: string | null) {
		setBusy(true);
		const { error } = await supabase.from("access_user_roles").insert({
			user_id: userId,
			role_id: roleId,
			project_id: projectId,
		});
		if (error) {
			toast.error("Failed to assign role");
			setBusy(false);
			return;
		}
		setUserRoles((prev) => [...prev, { user_id: userId, role_id: roleId, project_id: projectId }]);
		toast.success("Role assigned");
		setBusy(false);
	}

	async function addUserPermission(userId: string, permissionId: string, projectId: string | null) {
		setBusy(true);
		const { error } = await supabase.from("access_user_permissions").insert({
			user_id: userId,
			permission_id: permissionId,
			project_id: projectId,
		});
		if (error) {
			toast.error("Failed to assign permission");
			setBusy(false);
			return;
		}
		setUserPermissions((prev) => [...prev, { user_id: userId, permission_id: permissionId, project_id: projectId }]);
		toast.success("Permission assigned");
		setBusy(false);
	}

	async function addRoleBundle(roleId: string, bundleId: string) {
		setBusy(true);
		const { error } = await supabase.from("access_role_bundles").insert({
			role_id: roleId,
			bundle_id: bundleId,
		});
		if (error) {
			toast.error("Failed to attach bundle");
			setBusy(false);
			return;
		}
		setRoleBundles((prev) => [...prev, { role_id: roleId, bundle_id: bundleId }]);
		toast.success("Bundle attached");
		setBusy(false);
	}

	return (
		<div className="p-6">
			<Card>
				<CardHeader>
					<CardTitle>Add User</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div>
							<label className="text-sm font-medium">Email</label>
							<Input
								value={addUserEmail}
								onChange={(e) => setAddUserEmail(e.target.value)}
								placeholder="user@example.com"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Checkbox
								checked={addUserIsAdmin}
								onCheckedChange={(v) => setAddUserIsAdmin(Boolean(v))}
							/>
							<span className="text-sm">Admin</span>
						</div>
						<div>
							<div className="text-sm font-medium mb-2">Feature Access</div>
							<div className="flex flex-wrap gap-2">
								{globalPermissions.map((perm) => (
									<label
										key={perm.value}
										className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
									>
										<Checkbox
											checked={addUserPermissions.has(perm.label as PermissionKey)}
											onCheckedChange={(v) => {
												setAddUserPermissions((prev) => {
													const next = new Set(prev);
													if (v) next.add(perm.label as PermissionKey);
													else next.delete(perm.label as PermissionKey);
													return next;
												});
											}}
										/>
										{formatPermissionLabel(perm.label)}
									</label>
								))}
							</div>
						</div>
						<Button disabled={!canManage || busy} onClick={onAddUser}>
							Add User
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Admin Access Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{rows.length === 0 ? (
							<p className="text-sm text-muted-foreground">No users found.</p>
						) : (
							rows.map((row) => (
								<div
									key={row.id}
									className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
								>
									<div className="min-w-[220px]">
										<div className="font-medium">
											{row.full_name || "Unnamed User"}
										</div>
										<div className="text-xs text-muted-foreground">
											{row.email || row.id}
										</div>
										<div className="mt-2 text-xs text-muted-foreground">
											Admin Status: {row.is_admin ? "Admin" : "User"}
										</div>
									</div>
									<Button
										variant={row.is_admin ? "outline" : "default"}
										disabled={busy}
										onClick={() => toggleAdmin(row.id, !row.is_admin)}
									>
										{row.is_admin ? "Revoke Admin" : "Make Admin"}
									</Button>

									<div className="w-full border-t pt-3">
										<div className="flex items-center gap-3 text-sm">
											<span className="font-medium">Feature Access</span>
											{editingUserId === row.id ? (
												<>
													<Button
														variant="outline"
														size="sm"
														disabled={busy}
														onClick={() => {
															setEditingUserId(null);
															setEditingPermissions(new Set());
														}}
													>
														Cancel
													</Button>
													<Button
														size="sm"
														disabled={busy}
														onClick={() => onSaveUserPermissions(row.id)}
													>
														Save
													</Button>
												</>
											) : (
												<Button
													size="sm"
													variant="outline"
													disabled={!canManage}
													onClick={() => {
														setEditingUserId(row.id);
														setEditingPermissions(userGlobalPermissions(row.id));
													}}
												>
													Edit
												</Button>
											)}
										</div>
										<div className="mt-2 flex flex-wrap gap-2">
											{globalPermissions.map((perm) => {
												const key = perm.label as PermissionKey;
												const active = editingUserId === row.id
													? editingPermissions.has(key)
													: userGlobalPermissions(row.id).has(key);
												return (
													<label
														key={`${row.id}-${perm.value}`}
														className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
															active ? "bg-accent" : "bg-background"
														}`}
													>
														{editingUserId === row.id ? (
															<Checkbox
																checked={active}
																onCheckedChange={(v) => {
																	setEditingPermissions((prev) => {
																		const next = new Set(prev);
																		if (v) next.add(key);
																		else next.delete(key);
																		return next;
																	});
																}}
															/>
														) : (
															<span className="inline-block h-3 w-3 rounded-sm border" />
														)}
														{formatPermissionLabel(perm.label)}
													</label>
												);
											})}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="mt-6">
				<CardHeader>
					<CardTitle>Access Templates & Custom Grants</CardTitle>
				</CardHeader>
				<CardContent>
					{!canManage && (
						<p className="text-sm text-muted-foreground">
							You need the <code>admin.manage_access</code> permission to edit roles and permissions.
						</p>
					)}
					<div className="space-y-6">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="font-medium">Assign Global Role</div>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignGlobalRole.userId}
										disabled={!canManage}
										onChange={(e) => setAssignGlobalRole((s) => ({ ...s, userId: e.target.value }))}
									>
										<option value="">Select user</option>
										{userOptions.map((u) => (
											<option key={u.value} value={u.value}>{u.label}</option>
										))}
									</select>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignGlobalRole.roleId}
										disabled={!canManage}
										onChange={(e) => setAssignGlobalRole((s) => ({ ...s, roleId: e.target.value }))}
									>
										<option value="">Select role</option>
										{globalRoles.map((r) => (
											<option key={r.value} value={r.value}>{r.label}</option>
										))}
									</select>
									<Button
										disabled={busy || !assignGlobalRole.userId || !assignGlobalRole.roleId}
										onClick={() => addUserRole(assignGlobalRole.userId, assignGlobalRole.roleId, null)}
									>
										Assign Role
									</Button>
								</div>

								<div className="space-y-2">
									<div className="font-medium">Assign Project Role</div>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignProjectRole.projectId}
										disabled={!canManage}
										onChange={(e) => setAssignProjectRole((s) => ({ ...s, projectId: e.target.value }))}
									>
										<option value="">Select project</option>
										{projectOptions.map((p) => (
											<option key={p.value} value={p.value}>{p.label}</option>
										))}
									</select>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignProjectRole.userId}
										disabled={!canManage}
										onChange={(e) => setAssignProjectRole((s) => ({ ...s, userId: e.target.value }))}
									>
										<option value="">Select user</option>
										{userOptions.map((u) => (
											<option key={u.value} value={u.value}>{u.label}</option>
										))}
									</select>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignProjectRole.roleId}
										disabled={!canManage}
										onChange={(e) => setAssignProjectRole((s) => ({ ...s, roleId: e.target.value }))}
									>
										<option value="">Select role</option>
										{projectRoles.map((r) => (
											<option key={r.value} value={r.value}>{r.label}</option>
										))}
									</select>
									<Button
										disabled={busy || !assignProjectRole.userId || !assignProjectRole.roleId || !assignProjectRole.projectId}
										onClick={() =>
											addUserRole(assignProjectRole.userId, assignProjectRole.roleId, assignProjectRole.projectId)
										}
									>
										Assign Role
									</Button>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="font-medium">Custom Permission</div>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignPermission.scope}
										disabled={!canManage}
										onChange={(e) =>
											setAssignPermission((s) => ({ ...s, scope: e.target.value as "global" | "project" }))
										}
									>
										<option value="global">Global</option>
										<option value="project">Project</option>
									</select>
									{assignPermission.scope === "project" && (
										<select
											className="w-full rounded-md border px-3 py-2 text-sm"
											value={assignPermission.projectId}
											disabled={!canManage}
											onChange={(e) => setAssignPermission((s) => ({ ...s, projectId: e.target.value }))}
										>
											<option value="">Select project</option>
											{projectOptions.map((p) => (
												<option key={p.value} value={p.value}>{p.label}</option>
											))}
										</select>
									)}
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignPermission.userId}
										disabled={!canManage}
										onChange={(e) => setAssignPermission((s) => ({ ...s, userId: e.target.value }))}
									>
										<option value="">Select user</option>
										{userOptions.map((u) => (
											<option key={u.value} value={u.value}>{u.label}</option>
										))}
									</select>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignPermission.permissionId}
										disabled={!canManage}
										onChange={(e) => setAssignPermission((s) => ({ ...s, permissionId: e.target.value }))}
									>
										<option value="">Select permission</option>
										{(assignPermission.scope === "global" ? globalPermissions : projectPermissions).map((p) => (
											<option key={p.value} value={p.value}>{p.label}</option>
										))}
									</select>
									<Button
										disabled={
											busy ||
											!assignPermission.userId ||
											!assignPermission.permissionId ||
											(assignPermission.scope === "project" && !assignPermission.projectId)
										}
										onClick={() =>
											addUserPermission(
												assignPermission.userId,
												assignPermission.permissionId,
												assignPermission.scope === "project" ? assignPermission.projectId : null
											)
										}
									>
										Assign Permission
									</Button>
								</div>

								<div className="space-y-2">
									<div className="font-medium">Attach Bundle to Role</div>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignBundleToRole.roleId}
										disabled={!canManage}
										onChange={(e) => setAssignBundleToRole((s) => ({ ...s, roleId: e.target.value }))}
									>
										<option value="">Select role</option>
										{roleOptions.map((r) => (
											<option key={r.value} value={r.value}>{r.label}</option>
										))}
									</select>
									<select
										className="w-full rounded-md border px-3 py-2 text-sm"
										value={assignBundleToRole.bundleId}
										disabled={!canManage}
										onChange={(e) => setAssignBundleToRole((s) => ({ ...s, bundleId: e.target.value }))}
									>
										<option value="">Select bundle</option>
										{[...globalBundles, ...projectBundles].map((b) => (
											<option key={b.value} value={b.value}>{b.label}</option>
										))}
									</select>
									<Button
										disabled={busy || !assignBundleToRole.roleId || !assignBundleToRole.bundleId}
										onClick={() => addRoleBundle(assignBundleToRole.roleId, assignBundleToRole.bundleId)}
									>
										Attach Bundle
									</Button>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								<div>
									<div className="font-medium mb-2">Current Role Assignments</div>
									<ul className="text-sm space-y-1">
										{userRoles.map((r, idx) => (
											<li key={`${r.user_id}-${r.role_id}-${r.project_id}-${idx}`}>
												{findUserLabel(r.user_id)} → {findRoleLabel(r.role_id)} ({findProjectLabel(r.project_id)})
											</li>
										))}
									</ul>
								</div>
								<div>
									<div className="font-medium mb-2">Current Custom Permissions</div>
									<ul className="text-sm space-y-1">
										{userPermissions.map((p, idx) => (
											<li key={`${p.user_id}-${p.permission_id}-${p.project_id}-${idx}`}>
												{findUserLabel(p.user_id)} → {findPermLabel(p.permission_id)} ({findProjectLabel(p.project_id)})
											</li>
										))}
									</ul>
								</div>
							</div>

							<div>
								<div className="font-medium mb-2">Role Bundle Attachments</div>
								<ul className="text-sm space-y-1">
									{roleBundles.map((rb, idx) => (
										<li key={`${rb.role_id}-${rb.bundle_id}-${idx}`}>
											{findRoleLabel(rb.role_id)} → {findBundleLabel(rb.bundle_id)}
										</li>
									))}
								</ul>
							</div>
						</div>
				</CardContent>
			</Card>
		</div>
	);
}
