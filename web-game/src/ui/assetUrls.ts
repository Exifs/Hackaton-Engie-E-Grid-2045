export function cssUrlForPageAsset(assetPath: string, pageHref = window.location.href): string {
  const normalizedPath = assetPath.replace(/^\/+/, "");
  return `url("${new URL(normalizedPath, pageHref).href}")`;
}
