// src/components/ProtectedRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { User } from '../types/user';

interface Props {
  children: JSX.Element;
  user: User | null;
}

const ProtectedRoute: React.FC<Props> = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
