import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout/Layout';
import { PrivateRoute, AdminRoute, PublicRoute } from './components/Auth/PrivateRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Documents from './pages/Documents/Documents';
import DocumentDetail from './pages/Documents/DocumentDetail';
import DocumentUpload from './pages/Documents/DocumentUpload';
import CVE from './pages/CVE/CVE';
import Visualization from './pages/Visualization/Visualization';
import Forum from './pages/Forum/Forum';
import ForumPost from './pages/Forum/ForumPost';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import AIAnalysis from './pages/AIAnalysis/AIAnalysis';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* 公开路由 */}
            <Route index element={<Home />} />
            <Route path="documents" element={<Documents />} />
            <Route path="documents/:id" element={<DocumentDetail />} />
            <Route path="cve" element={<CVE />} />
            <Route path="visualization" element={<Visualization />} />
            <Route path="ai-analysis" element={<AIAnalysis />} />
            <Route path="forum" element={<Forum />} />
            <Route path="forum/post/:id" element={<ForumPost />} />
            
            {/* 需要登录的路由 */}
            <Route 
              path="documents/upload" 
              element={
                <PrivateRoute>
                  <DocumentUpload />
                </PrivateRoute>
              } 
            />
            <Route 
              path="profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            
            {/* 管理员路由 */}
            <Route 
              path="admin" 
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } 
            />
            
            {/* 公开但已登录用户不能访问的路由 */}
            <Route 
              path="login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="register" 
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } 
            />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
