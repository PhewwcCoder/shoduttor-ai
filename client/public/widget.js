/* Shoduttor.ai — embeddable chat widget.
 * One self-contained file, zero dependencies. A business pastes ONE script tag:
 *
 *   <script src="https://cdn.shoduttor.ai/widget.js"
 *           data-business-id="grameenphone"
 *           data-primary-color="#00A550"
 *           data-position="bottom-right"
 *           data-greeting="Apnar ki help lagbe?"
 *           data-api-url="https://shoduttor-ai.onrender.com"
 *           defer></script>
 *
 * Everything lives inside a Shadow DOM so the host site's CSS can't touch the
 * widget and the widget's CSS can't leak onto the host site.
 */
(function () {
  // ---- 1. Read config from the script tag's data-* attributes -------------
  // document.currentScript works for classic + deferred scripts during initial
  // run; fall back to locating our own tag by a data attribute just in case.
  var script =
    document.currentScript ||
    document.querySelector("script[data-business-id][src*='widget.js']");

  function attr(name, fallback) {
    var v = script && script.getAttribute(name);
    return v != null && v !== "" ? v : fallback;
  }

  var config = {
    businessId: attr("data-business-id", "grameenphone"),
    primaryColor: attr("data-primary-color", "#00A550"),
    position: attr("data-position", "bottom-right"),
    greeting: attr("data-greeting", "How can I help you?"),
    icon: attr("data-icon", "💬"),
    apiUrl: attr("data-api-url", "https://shoduttor-ai.onrender.com"),
  };

  var isBottom = config.position.indexOf("bottom") !== -1;
  var isRight = config.position.indexOf("right") !== -1;

  // ---- 2. Host element + sealed shadow root -------------------------------
  var host = document.createElement("div");
  host.id = "shoduttor-root";
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: "open" });

  // ---- 3. Scoped styles injected INTO the shadow root ---------------------
  var vSide = isBottom ? "bottom: 20px;" : "top: 20px;";
  var hSide = isRight ? "right: 20px;" : "left: 20px;";
  var panelV = isBottom ? "bottom: 90px;" : "top: 90px;";

  var style = document.createElement("style");
  style.textContent =
    ":host { all: initial; }" +
    "* { box-sizing: border-box; font-family: -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif; }" +
    ".launcher { position: fixed; " + vSide + hSide +
      " width: 60px; height: 60px; border-radius: 50%; background: " + config.primaryColor +
      "; cursor: pointer; z-index: 999999; box-shadow: 0 4px 16px rgba(0,0,0,0.2);" +
      " display: flex; align-items: center; justify-content: center; border: none; font-size: 26px; }" +
    ".launcher:hover { filter: brightness(1.05); }" +
    ".panel { position: fixed; " + panelV + hSide +
      " width: 360px; height: 520px; max-width: calc(100vw - 40px); max-height: calc(100vh - 120px);" +
      " background: #fff; border-radius: 16px; z-index: 999999; box-shadow: 0 8px 32px rgba(0,0,0,0.16);" +
      " display: none; flex-direction: column; overflow: hidden; }" +
    ".panel.open { display: flex; }" +
    ".header { background: " + config.primaryColor + "; color: #fff; padding: 14px 16px;" +
      " display: flex; align-items: center; justify-content: space-between; }" +
    ".header .title { font-weight: 600; font-size: 14px; }" +
    ".header .sub { font-size: 11px; opacity: 0.8; }" +
    ".header .close { background: none; border: none; color: #fff; font-size: 16px; cursor: pointer; opacity: 0.9; }" +
    ".messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; background: #f7f8fa; }" +
    ".row { display: flex; flex-direction: column; }" +
    ".row.user { align-items: flex-end; }" +
    ".row.bot { align-items: flex-start; }" +
    ".msg { max-width: 80%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.5; }" +
    ".msg.user { background: " + config.primaryColor + "; color: #fff; }" +
    ".msg.bot { background: #fff; color: #1a1a1a; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }" +
    ".badges { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }" +
    ".badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; text-transform: capitalize; }" +
    ".ticket { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #eef0f2; color: #555; }" +
    ".typing { display: flex; gap: 4px; align-self: flex-start; background: #fff; padding: 12px 14px; border-radius: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }" +
    ".typing span { width: 7px; height: 7px; border-radius: 50%; background: #bbb; animation: sd-bounce 1.2s infinite; }" +
    ".typing span:nth-child(2) { animation-delay: 0.15s; }" +
    ".typing span:nth-child(3) { animation-delay: 0.3s; }" +
    "@keyframes sd-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }" +
    ".input-row { display: flex; padding: 12px; border-top: 1px solid #eee; gap: 8px; background: #fff; }" +
    ".input-row input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 10px 14px; outline: none; font-size: 14px; }" +
    ".input-row input:focus { border-color: #aaa; }" +
    ".input-row button { background: " + config.primaryColor + "; color: #fff; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 16px; }" +
    ".powered { text-align: center; font-size: 10px; color: #aaa; padding: 0 0 8px; background: #fff; }";
  shadow.appendChild(style);

  // ---- 4. Build the DOM ----------------------------------------------------
  var launcher = document.createElement("button");
  launcher.className = "launcher";
  launcher.setAttribute("aria-label", "Open chat");
  launcher.textContent = config.icon; // 💬 by default, or e.g. ⚽ via data-icon

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="header">' +
      '<div><div class="title">Shoduttor.ai Support</div></div>' +
      '<button class="close" aria-label="Close">✕</button>' +
    "</div>" +
    '<div class="messages"></div>' +
    '<div class="input-row">' +
      '<input type="text" placeholder="Type a message…" />' +
      '<button class="send" aria-label="Send">➤</button>' +
    "</div>" +
    '<div class="powered">Powered by Shoduttor.ai</div>';

  shadow.appendChild(launcher);
  shadow.appendChild(panel);

  var messagesEl = panel.querySelector(".messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".send");
  var closeBtn = panel.querySelector(".close");

  // ---- 5. Badge colors (mirrors the dashboard palette) --------------------
  var INTENT_COLORS = {
    billing: "#fef3c7|#92400e", technical: "#dbeafe|#1e40af", subscription: "#ede9fe|#5b21b6",
    product: "#ccfbf1|#115e59", delivery: "#e0f2fe|#075985", account: "#e0e7ff|#3730a3",
    complaint: "#ffe4e6|#9f1239", general: "#f1f5f9|#334155",
  };
  var SENTIMENT_COLORS = {
    frustrated: "#ffedd5|#9a3412", urgent: "#fee2e2|#991b1b", angry: "#fee2e2|#991b1b",
    confused: "#fef9c3|#854d0e", neutral: "#f3f4f6|#4b5563",
  };
  function badge(value, map) {
    if (!value) return "";
    var pair = (map[value] || "#f1f5f9|#334155").split("|");
    return '<span class="badge" style="background:' + pair[0] + ";color:" + pair[1] + '">' + value + "</span>";
  }

  // ---- 6. Rendering helpers -----------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function addMessage(from, text, meta) {
    var row = document.createElement("div");
    row.className = "row " + from;
    var html = '<div class="msg ' + from + '">' + escapeHtml(text) + "</div>";
    if (meta && (meta.intent || meta.sentiment || meta.ticketId)) {
      html += '<div class="badges">';
      html += badge(meta.intent, INTENT_COLORS);
      html += badge(meta.sentiment, SENTIMENT_COLORS);
      if (meta.status === "escalated" && meta.ticketId) {
        html += '<span class="ticket">Ticket #' + escapeHtml(String(meta.ticketId).slice(0, 8)) + "</span>";
      }
      html += "</div>";
    }
    row.innerHTML = html;
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  var typingEl = null;
  function showTyping() {
    typingEl = document.createElement("div");
    typingEl.className = "typing";
    typingEl.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    if (typingEl) { typingEl.remove(); typingEl = null; }
  }

  // ---- 7. Send flow --------------------------------------------------------
  var sending = false;
  function send() {
    var text = inputEl.value.trim();
    if (!text || sending) return;
    sending = true;
    addMessage("user", text);
    inputEl.value = "";
    showTyping();

    fetch(config.apiUrl + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, business_id: config.businessId }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        hideTyping();
        if (data && data.reply) {
          addMessage("bot", data.reply, {
            intent: data.intent, sentiment: data.sentiment,
            status: data.status, ticketId: data.ticket_id,
          });
        } else {
          // Surface server messages (rate limit / daily cap / too long) directly.
          addMessage("bot", (data && data.error) || "Sorry, I couldn't process that. Please try again.");
        }
      })
      .catch(function () {
        hideTyping();
        addMessage("bot", "Sorry, I'm having trouble connecting. Please try again in a moment.");
      })
      .finally(function () { sending = false; });
  }

  // ---- 8. Wire up events ---------------------------------------------------
  var greeted = false;
  function openPanel() {
    panel.classList.add("open");
    launcher.textContent = "✕";
    if (!greeted) { addMessage("bot", config.greeting); greeted = true; }
    inputEl.focus();
  }
  function closePanel() {
    panel.classList.remove("open");
    launcher.textContent = config.icon;
  }
  launcher.addEventListener("click", function () {
    panel.classList.contains("open") ? closePanel() : openPanel();
  });
  closeBtn.addEventListener("click", closePanel);
  sendBtn.addEventListener("click", send);
  inputEl.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
})();
