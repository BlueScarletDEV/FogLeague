import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../types/auth';
import { soundManager } from '../lib/audioManager';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginWithSteam: () => void;
  logout: () => void;
  toggleTwoFactor: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiBase = () => {
  const envApi = import.meta.env.VITE_API_URL;
  if (envApi) return envApi.replace(/\/$/, '');
  return window.location.port === '5173' ? 'http://localhost:3001' : '';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('fogleague_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Validation cryptographique obligatoire lors du retour de Valve Steam OpenID
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const steamAuthSuccess = urlParams.get('steam_auth');
    const token = urlParams.get('token');

    if (steamAuthSuccess === 'success') {
      const apiBase = getApiBase();

      const verifyAndLogin = async () => {
        try {
          if (!token) {
            console.error('[Security-Auth] 🚨 Tentative d\'accès sans jeton de session cryptographique.');
            alert('Alerte de Sécurité : Requête de connexion non autorisée (aucun jeton fourni).');
            return;
          }

          // 🛡️ Vérification obligatoire auprès du backend Node.js (HMAC-SHA256 & TTL)
          const res = await fetch(`${apiBase}/api/auth/verify-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
          });

          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('fogleague_auth_token', token);
            localStorage.setItem('fogleague_auth_user', JSON.stringify(data.user));
            soundManager.playVictory();
            console.log(`[Security-Auth] ✅ Session validée cryptographiquement pour ${data.user.name}`);
          } else {
            console.error('[Security-Auth] 🚨 Jeton rejeté par le serveur :', data.error);
            alert('Alerte de Sécurité : La signature cryptographique de votre session est invalide ou expirée.');
            localStorage.removeItem('fogleague_auth_token');
            localStorage.removeItem('fogleague_auth_user');
            setUser(null);
          }
        } catch (e) {
          console.error('[Security-Auth] Erreur de vérification de session :', e);
        } finally {
          // Nettoyage immédiat de l'URL pour ne laisser aucune trace de jeton dans l'historique
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      verifyAndLogin();
    }
  }, []);

  // Redirection officielle vers Valve SteamCommunity
  const loginWithSteam = () => {
    soundManager.playPickSound();
    const apiBase = getApiBase();
    const currentOrigin = window.location.origin;
    const authEndpoint = `${apiBase}/api/auth/steam?origin=${encodeURIComponent(currentOrigin)}`;
    window.location.href = authEndpoint;
  };

  const logout = () => {
    soundManager.playBanSound();
    setUser(null);
    localStorage.removeItem('fogleague_auth_user');
    localStorage.removeItem('fogleague_auth_token');
  };

  const toggleTwoFactor = () => {
    if (!user) return;
    const updated = { ...user, twoFactorEnabled: !user.twoFactorEnabled };
    setUser(updated);
    localStorage.setItem('fogleague_auth_user', JSON.stringify(updated));
    soundManager.playPickSound();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loginWithSteam,
        logout,
        toggleTwoFactor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
