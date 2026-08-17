import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AppLayout } from '@/components/layout/AppLayout';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';

import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetails from '@/pages/ProjectDetails';
import Employees from '@/pages/Employees';
import Tasks from '@/pages/Tasks';
import Analytics from '@/pages/Analytics';

import CommandCenter from '@/pages/CommandCenter';
import RiskPrediction from '@/pages/RiskPrediction';
import ResourceAllocation from '@/pages/ResourceAllocation';
import Recommendations from '@/pages/Recommendations';
import WhatIf from '@/pages/WhatIf';

import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Users from '@/pages/Users';
import NotFound from '@/pages/NotFound';
import { RequireRole } from '@/components/RequireRole';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected app shell */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route
            path="employees"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <Employees />
              </RequireRole>
            }
          />
          <Route path="tasks" element={<Tasks />} />
          <Route
            path="analytics"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <Analytics />
              </RequireRole>
            }
          />

          {/* AI Decision Support */}
          <Route
            path="ai"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <CommandCenter />
              </RequireRole>
            }
          />
          <Route
            path="ai/risk"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <RiskPrediction />
              </RequireRole>
            }
          />
          <Route
            path="ai/allocation"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager']}>
                <ResourceAllocation />
              </RequireRole>
            }
          />
          <Route
            path="ai/recommendations"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <Recommendations />
              </RequireRole>
            }
          />
          <Route
            path="ai/simulator"
            element={
              <RequireRole roles={['Administrator', 'ProjectManager', 'TeamLead']}>
                <WhatIf />
              </RequireRole>
            }
          />

          {/* Administration */}
          <Route
            path="users"
            element={
              <RequireRole roles={['Administrator']}>
                <Users />
              </RequireRole>
            }
          />

          {/* Workspace */}
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
