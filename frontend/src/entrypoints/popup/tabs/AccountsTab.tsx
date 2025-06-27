import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useAuth } from "../../components/hooks/useAuth";
import { LoginView } from "../../components/auth/LoginView";
import { RegisterView } from "../../components/auth/RegisterView";
import { ProfileView } from "../../components/auth/ProfileView";
import { SettingsView } from "../../components/auth/SettingsView";

type View = "login" | "register" | "profile" | "settings";

export default function AccountsTab() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    syncSettings,
  } = useAuth();
  const [currentView, setCurrentView] = useState<View>("login");
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    username: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update currentView when authentication state changes
  useEffect(() => {
    if (!isLoading) {
      if (
        isAuthenticated &&
        (currentView === "login" || currentView === "register")
      ) {
        setCurrentView("profile");
        // Pre-populate form data when switching to profile
        setFormData((prev) => ({
          ...prev,
          email: user?.email || "",
          phone: user?.phone || "",
        }));
      } else if (
        !isAuthenticated &&
        (currentView === "profile" || currentView === "settings")
      ) {
        setCurrentView("login");
      }
    }
  }, [isAuthenticated, isLoading, currentView, user?.email, user?.phone]);

  // Populate form data when user data becomes available and we're on profile view
  useEffect(() => {
    if (isAuthenticated && user && currentView === "profile") {
      setFormData((prev) => ({
        ...prev,
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user, isAuthenticated, currentView]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await login({
      identifier: formData.identifier,
      password: formData.password,
    });

    if (result.success) {
      setFormData({ ...formData, identifier: "", password: "" });
      setCurrentView("profile");
    } else {
      setError(result.error || "Login failed");
    }
    setIsSubmitting(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const result = await register({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone: formData.phone || undefined,
    });

    if (result.success) {
      setFormData({
        ...formData,
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
      });
      setCurrentView("profile");
    } else {
      setError(result.error || "Registration failed");
    }
    setIsSubmitting(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    const result = await updateProfile({
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    });

    if (result.success) {
      setSuccess("Profile updated successfully");
    } else {
      setError(result.error || "Profile update failed");
    }
    setIsSubmitting(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      setIsSubmitting(false);
      return;
    }

    const result = await changePassword(
      formData.currentPassword,
      formData.newPassword
    );

    if (result.success) {
      setSuccess("Password changed successfully");
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } else {
      setError(result.error || "Password change failed");
    }
    setIsSubmitting(false);
  };

  const handleLogout = async () => {
    await logout();
    setCurrentView("login");
    setFormData({
      identifier: "",
      password: "",
      username: "",
      email: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  if (isLoading) {
    return (
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 4"
        />
        <UserCircleIcon className="size-8" />
      </label>
    );
  }

  return (
    <>
      <label className="tab">
        <input
          type="radio"
          name="my_tabs_3"
          className="tab"
          aria-label="Tab 4"
        />
        <UserCircleIcon className="size-8" />
      </label>
      <div className="tab-content bg-base-100 border-base-300 p-4 overflow-hidden max-h-120">
        <div className="overflow-y-auto px-1 py-2 h-110">
          {isAuthenticated ? (
            /* Authenticated View */
            <div className="space-y-5">
              {/* User Info Header */}
              <div className="bg-base-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="avatar placeholder">
                    <div className="bg-primary text-primary-content rounded-full w-12">
                      <span className="text-2xl font-semibold flex items-center justify-center h-full">
                        {user?.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">
                      {user?.username}
                    </h3>
                    <p className="text-sm text-base-content/70 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Settings Sync Info */}
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="text-sm font-medium text-success">
                      Settings Sync Active
                    </span>
                  </div>
                  <button
                    onClick={() => syncSettings()}
                    className="btn btn-xs btn-success"
                  >
                    Sync Now
                  </button>
                </div>
                <p className="text-xs text-base-content/70">
                  Your themes, speed, position, and preferences are saved to
                  your account. Settings sync automatically on login/logout.
                </p>
              </div>

              {/* Navigation */}
              <div className="tabs tabs-box w-full">
                <button
                  className={`tab flex-1 ${
                    currentView === "profile" ? "tab-active" : ""
                  }`}
                  defaultChecked
                  onClick={() => {
                    setCurrentView("profile");
                    setFormData({
                      ...formData,
                      email: user?.email || "",
                      phone: user?.phone || "",
                    });
                    setError("");
                    setSuccess("");
                  }}
                >
                  Profile
                </button>
                <button
                  className={`tab flex-1 ${
                    currentView === "settings" ? "tab-active" : ""
                  }`}
                  onClick={() => {
                    setCurrentView("settings");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Settings
                </button>
              </div>

              {/* Content based on current view */}
              {currentView === "profile" && user && (
                <ProfileView
                  user={user}
                  formData={{
                    email: formData.email,
                    phone: formData.phone,
                  }}
                  onInputChange={(field, value) =>
                    setFormData((prev) => ({ ...prev, [field]: value }))
                  }
                  onSubmit={handleUpdateProfile}
                  onLogout={handleLogout}
                  isSubmitting={isSubmitting}
                  error={error}
                  success={success}
                />
              )}

              {currentView === "settings" && (
                <SettingsView
                  formData={{
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword,
                    confirmPassword: formData.confirmPassword,
                  }}
                  onInputChange={(field, value) =>
                    setFormData((prev) => ({ ...prev, [field]: value }))
                  }
                  onSubmit={handleChangePassword}
                  onSyncSettings={() => syncSettings()}
                  isSubmitting={isSubmitting}
                  error={error}
                  success={success}
                />
              )}
            </div>
          ) : (
            /* Unauthenticated View */
            <div className="space-y-5">
              {/* Welcome Section */}
              <div className="text-center py-4">
                <div className="avatar placeholder mb-3">
                  <div className="bg-base-300 text-base-content rounded-full w-16">
                    <UserCircleIcon className="size-full" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg">Welcome</h3>
                <p className="text-sm text-base-content/70">
                  Sign in to your account or create a new one
                </p>
              </div>

              {/* Login/Register Toggle */}
              <div className="tabs tabs-box w-full">
                <button
                  className={`tab flex-1 ${
                    currentView === "login" ? "tab-active" : ""
                  }`}
                  onClick={() => {
                    setCurrentView("login");
                    setError("");
                  }}
                >
                  Sign In
                </button>
                <button
                  className={`tab flex-1 ${
                    currentView === "register" ? "tab-active" : ""
                  }`}
                  onClick={() => {
                    setCurrentView("register");
                    setError("");
                  }}
                >
                  Sign Up
                </button>
              </div>

              {currentView === "login" && (
                <LoginView
                  formData={{
                    identifier: formData.identifier,
                    password: formData.password,
                  }}
                  onInputChange={(field, value) =>
                    setFormData((prev) => ({ ...prev, [field]: value }))
                  }
                  onSubmit={handleLogin}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}

              {currentView === "register" && (
                <RegisterView
                  formData={{
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    phone: formData.phone,
                  }}
                  onInputChange={(field, value) =>
                    setFormData((prev) => ({ ...prev, [field]: value }))
                  }
                  onSubmit={handleRegister}
                  isSubmitting={isSubmitting}
                  error={error}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
