import { useState } from "react";
import {
  Outlet
} from "react-router-dom";

import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppLayout() {
  const [
    isMobileSidebarOpen,
    setIsMobileSidebarOpen
  ] = useState(false);

  return (
    <div
      className="
        relative
        h-screen
        overflow-hidden
        lg:flex
      "
    >
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() =>
          setIsMobileSidebarOpen(false)
        }
      />

      <div
        className="
          flex
          h-full
          min-w-0
          flex-1
          flex-col
        "
      >
        <Header
          onMenuClick={() =>
            setIsMobileSidebarOpen(true)
          }
        />

        <main
          data-app-scroll-container
          className="
            flex-1
            overflow-auto
            bg-slate-100
            p-4
            sm:p-6
          "
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
