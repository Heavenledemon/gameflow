import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  clearStoredSession,
  fetchCurrentUser,
  getStoredGuestState,
  getStoredToken,
  getStoredUser,
  persistAuthSession,
  persistGuestSession,
  signIn as signInRequest,
  signUp as signUpRequest,
  updateProfile as updateProfileRequest,
} from '../lib/auth';
import { AUTH_EXPIRED_EVENT } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(getStoredToken() || getStoredGuestState());
  });
  const [isGuest, setIsGuest] = useState(() => getStoredGuestState());
  const [user, setUser] = useState(() => getStoredUser());
  const [token, setToken] = useState(() => getStoredToken());
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredToken()));

  const refreshCurrentUser = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        return null;
      }

      const data = await fetchCurrentUser(activeToken);
      persistAuthSession({ token: activeToken, user: data.user });
      setUser(data.user);

      return data.user;
    },
    [token],
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateUser() {
      const storedToken = getStoredToken();

      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        await refreshCurrentUser(storedToken);

        if (!isMounted) {
          return;
        }

        setToken(storedToken);
        setIsAuthenticated(true);
        setIsGuest(false);
      } catch {
        if (!isMounted) {
          return;
        }

        clearStoredSession();
        setUser(null);
        setToken('');
        setIsAuthenticated(false);
        setIsGuest(false);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [refreshCurrentUser]);

  useEffect(() => {
    const handleExpired = () => {
      clearStoredSession();
      setUser(null);
      setToken('');
      setIsAuthenticated(false);
      setIsGuest(false);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const loginGuest = () => {
    persistGuestSession();
    setUser(null);
    setToken('');
    setIsAuthenticated(true);
    setIsGuest(true);
    setIsLoading(false);
  };

  const signIn = async (credentials) => {
    const data = await signInRequest(credentials);

    persistAuthSession(data);
    setUser(data.user);
    setToken(data.token);
    setIsAuthenticated(true);
    setIsGuest(false);
    setIsLoading(false);

    return data.user;
  };

  const signUp = async (input) => {
    const data = await signUpRequest(input);

    persistAuthSession(data);
    setUser(data.user);
    setToken(data.token);
    setIsAuthenticated(true);
    setIsGuest(false);
    setIsLoading(false);

    return data.user;
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
    setToken('');
    setIsAuthenticated(false);
    setIsGuest(false);
    setIsLoading(false);
  };

  const updateProfile = async (profileData) => {
    const data = await updateProfileRequest(token, profileData);
    const nextUser = data.user;

    persistAuthSession({ token, user: nextUser });
    setUser(nextUser);

    // Dispatch event to notify components of the update
    window.dispatchEvent(new CustomEvent('profileUpdated', { detail: nextUser }));

    return nextUser;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        isLoading,
        user,
        token,
        loginGuest,
        signIn,
        signUp,
        logout,
        updateProfile,
        refreshCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
