// Megaladata chooses its save mechanism while loading. File System Access writes
// bypass Playwright downloads and MCP's chooser interception rejects its picker.
// Hide only that capability before page scripts so Megaladata uses native downloads.
export function browserDownloadScript(megaladataUrl) {
  const origin = megaladataUrl ? new URL(megaladataUrl).origin : null;
  return `if (${origin === null ? 'true' : `globalThis.location.origin === ${JSON.stringify(origin)}`}) delete globalThis.showSaveFilePicker;`;
}
