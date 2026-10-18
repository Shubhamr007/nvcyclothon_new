import React from "react";
import { FaInstagram, FaYoutube, FaFacebook, FaLinkedin } from "react-icons/fa6";
import { CheckCircle2 } from "lucide-react";
import { DEFAULT_SOCIAL_LINKS } from "../../../features/cyclothon/constants";

export function SocialLinksSection({ settings, updateSocialLink }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-base font-bold text-slate-900">
          Official Social Media Channels
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Configure official handles and profile links. These channels appear in the website footer, point of contact section, and mobile navigation drawer.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Instagram */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-pink-500/10 text-pink-600">
              <FaInstagram className="h-5 w-5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Instagram</label>
              <p className="text-[11px] text-slate-500">Race reels, stories & photo updates</p>
            </div>
          </div>
          <input
            type="url"
            value={settings.social_links?.instagram || ""}
            onChange={(e) => updateSocialLink("instagram", e.target.value)}
            placeholder="https://www.instagram.com/nvcyclothon"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* YouTube */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-rose-500/10 text-rose-600">
              <FaYoutube className="h-5 w-5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">YouTube</label>
              <p className="text-[11px] text-slate-500">Race films, teasers & highlights</p>
            </div>
          </div>
          <input
            type="url"
            value={settings.social_links?.youtube || ""}
            onChange={(e) => updateSocialLink("youtube", e.target.value)}
            placeholder="https://www.youtube.com/@nvcyclothon"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* Facebook */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-500/10 text-blue-600">
              <FaFacebook className="h-5 w-5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">Facebook</label>
              <p className="text-[11px] text-slate-500">Community announcements & groups</p>
            </div>
          </div>
          <input
            type="url"
            value={settings.social_links?.facebook || ""}
            onChange={(e) => updateSocialLink("facebook", e.target.value)}
            placeholder="https://www.facebook.com/nvcyclothon"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {/* LinkedIn */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-700">
              <FaLinkedin className="h-5 w-5" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-900 uppercase tracking-wide">LinkedIn</label>
              <p className="text-[11px] text-slate-500">Partners, sponsors & leadership</p>
            </div>
          </div>
          <input
            type="url"
            value={settings.social_links?.linkedin || ""}
            onChange={(e) => updateSocialLink("linkedin", e.target.value)}
            placeholder="https://www.linkedin.com/company/nvcyclothon"
            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Live Synced Everywhere</p>
          <p className="text-emerald-700 mt-0.5">
            Changes published here immediately update official links on the website footer, contact section, and mobile drawer.
          </p>
        </div>
      </div>
    </div>
  );
}

export default SocialLinksSection;
