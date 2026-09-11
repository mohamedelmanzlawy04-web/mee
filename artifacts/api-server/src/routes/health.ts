import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

export default router;
router.get("/health/meta-test", async (req, res) => {
  const pixelId = process.env["META_PIXEL_ID"];
  const accessToken = process.env["META_CAPI_ACCESS_TOKEN"];

  if (!pixelId || !accessToken) {
    res.json({ ok: false, reason: "MISSING_ENV", pixelId: pixelId ?? null, hasToken: !!accessToken });
    return;
  }

  try {
    const testResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [{
            event_name: "PageView",
            event_time: Math.floor(Date.now() / 1000),
            event_id: "debug-test-" + Date.now(),
            action_source: "website",
            user_data: { client_ip_address: req.ip, client_user_agent: "debug-test" },
          }],
          test_event_code: process.env["META_TEST_EVENT_CODE"],
        }),
      },
    );
    const body = await testResponse.json();
    res.json({ ok: testResponse.ok, status: testResponse.status, pixelId, metaResponse: body });
  } catch (err: any) {
    res.json({ ok: false, reason: "FETCH_THREW", message: err?.message });
  }
});
