export default function auth(_req, _res, next) {
  // Client-side Firebase Auth will guard pages. This is a pass-through so nothing else breaks.
  return next();
}
