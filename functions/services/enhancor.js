const BASE = "https://api.enhancor.ai/api/image-upscaler/v1";

function getApiKey() {
  const key = process.env.ENHANCOR_API_KEY || "";
  if (!key) throw new Error("Server missing ENHANCOR_API_KEY");
  return key;
}

export async function enhancorQueue({ imgUrl, webhookUrl }) {
  const key = getApiKey();
  const r = await fetch(`${BASE}/queue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key
    },
    body: JSON.stringify({ img_url: String(imgUrl || ""), webhookUrl: String(webhookUrl || "") })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.success) {
    throw new Error(j?.error || "Enhancor queue failed");
  }
  return { requestId: String(j.requestId || j.request_id || "") };
}

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
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(j?.error || "Enhancor status failed");
  }
  // Example: {"requestId":"...","status":"IN_QUEUE","cost":480}
  return {
    requestId: String(j.requestId || j.request_id || ""),
    status: String(j.status || "PENDING"),
    cost: Number(j.cost || 0)
  };
}
