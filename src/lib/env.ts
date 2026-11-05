import "server-only";

// Todas las claves viven en variables de entorno de Vercel (ver .env.example y docs/SPEC.md §7).
// Nunca se escriben en el código ni se piden por chat.
function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Falta la variable de entorno ${name}`);
  return v;
}

export const env = {
  siteUrl: () => (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  supabaseUrl: () => req("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: () => req("SUPABASE_SERVICE_ROLE_KEY"),
  mpAccessToken: () => req("MP_ACCESS_TOKEN"),
  mpWebhookSecret: () => req("MP_WEBHOOK_SECRET"),
  resendApiKey: () => req("RESEND_API_KEY"),
  resendWebhookSecret: () => req("RESEND_WEBHOOK_SECRET"),
  emailFrom: () => process.env.EMAIL_FROM || "Manu Casaubon <manu@info.comunicatumarca.com>",
  emailReplyTo: () => process.env.EMAIL_REPLY_TO || undefined,
  // "test": solo se manda a EMAIL_TEST_RECIPIENTS. "live": a personas reales (requiere OK de Manu).
  emailMode: (): "test" | "live" => (process.env.EMAIL_MODE === "live" ? "live" : "test"),
  emailTestRecipients: () => (process.env.EMAIL_TEST_RECIPIENTS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  manuNotifyEmail: () => process.env.MANU_NOTIFY_EMAIL || "",
  cronSecret: () => req("CRON_SECRET"),
};
