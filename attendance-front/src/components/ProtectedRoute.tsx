import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'teacher' | 'student';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    console.log(user)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.user_type !== requiredRole) {
    return <Navigate to={user.user_type === 'teacher' ? '/teacher' : '/student'} replace />;
  }

  return <>{children}</>;
};