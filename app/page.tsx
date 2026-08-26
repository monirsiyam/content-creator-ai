"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

type AspectRatio = "16:9" | "9:16";
type AuthMode = "login" | "register";
type PaymentMethod = "bkash" | "nagad" | "rocket";
type PlatformKey = "facebook" | "tiktok" | "shorts" | "bilibili";

type PlatformCopy = {
  title: string;
  desc: string;
  tags: string;
  seo_keywords: string;
};

const PLATFORM_KEYS: PlatformKey[] = ["facebook", "tiktok", "shorts", "bilibili"];

const OPENAI_CONTENT_PROMPT = `You are Content Creator Ai, a professional multilingual social-video copywriter for Bangladeshi creators.

The user provides a short video topic/title. Use ONLY that topic as ground truth.

OUTPUT JSON SHAPE (required, no markdown):
{
  "facebook": { "title": "", "desc": "", "tags": "", "seo_keywords": "" },
  "tiktok": { "title": "", "desc": "", "tags": "", "seo_keywords": "" },
  "shorts": { "title": "", "desc": "", "tags": "", "seo_keywords": "" },
  "bilibili": { "title": "", "desc": "", "tags": "", "seo_keywords": "" }
}

TITLE RULES:
- Write a long, highly attention-grabbing, emotional title.
- Never mislead. Never invent discounts, guarantees, giveaways, delivery, or facts not in the user topic.
- 100% contextual accuracy: every claim must stay true to the user's title.

DESCRIPTION RULES:
- Write a rich, multi-paragraph description (at least 3 paragraphs, significantly longer than a caption).
- Professional, algorithm-friendly copywriting: hook, context, value, watch-reason, CTA to watch/comment/share.
- Separate paragraphs with blank lines.
- Do not add false product claims.

TAGS:
- "tags" must be exactly 4 hashtags, space-separated (e.g. "#BanglaVlog #VillageLife #Bangladesh #Vlog").

SEO KEYWORDS:
- "seo_keywords" must be comma-separated search terms for the video tags field (e.g. vlog, bangla vlog, village life).
- Include the topic plus natural discovery terms. No hashtags in seo_keywords.
- Provide seo_keywords for EVERY platform including bilibili.`;

function mapAiPlatformCopy(raw: unknown): PlatformCopy {
  const data = (raw ?? {}) as Record<string, unknown>;
  const seoKeywords = String(data.seo_keywords ?? data.seoKeywords ?? "").trim();
  return {
    title: String(data.title ?? "").trim(),
    desc: String(data.desc ?? data.description ?? "").trim(),
    tags: String(data.tags ?? "").trim(),
    seo_keywords: seoKeywords,
  };
}

function mapAiKitResponse(raw: unknown): Record<PlatformKey, PlatformCopy> {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    facebook: mapAiPlatformCopy(data.facebook),
    tiktok: mapAiPlatformCopy(data.tiktok),
    shorts: mapAiPlatformCopy(data.shorts),
    bilibili: mapAiPlatformCopy(data.bilibili),
  };
}

