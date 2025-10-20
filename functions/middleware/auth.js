// functions/middleware/auth.js
export default function auth(req, res, next) {
  const user = process.env.BASIC_AUTH_USER || "";
  const pass = process.env.BASIC_AUTH_PASS || "";
  if (!user || !pass) return next(); // disabled if not configured

  const header = req.headers["authorization"] || "";
  const [scheme, credentials] = header.split(" ");
  if (scheme !== "Basic" || !credentials) return challenge(res);

  try {
    const decoded = Buffer.from(credentials, "base64").toString("utf8");
    const i = decoded.indexOf(":");
    const u = i >= 0 ? decoded.slice(0, i) : "";
    const p = i >= 0 ? decoded.slice(i + 1) : "";
    if (u === user && p === pass) return next();
  } catch {
    // fall through
  }
  return challenge(res);
}

function challenge(res) {
  res.set("WWW-Authenticate", 'Basic realm="Sequence Five"');
  return res.status(401).send("Auth required");
}
