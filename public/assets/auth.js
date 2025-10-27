(function () {
  // Require config injected by server
  var cfg = (window && window.__FIREBASE_CONFIG) || {};
  if (!cfg.apiKey || !cfg.authDomain) {
    console.warn("[auth] Missing Firebase web config");
    return;
  }

  // Initialize (compat)
  try {
    if (!firebase.apps.length) firebase.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain });
  } catch (e) {
    console.warn("[auth] init error", e);
  }

  // Helper: route guard
  function isProtectedPath(path) {
    // We protect all app pages except /login, /healthz, favicon and static assets
    if (path === "/login" || path === "/healthz" || path.startsWith("/images/")) return false;
    if (path.startsWith("/assets/") || path.startsWith("/favicon")) return false;
    return true;
  }

  function go(url) { try { window.location.assign(url); } catch { location.href = url; } }

  // Listen once and guard
  firebase.auth().onAuthStateChanged(function (user) {
    var path = (location && location.pathname) || "/";
    if (path === "/login") {
      if (user) go("/");
      return;
    }
    if (isProtectedPath(path) && !user) {
      go("/login");
    }
  });

  // Logout hook if link exists
  var logout = document.getElementById("logoutLink");
  if (logout) {
    logout.addEventListener("click", function (e) {
      e.preventDefault();
      firebase.auth().signOut().then(function () {
        go("/login");
      }).catch(function (err) {
        alert(err && err.message ? err.message : String(err));
      });
    });
  }
})();
