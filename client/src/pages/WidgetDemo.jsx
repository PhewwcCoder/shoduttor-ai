// WidgetDemo — hosts the React ChatWidget for local testing.
// Tabs let you switch between branded demos (Grameenphone / Pathao).
import { useState } from "react";
import ChatWidget from "../components/ChatWidget";

// Each demo is just a different config passed to the same widget — proving the
// product is business-agnostic (telecom vs. ride-share/food delivery).
const DEMOS = {
  grameenphone: {
    label: "Grameenphone Demo",
    businessId: "grameenphone",
    primaryColor: "#00A550",
    greeting: "Apnar ki help lagbe?",
    example: "amar net cholche na",
  },
  pathao: {
    label: "Pathao Demo",
    businessId: "pathao",
    primaryColor: "#E2136E",
    greeting: "Ki help lagbe apnar?",
    example: "amar order ta kobe ashbe",
  },
};

export default function WidgetDemo() {
  const [active, setActive] = useState("grameenphone"); // GP is the default
  const demo = DEMOS[active];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Shoduttor.ai — Widget Demo</h1>
        <p className="mt-3 text-gray-600">
          One widget for every customer. It understands messages in <strong>Banglish, Bengali,
          and English</strong> alike, and answers from whatever FAQ a business uploads — telecom,
          retail, banking, food delivery, anything. Banglish is our edge, not our limit.
        </p>

        {/* Demo switcher */}
        <div className="mt-6 inline-flex rounded-full border border-gray-200 bg-white p-1 shadow-sm">
          {Object.entries(DEMOS).map(([key, d]) => (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === key ? "text-white" : "text-gray-600 hover:text-gray-900"
              }`}
              style={active === key ? { background: d.primaryColor } : undefined}
            >
              {d.label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-gray-600">
          Click the bubble in the bottom-right and try{" "}
          <span className="font-mono">{demo.example}</span>{" "}
          or <span className="font-mono">what is your refund policy?</span>
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Now showing the <strong style={{ color: demo.primaryColor }}>{demo.label}</strong> ·
          business ID <span className="font-mono">{demo.businessId}</span>.
          (Standalone embeddable version: <span className="font-mono">/widget.js</span>.)
        </p>
      </div>

      {/* key=active remounts the widget so it picks up the new greeting + color cleanly */}
      <ChatWidget
        key={active}
        businessId={demo.businessId}
        primaryColor={demo.primaryColor}
        greeting={demo.greeting}
      />
    </div>
  );
}
