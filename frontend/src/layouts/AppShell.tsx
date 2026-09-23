import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { CollapsibleSidebar } from '../components/CollapsibleSidebar';
import AppHeader from '../components/AppHeader';
import '../styles/AppShell.css';

/**
 * AppShell — authenticated layout.
 * Sidebar (collapsible on desktop, drawer on mobile) + header + page content.
 * No footer.
 */
const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    // Persist collapse preference
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  // Apply user's selected theme on AppShell mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('mavuno-theme') || 'dark';
    const effective = savedTheme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : savedTheme;
    document.documentElement.setAttribute('data-theme', effective);
  }, []);

  const toggleCollapse = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const toggleMobile = () => setMobileOpen((v) => !v);
  const closeMobile = () => setMobileOpen(false);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 900) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      <CollapsibleSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onMobileClose={closeMobile}
      />

      <div className="app-shell-body">
        <AppHeader
          onMenuClick={toggleMobile}
          sidebarCollapsed={collapsed}
        />
        <main className="app-shell-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
