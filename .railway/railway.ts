import { defineRailway, github, preserve, project, service } from "railway/iac";

// Infraestructura de Railway para la calculadora laboral.
// Revisar con `railway config plan` y aplicar con `railway config apply`
// (requiere Node >= 22.6). Los secretos se cargan con `railway variable set`
// y aquí se declaran con preserve() para que el apply no los borre.
export default defineRailway(() => {
  const web = service("calculadora-laboral", {
    source: github("r2flows/calculadora_laboral", { branch: "main" }),
    build: { builder: "RAILPACK", buildCommand: "npm run build" },
    start: "npm run start",
    healthcheck: "/api/health",
    healthcheckTimeout: 120,
    deploy: { restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 5 },
    env: {
      FROM_EMAIL: "onboarding@resend.dev",
      NEXT_PUBLIC_SITE_URL: preserve(), // https://${{RAILWAY_PUBLIC_DOMAIN}}
      NEXT_PUBLIC_ADMIN_CODE: preserve(),
      NEXT_PUBLIC_SUPABASE_URL: preserve(),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: preserve(),
      SUPABASE_SERVICE_ROLE_KEY: preserve(),
      RESEND_API_KEY: preserve(),
    },
  });

  return project("calculadora-laboral", { resources: [web] });
});
