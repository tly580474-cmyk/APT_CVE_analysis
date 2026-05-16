import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  BugOutlined,
  BarChartOutlined,
  MessageOutlined,
} from '@ant-design/icons';

const navItems = [
  { key: '/', icon: <HomeOutlined />, label: '首页' },
  { key: '/documents', icon: <FileTextOutlined />, label: '文档' },
  { key: '/cve', icon: <BugOutlined />, label: 'CVE' },
  { key: '/visualization', icon: <BarChartOutlined />, label: '可视化' },
  { key: '/forum', icon: <MessageOutlined />, label: '论坛' },
];

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex justify-around items-center z-50 transition-colors duration-200">
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => navigate(item.key)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
            isActive(item.key)
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-400 dark:text-slate-500'
          }`}
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default MobileBottomNav;
