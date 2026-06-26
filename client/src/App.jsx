import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import WidgetDemo from "./pages/WidgetDemo.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/demo" element={<WidgetDemo />} />
      {/* Landing, /docs and /gp-demo are added in later phases. */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
