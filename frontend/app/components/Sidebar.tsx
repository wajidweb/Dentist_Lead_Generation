"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import {
  LayoutGrid,
  Search,
  Users,
  BarChart3,
  LogOut,
  X,
  ClipboardCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard",     href: "/dashboard",               icon: <LayoutGrid size={20} /> },
  { label: "Search",        href: "/dashboard/search",        icon: <Search size={20} /> },
  { label: "Analyze Leads", href: "/dashboard/analyze-leads", icon: <ClipboardCheck size={20} /> },
  { label: "Leads",         href: "/dashboard/leads",         icon: <Users size={20} /> },
  { label: "Analytics",     href: "/dashboard/analytics",     icon: <BarChart3 size={20} /> },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
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
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-[#1E3A2E] border-r border-[#2A4A3A]
          flex flex-col
          transition-all duration-300 ease-in-out
          lg:sticky lg:top-0 lg:translate-x-0 lg:z-auto lg:h-screen lg:self-start
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          w-64
          ${collapsed ? "lg:w-16" : "lg:w-64"}
        `}
      >
        {/* Logo area */}
        <div
          className={`
            border-b border-[#2A4A3A] relative flex items-center
            ${collapsed ? "lg:justify-center lg:py-4 lg:px-2 px-6 py-3" : "justify-center px-6 py-3"}
          `}
        >
          {/* Full logo — always on mobile, only when expanded on desktop */}
          <div className={collapsed ? "lg:hidden" : ""}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/DentalLeads_final_logo.svg"
              alt="DentalLeads"
              className="h-24 w-auto drop-shadow-md animate-[logoFloat_3s_ease-in-out_infinite] hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Collapsed placeholder — desktop only */}
          <div
            className={`
              items-center justify-center w-8 h-8 rounded-xs bg-[#2A4A3A]
              ${collapsed ? "hidden lg:flex" : "hidden"}
            `}
          >
            <span className="text-[#7BAF8E] font-bold text-sm select-none">D</span>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden absolute right-4 p-1 text-[#7BAF8E] hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav
          className={`
            flex-1 py-6 space-y-1 overflow-y-auto
            ${collapsed ? "lg:px-2 px-4" : "px-4"}
          `}
        >
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div key={item.href} className="relative group/navitem">
                <Link
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-3 rounded-xs text-sm font-medium
                    transition-all duration-200
                    px-4 py-3
                    ${collapsed ? "lg:justify-center lg:px-0" : ""}
                    ${
                      isActive
                        ? "text-white bg-[#3D8B5E] shadow-sm"
                        : "text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A]"
                    }
                  `}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>
                    {item.label}
                  </span>
                </Link>

                {/* Tooltip — desktop collapsed only */}
                {collapsed && (
                  <div
                    className="
                      hidden lg:block
                      pointer-events-none
                      absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
                      opacity-0 group-hover/navitem:opacity-100
                      transition-opacity duration-150
                    "
                  >
                    <div className="bg-[#1A2E22] text-white text-xs font-medium px-2.5 py-1.5 rounded-xs shadow-xl border border-[#2A4A3A] whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom: collapse toggle + logout */}
        <div
          className={`
            border-t border-[#2A4A3A] py-4 space-y-1
            ${collapsed ? "lg:px-2 px-4" : "px-4"}
          `}
        >
          {/* Collapse toggle — desktop only */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`
              hidden lg:flex items-center gap-3 w-full rounded-xs text-sm font-medium
              text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A]
              transition-all duration-200
              px-4 py-3
              ${collapsed ? "justify-center px-0" : ""}
            `}
          >
            <span className="shrink-0">
              {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            </span>
            <span className={`whitespace-nowrap ${collapsed ? "hidden" : ""}`}>Collapse</span>
          </button>

          {/* Logout */}
          <div className="relative group/logout">
            <button
              onClick={handleLogout}
              className={`
                w-full flex items-center gap-3 rounded-xs text-sm font-medium
                text-[#7BAF8E] hover:text-white hover:bg-[#2A4A3A]
                transition-all duration-200
                px-4 py-3
                ${collapsed ? "lg:justify-center lg:px-0" : ""}
              `}
            >
              <span className="shrink-0"><LogOut size={20} /></span>
              <span className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>Logout</span>
            </button>

            {/* Tooltip — desktop collapsed only */}
            {collapsed && (
              <div
                className="
                  hidden lg:block
                  pointer-events-none
                  absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[60]
                  opacity-0 group-hover/logout:opacity-100
                  transition-opacity duration-150
                "
              >
                <div className="bg-[#1A2E22] text-white text-xs font-medium px-2.5 py-1.5 rounded-xs shadow-xl border border-[#2A4A3A] whitespace-nowrap">
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
