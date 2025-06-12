import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAtom } from 'jotai';
import { activeProfileAtom } from '../../../store';
import { 
  Home, 
  FolderOpen, 
  Settings, 
  User,
  ListOrdered,
  Star,
  Search,
  Menu,
  X
} from 'lucide-react';
import OsuverseSearchbar from '../OsuverseSearchbar/OsuverseSearchbar';
import './Navbar.scss';

const Navbar = ({ onManageProfiles }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeProfile] = useAtom(activeProfileAtom);

  const menuItems = [
    {
      path: '/collection',
      icon: ListOrdered,
      label: 'osu! Collection',
      shortLabel: 'Collection'
    },
    {
      path: '/local',
      icon: FolderOpen,
      label: 'Local Collection',
      shortLabel: 'Local'
    },
    {
      path: '/settings',
      icon: Settings,
      label: 'Settings',
      shortLabel: 'Settings'
    }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo Section */}
        <div className="logo-container">
          <NavLink to="/" className="logo-link">
            <div className="logo-icon">
              <Star className="star-icon" />
            </div>
            <div className="logo-text">
              <h2>osudeit</h2>
              <span className="logo-subtitle">beatmap manager</span>
            </div>
          </NavLink>
        </div>

        {/* Navigation Links - Desktop */}
        <ul className="nav-list desktop-nav">
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
                  <IconComponent size={18} />
                  <span className="nav-label">{item.shortLabel}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>

        {/* Search Bar - Desktop */}
        <div className="search-container">
          <OsuverseSearchbar />
        </div>

        {/* User Section */}
        <div className="user-panel-container">
          {activeProfile ? (
            <div className="profile-info">
              <div className="profile-avatar">
                <User size={20} />
              </div>
              <div className="profile-details">
                <span className="profile-name">{activeProfile}</span>
                <button 
                  className="manage-profiles-btn"
                  onClick={onManageProfiles}
                >
                  Manage
                </button>
              </div>
            </div>
          ) : (
            <button className="login-btn" onClick={onManageProfiles}>
              Set Profile
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-search">
            <OsuverseSearchbar />
          </div>
          
          <ul className="mobile-nav-list">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <li key={item.path} className="mobile-nav-item">
                  <NavLink 
                    to={item.path}
                    className={({ isActive }) => 
                      `mobile-nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <IconComponent size={20} />
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>

          {activeProfile && (
            <div className="mobile-profile-section">
              <div className="profile-info">
                <div className="profile-avatar">
                  <User size={24} />
                </div>
                <div className="profile-details">
                  <span className="profile-name">{activeProfile}</span>
                  <button 
                    className="manage-profiles-btn"
                    onClick={() => {
                      onManageProfiles();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Manage Profiles
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
