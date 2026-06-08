import React from 'react';
import type {ReactNode} from 'react';
import {Navigate} from 'react-router-dom';
import {useAuth} from '../context/AuthContext';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: Array<'athlete' | 'coach' | 'manager'>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children, allowedRoles}) => {
    const {user, isLoading} = useAuth();

    if (isLoading) {
        return <div style={{color: '#fff', textAlign: 'center', marginTop: '20vh'}}>Перевірка прав доступу...</div>;
    }

    if (!user) {
        return <Navigate to="/auth" replace/>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace/>;
    }

    return <>{children}</>;
};

export default ProtectedRoute;