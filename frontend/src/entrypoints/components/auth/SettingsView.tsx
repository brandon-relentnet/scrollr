interface SettingsViewProps {
  formData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onSyncSettings: () => Promise<void>;
  isSubmitting: boolean;
  error: string;
  success: string;
}

export function SettingsView({
  formData,
  onInputChange,
  onSubmit,
  onSyncSettings,
  isSubmitting,
  error,
  success,
}: SettingsViewProps) {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Account Settings</h3>

        <div className="card bg-base-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sync Settings</h4>
              <p className="text-sm text-base-content/70">
                Sync your extension settings with the cloud
              </p>
            </div>
            <button
              onClick={onSyncSettings}
              className="btn btn-outline btn-sm"
              disabled={isSubmitting}
            >
              Sync Now
            </button>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-4">Change Password</h4>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="floating-label">
            <span>Current Password</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={formData.currentPassword}
              onChange={(e) => onInputChange("currentPassword", e.target.value)}
              required
            />
          </label>

          <label className="floating-label">
            <span>New Password</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={formData.newPassword}
              onChange={(e) => onInputChange("newPassword", e.target.value)}
              required
            />
          </label>

          <label className="floating-label">
            <span>Confirm New Password</span>
            <input
              type="password"
              className="input input-bordered w-full"
              value={formData.confirmPassword}
              onChange={(e) => onInputChange("confirmPassword", e.target.value)}
              required
            />
          </label>

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

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Changing Password..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