function buildSeoKeywords(topic: string, extra: string[]): string {
  const unique = [topic, ...extra]
    .map((term) => term.replace(/^#+/, "").trim())
    .filter(Boolean);
  return Array.from(new Set(unique)).join(", ");
}

function buildContextualKit(topic: string): Record<PlatformKey, PlatformCopy> {
  const safeTopic = topic.trim();
  const facebook: PlatformCopy = {
    title: `এই ভিডিওটা দেখলে মনটা কেন এমন টানবে জানেন? ${safeTopic} — আসল গল্প, আসল অনুভূতি, কোনো বাড়াবাড়ি দাবি ছাড়াই একবার দেখুন`,
    desc: `আজকের ভিডিও সম্পূর্ণভাবে ${safeTopic} নিয়ে। শুরুতেই যে অনুভূতিটা ধরা পড়ে, সেটাই এই গল্পের মূল সুর — কৌতূহল, স্মৃতি, আর একটুখানি অপেক্ষা।\n\nআমরা ইচ্ছে করে কোনো মিথ্যা অফার, গ্যারান্টি বা অতিরঞ্জিত দাবি যোগ করিনি। যা দেখবেন, তা এই টপিকের বাস্তব প্রেক্ষাপটেই থাকবে, যাতে অ্যালগরিদম এবং দর্শক দুই পক্ষই বিশ্বাস করতে পারে।\n\nভিডিওটি শেষ পর্যন্ত দেখুন, কমেন্টে আপনার অভিজ্ঞতা লিখুন, আর যদি ${safeTopic} আপনার কাছে গুরুত্বপূর্ণ হয় তাহলে শেয়ার করুন — পরের পর্বে আরও গভীরভাবে এই বিষয়টা নিয়ে ফিরে আসব।`,
    tags: "#BanglaVlog #EmotionalStory #Bangladesh #ContentCreator",
    seo_keywords: buildSeoKeywords(safeTopic, [
      "vlog",
      "bangla vlog",
      "facebook video",
      "bangladesh",
      "emotional story",
    ]),
  };
  const tiktok: PlatformCopy = {
    title: `এক মুহূর্তে থমকে যাবেন — ${safeTopic} দেখতে গিয়ে যে অনুভূতি হয়, সেটা বলে শেষ করা যায় না`,
    desc: `${safeTopic} নিয়ে এই শর্ট ভিডিওতে আমরা শুধু সেই মুহূর্তটা ধরেছি যা আসলেই গুরুত্বপূর্ণ। কোনো ক্লিকবেইট দাবি নেই, শুধু আসল কনটেক্সট।\n\nদ্রুত হুক, পরিষ্কার বিষয়বস্তু, আর দর্শকের সাথে সৎ কানেকশন — এভাবেই ভিডিওটি অ্যালগরিদম-ফ্রেন্ডলি রাখা হয়েছে।\n\nযদি এই টপিক আপনার মনে ধরে, ফলো করুন এবং কমেন্টে লিখুন আপনি কী দেখতে চান পরের ভিডিওতে।`,
    tags: "#TikTokBD #BanglaTikTok #Vlog #Trending",
    seo_keywords: buildSeoKeywords(safeTopic, [
      "tiktok",
      "bangla tiktok",
      "short video",
      "vlog",
      "bangladesh tiktok",
    ]),
  };
  const shorts: PlatformCopy = {
    title: `YouTube Shorts-এ ${safeTopic} দেখে অনেকেই থেমে যান — কারণ গল্পটা সহজ, কিন্তু অনুভূতিটা গভীর`,
    desc: `এই Shorts-এর বিষয় একদম স্পষ্ট: ${safeTopic}। আমরা দর্শককে বিভ্রান্ত করার জন্য বাড়তি ওয়াদা করি না; বরং প্রথম সেকেন্ড থেকেই টপিকের সাথে থাকি।\n\nসার্চ ও সাজেশন অ্যালগরিদমের জন্য কপি রাখা হয়েছে পরিষ্কার, আবেগপূর্ণ এবং প্রাসঙ্গিক। দ্বিতীয় অনুচ্ছেদে কেন ভিডিওটি দেখা দরকার, তৃতীয়ে কীভাবে এনগেজ করবেন — সেটাই ফোকাস।\n\nLike, comment এবং subscribe করে পাশে থাকুন। ${safeTopic} নিয়ে আপনার প্রশ্ন থাকলে কমেন্টে জানাবেন।`,
    tags: "#Shorts #YouTubeShorts #BanglaVlog #Bangladesh",
    seo_keywords: buildSeoKeywords(safeTopic, [
      "youtube shorts",
      "bangla shorts",
      "vlog",
      "bangla vlog",
      "village life",
    ]),
  };
  const bilibili: PlatformCopy = {
    title: `[Bilibili] ${safeTopic} — a sincere, emotional watch that stays 100% true to the real topic, no misleading claims`,
    desc: `This upload is about ${safeTopic}. The story is written to feel warm and human, while staying factually faithful to the title you provided.\n\nNothing here invents a sale, a miracle result, or a fact that is not in the topic. That honesty helps both recommendation systems and returning viewers.\n\nIf ${safeTopic} resonates with you, watch till the end, leave a comment, and follow for more contextual Bangla-culture storytelling on Bilibili.`,
    tags: "#Bilibili #BanglaVlog #Vlog #Bangladesh",
    seo_keywords: buildSeoKeywords(safeTopic, [
      "bilibili",
      "bangla vlog",
      "vlog",
      "village life",
      "bangladesh culture",
    ]),
  };

  return { facebook, tiktok, shorts, bilibili };
}

type StoredAccount = {
  fullName: string;
  whatsapp: string;
  passwordHash: string;
};

type AuthUser = {
  fullName: string;
  whatsapp: string;
};

const AUTH_STORE_KEY = "cca_auth_accounts";
const AUTH_SESSION_KEY = "cca_auth_session";

function normalizeWhatsApp(value: string) {
  return value.replace(/\s+/g, "").trim();
}

async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function loadAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(AUTH_STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts: StoredAccount[]) {
  localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(accounts));
}

function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.fullName || !parsed?.whatsapp) return null;
    return { fullName: parsed.fullName, whatsapp: parsed.whatsapp };
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser) {
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ fullName: user.fullName, whatsapp: user.whatsapp })
  );
}

