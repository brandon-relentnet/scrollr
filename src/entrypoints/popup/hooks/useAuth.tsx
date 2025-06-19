import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

const API_BASE_URL = 'http://localhost:5000/api';

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
    const dispatch = useDispatch();
    
    // Get settings with a stable reference to prevent infinite loops
    const currentSettings = useSelector((state: any) => {
        const { theme, layout, finance, power, toggles } = state;
        return { theme, layout, finance, power, toggles };
    });

    // Save current settings to server
    const saveSettingsToServer = useCallback(async (token: string, settingsToSave?: any) => {
        try {
            const settings = settingsToSave || currentSettings;
            const response = await fetch(`${API_BASE_URL}/auth/settings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    settings: settings,
                    version: '2.0.0-beta.1'
                }),
            });

            if (!response.ok) {
                console.error('Failed to save settings to server');
            }
        } catch (error) {
            console.error('Error saving settings to server:', error);
        }
    }, [currentSettings]);

    // Load settings from server and apply to Redux store
    const loadSettingsFromServer = useCallback(async (token: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const { settings } = await response.json();
                
                // Only apply server settings if they exist and are not empty
                if (settings && Object.keys(settings).length > 0) {
                    // Apply each slice of settings to Redux store
                    Object.keys(settings).forEach(key => {
                        if (settings[key] && typeof settings[key] === 'object') {
                            const actionType = `${key}/setState`;
                            dispatch({ type: actionType, payload: settings[key] });
                        }
                    });
                    
                    console.log('Settings loaded from server and applied');
                } else {
                    // If no server settings exist, save current local settings to server
                    await saveSettingsToServer(token);
                    console.log('No server settings found, saved current local settings');
                }
            }
        } catch (error) {
            console.error('Error loading settings from server:', error);
            // If there's an error loading settings, save current local settings as backup
            await saveSettingsToServer(token);
        }
    }, [dispatch]);

    // Initialize auth state from storage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const userData = localStorage.getItem('auth_user');

                if (token && userData) {
                    const user = JSON.parse(userData);
                    
                    // Verify token is still valid by fetching current user
                    const response = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
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
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('auth_user');
                        setAuthState({
                            user: null,
                            token: null,
                            isLoading: false,
                            isAuthenticated: false,
                        });
                    }
                } else {
                    setAuthState(prev => ({
                        ...prev,
                        isLoading: false,
                    }));
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
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

    // Note: Auto-save removed to prevent infinite loops
    // Settings are saved explicitly on login/logout and can be manually saved

    const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                const { token, user } = data;
                
                // Store auth data
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify(user));

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
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error during login' };
        }
    }, [loadSettingsFromServer]);

    const register = useCallback(async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            const data = await response.json();

            if (response.ok) {
                const { token, user } = data;
                
                // Store auth data
                localStorage.setItem('auth_token', token);
                localStorage.setItem('auth_user', JSON.stringify(user));

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
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error during registration' };
        }
    }, [saveSettingsToServer]);

    const logout = useCallback(async () => {
        // Save current settings to server before logging out
        if (authState.token) {
            await saveSettingsToServer(authState.token);
        }
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
        });
    }, [authState.token, saveSettingsToServer]);

    const updateProfile = useCallback(async (profileData: Partial<Pick<User, 'email' | 'phone'>>): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authState.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });

            const data = await response.json();

            if (response.ok) {
                const { user } = data;
                
                // Update stored user data
                localStorage.setItem('auth_user', JSON.stringify(user));
                
                setAuthState(prev => ({
                    ...prev,
                    user,
                }));

                return { success: true };
            } else {
                return { success: false, error: data.error || 'Profile update failed' };
            }
        } catch (error) {
            console.error('Profile update error:', error);
            return { success: false, error: 'Network error during profile update' };
        }
    }, [authState.token]);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${authState.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Password change failed' };
            }
        } catch (error) {
            console.error('Password change error:', error);
            return { success: false, error: 'Network error during password change' };
        }
    }, [authState.token]);

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
    };
}