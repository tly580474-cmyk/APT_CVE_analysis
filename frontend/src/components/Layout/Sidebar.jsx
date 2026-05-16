import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  FileTextOutlined,
  BugOutlined,
  BarChartOutlined,
  RobotOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
  SafetyOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useDarkMode } from '../../contexts/DarkModeContext';
import useAuth from '../../hooks/useAuth';

const navGroups = [
  {
    label: '核心模块',
    items: [
      { key: '/', icon: <HomeOutlined />, label: '仪表盘' },
      { key: '/documents', icon: <FileTextOutlined />, label: '文档管理' },
      { key: '/cve', icon: <BugOutlined />, label: 'CVE漏洞' },
      { key: '/visualization', icon: <BarChartOutlined />, label: '可视化' },
      { key: '/ai-analysis', icon: <RobotOutlined />, label: '智能分析' },
    ],
  },
  {
    label: '社区',
    items: [
      { key: '/forum', icon: <MessageOutlined />, label: '论坛' },
    ],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();
  const { isLoggedIn, isAdmin } = useAuth();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const userItems = [
    ...(isLoggedIn ? [{ key: '/profile', icon: <UserOutlined />, label: '个人资料' }] : []),
    ...(isAdmin ? [{ key: '/admin', icon: <SettingOutlined />, label: '管理后台' }] : []),
  ];

  const allGroups = [
    ...navGroups,
    ...(userItems.length > 0 ? [{ label: '用户', items: userItems }] : []),
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col z-50 transition-colors duration-200">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
          <SafetyOutlined className="text-white text-sm" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {allGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-4">
            <div className="px-3 mb-2">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold truncate block">
                {group.label}
              </span>
            </div>
            {group.items.map((item) => (
              <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.3}>
                <button
                  onClick={() => navigate(item.key)}
                  className={`w-full flex items-center justify-center h-10 mx-2 rounded-lg transition-all duration-150 cursor-pointer mb-1 ${
                    isActive(item.key)
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold'
                      : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                  style={{ width: 'calc(100% - 16px)' }}
                >
                  <span className="text-lg">{item.icon}</span>
                </button>
              </Tooltip>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: Dark mode toggle */}
      <div className="p-3 border-t border-gray-200 dark:border-slate-700">
        <Tooltip title={isDark ? '切换亮色模式' : '切换暗色模式'} placement="right">
          <button
            onClick={toggleDark}
            className="w-full flex items-center justify-center h-10 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {isDark ? <SunOutlined className="text-lg" /> : <MoonOutlined className="text-lg" />}
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};

export default Sidebar;
