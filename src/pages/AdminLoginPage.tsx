import { ArrowLeft } from "lucide-react";
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
    <div className="flex min-h-[100dvh] flex-col bg-[#f8fafc]">
      <header className="flex h-12 shrink-0 items-center justify-between bg-[#f8fafc] px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1 text-[13px] font-medium text-[#2d5be3] hover:bg-[#eef3fe]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to library
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-10 sm:px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[16px] border border-[#e8eaec] bg-[#ffffff] p-6 sm:p-8"
        >
          <div className="mb-5 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[#2d5be3] text-[11px] font-semibold text-white">
              EM
            </div>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#131416]">
              Admin Sign In
            </h1>
          </div>

          <p className="text-[13px] leading-[1.45] text-[#5d5f60]">
            Enter the admin password to manage video guides, FAQs, and module categories.
          </p>

          <label
            className="mt-5 block text-[12px] font-medium text-[#131416]"
            htmlFor="admin-secret"
          >
            Admin password
          </label>
          <input
            id="admin-secret"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="mt-1.5 h-9 w-full rounded-[6px] border border-[#e8eaec] bg-[#ffffff] px-3 text-[13px] text-[#131416] placeholder:text-[#5d5f60] focus:border-[#cdced1] focus:outline-none"
            autoFocus
          />

          {error && (
            <p className="mt-3 break-words rounded-[6px] border border-[#ffedea] bg-[#ffedea] px-3 py-2 text-[13px] text-[#831c1e]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-[6px] bg-[#2d5be3] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#244ac2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3] disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Sign In"}
          </button>

          <p className="mt-4 text-center text-[12px] text-[#5d5f60]">
            Writes require an authenticated admin session. Public browsing needs no login.
          </p>
        </form>
      </main>
    </div>
  );
}
