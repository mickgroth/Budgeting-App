import React, { useState } from 'react';

interface UserProfileProps {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
  };
  onSignOut: () => void;
}

/**
 * User profile component with logout functionality
 */
export const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      onSignOut();
    }
  };

  // Get initials from display name or email
  const getInitials = () => {
    if (user.displayName) {
      const parts = user.displayName.split(' ');
      if (parts.length >= 2) {
        return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
      }
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="user-profile" style={{ position: 'relative' }}>
      <button
        className="user-profile-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          color: 'white',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {getInitials()}
      </button>

      {isMenuOpen && (
        <>
          <div
            className="user-profile-overlay"
            onClick={() => setIsMenuOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
          />
          <div
            className="user-profile-menu"
            style={{
              position: 'absolute',
              top: '50px',
              right: '0',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              padding: '1rem',
              minWidth: '220px',
              zIndex: 1000,
            }}
          >
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#1F2937' }}>
                {user.displayName || 'User'}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                {user.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9375rem',
              }}
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

