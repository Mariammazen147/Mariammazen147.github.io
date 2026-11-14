// Money Match: shared settings, questions and helpers for host.html and index.html.
// The host page runs the game; phones talk to it through a free public MQTT relay.

const MM = (() => {
  // ---- Edit your questions here (exactly 4 options each, no "right" answers) ----
  const QUESTIONS = [
    {
      q: "You get a surprise bonus equal to one month's salary. What do you do first?",
      options: [
        "Save all of it",
        "Invest it (gold, stocks, a small project)",
        "Pay off what I owe",
        "Treat myself and my family, then save the rest",
      ],
    },
    {
      q: 'What does being "rich" really mean to you?',
      options: [
        "Never worrying about bills",
        "Freedom to choose how I spend my time",
        "Owning assets (a home, land, a business)",
        "Being able to help the people I love",
      ],
    },
    {
      q: "Which money personality sounds most like you?",
      options: [
        "The Saver: I feel safe when money sits untouched",
        "The Spender: money is for living now",
        "The Investor: money should make more money",
        "The Avoider: I'd rather not check my balance",
      ],
    },
    {
      q: "Where would you keep your savings for the next 5 years?",
      options: [
        "Bank certificate or savings account",
        "Gold",
        "Real estate",
        "Stocks, funds, or my own business",
      ],
    },
    {
      q: "A close friend asks to borrow a big amount of money. You...",
      options: [
        "Lend it, friendship comes first",
        "Lend it, but with a clear written plan to pay back",
        "Give a smaller amount as a gift, no payback expected",
        "Politely say no, money ruins friendships",
      ],
    },
  ];

  // Free public relays. If the first is unreachable the host switches to the next,
  // and the QR code tells phones which one to use.
  const BROKERS = ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt"];
  const PREFIX = "moneymatch-eg/v1/";

  const params = new URLSearchParams(location.search);
  const brokerOverride = params.get("broker"); // for local testing only

  function brokerUrl(i) { return brokerOverride || BROKERS[i] || BROKERS[0]; }

  function connect(brokerIndex) {
    return mqtt.connect(brokerUrl(brokerIndex), {
      clientId: "mm_" + Math.random().toString(16).slice(2, 12),
      keepalive: 20,
      reconnectPeriod: 1500,
      connectTimeout: 8000,
      clean: true,
    });
  }

  const topic = (code, name) => PREFIX + code + "/" + name;
  const rid = (n = 10) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]).join("");
  const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[b % 32]).join("");
  const esc = (s) => { const d = document.createElement("div"); d.textContent = s == null ? "" : String(s); return d.innerHTML; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };

  return { QUESTIONS, BROKERS, connect, topic, rid, newCode, esc, store, params };
})();
