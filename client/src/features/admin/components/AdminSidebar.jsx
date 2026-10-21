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
  Camera,
  Settings,
  ChevronRight,
  Calendar,
  IndianRupee,
} from "lucide-react";

export const NAVIGATION_GROUPS = [
  {
    title: "COMMAND CENTER",
    items: [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "finance", label: "Finance & Budget", icon: IndianRupee },
      { id: "visitors", label: "Visitor Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "RIDER OPERATIONS",
    items: [
      { id: "riders", label: "Participants", icon: Users },
      { id: "volunteers", label: "Volunteers", icon: UserCheck },
      { id: "delegations", label: "Delegations & Guests", icon: Flag },
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
      { id: "gallery", label: "Photo Gallery", icon: Camera },
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

const SidebarNavItem = React.memo(function SidebarNavItem({
  item,
  isActive,
  badgeCount,
  onSelect,
  onCloseMobile,
}) {
  const handleClick = React.useCallback(() => {
    onSelect(item.id);
    onCloseMobile?.();
  }, [item.id, onSelect, onCloseMobile]);

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`group relative flex w-full items-center justify-between rounded-md px-3 py-2.5 transition-colors ${
        isActive
          ? "bg-white text-slate-950 text-sm font-semibold shadow-2xs border border-slate-200/80"
          : "text-slate-700 text-xs font-medium hover:bg-white/70 hover:text-slate-950"
      }`}
    >
      {isActive && <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-[#0078d4]" aria-hidden="true" />}
      <div className="flex items-center gap-2.5">
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors ${
            isActive
              ? "text-[#0078d4]"
              : "text-slate-500 group-hover:text-[#0078d4]"
          }`}
        />
        <span>{item.label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {badgeCount !== undefined && badgeCount > 0 && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-black ${
              isActive
                ? "bg-[#deecf9] text-[#005a9e]"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {badgeCount}
          </span>
        )}
        <ChevronRight
          className={`h-3.5 w-3.5 transition-opacity ${
            isActive
              ? "opacity-0"
              : "opacity-0 group-hover:opacity-75 text-slate-400"
          }`}
        />
      </div>
    </button>
  );
});

export function AdminSidebar({
  currentTab,
  onSelectTab,
  mobileOpen = false,
  onCloseMobile,
  badges = {},
  width,
}) {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-xs lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation */}
      <aside
        style={typeof width === "number" ? { width: `${width}px` } : undefined}
        className={`fixed top-[4.25rem] bottom-0 left-0 z-40 w-72 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-[#faf9f6] p-3.5 shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:h-full ${
          typeof width === "number" ? "" : "lg:w-64"
        } lg:shrink-0 lg:shadow-none lg:translate-x-0 lg:flex ${
          mobileOpen ? "translate-x-0 flex" : "-translate-x-full lg:flex"
        }`}
      >
        {/* Navigation Sections */}
        <div className="space-y-5">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2.5 text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
                {group.title}
              </p>
              <nav className="mt-1.5 space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.id}
                    item={item}
                    isActive={currentTab === item.id}
                    badgeCount={badges[item.id]}
                    onSelect={onSelectTab}
                    onCloseMobile={onCloseMobile}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Bottom Sidebar Info Card */}
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-900 font-semibold">
            <Calendar className="h-4 w-4 text-[#0078d4]" />
            <span>NV Cyclothon 2026</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Sunday, 22 Nov 2026 • Rewa, M.P.
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
            <span className="text-slate-500 font-mono font-bold">EDITION 3.0</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Registration Open
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
