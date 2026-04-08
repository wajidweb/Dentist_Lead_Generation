"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, loginAdmin, verifyToken, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    const success = await loginAdmin({ email, password });
    if (success) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    } else {
      toast.error("Invalid credentials");
    }
    setSubmitting(false);
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
        <Loader2 size={32} className="animate-spin text-[#3D8B5E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB] relative overflow-hidden">
      <div
        className="absolute w-72 h-72 rounded-xs opacity-20 blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ backgroundColor: "#3D8B5E", top: "-5%", left: "-5%" }}
      />
      <div
        className="absolute w-96 h-96 rounded-xs opacity-15 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ backgroundColor: "#A8D4B8", bottom: "-10%", right: "-10%" }}
      />
      <div
        className="absolute w-48 h-48 rounded-xs opacity-10 blur-2xl animate-[float_6s_ease-in-out_infinite_1s]"
        style={{ backgroundColor: "#3D8B5E", top: "40%", right: "20%" }}
      />

      <div className="relative w-full max-w-md mx-4 animate-[slideUp_0.6s_ease-out]">
        <div className="bg-white rounded-xs shadow-2xl border border-[#E8E2D8] overflow-hidden">
          <div className="h-1.5" style={{ backgroundColor: "#3D8B5E" }} />

          <div className="p-8 sm:p-10">
            <div className="text-center mb-8 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/DentalLeads_logo_dark.svg"
                alt="DentalLeads"
                className="h-52 w-auto mx-auto mb-4 drop-shadow-lg animate-[logoPop_0.65s_cubic-bezier(0.34,1.56,0.64,1)_0.05s_both]"
              />
              <h1 className="text-2xl font-bold text-[#1A2E22]">Welcome Back</h1>
              <p className="text-[#8A9590] mt-1 text-sm">
                Sign in to your admin dashboard
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {authError && (
                <div className="bg-red-50 text-[#C75555] text-sm px-4 py-3 rounded-xs border border-red-100 animate-[shake_0.4s_ease-in-out]">
                  {authError}
                </div>
              )}

              <div className="animate-[fadeIn_0.8s_ease-out_0.3s_both]">
                <label className="block text-sm font-semibold text-[#1A2E22] mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9590]">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email address"
                    className="w-full border-2 border-[#E8E2D8] rounded-xs pl-11 pr-4 py-3 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] bg-[#FAF8F5] focus:bg-white transition-all duration-300"
                  />
                </div>
              </div>

              <div className="animate-[fadeIn_0.8s_ease-out_0.4s_both]">
                <label className="block text-sm font-semibold text-[#1A2E22] mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A9590]">
                    <Lock size={18} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full border-2 border-[#E8E2D8] rounded-xs pl-11 pr-11 py-3 text-sm text-[#1A2E22] placeholder-[#B5AFA5] focus:outline-none focus:border-[#3D8B5E] bg-[#FAF8F5] focus:bg-white transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8A9590] hover:text-[#5A6B60] transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="animate-[fadeIn_0.8s_ease-out_0.5s_both] pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xs font-bold text-white text-sm transition-all duration-300 hover:shadow-lg hover:shadow-[#3D8B5E]/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  style={{ backgroundColor: "#2A4A3A" }}
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-[#FAF8F5] border-t border-[#E8E2D8] text-center animate-[fadeIn_0.8s_ease-out_0.6s_both]">
            <p className="text-xs text-[#8A9590]">
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
