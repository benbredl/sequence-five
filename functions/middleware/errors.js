// functions/middleware/errors.js
export function methodNotAllowed(req, res) {
  res.status(405).json({ error: `Use ${req.method === "GET" ? "POST" : "GET"} for ${req.path}` });
}

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}
