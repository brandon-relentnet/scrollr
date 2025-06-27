import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
// @ts-ignore
import { browser } from "wxt/browser";
import { API_ENDPOINTS } from "@/entrypoints/config/endpoints.js";
import debugLogger, {
  DEBUG_CATEGORIES,
} from "@/entrypoints/utils/debugLogger.js";

interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role_id: number;
  created_at: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginCredentials {
  identifier: string; // email or username
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const dispatch = useDispatch();

  // Get settings with a stable reference to prevent infinite loops
  const theme = useSelector((state: any) => state.theme);
  const layout = useSelector((state: any) => state.layout);
  const finance = useSelector((state: any) => state.finance);
  const power = useSelector((state: any) => state.power);
  const toggles = useSelector((state: any) => state.toggles);
  const rss = useSelector((state: any) => state.rss);
  const pinned = useSelector((state: any) => state.pinned);

  const currentSettings = useMemo(
    () => ({
      theme,
      layout,
      finance,
      power,
      toggles,
      rss,
      pinned,
    }),
    [theme, layout, finance, power, toggles, rss, pinned]
  );

  // Create a stable reference to prevent unnecessary effect triggers
  const settingsRef = useRef(currentSettings);
  const [lastSavedSettings, setLastSavedSettings] = useState<
    typeof currentSettings | null
  >(null);

  // Save current settings to server
  const saveSettingsToServer = useCallback(
    async (token: string, settingsToSave?: any) => {
      try {
        const settings = settingsToSave || currentSettings;
        const response = await fetch(API_ENDPOINTS.accounts.auth.settings, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settings: settings,
            version: "2.0.0-beta.1",
          }),
        });

        if (!response.ok) {
          debugLogger.error(
            DEBUG_CATEGORIES.AUTH,
            "Failed to save settings to server"
          );
        }
      } catch (error) {
        debugLogger.error(
          DEBUG_CATEGORIES.AUTH,
          "Error saving settings to server",
          error
        );
      }
    },
    [currentSettings]
  );

  // Load settings from server and apply to Redux store
  const loadSettingsFromServer = useCallback(
    async (token: string) => {
      setIsLoadingSettings(true);
      try {
        const response = await fetch(API_ENDPOINTS.accounts.auth.settings, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const { settings } = await response.json();

          // Only apply server settings if they exist and are not empty
          if (settings && Object.keys(settings).length > 0) {
            // Apply each slice of settings to Redux store
            Object.keys(settings).forEach((key) => {
              if (settings[key] && typeof settings[key] === "object") {
                const actionType = `${key}/setState`;
                dispatch({ type: actionType, payload: settings[key] });
              }
            });

            debugLogger.authEvent("Settings loaded from server and applied");
          } else {
            // If no server settings exist, save current local settings to server
            await saveSettingsToServer(token);
            debugLogger.authEvent(
              "No server settings found, saved current local settings"
            );
          }
        }
      } catch (error) {
        debugLogger.error(
          DEBUG_CATEGORIES.AUTH,
          "Error loading settings from server",
          error
        );
        // If there's an error loading settings, save current local settings as backup
        await saveSettingsToServer(token);
      } finally {
        // Small delay to ensure Redux state has updated before allowing auto-save
        setTimeout(() => setIsLoadingSettings(false), 1000);
      }
    },
    [dispatch, saveSettingsToServer]
  );

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const userData = localStorage.getItem("auth_user");

        if (token && userData) {
          const user = JSON.parse(userData);

          // Verify token is still valid by fetching current user
          const response = await fetch(API_ENDPOINTS.accounts.auth.me, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const { user: currentUser } = await response.json();
            setAuthState({
              user: currentUser,
              token,
              isLoading: false,
              isAuthenticated: true,
            });

            // Load user settings from server
            await loadSettingsFromServer(token);
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem("auth_token");
            localStorage.removeItem("auth_user");
            setAuthState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } else {
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        debugLogger.error(
          DEBUG_CATEGORIES.AUTH,
          "Auth initialization error",
          error
        );
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      } finally {
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeAuth();
    }
  }, [isInitialized]);

  // Update settings ref when settings change
  useEffect(() => {
    settingsRef.current = currentSettings;
  }, [currentSettings]);

  // Immediate save function for critical changes (like when popup closes)
  const saveSettingsImmediately = useCallback(async () => {
    if (
      !isInitialized ||
      isLoadingSettings ||
      !authState.isAuthenticated ||
      !authState.token
    ) {
      return;
    }

    // Only save if settings have actually changed
    if (
      lastSavedSettings &&
      JSON.stringify(currentSettings) === JSON.stringify(lastSavedSettings)
    ) {
      return;
    }

    try {
      debugLogger.authEvent("Immediately saving settings to server");
      await saveSettingsToServer(authState.token!);
      setLastSavedSettings(settingsRef.current);
    } catch (error) {
      debugLogger.error(DEBUG_CATEGORIES.AUTH, "Immediate save failed", error);
    }
  }, [
    currentSettings,
    isInitialized,
    isLoadingSettings,
    authState.isAuthenticated,
    authState.token,
    saveSettingsToServer,
    lastSavedSettings,
  ]);

  // Auto-save settings when they change (with safeguards to prevent infinite loops)
  useEffect(() => {
    // Don't auto-save during initialization, settings loading, or if not authenticated
    if (
      !isInitialized ||
      isLoadingSettings ||
      !authState.isAuthenticated ||
      !authState.token
    ) {
      return;
    }

    // Only save if settings have actually changed
    if (
      lastSavedSettings &&
      JSON.stringify(currentSettings) === JSON.stringify(lastSavedSettings)
    ) {
      return;
    }

    // Debounce auto-save to prevent excessive API calls
    const timeoutId = setTimeout(async () => {
      try {
        debugLogger.authEvent("Auto-saving settings to server");
        await saveSettingsToServer(authState.token!);
        setLastSavedSettings(settingsRef.current);
      } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.AUTH, "Auto-save failed", error);
      }
    }, 500); // Reduced from 2000ms to 500ms for better responsiveness

    return () => clearTimeout(timeoutId);
  }, [
    currentSettings,
    isInitialized,
    isLoadingSettings,
    authState.isAuthenticated,
    authState.token,
    saveSettingsToServer,
    lastSavedSettings,
  ]);

  // Save settings immediately when the popup/window is about to close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        isInitialized &&
        !isLoadingSettings &&
        authState.isAuthenticated &&
        authState.token &&
        lastSavedSettings &&
        JSON.stringify(currentSettings) !== JSON.stringify(lastSavedSettings)
      ) {
        // For browser extensions, use synchronous fetch with keepalive
        try {
          fetch(API_ENDPOINTS.accounts.auth.settings, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authState.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              settings: currentSettings,
              version: "2.0.0-beta.1",
            }),
            keepalive: true, // Keep request alive during page unload
          });
          debugLogger.authEvent("Emergency save triggered on unload");
        } catch (error) {
          debugLogger.error(
            DEBUG_CATEGORIES.AUTH,
            "Emergency save on unload failed",
            error
          );
        }
      }
    };

    // Use both beforeunload and unload events for maximum coverage
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleBeforeUnload);

    // Also handle visibility change (when user switches tabs or minimizes)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleBeforeUnload();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    currentSettings,
    isInitialized,
    isLoadingSettings,
    authState.isAuthenticated,
    authState.token,
    lastSavedSettings,
  ]);

  const login = useCallback(
    async (
      credentials: LoginCredentials
    ): Promise<{ success: boolean; error?: string }> => {
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          debugLogger.authEvent(
            `Login attempt ${attempt}/${maxRetries} to ${API_ENDPOINTS.accounts.auth.login}`
          );

          const response = await fetch(API_ENDPOINTS.accounts.auth.login, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(credentials),
          });

          debugLogger.authEvent(`Login response status: ${response.status}`);

          // Handle 502/503 errors with retry
          if (response.status >= 502 && response.status <= 504) {
            debugLogger.warn(
              DEBUG_CATEGORIES.AUTH,
              `Server error on attempt ${attempt}, retrying`,
              { status: response.status }
            );
            if (attempt < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
              ); // exponential backoff
              continue;
            }
            return {
              success: false,
              error: `Server temporarily unavailable (${response.status}). Please try again.`,
            };
          }

          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            debugLogger.error(
              DEBUG_CATEGORIES.AUTH,
              "Failed to parse response as JSON",
              parseError
            );
            const text = await response.text();
            debugLogger.error(DEBUG_CATEGORIES.AUTH, "Response text", {
              text: text.substring(0, 200),
            });

            if (attempt < maxRetries) {
              debugLogger.warn(
                DEBUG_CATEGORIES.AUTH,
                `JSON parse error on attempt ${attempt}, retrying`
              );
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * attempt)
              );
              continue;
            }
            return {
              success: false,
              error: "Server returned invalid response. Please try again.",
            };
          }

          if (response.ok) {
            const { token, user } = data;

            // Store auth data
            localStorage.setItem("auth_token", token);
            localStorage.setItem("auth_user", JSON.stringify(user));

            setAuthState({
              user,
              token,
              isLoading: false,
              isAuthenticated: true,
            });

            // Load user settings from server after successful login
            await loadSettingsFromServer(token);

            return { success: true };
          } else {
            return { success: false, error: data.error || "Login failed" };
          }
        } catch (error) {
          debugLogger.error(
            DEBUG_CATEGORIES.AUTH,
            `Login error on attempt ${attempt}`,
            error
          );
          lastError = error;

          if (attempt < maxRetries) {
            debugLogger.warn(
              DEBUG_CATEGORIES.AUTH,
              `Network error on attempt ${attempt}, retrying`
            );
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }
      }

      return {
        success: false,
        error:
          "Network error during login. Please check your connection and try again.",
      };
    },
    [loadSettingsFromServer]
  );

  const register = useCallback(
    async (
      credentials: RegisterCredentials
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(API_ENDPOINTS.accounts.auth.register, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(credentials),
        });

        const data = await response.json();

        if (response.ok) {
          const { token, user } = data;

          // Store auth data
          localStorage.setItem("auth_token", token);
          localStorage.setItem("auth_user", JSON.stringify(user));

          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });

          // For new registrations, save current local settings to server
          await saveSettingsToServer(token);

          return { success: true };
        } else {
          return { success: false, error: data.error || "Registration failed" };
        }
      } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.AUTH, "Registration error", error);
        return { success: false, error: "Network error during registration" };
      }
    },
    [saveSettingsToServer]
  );

  const logout = useCallback(async () => {
    // Save current settings to server before logging out
    if (authState.token) {
      await saveSettingsToServer(authState.token);
    }

    // Clear authentication data
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    // Clear extension storage
    try {
      if (typeof browser !== "undefined" && browser.storage) {
        await browser.storage.local.clear();
        await browser.storage.sync?.clear();
      }
    } catch (error) {
      debugLogger.error(
        DEBUG_CATEGORIES.STORAGE,
        "Failed to clear browser storage",
        error
      );
    }

    // Update auth state
    setAuthState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });

    // Refresh the entire extension to reset all state
    setTimeout(() => {
      // Send message to background script to notify all contexts
      if (typeof browser !== "undefined" && browser.runtime) {
        try {
          browser.runtime.sendMessage({ type: "LOGOUT_REFRESH" });
        } catch (error) {
          debugLogger.error(
            DEBUG_CATEGORIES.AUTH,
            "Failed to send logout message",
            error
          );
        }
      }

      // Force refresh of current context (popup)
      window.location.reload();
    }, 100);
  }, [authState.token, saveSettingsToServer]);

  const updateProfile = useCallback(
    async (
      profileData: Partial<Pick<User, "email" | "phone">>
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(API_ENDPOINTS.accounts.auth.profile, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authState.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        });

        const data = await response.json();

        if (response.ok) {
          const { user } = data;

          // Update stored user data
          localStorage.setItem("auth_user", JSON.stringify(user));

          setAuthState((prev) => ({
            ...prev,
            user,
          }));

          return { success: true };
        } else {
          return {
            success: false,
            error: data.error || "Profile update failed",
          };
        }
      } catch (error) {
        debugLogger.error(DEBUG_CATEGORIES.AUTH, "Profile update error", error);
        return { success: false, error: "Network error during profile update" };
      }
    },
    [authState.token]
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(
          API_ENDPOINTS.accounts.auth.changePassword,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authState.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          return { success: true };
        } else {
          return {
            success: false,
            error: data.error || "Password change failed",
          };
        }
      } catch (error) {
        debugLogger.error(
          DEBUG_CATEGORIES.AUTH,
          "Password change error",
          error
        );
        return {
          success: false,
          error: "Network error during password change",
        };
      }
    },
    [authState.token]
  );

  // Manual settings sync function for UI use
  const syncSettings = useCallback(async () => {
    if (authState.isAuthenticated && authState.token) {
      await saveSettingsToServer(authState.token);
    }
  }, [authState.isAuthenticated, authState.token, saveSettingsToServer]);

  return {
    ...authState,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    syncSettings,
    saveSettingsImmediately,
  };
}
