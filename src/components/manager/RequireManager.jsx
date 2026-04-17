/**
 * RequireManager.jsx
 * Route guard for Manager/Admin area.
 *
 * Dev-only bypass:
 * - If `VITE_BYPASS_MANAGER_AUTH=true`, manager area is accessible without login.
 */

import { Navigate } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

const BYPASS = String(import.meta.env.VITE_BYPASS_MANAGER_AUTH || '').toLowerCase() === 'true';

/**
 * isAdminGroup
 * Checks whether a role belongs to AdminAccount group.
 *
 * @param {string} role - Role string (e.g. 'Manager', 'Admin')
 * @returns {boolean} true if manager/admin
 */
function isAdminGroup(role) {
  const roleKey = String(role || '').trim().toLowerCase();
  return roleKey === 'admin' || roleKey === 'manager';
}

/**
 * RequireManager
 * @param {object} props
 * @param {import('react').ReactNode} props.children - protected UI
 * @returns {JSX.Element} guarded UI
 */
export default function RequireManager({ children }) {
  const auth = useAuth();

  if (BYPASS) return children;

  if (!auth.isAuthenticated) return <Navigate to="/auth" replace />;

  const role = auth.user?.role;
  if (!isAdminGroup(role)) return <Navigate to="/" replace />;

  return children;
}
