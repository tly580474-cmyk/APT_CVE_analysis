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
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useDarkMode } from '../../contexts/DarkModeContext';
import { useSidebar } from '../../contexts/SidebarContext';
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
  const {
    isExpanded,
    collapsed,
    toggleCollapsed,
    handleMouseEnter,
    handleMouseLeave,
  } = useSidebar();

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

  const renderNavItem = (item) => {
    const active = isActive(item.key);
    const button = (
      <button
        onClick={() => navigate(item.key)}
        className={`
          w-full flex items-center h-10 rounded-lg transition-all duration-150 cursor-pointer mb-0.5
          ${isExpanded ? 'px-3 gap-3 justify-start' : 'justify-center'}
          ${active
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
            : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/60'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-600 dark:bg-primary-400 rounded-r-full" />
        )}
        <span className={`text-lg flex-shrink-0 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`}>
          {item.icon}
        </span>
        {isExpanded && (
          <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {item.label}
          </span>
        )}
      </button>
    );

    if (isExpanded) {
      return <div key={item.key} className="relative px-2">{button}</div>;
    }

    return (
      <Tooltip key={item.key} title={item.label} placement="right" mouseEnterDelay={0.3}>
        <div className="relative px-2">{button}</div>
      </Tooltip>
    );
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        fixed left-0 top-0 h-screen z-50
        bg-white dark:bg-slate-800
        border-r border-gray-200 dark:border-slate-700
        flex flex-col
        transition-all duration-200 ease-in-out
      `}
      style={{ width: isExpanded ? 220 : 64 }}
    >
      {/* Logo */}
      <div
        className="h-16 flex items-center border-b border-gray-200 dark:border-slate-700 overflow-hidden"
        style={{ paddingLeft: isExpanded ? 20 : 0, justifyContent: isExpanded ? 'flex-start' : 'center' }}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
          <SafetyOutlined className="text-white text-sm" />
        </div>
        {isExpanded && (
          <span className="ml-3 text-sm font-bold text-gray-800 dark:text-white whitespace-nowrap">
            APT Sentinel
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {allGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="mb-3">
            {isExpanded && (
              <div className="px-4 mb-1.5">
                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider font-bold">
                  {group.label}
                </span>
              </div>
            )}
            {!isExpanded && groupIdx > 0 && (
              <div className="mx-3 my-2 border-t border-gray-100 dark:border-slate-700" />
            )}
            {group.items.map(renderNavItem)}
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-gray-200 dark:border-slate-700 p-2">
        <div className={`flex ${isExpanded ? 'flex-row gap-1' : 'flex-col gap-1'}`}>
          <Tooltip title={isExpanded ? '收起侧边栏' : '展开侧边栏'} placement="right" mouseEnterDelay={0.3}>
            <button
              onClick={toggleCollapsed}
              className={`
                flex items-center justify-center h-10 rounded-lg
                text-gray-500 dark:text-slate-400
                hover:bg-gray-100 dark:hover:bg-slate-700/60
                transition-colors cursor-pointer
                ${isExpanded ? 'flex-1' : 'w-full'}
              `}
            >
              {isExpanded
                ? <LeftOutlined className="text-base" />
                : <RightOutlined className="text-base" />
              }
            </button>
          </Tooltip>

          <Tooltip title={isDark ? '切换亮色模式' : '切换暗色模式'} placement="right" mouseEnterDelay={0.3}>
            <button
              onClick={toggleDark}
              className={`
                flex items-center justify-center h-10 rounded-lg
                text-gray-500 dark:text-slate-400
                hover:bg-gray-100 dark:hover:bg-slate-700/60
                transition-colors cursor-pointer
                ${isExpanded ? 'flex-1' : 'w-full'}
              `}
            >
              {isDark ? <SunOutlined className="text-base" /> : <MoonOutlined className="text-base" />}
            </button>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
