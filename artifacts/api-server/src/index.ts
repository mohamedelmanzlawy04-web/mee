import app from "./app";
import { logger } from "./lib/logger";
import { registerWebhook, sendDailyReport } from "./lib/telegram";
import { generateDailyStats, getCairoHourMinute } from "./lib/daily-report";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Register Telegram webhook (non-blocking)
  const domain = process.env["REPLIT_DEV_DOMAIN"] ?? process.env["APP_DOMAIN"];
  if (domain) {
    registerWebhook(`https://${domain}/api/telegram/webhook`).catch(() => {});
  } else {
    logger.warn("Telegram webhook not registered: REPLIT_DEV_DOMAIN not set");
  }

  // Daily report cron — fires at 23:59 Cairo time
  scheduleDailyReport();
});

// ─── Daily report scheduler ───────────────────────────────────────────────────

let lastReportDate = "";

function scheduleDailyReport(): void {
  setInterval(async () => {
    const { hour, minute, dateStr } = getCairoHourMinute();
    if (hour === 23 && minute === 59 && lastReportDate !== dateStr) {
      lastReportDate = dateStr;
      logger.info("Running daily Telegram report");
      try {
        const stats = await generateDailyStats();
        await sendDailyReport(stats);
      } catch (err) {
        logger.error({ err }, "Daily Telegram report failed");
      }
    }
  }, 60_000); // check every minute
}
