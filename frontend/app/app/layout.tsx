import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/top-bar";

export default function AuthenticatedAppLayout({ children }: { children: React.ReactNode }) {
  return <div className="workspace-ui min-h-screen"><AppSidebar /><main className="workspace-main min-h-screen lg:pl-[252px]"><TopBar /><div className="workspace-grid pointer-events-none fixed inset-x-0 top-[76px] z-0 h-80" /><div className="workspace-content relative z-10 mx-auto w-full max-w-[1550px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">{children}</div></main></div>;
}
