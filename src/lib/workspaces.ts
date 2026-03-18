export type DashboardWorkspace = "gogevgelija" | "godevlab";

export interface WorkspaceOption {
  key: DashboardWorkspace;
  label: string;
  subtitle: string;
  basePath: string;
}

export const workspaceOptions: WorkspaceOption[] = [
  {
    key: "gogevgelija",
    label: "GoGevgelija",
    subtitle: "City dashboard",
    basePath: "/dashboard",
  },
  {
    key: "godevlab",
    label: "GoDevLab",
    subtitle: "Product workspace",
    basePath: "/dashboard/godevlab",
  },
];

export function getWorkspaceFromPathname(pathname: string): DashboardWorkspace {
  if (pathname === "/dashboard/godevlab" || pathname.startsWith("/dashboard/godevlab/")) {
    return "godevlab";
  }

  return "gogevgelija";
}

export function getWorkspaceOption(workspace: DashboardWorkspace): WorkspaceOption {
  return workspaceOptions.find((option) => option.key === workspace) ?? workspaceOptions[0];
}

export function getWorkspaceBasePath(pathname: string): string {
  return getWorkspaceOption(getWorkspaceFromPathname(pathname)).basePath;
}
