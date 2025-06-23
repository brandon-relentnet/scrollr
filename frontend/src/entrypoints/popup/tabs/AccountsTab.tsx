import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

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
              {currentView === "profile" && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Update Profile</h4>

                  {error && (
                    <div className="alert alert-error">
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <label className="floating-label">
                      <span>Email Address</span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input input-md w-full"
                        placeholder="mail@site.com"
                      />
                    </label>

                    <label className="floating-label">
                      <span>Phone Number</span>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input input-md w-full"
                        placeholder="+1 (555) 123-4567"
                      />
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Update Profile"
                      )}
                    </button>
                  </form>
                </div>
              )}

              {currentView === "settings" && (
                <div className="space-y-4">
                  <h4 className="font-semibold">Change Password</h4>

                  {error && (
                    <div className="alert alert-error">
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success">
                      <span>{success}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <label className="floating-label">
                      <span>Current Password</span>
                      <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="input input-md w-full"
                        placeholder="Enter current password"
                        required
                      />
                    </label>

                    <label className="floating-label">
                      <span>New Password</span>
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="input input-md w-full"
                        placeholder="Create new password"
                        required
                      />
                    </label>

                    <label className="floating-label">
                      <span>Confirm New Password</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="input input-md w-full"
                        placeholder="Confirm new password"
                        required
                      />
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </form>

                  <div className="divider my-6"></div>

                  <button
                    onClick={handleLogout}
                    className="btn btn-error w-full"
                  >
                    Sign Out
                  </button>
                </div>
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

              {error && (
                <div className="alert alert-error">
                  <span>{error}</span>
                </div>
              )}

              {currentView === "login" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="floating-label">
                    <span>Email or Username</span>
                    <input
                      type="text"
                      name="identifier"
                      value={formData.identifier}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="user@example.com"
                      required
                    />
                  </label>

                  <label className="floating-label">
                    <span>Password</span>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="Enter your password"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>
              )}

              {currentView === "register" && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <label className="floating-label">
                    <span>Username</span>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="Choose a username"
                      required
                    />
                  </label>

                  <label className="floating-label">
                    <span>Email Address</span>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="mail@site.com"
                      required
                    />
                  </label>

                  <label className="floating-label">
                    <span>Phone Number</span>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="+1 (555) 123-4567"
                    />
                  </label>

                  <label className="floating-label">
                    <span>Password</span>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="Create a password"
                      required
                    />
                  </label>

                  <label className="floating-label">
                    <span>Confirm Password</span>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="input input-md w-full"
                      placeholder="Confirm your password"
                      required
                    />
                  </label>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
