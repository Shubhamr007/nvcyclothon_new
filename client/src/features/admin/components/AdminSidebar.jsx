import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  Flag,
  Handshake,
  Store,
  MessageSquare,
  Award,
  UsersRound,
  Tag,
  Settings,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export const NAVIGATION_GROUPS = [
  {
    title: "COMMAND CENTER",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "visitors", label: "Visitor Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "RIDER OPERATIONS",
    items: [
      { id: "riders", label: "Participants", icon: Users },
      { id: "volunteers", label: "Volunteers", icon: UserCheck },
      { id: "delegations", label: "Delegations", icon: Flag },
    ],
  },
  {
    title: "COMMERCIAL & COMMUNITY",
    items: [
      { id: "partners", label: "Partners", icon: Handshake },
      { id: "vendors", label: "Vendors", icon: Store },
      { id: "community", label: "Community Wall", icon: MessageSquare },
    ],
  },
  {
    title: "EVENT CONTENT",
    items: [
      { id: "guests", label: "Chief Guests", icon: Award },
      { id: "members", label: "Organizing Members", icon: UsersRound },
      { id: "offers", label: "Promo Offers", icon: Tag },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { id: "settings", label: "Site Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  badges = {},
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-72 flex-col justify-between overflow-y-auto border-r border-[#071313]/10 bg-white p-4 shadow-xl transition-transform duration-200 lg:sticky lg:top-20 lg:z-0 lg:h-[calc(100vh-5.5rem)] lg:w-64 lg:rounded-2xl lg:border lg:p-3 lg:shadow-sm ${
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full lg:flex lg:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-black tracking-[0.16em] text-[#071313]/40 uppercase font-mono">
                {group.title}
              </p>
              <nav className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  const badgeCount = badges[item.id];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile?.();
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#071313] text-[#d9ff38] shadow-md shadow-[#071313]/15 font-black"
                          : "text-[#071313]/70 hover:bg-[#071313]/5 hover:text-[#071313]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive
                              ? "text-[#d9ff38]"
                              : "text-[#071313]/50 group-hover:text-[#071313]"
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {badgeCount !== undefined && badgeCount > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                              isActive
                                ? "bg-[#d9ff38] text-[#071313]"
                                : "bg-[#ff5f3d]/15 text-[#ff5f3d]"
                            }`}
                          >
                            {badgeCount}
                          </span>
                        )}
                        <ChevronRight
                          className={`h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 ${
                            isActive ? "opacity-100 text-[#d9ff38]" : "text-black/30"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="mt-8 rounded-xl border border-[#071313]/5 bg-[#fbf8ef] p-3 text-[11px] text-[#071313]/60">
          <p className="font-bold text-[#071313]">Race Day Operations</p>
          <p className="mt-0.5 text-[10px]">November 22, 2026 • Rewa (M.P.)</p>
        </div>
      </aside>
    </>
  );
}
