import { useState, useEffect, useCallback } from 'react';

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
            }
        };

        initializeAuth();
    }, []);

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

                return { success: true };
            } else {
                return { success: false, error: data.error || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error during login' };
        }
    }, []);

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

                return { success: true };
            } else {
                return { success: false, error: data.error || 'Registration failed' };
            }
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Network error during registration' };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
        });
    }, []);

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

    return {
        ...authState,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
    };
}