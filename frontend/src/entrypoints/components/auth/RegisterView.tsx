interface RegisterViewProps {
  formData: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  error: string;
}

export function RegisterView({
  formData,
  onInputChange,
  onSubmit,
  isSubmitting,
  error,
}: RegisterViewProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Create Account</h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="floating-label">
          <span>Username</span>
          <input
            type="text"
            className="input input-bordered w-full"
            value={formData.username}
            onChange={(e) => onInputChange("username", e.target.value)}
            required
          />
        </label>

        <label className="floating-label">
          <span>Email</span>
          <input
            type="email"
            className="input input-bordered w-full"
            value={formData.email}
            onChange={(e) => onInputChange("email", e.target.value)}
            required
          />
        </label>

        <label className="floating-label">
          <span>Phone (Optional)</span>
          <input
            type="tel"
            className="input input-bordered w-full"
            value={formData.phone}
            onChange={(e) => onInputChange("phone", e.target.value)}
          />
        </label>

        <label className="floating-label">
          <span>Password</span>
          <input
            type="password"
            className="input input-bordered w-full"
            value={formData.password}
            onChange={(e) => onInputChange("password", e.target.value)}
            required
          />
        </label>

        <label className="floating-label">
          <span>Confirm Password</span>
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

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
}
