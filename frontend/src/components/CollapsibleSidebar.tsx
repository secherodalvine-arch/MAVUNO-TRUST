import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Leaf,
  TrendingUp,
  Calculator,
  Scale,
  MessageSquare,
  Receipt,
  HandshakeIcon,
  Search,
  Shield,
  ScrollText,
  Building2,
  ChevronLeft,
  ChevronRight,
  Settings,
  X,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import './CollapsibleSidebar.css';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const farmerNav: NavItem[] = [
  { to: '/farmer/dashboard', label: 'Dashboard',     icon: <LayoutDashboard size={18} /> },
  { to: '/farmer/profile',   label: 'My Profile',    icon: <User size={18} /> },
  { to: '/farmer/crops',     label: 'My Crops',      icon: <Leaf size={18} /> },
  { to: '/farmer/market',    label: 'Market Prices', icon: <TrendingUp size={18} /> },
  { to: '/farmer/calculator',label: 'Calculator',    icon: <Calculator size={18} /> },
  { to: '/dealers',          label: 'Find Dealers',  icon: <Search size={18} /> },
  { to: '/offers',           label: 'Offers',        icon: <HandshakeIcon size={18} /> },
  { to: '/messages',         label: 'Messages',      icon: <MessageSquare size={18} /> },
  { to: '/transactions',     label: 'Transactions',  icon: <Receipt size={18} /> },
  { to: '/farmer/rights',    label: 'Rights Centre', icon: <Scale size={18} /> },
  { to: '/farmer/complaints',label: 'My Complaints', icon: <ScrollText size={18} /> },
];

const dealerNav: NavItem[] = [
  { to: '/dealer/dashboard',  label: 'Dashboard',         icon: <LayoutDashboard size={18} /> },
  { to: '/dealer/crop-match', label: 'Farmer Crop Match', icon: <Sprout size={18} /> },
  { to: '/dealer/profile',    label: 'My Profile',        icon: <Building2 size={18} /> },
  { to: '/offers',            label: 'Offers',            icon: <HandshakeIcon size={18} /> },
  { to: '/messages',          label: 'Messages',          icon: <MessageSquare size={18} /> },
  { to: '/transactions',      label: 'Transactions',      icon: <Receipt size={18} /> },
];

const adminNav: NavItem[] = [
  { to: '/admin/dashboard',  label: 'Control Panel', icon: <Shield size={18} /> },
  { to: '/transactions',     label: 'Transactions',  icon: <Receipt size={18} /> },
  { to: '/messages',         label: 'Messages',      icon: <MessageSquare size={18} /> },
];

interface CollapsibleSidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onMobileClose: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onMobileClose,
}) => {
  const { user } = useAuth();

  const navItems: NavItem[] =
    user?.role === 'FARMER' ? farmerNav
    : user?.role === 'DEALER' ? dealerNav
    : adminNav;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''} ${mobileOpen ? 'sidebar--mobile-open' : ''}`}
        aria-label="Application navigation"
      >
        {/* ── Brand / Header ── */}
        <div className="sidebar-brand">
          <img
            src="/logo.png"
            alt="MavunoTrust Logo"
            className="sidebar-brand-logo-img"
          />
          {!collapsed && (
            <span className="sidebar-brand-name">MavunoTrust</span>
          )}
          {/* Mobile close button */}
          <button
            className="sidebar-mobile-close"
            onClick={onMobileClose}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="sidebar-nav" aria-label="Section navigation">
          <ul className="sidebar-nav-list" role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                  onClick={onMobileClose}
                >
                  <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
                  {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Footer: Settings + Collapse toggle ── */}
        <div className="sidebar-footer">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-logout ${isActive ? 'sidebar-nav-item--active' : ''}`
            }
            title={collapsed ? 'Settings' : undefined}
            onClick={onMobileClose}
          >
            <span className="sidebar-nav-icon" aria-hidden="true"><Settings size={18} /></span>
            {!collapsed && <span className="sidebar-nav-label">Settings</span>}
          </NavLink>

          {/* Desktop collapse toggle */}
          <button
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default CollapsibleSidebar;
