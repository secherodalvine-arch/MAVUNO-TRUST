import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/PublicLayout.css';

/**
 * PublicLayout — wraps the landing page, login, and register.
 * Always strictly uses hardcoded dark theme regardless of user app settings.
 */
const PublicLayout = () => {
  useEffect(() => {
    // Enforce dark theme on public layout & homepage
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      // Restore user's preferred theme when exiting public layout
      const savedTheme = localStorage.getItem('mavuno-theme') || 'dark';
      const effective = savedTheme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : savedTheme;
      document.documentElement.setAttribute('data-theme', effective);
    };
  }, []);

  return (
    <div className="public-layout" data-theme="dark">
      <Navbar />
      <main className="public-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
