import React, { useState } from 'react';
import { AuthService } from '../services/authService';

interface UserProfileProps {
  userName: string | null;
  userEmail: string | null;
}

/**
 * User profile component with logout functionality
 */
export const UserProfile: React.FC<UserProfileProps> = ({ userName, userEmail }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      setIsLoggingOut(true);
      try {
        await AuthService.signOut();
        window.location.reload();
      } catch (error) {
        console.error('Error logging out:', error);
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <div className="user-profile">
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
        {userName?.charAt(0).toUpperCase() || 'U'}
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
              minWidth: '200px',
              zIndex: 1000,
            }}
          >
            <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{userName}</div>
              <div style={{ fontSize: '0.875rem', color: '#718096' }}>{userEmail}</div>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: '#EF4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoggingOut ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: isLoggingOut ? 0.6 : 1,
              }}
            >
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

