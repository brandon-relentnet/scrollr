interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  role_id: number;
  created_at: string;
}

interface ProfileViewProps {
  user: User;
  formData: {
    email: string;
    phone: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onLogout: () => Promise<void>;
  isSubmitting: boolean;
  error: string;
  success: string;
}

export function ProfileView({
  user,
  formData,
  onInputChange,
  onSubmit,
  onLogout,
  isSubmitting,
  error,
  success,
}: ProfileViewProps) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Welcome, {user.username}!</h3>
          <p className="text-sm text-base-content/70">
            Account created: {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <button onClick={onLogout} className="btn btn-outline btn-sm">
          Logout
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="floating-label">
          <span>Username (Read Only)</span>
          <input
            type="text"
            className="input input-bordered w-full"
            value={user.username}
            disabled
          />
        </label>

        <label className="floating-label">
          <span>Email</span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
          />
        </label>

        <label className="floating-label">
          <span>Phone</span>
          <input
            type="tel"
            className="input input-bordered w-full"
            value={formData.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
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
          {isSubmitting ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
