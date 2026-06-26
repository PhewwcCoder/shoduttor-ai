// WidgetDemo — a simple page that hosts the React ChatWidget for local testing.
import ChatWidget from "../components/ChatWidget";

export default function WidgetDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Shoduttor.ai — Widget Demo</h1>
        <p className="mt-3 text-gray-600">
          One widget for every customer. It understands messages in <strong>Banglish, Bengali,
          and English</strong> alike, and answers from whatever FAQ a business uploads — telecom,
          retail, banking, food delivery, anything. Banglish is our edge, not our limit.
        </p>
        <p className="mt-2 text-gray-600">
          Click the bubble in the bottom-right and try <span className="font-mono">amar net cholche na</span>{" "}
          or <span className="font-mono">what is your refund policy?</span>
        </p>
        <p className="mt-2 text-sm text-gray-400">
          (The standalone embeddable Shadow-DOM version is served at <span className="font-mono">/widget.js</span>.)
        </p>
      </div>
      <ChatWidget businessId="grameenphone" primaryColor="#00A550" greeting="Apnar ki help lagbe?" />
    </div>
  );
}
