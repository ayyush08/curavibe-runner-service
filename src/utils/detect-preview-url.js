export function detectPreviewReady(text) {
  const lower = text.toLowerCase();

  return (
    lower.includes("ready") ||
    lower.includes("local:") ||          // Vite
    lower.includes("started server") ||  // Next.js
    lower.includes("listening on") ||     // Hono / Express
    lower.includes("http://")             // fallback
  );
}