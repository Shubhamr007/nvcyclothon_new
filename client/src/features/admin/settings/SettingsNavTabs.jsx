import React, { useCallback } from "react";
import { Calendar, Bike, Trophy, Layers, Share2, Eye } from "lucide-react";

export const SETTINGS_TABS = [
  { id: "logistics", label: "Event & Registrations", icon: Calendar },
  { id: "categories", label: "Race Categories & Pricing", icon: Bike },
  { id: "prizes", label: "Prize Pool & Rider Kit", icon: Trophy },
  { id: "visuals", label: "Hero & Visuals", icon: Layers },
  { id: "social", label: "Social Media Links", icon: Share2 },
  { id: "visibility", label: "Page Sections Visibility", icon: Eye },
];

const SettingsTabButton = React.memo(function SettingsTabButton({
  tab,
  isActive,
  onSelect,
}) {
  const handleClick = useCallback(() => {
    onSelect(tab.id);
  }, [tab.id, onSelect]);

  const Icon = tab.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all ${
        isActive
          ? "bg-slate-900 text-white shadow-xs"
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "text-[#d9ff38]" : "text-slate-400"}`} />
      <span>{tab.label}</span>
    </button>
  );
});

export function SettingsNavTabs({ activeTab, onSelectTab }) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs">
      {SETTINGS_TABS.map((tab) => (
        <SettingsTabButton
          key={tab.id}
          tab={tab}
          isActive={activeTab === tab.id}
          onSelect={onSelectTab}
        />
      ))}
    </div>
  );
}

export default SettingsNavTabs;
