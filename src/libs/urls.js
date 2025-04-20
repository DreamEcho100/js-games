export const importBaseUrl = import.meta.resolve(
  "../",
  new URL(import.meta.url),
);
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
window.importMeta = import.meta;

const importBasePrefix = "#";
const importBasePrefixRegExp = new RegExp(`^${importBasePrefix}\\w+`);
/**
 * @param {string} url
 */
export function resolveBaseImportUrl(url) {
  if (importBasePrefixRegExp.test(url)) {
    url = importBaseUrl + url.slice(1);
    return import.meta.resolve(url, new URL(import.meta.url));
  }

  throw new Error(
    `${resolveBaseImportUrl.name}: url must start with "${importBasePrefix}", passed url: "${url}"`,
  );
}
