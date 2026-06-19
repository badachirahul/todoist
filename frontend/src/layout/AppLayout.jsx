import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const BREADCRUMBS = {
  "/inbox": "Inbox",
  "/today": "Today",
  "/upcoming": "Upcoming",
  "/filters": "Filters & Labels",
  "/reporting": "Reporting",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const breadcrumb = BREADCRUMBS[pathname] || "";
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {sidebarOpen && <Sidebar onCollapse={() => setSidebarOpen(false)} />}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          breadcrumb={breadcrumb}
          sidebarOpen={sidebarOpen}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
