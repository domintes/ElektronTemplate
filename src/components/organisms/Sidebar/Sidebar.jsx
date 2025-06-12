import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';
import { activeProfileAtom } from '../../../store';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Star
} from 'lucide-react';
import './Sidebar.scss';

const Sidebar = ({ onManageProfiles }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeProfile] = useAtom(activeProfileAtom);

  const menuItems = [
    {
      path: '/collection',
      icon: ListOrdered,
      label: 'osu! Collection',
      description: 'Browse and manage beatmaps from osu! API'
    },
    {
      path: '/local',
      icon: FolderOpen,
      label: 'Local Collection',
      description: 'Manage local beatmap files'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      description: 'Application preferences'
    }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-section">
          <div className="logo-icon">
            <Star className="star-icon" />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <h2>osudeit</h2>
              <span className="logo-subtitle">beatmap manager</span>
            </div>
          )}
        </div>
        
        <button 
          className="collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {!collapsed && activeProfile && (
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-avatar">
              <User size={24} />
            </div>
            <div className="profile-details">
              <span className="profile-name">{activeProfile}</span>
              <button 
                className="manage-profiles-btn"
                onClick={onManageProfiles}
              >
                Manage Profiles
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path} className="nav-item">
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <div className="nav-icon">
                    <IconComponent size={20} />
                  </div>
                  {!collapsed && (
                    <div className="nav-content">
                      <span className="nav-label">{item.label}</span>
                      <span className="nav-description">{item.description}</span>
                    </div>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          <div className="stats-section">
            <h4>Quick Stats</h4>
            <div className="stat-item">
              <span className="stat-label">Collections:</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Beatmaps:</span>
              <span className="stat-value">0</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
