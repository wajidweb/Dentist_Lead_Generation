"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { LayoutGrid, Search, Users, BarChart3, Settings, LogOut, X, ClipboardCheck } from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutGrid size={20} />,
  },
  {
    label: "Search",
    href: "/dashboard/search",
    icon: <Search size={20} />,
  },
  {
    label: "Analyze Leads",
    href: "/dashboard/analyze-leads",
    icon: <ClipboardCheck size={20} />,
  },
  {
    label: "Leads",
    href: "/dashboard/leads",
    icon: <Users size={20} />,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 size={20} />,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings size={20} />,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-[#1E3A2E] border-r border-[#2A4A3A] flex flex-col
          transition-transform duration-300 ease-in-out
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-6 py-6 border-b border-[#2A4A3A] flex items-center justify-between">
          <span className="font-bold text-lg px-3 py-1.5 rounded-xs text-white inline-block bg-[#2A4A3A]">
            DentalLeads
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-[#7BAF8E] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xs text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "text-white bg-[#3D8B5E] shadow-sm"
                    : "text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A]"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-6 border-t border-[#2A4A3A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xs text-sm font-medium text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A] transition-all duration-200"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
