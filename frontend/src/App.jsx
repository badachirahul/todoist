import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RequireAuth from "./auth/RequireAuth";
import AppLayout from "./layout/AppLayout";
import ViewPlaceholder from "./views/ViewPlaceholder";
import InboxView from "./views/InboxView";
import ProjectView from "./views/ProjectView";
import ProjectsView from "./views/ProjectsView";
import NotificationsView from "./views/NotificationsView";
import InviteAccept from "./pages/InviteAccept";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Accept an invite (auth required; redirects back here after login) */}
        <Route path="/invite/:token" element={<RequireAuth><InviteAccept /></RequireAuth>} />

        {/* Protected app shell */}
        <Route
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="inbox" element={<InboxView />} />
          <Route path="today" element={<ViewPlaceholder title="Today" />} />
          <Route path="upcoming" element={<ViewPlaceholder title="Upcoming" />} />
          <Route path="filters" element={<ViewPlaceholder title="Filters & Labels" />} />
          <Route path="reporting" element={<ViewPlaceholder title="Reporting" />} />
          <Route path="projects" element={<ProjectsView />} />
          <Route path="notifications" element={<NotificationsView />} />
          <Route path="project/:projectId" element={<ProjectView />} />
          <Route path="*" element={<Navigate to="/inbox" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
