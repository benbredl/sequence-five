// functions/services/enhancor.js
// Updated to new base URL per latest Enhancor docs.

const BASE = "https://apireq.enhancor.ai/api/image-upscaler/v1";

function getApiKey() {
  const key = process.env.ENHANCOR_API_KEY || "";
  if (!key) throw new Error("Server missing ENHANCOR_API_KEY");
  return key;
}

/**
 * Queue an upscale job.
 * Body required by API:
 * {
 *   img_url: "https://...",
 *   webhookUrl: "https://your-host/api/webhooks/enhancor"
 * }
 * Returns: { requestId }
 */
export async function enhancorQueue({ imgUrl, webhookUrl }) {
  const key = getApiKey();
  const r = await fetch(`${BASE}/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key
    },
    body: JSON.stringify({
      img_url: String(imgUrl || ""),
      webhookUrl: String(webhookUrl || "")
    })
  });

  let j = {};
  try { j = await r.json(); } catch {}

  if (!r.ok || !j?.success) {
    const msg = (j && (j.error || j.message)) || `Enhancor queue failed (${r.status})`;
    throw new Error(msg);
  }

  return { requestId: String(j.requestId || j.request_id || "") };
}

/**
 * Check job status.
 * Body required by API: { request_id: "..." }
 * Response example: { requestId, status: "IN_QUEUE"|"IN_PROGRESS"|"COMPLETED"|"FAILED", cost: 480 }
 */
export async function enhancorStatus({ requestId }) {
  const key = getApiKey();
  const r = await fetch(`${BASE}/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key
    },
    body: JSON.stringify({ request_id: String(requestId || "") })
  });

  let j = {};
  try { j = await r.json(); } catch {}

  if (!r.ok) {
    const msg = (j && (j.error || j.message)) || `Enhancor status failed (${r.status})`;
    throw new Error(msg);
  }

  // Normalize fields
  return {
    requestId: String(j.requestId || j.request_id || ""),
    status: String(j.status || "PENDING").toUpperCase(), // e.g., PENDING | IN_QUEUE | IN_PROGRESS | COMPLETED | FAILED
    cost: Number(j.cost || 0)
  };
}
