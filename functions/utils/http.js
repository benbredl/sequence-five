// functions/utils/http.js
export function ok(res, data) {
  res.status(200).json(data ?? {});
}

export function bad(res, msg, code = "bad_request") {
  res.status(400).json({ error: msg || "Bad request", code });
}

export function err(res, e, status = 500, code = "server_error") {
  const message = e?.message || String(e);
  console.error(message);
  res.status(status).json({ error: message, code });
}
