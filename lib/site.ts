// URL pública del sitio, usada en links de email y llamadas internas.
// Prioridad: NEXT_PUBLIC_SITE_URL → dominio público de Railway → localhost.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railwayDomain) return `https://${railwayDomain}`;

  return `http://localhost:${process.env.PORT ?? 3000}`;
}
