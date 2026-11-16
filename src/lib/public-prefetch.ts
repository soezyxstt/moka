export function publicPrefetch(href: string, enabled: boolean): boolean | null {
  const path = href.split(/[?#]/, 1)[0];
  if (!enabled || !path.startsWith('/') || path.startsWith('//') || /^\/(admin|monitor)(\/|$)/.test(path)) return false;
  return /^\/voting(\/|$)/.test(path) ? null : true;
}
