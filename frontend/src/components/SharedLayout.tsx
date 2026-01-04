// src/components/SharedLayout.tsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";

export const SharedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dashboard-bg">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 pt-16">
          {/* This Outlet renders the matched page component (Dashboard, Analysis, etc.) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};