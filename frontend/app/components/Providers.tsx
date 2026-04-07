"use client";

import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1A2E22",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "4px",
            padding: "10px 16px",
          },
          success: {
            iconTheme: { primary: "#3D8B5E", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#C75555", secondary: "#fff" },
            style: { background: "#2E1A1A" },
          },
        }}
      />
    </>
  );
}
