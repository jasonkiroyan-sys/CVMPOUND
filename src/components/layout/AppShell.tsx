import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <Sidebar />
      {/* Offset for fixed sidebar (desktop) and mobile top bar */}
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}
