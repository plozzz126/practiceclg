const faviconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#0f766e"/>
  <path d="M22 18h12c10 0 16 5.5 16 14s-6 14-16 14h-4v10H22V18zm8 8v12h4c5 0 8-2.2 8-6s-3-6-8-6h-4z" fill="#ffffff"/>
</svg>
`;

export async function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
