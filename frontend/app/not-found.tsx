"use client";

import Link from "next/link";
import { Home, LayoutGrid } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB] relative overflow-hidden">
      <div
        className="absolute w-72 h-72 rounded-xs opacity-20 blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ backgroundColor: "#3D8B5E", top: "10%", left: "-5%" }}
      />
      <div
        className="absolute w-96 h-96 rounded-xs opacity-15 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ backgroundColor: "#A8D4B8", bottom: "-10%", right: "-5%" }}
      />

      <div className="relative text-center px-6 animate-[slideUp_0.6s_ease-out]">
        <div
          className="inline-block text-8xl sm:text-9xl font-black tracking-tight mb-4"
          style={{ color: "#3D8B5E" }}
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A2E22] mb-3">
          Page Not Found
        </h1>
        <p className="text-[#8A9590] mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xs font-semibold text-sm text-white transition-all duration-200 hover:shadow-lg hover:shadow-[#3D8B5E]/20 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#2A4A3A" }}
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xs font-semibold text-sm text-[#5A6B60] border border-[#DDD8D0] transition-all duration-200 hover:bg-white hover:text-[#1A2E22]"
          >
            <LayoutGrid size={18} />
            Go to Dashboard
          </Link>
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
      `}</style>
    </div>
  );
}
