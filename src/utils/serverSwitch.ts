const SITE_STORAGE_KEY = "maayuan.site.target";

const isBrowser = typeof window !== "undefined";

const dedupe = (list: Array<string | undefined | null>) =>
  Array.from(new Set(list.filter((item): item is string => !!item && !!item.trim())));

const siteEndpoints = dedupe([
  import.meta.env.VITE_SITE_PRIMARY || (isBrowser ? window.location.origin : ""),
  import.meta.env.VITE_SITE_BACKUP,
]);

const pickStored = (allowed: string[]) => {
  if (!isBrowser || !allowed.length) return allowed[0] ?? "";
  try {
    const stored = localStorage.getItem(SITE_STORAGE_KEY);
    if (stored && allowed.includes(stored)) {
      return stored;
    }
  } catch {
    // ignore storage failures
  }
  return allowed[0] ?? "";
};

let activeSite = pickStored(siteEndpoints);

const persist = (value: string) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(SITE_STORAGE_KEY, value);
  } catch {
    // ignore storage failures
  }
};

export const getSiteTargets = () => siteEndpoints;

export const getSiteSwitchInfo = () => {
  const current = isBrowser ? window.location.origin : activeSite;
  const targetSite =
    siteEndpoints.find((item) => item && item !== current) ?? siteEndpoints[0] ?? "";
  return { currentSite: current, targetSite };
};

export const switchSite = () => {
  const { targetSite } = getSiteSwitchInfo();
  if (targetSite && isBrowser) {
    window.location.href = targetSite;
  }
  if (targetSite) {
    activeSite = targetSite;
    persist(targetSite);
  }
  return targetSite;
};
