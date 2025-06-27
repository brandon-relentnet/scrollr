interface LoginViewProps {
  formData: {
    identifier: string;
    password: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
  error: string;
}

export function LoginView({
  formData,
  onInputChange,
  onSubmit,
  isSubmitting,
  error,
}: LoginViewProps) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Login to Account</h3>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="floating-label">
          <span>Email or Username</span>
          <input
            type="text"
            className="input input-bordered w-full"
            value={formData.identifier}
            onChange={(e) => onInputChange("identifier", e.target.value)}
            required
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
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
