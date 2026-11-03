import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Protected from './lib/Protected.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Swipe from './pages/Swipe.jsx';
import Connections from './pages/Connections.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import RolesFeed from './pages/RolesFeed.jsx';
import MyApplications from './pages/MyApplications.jsx';
import { useAuth } from './lib/auth.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.userType === 'RECRUITER') {
    return <Navigate to="/recruiter" replace />;
  }
  return <Navigate to="/roles" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated app */}
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/home" element={<HomeRedirect />} />
        <Route path="/roles" element={<RolesFeed />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/swipe" element={<Swipe />} />
        <Route path="/connections" element={<Connections />} />
        {/* Backwards-compat redirects */}
        <Route path="/matches" element={<Navigate to="/connections" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
