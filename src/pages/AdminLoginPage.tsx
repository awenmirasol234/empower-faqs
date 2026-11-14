import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/contentService.ts";

export function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the admin password.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await loginAdmin(password);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="text-sm font-medium text-accentBlue hover:underline"
          >
            &larr; Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <h1 className="text-xl font-bold text-zinc-900">Admin Login</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Enter the admin password to manage FAQ and video cards.
          </p>

          <label
            className="mt-6 block text-sm font-medium text-zinc-700"
            htmlFor="admin-secret"
          >
            Admin Password
          </label>
          <input
            id="admin-secret"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accentBlue focus:ring-2 focus:ring-accentBlue/20 min-h-[44px]"
            autoFocus
          />

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 break-words">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-accentBlue px-4 py-2.5 text-sm font-medium text-white hover:bg-[#244ac2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue disabled:opacity-50 min-h-[44px]"
          >
            {submitting ? "Checking..." : "Log In"}
          </button>

          <p className="mt-4 text-center text-xs text-zinc-400">
            Writes require an authenticated admin session. Public browsing needs no
            login.
          </p>
        </form>
      </main>
    </div>
  );
}
