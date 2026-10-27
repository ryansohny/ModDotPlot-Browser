import type { RemoteFastaDownloadDescriptor } from "./protocol";

const REMOTE_FASTA_SUFFIX = /\.(?:fa|fasta|fna|fas)(?:\.gz)?$/i;

/** Validates and normalizes a user-entered URL before it is sent to the worker. */
export function parseRemoteFastaUrl(value: string): RemoteFastaDownloadDescriptor {
  const trimmed = value.trim();
  if (trimmed.length === 0) throw new Error("Enter an HTTPS URL for a FASTA file.");

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("Enter a complete HTTPS URL, including https://.");
  }
  // Same-origin HTTP is allowed so a local preview server (e.g. over an SSH tunnel) can serve FASTA files.
  if (url.protocol !== "https:" && url.origin !== globalThis.location?.origin) {
    throw new Error("Remote FASTA URLs must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Remote FASTA URLs cannot contain embedded credentials.");
  }

  normalizeGitHubRawUrl(url);
  const encodedName = url.pathname.split("/").at(-1) ?? "";
  let fileName: string;
  try {
    fileName = decodeURIComponent(encodedName);
  } catch {
    throw new Error("The FASTA URL contains an invalid encoded filename.");
  }
  if (!REMOTE_FASTA_SUFFIX.test(fileName)) {
    throw new Error("The URL must end in .fa, .fasta, .fna, or .fas, optionally followed by .gz.");
  }

  url.hash = "";
  return Object.freeze({ url: url.href, fileName });
}

/** Validates a feature-track URL with the same HTTPS/same-origin rule as FASTA URLs. */
export function parseRemoteTrackUrl(value: string): { url: string; fileName: string } {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a complete track URL, including https://.");
  }
  if (url.protocol !== "https:" && url.origin !== globalThis.location?.origin) {
    throw new Error("Remote track URLs must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("Remote track URLs cannot contain embedded credentials.");
  }
  normalizeGitHubRawUrl(url);
  const fileName = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
  if (fileName.length === 0) throw new Error("The track URL must end in a file name.");
  url.hash = "";
  return { url: url.href, fileName };
}

function normalizeGitHubRawUrl(url: URL): void {
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 5 || segments[2] !== "raw") return;
  url.hostname = "raw.githubusercontent.com";
  url.pathname = `/${segments[0]}/${segments[1]}/${segments.slice(3).join("/")}`;
}
