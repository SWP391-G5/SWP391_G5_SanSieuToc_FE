import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RequireOwner({ children }) {
  const auth = useAuth();
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  const role = String(auth.user?.role || '').trim();
  if (role !== 'Owner') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

export default RequireOwner;
