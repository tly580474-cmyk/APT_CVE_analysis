import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Dropdown } from 'antd';
import {
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useDarkMode } from '../../contexts/DarkModeContext';
import useAuth from '../../hooks/useAuth';

const TopNavbar = () => {
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();
  const { isLoggedIn, isAdmin, user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('storage'));
    navigate('/');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人资料' },
    ...(isAdmin ? [{ key: 'admin', icon: <SettingOutlined />, label: '管理后台' }] : []),
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'admin') {
      navigate('/admin');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-16 h-16 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 transition-colors duration-200">
      {/* Left: Search */}
      <div className="hidden md:flex items-center bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 w-80">
        <SearchOutlined className="text-gray-400 dark:text-slate-400 mr-2" />
        <input
          className="bg-transparent border-none focus:outline-none text-sm w-full dark:text-white placeholder-gray-400 dark:placeholder-slate-400"
          placeholder="搜索情报、CVE、文档..."
          type="text"
        />
      </div>

      {/* Mobile: Logo */}
      <div className="md:hidden flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">A</span>
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-white">APT情报分析</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          {isDark ? (
            <SunOutlined className="text-gray-500 dark:text-slate-400 text-base" />
          ) : (
            <MoonOutlined className="text-gray-500 text-base" />
          )}
        </button>

        {/* User area */}
        {isLoggedIn ? (
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
            trigger={['click']}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
              <Avatar
                src={user?.avatar}
                icon={!user?.avatar ? <UserOutlined /> : undefined}
                size={32}
                className="bg-primary-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300 hidden md:inline">
                {user?.username || '用户'}
              </span>
            </div>
          </Dropdown>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
          >
            登录
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;
