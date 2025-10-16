export function methodNotAllowed(req, res) {
  res.status(405).json({ error: `Use ${req.method === "GET" ? "POST" : "GET"} for ${req.path}` });
}

export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.path });
}
