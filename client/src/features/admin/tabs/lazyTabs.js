import { lazy } from "react";

export const OverviewTab = lazy(() =>
  import("./OverviewTab").then((m) => ({ default: m.OverviewTab })),
);
export const FinanceTab = lazy(() =>
  import("./FinanceTab").then((m) => ({ default: m.FinanceTab })),
);
export const AnalyticsTab = lazy(() =>
  import("./AnalyticsTab").then((m) => ({ default: m.AnalyticsTab })),
);
export const ParticipantsTab = lazy(() =>
  import("./ParticipantsTab").then((m) => ({ default: m.ParticipantsTab })),
);
export const VolunteersTab = lazy(() =>
  import("./VolunteersTab").then((m) => ({ default: m.VolunteersTab })),
);
export const DelegationsTab = lazy(() =>
  import("./DelegationsTab").then((m) => ({ default: m.DelegationsTab })),
);
export const PartnersTab = lazy(() =>
  import("./PartnersTab").then((m) => ({ default: m.PartnersTab })),
);
export const VendorsTab = lazy(() =>
  import("./VendorsTab").then((m) => ({ default: m.VendorsTab })),
);
export const CommunityTab = lazy(() =>
  import("./CommunityTab").then((m) => ({ default: m.CommunityTab })),
);
export const GalleryManager = lazy(() =>
  import("./GalleryManager").then((m) => ({ default: m.GalleryManager })),
);
export const OffersTab = lazy(() =>
  import("./OffersTab").then((m) => ({ default: m.OffersTab })),
);
export const MembersTab = lazy(() =>
  import("./MembersTab").then((m) => ({ default: m.MembersTab })),
);
export const SettingsTab = lazy(() =>
  import("./SettingsTab").then((m) => ({ default: m.SettingsTab })),
);
