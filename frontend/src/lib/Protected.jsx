import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Spinner from '../components/Spinner.jsx';

export default function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
