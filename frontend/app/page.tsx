"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { loginAdmin, verifyToken, clearError } from "./store/slices/authSlice";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, loading: authLoading, error: authError } = useAppSelector((s) => s.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(verifyToken());
  }, [dispatch]);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setSubmitting(true);
    const result = await dispatch(loginAdmin({ email, password }));
    if (loginAdmin.fulfilled.match(result)) {
      router.push("/dashboard");
    }
    setSubmitting(false);
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#dfefdb]">
        <svg className="animate-spin h-8 w-8 text-gray-600" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfefdb] relative overflow-hidden">
      <div
        className="absolute w-72 h-72 rounded-xs opacity-30 blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ backgroundColor: "#d1ff8f", top: "-5%", left: "-5%" }}
      />
      <div
        className="absolute w-96 h-96 rounded-xs opacity-20 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ backgroundColor: "#d1ff8f", bottom: "-10%", right: "-10%" }}
      />
      <div
        className="absolute w-48 h-48 rounded-xs opacity-15 blur-2xl animate-[float_6s_ease-in-out_infinite_1s]"
        style={{ backgroundColor: "#d1ff8f", top: "40%", right: "20%" }}
      />

      <div className="relative w-full max-w-md mx-4 animate-[slideUp_0.6s_ease-out]">
        <div className="bg-white rounded-xs shadow-2xl border border-gray-100 overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: "#d1ff8f" }} />

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs mb-5 font-bold text-lg text-black shadow-sm" style={{ backgroundColor: "#d1ff8f" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 0-7 7c0 3 2 5.5 4 7.5L12 22l3-5.5c2-2 4-4.5 4-7.5a7 7 0 0 0-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                DentalLeads
              </div>
              <h1 className="text-2xl font-bold text-black">Welcome Back</h1>
              <p className="text-gray-400 mt-1 text-sm">
                Sign in to your admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {authError && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xs border border-red-100 animate-[shake_0.4s_ease-in-out]">
                  {authError}
                </div>
              )}

              <div className="animate-[fadeIn_0.8s_ease-out_0.3s_both]">
                <label className="block text-sm font-semibold text-black mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@gmail.com"
                    className="w-full border-2 border-gray-200 rounded-xs pl-11 pr-4 py-3 text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#d1ff8f] bg-gray-50 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>

              <div className="animate-[fadeIn_0.8s_ease-out_0.4s_both]">
                <label className="block text-sm font-semibold text-black mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full border-2 border-gray-200 rounded-xs pl-11 pr-4 py-3 text-sm text-black placeholder-black/40 focus:outline-none focus:border-[#d1ff8f] bg-gray-50 focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>

              <div className="animate-[fadeIn_0.8s_ease-out_0.5s_both] pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xs font-bold text-black text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ backgroundColor: "#d1ff8f" }}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center animate-[fadeIn_0.8s_ease-out_0.6s_both]">
            <p className="text-xs text-gray-400">
              DentalLeads &middot; Admin Panel
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
