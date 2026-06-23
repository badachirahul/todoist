import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useNotificationStream } from "../api/realtime";

const BREADCRUMBS = {
  "/inbox": "Inbox",
  "/today": "Today",
  "/upcoming": "Upcoming",
  "/filters": "Filters & Labels",
  "/reporting": "Reporting",
  "/notifications": "Notifications",
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const breadcrumb = BREADCRUMBS[pathname] || "";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useNotificationStream(); // live badge + notifications page

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Animated collapse: clip the fixed-width sidebar by transitioning the
          wrapper's width (+ a slight fade) so the main area slides over smoothly. */}
      <div
        className={[
          "shrink-0 overflow-hidden transition-all duration-[250ms] ease-in-out",
          sidebarOpen ? "w-[280px] opacity-100" : "w-0 opacity-0",
        ].join(" ")}
      >
        <Sidebar onCollapse={() => setSidebarOpen(false)} />
      </div>
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* The Notifications page renders its own bare layout (no Display/comment/⋯ header). */}
        {pathname !== "/notifications" && (
          <Topbar
            breadcrumb={breadcrumb}
            sidebarOpen={sidebarOpen}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        )}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
