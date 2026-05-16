import React from 'react';
import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import MobileBottomNav from './MobileBottomNav';

const { Content, Footer } = AntLayout;

const Layout = () => {
  return (
    <AntLayout className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content area */}
      <AntLayout className="md:ml-16 transition-all duration-300">
        {/* Top navbar */}
        <TopNavbar />

        {/* Content */}
        <Content className="pt-20 px-4 md:px-6 pb-8 md:pb-8 pb-20">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </Content>

        {/* Footer */}
        <Footer className="text-center bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-t border-gray-100 dark:border-slate-700 transition-colors duration-200">
          <div className="flex flex-col items-center gap-2">
            <p className="text-gray-500 dark:text-slate-400 text-sm">
              APT攻击情报分析平台 &copy;2026 Created by Security Team
            </p>
            <div className="flex gap-4 text-xs text-gray-400 dark:text-slate-500">
              <span>安全 · 智能 · 高效</span>
            </div>
          </div>
        </Footer>
      </AntLayout>

      {/* Mobile bottom nav */}
      <MobileBottomNav />
    </AntLayout>
  );
};

export default Layout;
