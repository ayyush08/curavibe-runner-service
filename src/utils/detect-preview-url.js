export function detectPreviewUrl(text) {
  const regex = /(http:\/\/localhost:\d+)/;
  const match = text.match(regex);
  return match ? match[1] : null;
}