function clearSession() {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}

type PricingPlan = {
  title: string;
  credits: string;
  price: string;
  tag: string;
};

const ADMIN_WHATSAPP = "8801624629533";

const MERCHANT_NUMBERS: Record<PaymentMethod, string> = {
  bkash: "Personal 01624629533",
  nagad: "Personal 01624629533",
  rocket: "Personal 016246295338",
};

const pricingPlans: PricingPlan[] = [
  { title: "Starter Kit", credits: "২০০", price: "১০০০", tag: "" },
  { title: "Growth Plan", credits: "৩০০", price: "১৫০০", tag: "" },
  { title: "Pro Creator", credits: "৫০০", price: "২৫০০", tag: "" },
  { title: "Business Elite", credits: "৬০০", price: "৩০০০", tag: "" },
  { title: "Mega Offer", credits: "১০০০", price: "৪০০০", tag: "ধামাকা ডিসকাউন্ট" },
];

export default function ContentCreatorAiApp() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [fullNameInput, setFullNameInput] = useState("");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [title, setTitle] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [size, setSize] = useState<AspectRatio>("16:9");
  const [loading, setLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<any>({});
  const [copiedField, setCopiedField] = useState("");
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("facebook");

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawText = useCallback(
    (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const bannerY = size === "16:9" ? 100 : 150;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px Arial';
      const displayTitle = aiOutput?.[activePlatform]?.thumb_text || "অবশেষে স্বপ্ন সত্যি হলো! 🔥";
      ctx.fillText(displayTitle, 80, size === '16:9' ? 162 : 212);
    },
    [size, title, aiOutput, activePlatform]
  );

  const drawThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size === "16:9" ? 1280 : 720;
    canvas.height = size === "16:9" ? 720 : 1280;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0a192f");
    gradient.addColorStop(1, "#020c1b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (image) {
      const img = new window.Image();
      img.src = image;
      img.onload = () => {
        if (size === "16:9") {
          ctx.drawImage(img, canvas.width / 2, 50, canvas.width / 2 - 50, canvas.height - 100);
        } else {
          ctx.drawImage(img, 50, canvas.height / 2 - 100, canvas.width - 100, canvas.height / 2);
        }
        drawText(ctx, canvas);
      };
      return;
    }

    drawText(ctx, canvas);
  }, [drawText, image, size]);

  useEffect(() => {
    drawThumbnail();
  }, [drawThumbnail]);

  useEffect(() => {
    const session = loadSession();
    if (session) setUser(session);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!user) {
      alert("দয়া করে কন্টেন্ট তৈরি করতে প্রথমে লগইন করুন!");
      setAuthMode("login");
      return;
    }
    if (!title) return alert("অনুগ্রহ করে একটি টাইটেল লিখুন!");
    setLoading(true);

    window.setTimeout(() => {
      void OPENAI_CONTENT_PROMPT;
      const kit = mapAiKitResponse(buildContextualKit(title));
      const missingSeo = PLATFORM_KEYS.filter((platform) => !kit[platform].seo_keywords);
      if (missingSeo.length > 0) {
        setLoading(false);
        alert("SEO tags missing for: " + missingSeo.join(", "));
        return;
      }
      setAiOutput(kit);
      setActivePlatform("facebook");
      setLoading(false);
    }, 1200);
  };

  const downloadThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const imageURI = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `content-creator-ai-thumbnail-${size.replace(":", "x")}.png`;
    link.href = imageURI;
    link.click();
  };

  const handleCopy = (text: string, fieldId: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    window.setTimeout(() => setCopiedField(""), 2000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsapp = normalizeWhatsApp(whatsappInput);
    const password = passwordInput.trim();

    if (!whatsapp || !password) {
      return alert("সবগুলো তথ্য সঠিকভাবে পূরণ করুন");
    }

    try {
      const passwordHash = await hashPassword(password);
      const accounts = loadAccounts();

      if (authMode === "register") {
        const fullName = fullNameInput.trim();
        if (!fullName) return alert("অনুগ্রহ করে আপনার পুরো নাম লিখুন");
        if (accounts.some((account) => account.whatsapp === whatsapp)) {
          return alert("এই WhatsApp নম্বরে ইতিমধ্যে একটি একাউন্ট আছে। লগইন করুন।");
        }

        const nextUser: AuthUser = { fullName, whatsapp };
        saveAccounts([...accounts, { ...nextUser, passwordHash }]);
        saveSession(nextUser);
        setUser(nextUser);
        setAuthMode(null);
        setFullNameInput("");
        setPasswordInput("");
        return;
      }

      const matched = accounts.find((account) => account.whatsapp === whatsapp);
      if (!matched || matched.passwordHash !== passwordHash) {
        return alert("WhatsApp নম্বর বা পাসওয়ার্ড সঠিক নয়।");
      }

      const nextUser: AuthUser = { fullName: matched.fullName, whatsapp: matched.whatsapp };
      saveSession(nextUser);
      setUser(nextUser);
      setAuthMode(null);
      setPasswordInput("");
    } catch {
      alert("অথেন্টিকেশন সম্পন্ন করা যায়নি। আবার চেষ্টা করুন।");
    }
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber || !transactionId) {
      return alert("পেমেন্ট ভেরিফিকেশনের জন্য নম্বর এবং ট্রানজেকশন আইডি দিন।");
    }

    const messageText =
      `আসসালামু আলাইকুম, আমি Content Creator Ai (contentcreatorai.online) থেকে একটি প্ল্যান অর্ডার করেছি। অনুগ্রহ করে আমার পেমেন্ট চেক করে অ্যাকাউন্টটি একটিভ করে দিন।\n\n` +
      `👤 ইউজার হোয়াটসঅ্যাপ নম্বর: ${user ? user.whatsapp : senderNumber}\n` +
      `📦 নির্বাচিত প্ল্যান: ${selectedPlan?.title} (৳${selectedPlan?.price})\n` +
      `💳 পেমেন্ট মেথড: ${paymentMethod.toUpperCase()}\n` +
      `📱 যে নম্বর থেকে টাকা পাঠিয়েছেন: ${senderNumber}\n` +
      `🔢 ট্রানজেকশন আইডি (TxnID): ${transactionId}\n\n` +
      `ধন্যবাদ!`;

    const encodedMessage = encodeURIComponent(messageText);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`, "_blank");

    setSelectedPlan(null);
    setSenderNumber("");
    setTransactionId("");
    alert(
      "আপনার পেমেন্টের অনুরোধটি পাঠানো হয়েছে! এডমিন পেমেন্ট চেক করে কিছুক্ষণের মধ্যে প্ল্যানটি একটিভ করে দিবে।"
    );
  };

  const closePaymentModal = () => {
    setSelectedPlan(null);
    setSenderNumber("");
    setTransactionId("");
  };

  return (
    <div className="min-h-screen bg-[#020c1b] text-slate-100 p-4 md:p-8 font-sans antialiased relative">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-[#10b981] flex items-center justify-center md:justify-start gap-2">
              <span className="bg-red-600 text-white px-2 py-1 text-xs rounded uppercase tracking-wider">
                SaaS v1.0
              </span>
              Content Creator Ai
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              অফিসিয়াল ডোমেন:{" "}
              <span className="text-amber-400 font-mono">contentcreatorai.online</span>
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3 bg-[#0a192f] border border-slate-700 px-4 py-2 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-300">
                  👤 {user.fullName || user.whatsapp}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs text-red-500 underline ml-2"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-lg transition text-[#10b981]"
                >
                  লগইন
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("register")}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#0f9f6e] text-[#020c1b] text-xs font-bold rounded-lg transition"
                >
                  রেজিস্ট্রেশন
                </button>
              </div>
            )}
          </div>
        </header>

        {user && (
          <div className="mb-8 rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-5 py-4 shadow-[0_0_28px_rgba(16,185,129,0.28)] ring-1 ring-emerald-400/20">
            <p className="text-center md:text-left text-sm md:text-base font-semibold text-emerald-400">
              👋 স্বাগতম, {user.fullName}! আপনার ক্রিয়েটিভ ওয়ার্কস্পেস এখন সম্পূর্ণ অ্যাক্টিভ।
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-5 bg-[#0a192f] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> কন্টেন্ট মেকার
              ইনপুট
            </h2>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                ১. আপনার ভিডিওর ছোট টাইটেল
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder=""
                className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                ২. আপনার ভিডিওর আকর্ষণীয় একটি ছবি দিন
              </label>
              <div className="border-2 border-dashed border-slate-700 hover:border-[#10b981] rounded-xl p-4 text-center cursor-pointer relative bg-[#020c1b]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <p className="text-sm text-slate-400">
                  {image ? "✅ ছবি আপলোড হয়েছে" : "ছবি এখানে ড্রপ করুন বা আপলোড করুন"}
                </p>
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">
                ৩. থাম্বনেইল অ্যাসপেক্ট রেশিও
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSize("16:9")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    size === "16:9"
                      ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                      : "border-slate-700 bg-[#020c1b] text-slate-400"
                  }`}
                >
                  🖥️ 16:9 Ratio
                </button>
                <button
                  type="button"
                  onClick={() => setSize("9:16")}
                  className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                    size === "9:16"
                      ? "border-red-500 bg-red-500/10 text-red-500"
                      : "border-slate-700 bg-[#020c1b] text-slate-400"
                  }`}
                >
                  📱 9:16 Ratio
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#10b981] hover:bg-[#0f9f6e] disabled:opacity-60 disabled:cursor-not-allowed text-[#020c1b] font-extrabold py-4 rounded-xl transition shadow-xl"
            >
              {loading ? "GENERATING..." : "GENERATE SOCIAL MARKETING KIT ⚡"}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#0a192f] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">🖼️ লাইভ থাম্বনেইল প্রিভিউ</h2>
                <button
                  type="button"
                  onClick={downloadThumbnail}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs uppercase tracking-wider"
                >
                  Download 📥
                </button>
              </div>
              <div className="flex justify-center bg-[#020c1b] p-3 rounded-lg border border-slate-800">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[280px] object-contain rounded"
                />
              </div>
            </div>

            {!aiOutput ? (
              <div className="bg-[#0a192f] p-12 rounded-2xl border border-slate-800 text-center text-slate-500 shadow-2xl">
                📥 ইনপুট দিয়ে উপরে বাটনে ক্লিক করলে ফলাফল এখানে লোড হবে।
              </div>
            ) : (
              <div className="bg-[#0a192f] p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
                <div className="flex border-b border-slate-800 overflow-x-auto pb-2 gap-2">
                  {(Object.keys(aiOutput) as PlatformKey[]).map((platform) => (
                    <button
                      type="button"
                      key={platform}
                      onClick={() => setActivePlatform(platform)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition uppercase ${
                        activePlatform === platform
                          ? "bg-[#10b981] text-[#020c1b]"
                          : "bg-[#020c1b] text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
                <div className="space-y-5">
                  <div className="bg-[#020c1b] p-4 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                      📦 বক্স ১: এসইও ফ্রেন্ডলি টাইটেল
                    </span>
                    <div className="flex items-start gap-3">
                      <div className="w-full text-sm font-semibold text-white leading-relaxed">
                      {aiOutput && aiOutput[activePlatform] ? aiOutput[activePlatform].title : ""}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(aiOutput[activePlatform]?.title, "title-copy")}
                        className="px-3 py-1.5 bg-[#10b981] text-[#020c1b] text-xs font-black rounded-lg shrink-0"
                      >
                        {copiedField === "title-copy" ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#020c1b] p-4 rounded-xl border border-slate-800 space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                      📝 বক্স ২: ডেসক্রিপশন এবং ৪টি হ্যাশট্যাগ
                    </span>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed border-b border-slate-800 pb-3">
                    {aiOutput && aiOutput[activePlatform] ? aiOutput[activePlatform].desc : ""}
                    </p>
                    <p className="text-[#10b981] font-mono text-xs font-bold">
                    {aiOutput && aiOutput[activePlatform] ? aiOutput[activePlatform].tags : ""}
                    </p>
                    <div className="rounded-lg border border-slate-800 bg-[#0a192f] p-3 space-y-2">
                      <span className="text-[11px] font-bold text-amber-400 tracking-wide block">
                        SEO Tags (ট্যাগসমূহ)
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed">
                      {aiOutput && aiOutput[activePlatform] ? aiOutput[activePlatform].seo_keywords : ""}
                      </p>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(aiOutput[activePlatform]?.seo_keywords, "seo-copy")
                          }
                          className="px-3 py-1.5 bg-amber-500 text-[#020c1b] text-xs font-black rounded-lg"
                        >
                          {copiedField === "seo-copy" ? "✓ Copied" : "Copy Tags"}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `${aiOutput[activePlatform]?.desc}\n\n${aiOutput[activePlatform]?.tags}\n\n${aiOutput[activePlatform]?.seo_keywords}`,
                            "desc-copy"
                          )
                        }
                        className="px-4 py-1.5 bg-slate-800 text-[#10b981] text-xs font-black rounded-lg"
                      >
                        {copiedField === "desc-copy" ? "✓ Copied" : "Copy All"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="border-t border-slate-800 pt-12 mb-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-wide">
              💼 আমাদের মাসিক সাবস্ক্রিপশন প্ল্যানসমূহ
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.title}
                className={`bg-[#0a192f] rounded-2xl p-5 border text-center flex flex-col justify-between transition relative shadow-xl ${
                  plan.tag ? "border-red-500 ring-2 ring-red-500/50" : "border-slate-800"
                }`}
              >
                {plan.tag && (
                  <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-red-600 text-white font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
                    {plan.tag}
                  </span>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-1">
                    {plan.title}
                  </h3>
                  <div className="text-2xl font-black text-white my-3">
                    ৳{plan.price}
                    <span className="text-xs font-normal text-slate-400">/মাস</span>
                  </div>
                  <p className="text-xs text-[#10b981] font-bold mb-4">
                    ✅ {plan.credits}টি কন্টেন্ট মেকিং কিট
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      alert("প্ল্যান বুক করতে প্রথমে লগইন করুন!");
                      setAuthMode("login");
                    } else {
                      setSelectedPlan(plan);
                    }
                  }}
                  className="w-full mt-4 py-2 bg-[#020c1b] border border-slate-700 text-[#10b981] hover:bg-slate-800 text-xs font-extrabold rounded-xl transition"
                >
                  BUY PLAN 🚀
                </button>
              </div>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-800 pt-6 pb-2 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Content Creator Ai · contentcreatorai.online
        </footer>
      </div>

      {authMode && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50">
          <div className="bg-[#0a192f] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-white uppercase">
                {authMode === "login" ? "👤 এক্কাউন্ট লগইন" : "📝 নতুন রেজিস্ট্রেশন"}
              </h3>
              <button
                type="button"
                onClick={() => setAuthMode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <div>
                  <label
                    htmlFor="register-full-name"
                    className="block text-xs tracking-wider text-slate-400 font-semibold mb-2"
                  >
                    আপনার পুরো নাম
                  </label>
                  <input
                    id="register-full-name"
                    name="fullName"
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder=""
                    required
                    autoComplete="name"
                    className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
                  />
                </div>
              )}
              <div>
                <label
                  htmlFor="auth-whatsapp"
                  className="block text-xs tracking-wider text-slate-400 font-semibold mb-2"
                >
                  {authMode === "register" ? "আপনার WhatsApp নম্বর দিন" : "WhatsApp নম্বর"}
                </label>
                <input
                  id="auth-whatsapp"
                  name="whatsapp"
                  type="tel"
                  value={whatsappInput}
                  onChange={(e) => setWhatsappInput(e.target.value)}
                  placeholder=""
                  required
                  autoComplete="tel"
                  className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
                />
              </div>
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs tracking-wider text-slate-400 font-semibold mb-2"
                >
                  {authMode === "register" ? "পাসওয়ার্ড সেট করুন" : "পাসওয়ার্ড"}
                </label>
                <input
                  id="auth-password"
                  name="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder=""
                  required
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#0f9f6e] text-[#020c1b] font-extrabold py-3 rounded-xl transition"
              >
                {authMode === "login" ? "লগইন করুন" : "রেজিস্টার করুন"}
              </button>
              <p className="text-center text-xs text-slate-500">
                {authMode === "login" ? "নতুন ইউজার?" : "আগে থেকে একাউন্ট আছে?"}{" "}
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-[#10b981] font-semibold underline"
                >
                  {authMode === "login" ? "রেজিস্ট্রেশন করুন" : "লগইন করুন"}
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center p-4 z-50">
          <div className="bg-[#0a192f] border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-md font-bold text-white uppercase">💳 পেমেন্ট ভেরিফিকেশন</h3>
              <button
                type="button"
                onClick={closePaymentModal}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="bg-[#020c1b] border border-slate-800 rounded-xl p-4 text-sm">
              <p className="text-slate-400">নির্বাচিত প্ল্যান</p>
              <p className="text-white font-bold">
                {selectedPlan.title} · ৳{selectedPlan.price}/মাস
              </p>
              <p className="text-[#10b981] text-xs mt-1">{selectedPlan.credits}টি কন্টেন্ট কিট</p>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  পেমেন্ট মেথড
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["bkash", "nagad", "rocket"] as PaymentMethod[]).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-lg border text-xs font-bold uppercase transition ${
                        paymentMethod === method
                          ? "border-[#10b981] bg-[#10b981]/10 text-[#10b981]"
                          : "border-slate-700 bg-[#020c1b] text-slate-400"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#020c1b] border border-dashed border-amber-500/40 rounded-xl p-3 text-center">
                <p className="text-[11px] uppercase tracking-widest text-slate-400">মার্চেন্ট নম্বর</p>
                <p className="text-lg font-black text-amber-400 tracking-wide">
                  {MERCHANT_NUMBERS[paymentMethod]}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  এই নম্বরে Send Money করে TxnID দিন
                </p>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  যে নম্বর থেকে টাকা পাঠিয়েছেন
                </label>
                <input
                  type="tel"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  ট্রানজেকশন আইডি (TxnID)
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="TxnID"
                  className="w-full p-3 bg-[#020c1b] rounded-xl text-white border border-slate-700 focus:outline-none focus:border-[#10b981] transition"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#10b981] hover:bg-[#0f9f6e] text-[#020c1b] font-extrabold py-3 rounded-xl transition"
              >
                হোয়াটসঅ্যাপে পেমেন্ট পাঠান
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
