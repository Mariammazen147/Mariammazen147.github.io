// LYD Frequency: shared settings, questions, team names and helpers.
// host.html runs the game; phones (index.html) talk to it through two free public relays at once,
// so the game keeps going if one relay has a hiccup.

const LF = (() => {
  // ------------------------------------------------------------------ QUESTIONS
  // 4 options each, no right answers. "pick" = which questions are used when the host
  // chooses 3, 4 or 5 questions (lowest numbers first). They are always shown in this order,
  // going from light to a little deeper.
  const QUESTIONS = [
    {
      pick: 2,
      q: "Your ideal Friday looks like…",
      options: [
        ["😴", "Sleeping in. No plans, no guilt."],
        ["🎉", "Out with friends until late"],
        ["🚗", "A day trip out of the city"],
        ["🛠️", "Working on a side project or hobby"],
      ],
    },
    {
      pick: 5,
      q: "Your phone dies for a whole day. What do you miss most?",
      options: [
        ["💬", "My group chats"],
        ["🎧", "Music and podcasts"],
        ["🗺️", "Maps. I'd be lost, literally."],
        ["🧘", "Honestly? Nothing. Peace at last."],
      ],
    },
    {
      pick: 4,
      q: "Pick one superpower for everyday life:",
      options: [
        ["✨", "Teleport anywhere. Goodbye, traffic."],
        ["🗣️", "Speak every language fluently"],
        ["⏰", "4 extra hours in every day"],
        ["🔋", "Never feel tired again"],
      ],
    },
    {
      pick: 1,
      q: "In a team project, you're usually the one who…",
      options: [
        ["🧭", "Takes the lead and splits the tasks"],
        ["💡", "Comes up with the big ideas"],
        ["🎯", "Quietly gets the work done"],
        ["⚡", "Keeps everyone's energy up"],
      ],
    },
    {
      pick: 3,
      q: "If time and money weren't an issue, next year you'd…",
      options: [
        ["✈️", "Travel somewhere new every month"],
        ["🚀", "Start your own thing"],
        ["📚", "Learn something completely new"],
        ["🤝", "Give your time to a cause you care about"],
      ],
    },
  ];
  const pickQuestions = (n) => QUESTIONS.filter((q) => q.pick <= n);

  // ------------------------------------------------------------------ TEAM NAMES
  const TEAMS = [
    ["🍲", "Koshary", "كشري"], ["🧆", "Ta'ameya", "طعمية"], ["🌺", "Karkadeh", "كركديه"],
    ["🥭", "Mango", "مانجا"], ["🍯", "Konafa", "كنافة"], ["🌯", "Shawerma", "شاورما"],
    ["🍰", "Basbousa", "بسبوسة"], ["🎋", "Asab", "قصب"], ["🥙", "Hawawshi", "حواوشي"],
    ["☕", "Sahlab", "سحلب"], ["🍠", "Batata", "بطاطا"], ["🌻", "Lebb", "لب"],
    ["🌽", "Dorra", "درة"], ["🍉", "Batteekh", "بطيخ"], ["🍩", "Zalabya", "زلابية"],
    ["🍮", "Roz Bel Laban", "رز بلبن"], ["🥧", "Feteer", "فطير"], ["🥥", "Sobia", "سوبيا"],
    ["🥬", "Molokhia", "ملوخية"], ["🍪", "Kahk", "كحك"], ["🍵", "Shai", "شاي"],
    ["🥣", "Om Ali", "أم علي"],
  ];

  // ------------------------------------------------------------------ COLORS (from the LYD logo)
  // [background, text on it]
  const OPTION_COLORS = [["#FDC462", "#2a1d05"], ["#E8579E", "#ffffff"], ["#5CC8F0", "#08283a"], ["#9A86F0", "#ffffff"]];
  const TEAM_COLORS = [
    ["#FDC462", "#2a1d05"], ["#E8579E", "#ffffff"], ["#5CC8F0", "#08283a"], ["#6DD0CF", "#06302f"],
    ["#9A86F0", "#ffffff"], ["#F6A3C8", "#3a0d22"], ["#FFA45C", "#2e1503"], ["#7FD7A8", "#0b2e1c"],
  ];
  const BLOOM = ["#FDC462", "#E8579E", "#5CC8F0", "#6DD0CF", "#F6B6D2", "#9A86F0"];

  // ------------------------------------------------------------------ RELAYS
  const params = new URLSearchParams(location.search);
  const BROKERS = params.get("brokers") // local testing only
    ? params.get("brokers").split(",")
    : ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt"];
  const PREFIX = "lyd-frequency/v1/";
  const topic = (code, name) => PREFIX + code + "/" + name;

  // Talks to every relay at once. Publishes go to all connected relays; messages from any relay are delivered.
  class Bus {
    constructor(onMessage, onStatus) {
      this.subs = new Map();
      this.onConnect = null;
      this.clients = BROKERS.map((url) => {
        const c = mqtt.connect(url, {
          clientId: "lf_" + Math.random().toString(16).slice(2, 12),
          keepalive: 15, reconnectPeriod: 1500, connectTimeout: 8000, clean: true, resubscribe: false,
        });
        c.on("connect", () => {
          for (const [t, qos] of this.subs) c.subscribe(t, { qos });
          onStatus && onStatus();
          this.onConnect && this.onConnect(c);
        });
        for (const ev of ["close", "offline", "error"]) c.on(ev, () => onStatus && onStatus());
        c.on("message", (t, buf, packet) => onMessage(t, buf, packet));
        return c;
      });
    }
    get up() { return this.clients.filter((c) => c.connected).length; }
    subscribe(t, qos = 1) { this.subs.set(t, qos); for (const c of this.clients) if (c.connected) c.subscribe(t, { qos }); }
    unsubscribe(t) { this.subs.delete(t); for (const c of this.clients) if (c.connected) c.unsubscribe(t); }
    publish(t, payload, opts) { for (const c of this.clients) if (c.connected) c.publish(t, payload, opts || { qos: 1 }); }
  }

  // ------------------------------------------------------------------ helpers
  const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A burst of petals that bloom out from a point (x, y in viewport pixels).
  function bloomBurst(x, y, opts = {}) {
    if (reduced()) return;
    const n = opts.count || 14, colors = opts.colors || BLOOM, spread = opts.spread || 120;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "petal";
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
      const d = spread * (0.55 + Math.random() * 0.6);
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.background = colors[i % colors.length];
      p.style.setProperty("--dx", Math.cos(a) * d + "px");
      p.style.setProperty("--dy", Math.sin(a) * d - (opts.lift || 30) + "px");
      p.style.setProperty("--r", Math.round(Math.random() * 540 - 270) + "deg");
      p.style.setProperty("--s", (0.7 + Math.random() * 0.8).toFixed(2));
      p.style.animationDuration = (opts.duration || 900) + Math.random() * 400 + "ms";
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }
  // Petal shower from the top of the screen (group reveal).
  function petalRain(count = 40) {
    if (reduced()) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "petal rain";
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = BLOOM[i % BLOOM.length];
      p.style.setProperty("--r", Math.round(Math.random() * 720 - 360) + "deg");
      p.style.setProperty("--drift", Math.round(Math.random() * 120 - 60) + "px");
      p.style.setProperty("--s", (0.7 + Math.random() * 0.9).toFixed(2));
      p.style.animationDelay = Math.random() * 900 + "ms";
      p.style.animationDuration = 2200 + Math.random() * 1600 + "ms";
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }
  // An SVG flower (5 petals) for the host's live "garden".
  function flowerSVG(color, center = "#FDC462") {
    const petals = [0, 72, 144, 216, 288].map((r) =>
      `<ellipse cx="20" cy="9" rx="7" ry="10" fill="${color}" transform="rotate(${r} 20 20)"/>`).join("");
    return `<svg viewBox="0 0 40 40" aria-hidden="true">${petals}<circle cx="20" cy="20" r="6" fill="${center}"/></svg>`;
  }

  return { QUESTIONS, pickQuestions, TEAMS, OPTION_COLORS, TEAM_COLORS, BLOOM, Bus, topic, rid, newCode, esc, store, params, bloomBurst, petalRain, flowerSVG, reduced };
})();
