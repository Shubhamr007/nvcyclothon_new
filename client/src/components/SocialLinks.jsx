import React from "react";
import { FaInstagram, FaYoutube, FaFacebook, FaLinkedin } from "react-icons/fa6";
import { useSiteSettings } from "../state/SiteSettingsContext";
import { DEFAULT_SOCIAL_LINKS } from "../features/cyclothon/constants";

export const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@nvcyclothon",
    subtext: "Reels & race photos",
    icon: FaInstagram,
    hoverBg: "hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:text-white hover:border-transparent",
    brandText: "text-[#E1306C]",
    accentBg: "bg-[#E1306C]/10 text-[#E1306C] border-[#E1306C]/30",
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "@nvcyclothon",
    subtext: "Race films & teasers",
    icon: FaYoutube,
    hoverBg: "hover:bg-[#FF0000] hover:text-white hover:border-[#FF0000]",
    brandText: "text-[#FF0000]",
    accentBg: "bg-[#FF0000]/10 text-[#FF0000] border-[#FF0000]/30",
  },
  {
    id: "facebook",
    name: "Facebook",
    handle: "NV Cyclothon",
    subtext: "Community updates",
    icon: FaFacebook,
    hoverBg: "hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2]",
    brandText: "text-[#1877F2]",
    accentBg: "bg-[#1877F2]/10 text-[#1877F2] border-[#1877F2]/30",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "NV Cyclothon",
    subtext: "Partners & leadership",
    icon: FaLinkedin,
    hoverBg: "hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]",
    brandText: "text-[#0A66C2]",
    accentBg: "bg-[#0A66C2]/10 text-[#0A66C2] border-[#0A66C2]/30",
  },
];

export function SocialLinks({ variant = "pills", className = "", showLabels = false }) {
  const { settings } = useSiteSettings();
  const links = {
    ...DEFAULT_SOCIAL_LINKS,
    ...(settings?.social_links || {}),
  };

  if (variant === "buttons") {
    // Rich Card/Button Variant for Point of Contact section
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
        {SOCIAL_PLATFORMS.map((platform) => {
          const url = links[platform.id] || DEFAULT_SOCIAL_LINKS[platform.id];
          const Icon = platform.icon;
          return (
            <a
              key={platform.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit NV Cyclothon on ${platform.name}`}
              className={`group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:-translate-y-0.5 ${platform.hoverBg}`}
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-[#071313]">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-white">
                      {platform.name}
                    </span>
                  </div>
                  <span className="text-[11px] text-white/60 group-hover:text-white/80 transition-colors">
                    {platform.handle}
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-white/40 group-hover:text-white transition-colors">
                ↗
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "compact") {
    // Compact icon buttons for Mobile Menu / Header
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {SOCIAL_PLATFORMS.map((platform) => {
          const url = links[platform.id] || DEFAULT_SOCIAL_LINKS[platform.id];
          const Icon = platform.icon;
          return (
            <a
              key={platform.id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow on ${platform.name}`}
              className={`grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-white/5 text-white/80 transition-all duration-200 hover:-translate-y-0.5 ${platform.hoverBg}`}
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      </div>
    );
  }

  // Default Pills Variant for Footer
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {SOCIAL_PLATFORMS.map((platform) => {
        const url = links[platform.id] || DEFAULT_SOCIAL_LINKS[platform.id];
        const Icon = platform.icon;
        return (
          <a
            key={platform.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Connect with NV Cyclothon on ${platform.name}`}
            className={`group inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${platform.hoverBg}`}
          >
            <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span className="font-black uppercase tracking-wider text-[11px]">
              {platform.name}
            </span>
            {showLabels && (
              <span className="text-[10px] text-white/50 group-hover:text-white/80">
                {platform.handle}
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
