import type { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#004E9A] text-white flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <img
            src="/icon-192x192.png"
            alt="Liqui Moly"
            className="h-8 w-8"
          />
          <span className="ml-2 font-semibold">Liqui Moly</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          <div className="px-3 py-2 rounded-md bg-white/10">
            Panel de Control
          </div>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="font-semibold text-gray-800">
            Liqui Moly Sales Hub
          </h1>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
