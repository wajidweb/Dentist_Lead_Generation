"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#dfefdb] relative overflow-hidden">
      <div
        className="absolute w-72 h-72 rounded-xs opacity-20 blur-3xl animate-[float_8s_ease-in-out_infinite]"
        style={{ backgroundColor: "#d1ff8f", top: "10%", left: "-5%" }}
      />
      <div
        className="absolute w-96 h-96 rounded-xs opacity-15 blur-3xl animate-[float_10s_ease-in-out_infinite_reverse]"
        style={{ backgroundColor: "#d1ff8f", bottom: "-10%", right: "-5%" }}
      />

      <div className="relative text-center px-6 animate-[slideUp_0.6s_ease-out]">
        <div
          className="inline-block text-8xl sm:text-9xl font-black tracking-tight mb-4"
          style={{ color: "#d1ff8f" }}
        >
          404
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xs font-semibold text-sm text-black transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: "#d1ff8f" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Back to Home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xs font-semibold text-sm text-gray-600 border border-gray-300 transition-all duration-200 hover:bg-gray-50 hover:text-black"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
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
