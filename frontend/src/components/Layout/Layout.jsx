import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Avatar, Dropdown } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  BugOutlined,
  BarChartOutlined,
  MessageOutlined,
  UserOutlined,
  LoginOutlined,
  LogoutOutlined,
  SettingOutlined,
  RobotOutlined,
} from '@ant-design/icons';

const { Header, Content, Footer } = AntLayout;

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  // 检查登录状态
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
        } catch (e) {
          setIsAdmin(false);
        }
      }
    };
    
    checkAuth();
    // 监听storage变化
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const menuItems = [
    { key: '/', icon: <HomeOutlined />, label: '首页' },
    { key: '/documents', icon: <FileTextOutlined />, label: '文档管理' },
    { key: '/cve', icon: <BugOutlined />, label: 'CVE漏洞' },
    { key: '/visualization', icon: <BarChartOutlined />, label: '可视化' },
    { key: '/ai-analysis', icon: <RobotOutlined />, label: '智能分析' },
    { key: '/forum', icon: <MessageOutlined />, label: '论坛' },
    ...(isAdmin ? [{ key: '/admin', icon: <SettingOutlined />, label: '管理后台' }] : []),
  ];

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    ...(isAdmin ? [{ key: 'admin', icon: <SettingOutlined />, label: '管理后台' }] : []),
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUser(null);
      navigate('/');
    } else if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'admin') {
      navigate('/admin');
    }
  };

  return (
    <AntLayout className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 顶部导航栏 - 玻璃拟态效果 */}
      <Header className="flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-blue-900/5">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BugOutlined className="text-white text-lg" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              APT情报分析平台
            </h1>
          </div>
          
          {/* 导航菜单 - 所有功能一排显示 */}
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-0 bg-transparent min-w-[500px]"
            style={{ 
              background: 'transparent',
              border: 'none'
            }}
          />
        </div>

        {/* 右侧用户区域 */}
        <div className="flex items-center">
          {isLoggedIn ? (
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 cursor-pointer hover:shadow-md transition-all duration-300">
                <Avatar 
                  src={user?.avatar} 
                  icon={!user?.avatar && <UserOutlined />} 
                  className={isAdmin ? "bg-gradient-to-br from-red-500 to-orange-500" : "bg-gradient-to-br from-blue-500 to-indigo-600"}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.username || '用户'}
                  </span>
                  {isAdmin && (
                    <span className="text-xs text-red-500">管理员</span>
                  )}
                </div>
              </div>
            </Dropdown>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
              className="rounded-full px-6 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 border-0 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300"
            >
              登录
            </Button>
          )}
        </div>
      </Header>

      {/* 主内容区 */}
      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </Content>

      {/* 底部页脚 */}
      <Footer className="text-center bg-white/60 backdrop-blur-sm border-t border-gray-100">
        <div className="flex flex-col items-center gap-2">
          <p className="text-gray-500 text-sm">
            APT攻击情报分析平台 ©2026 Created by Security Team
          </p>
          <div className="flex gap-4 text-xs text-gray-400">
            <span>安全 · 智能 · 高效</span>
          </div>
        </div>
      </Footer>
    </AntLayout>
  );
};

export default Layout;
