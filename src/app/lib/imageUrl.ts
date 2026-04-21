function extractGoogleDriveFileId(url: URL) {
  const directId = url.searchParams.get("id");

  if (directId) {
    return directId;
  }

  const filePathMatch = url.pathname.match(/\/file\/d\/([^/]+)/);
  return filePathMatch?.[1] || null;
}

export function normalizeRemoteImageUrl(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed)
    ? trimmed
    : trimmed.startsWith("//")
      ? `https:${trimmed}`
      : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    const host = url.hostname.toLowerCase();

    if (host.includes("drive.google.com")) {
      const fileId = extractGoogleDriveFileId(url);

      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }

    if (host.includes("dropbox.com")) {
      url.searchParams.delete("dl");
      url.searchParams.set("raw", "1");
      return url.toString();
    }

    if (host === "github.com" && url.pathname.includes("/blob/")) {
      return `https://raw.githubusercontent.com${url.pathname.replace("/blob/", "/")}`;
    }

    return url.toString();
  } catch {
    return trimmed;
  }
}
