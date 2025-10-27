(function () {
  var cfg = (window && window.__FIREBASE_CONFIG) || {};
  if (!cfg.apiKey || !cfg.authDomain) {
    document.getElementById("error").textContent = "Missing Firebase configuration.";
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp({ apiKey: cfg.apiKey, authDomain: cfg.authDomain });
  } catch (e) {}

  var emailEl = document.getElementById("email");
  var passEl  = document.getElementById("password");
  var btn     = document.getElementById("loginBtn");
  var back    = document.getElementById("goHome");
  var errorEl = document.getElementById("error");

  function setErr(msg) { errorEl.textContent = msg || ""; }
  function go(url) { try { window.location.assign(url); } catch { location.href = url; } }

  btn && btn.addEventListener("click", function () {
    setErr("");
    var email = (emailEl && emailEl.value || "").trim();
    var pass  = (passEl  && passEl.value  || "");
    if (!email || !pass) { setErr("Enter email and password."); return; }
    btn.disabled = true;
    firebase.auth().signInWithEmailAndPassword(email, pass)
      .then(function () { go("/"); })
      .catch(function (e) {
        var code = (e && e.code) || "";
        var msg  = (e && e.message) || "Sign-in failed";
        if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
          setErr("Invalid email or password.");
        } else if (code === "auth/user-not-found") {
          setErr("User not found.");
        } else {
          setErr(msg);
        }
      })
      .finally(function () { btn.disabled = false; });
  });

  // Enter key submits
  [emailEl, passEl].forEach(function (el) {
    el && el.addEventListener("keydown", function (e) {
      if (e.key === "Enter") btn && btn.click();
    });
  });

  back && back.addEventListener("click", function () { go("/"); });
})();
