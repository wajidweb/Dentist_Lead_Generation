"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import Sidebar from "../components/Sidebar";
import { Menu, Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, verifyToken } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    verifyToken();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1EB]">
        <Loader2 size={32} className="animate-spin text-[#3D8B5E]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-[#1E3A2E] border-b border-[#2A4A3A] px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A] rounded-xs transition"
          >
            <Menu size={22} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/DentalLeads_final_logo.svg"
            alt="DentalLeads"
            className="h-14 w-auto drop-shadow-sm animate-[logoFloat_3s_ease-in-out_infinite]"
          />
        </header>

        <main className="flex-1 bg-[#F5F1EB] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
