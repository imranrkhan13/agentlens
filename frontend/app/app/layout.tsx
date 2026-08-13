import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <div className="workspace-ui"><AppSidebar /><main className="workspace-main"><TopBar /><div className="workspace-content">{children}</div></main></div>;
}
