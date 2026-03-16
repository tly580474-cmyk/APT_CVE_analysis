import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { message } from 'antd';

// 检查用户是否登录
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!token && !!user;
};

// 获取当前用户角色
const getUserRole = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role || 'user';
    } catch (e) {
      return 'user';
    }
  }
  return 'user';
};

// 需要登录的路由
export const PrivateRoute = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    message.warning('请先登录');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
};

// 需要管理员权限的路由
export const AdminRoute = ({ children }) => {
  const location = useLocation();
  
  if (!isAuthenticated()) {
    message.warning('请先登录');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (getUserRole() !== 'admin') {
    message.error('需要管理员权限');
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// 公开路由（已登录用户重定向到首页）
export const PublicRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PrivateRoute;
