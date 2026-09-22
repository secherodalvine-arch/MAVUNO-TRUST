import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<'FARMER' | 'DEALER' | 'ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ padding: '24px', background: '#1e293b', borderRadius: '12px', color: '#94a3b8' }}>
          🔒 Verifying credentials...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return (
      <div style={{ padding: '48px', maxWidth: '600px', margin: '40px auto', textAlign: 'center' as any }}>
        <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', padding: '24px', borderRadius: '12px', color: '#fef2f2' }}>
          <h2>🚫 Access Denied</h2>
          <p>Your account ({user.role}) does not have permission to view this section.</p>
          <a
            href={
              user.role === 'FARMER'
                ? '/farmer/dashboard'
                : user.role === 'DEALER'
                ? '/dealer/dashboard'
                : '/admin/dashboard'
            }
            style={{ color: '#60a5fa', textDecoration: 'underline', marginTop: '12px', display: 'inline-block' }}
          >
            Go to your role dashboard →
          </a>
        </div>
      </div>
    );
  }

  return children;
};
