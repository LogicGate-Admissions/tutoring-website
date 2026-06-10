/**
 * File purpose: helpers for turning pasted clipboard file data into File objects
 * that can be uploaded through the existing attachment pipeline.
 */

export function getFilesFromClipboard(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];

  const itemFiles = Array.from(clipboardData.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => Boolean(file));

  const files = itemFiles.length > 0 ? itemFiles : Array.from(clipboardData.files ?? []);

  return files.map((file, index) => normalisePastedFile(file, index));
}

function normalisePastedFile(file: File, index: number): File {
  const fallbackName = buildPastedFileName(file, index);
  const currentName = file.name?.trim();

  if (currentName && !/^image\.(png|jpg|jpeg|gif|webp)$/i.test(currentName)) {
    return file;
  }

  return new File([file], fallbackName, {
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified || Date.now(),
  });
}

function buildPastedFileName(file: File, index: number): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = getExtensionFromMimeType(file.type) ?? getExtensionFromName(file.name) ?? 'png';
  const suffix = index === 0 ? '' : `-${index + 1}`;

  return `pasted-screenshot-${timestamp}${suffix}.${extension}`;
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/gif') return 'gif';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  return undefined;
}

function getExtensionFromName(name: string) {
  const match = name.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase();
}
