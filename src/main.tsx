import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@/globals.css";
import Home from "@/pages/Home.tsx";
import Admin from "@/pages/Admin.tsx";
import Setting from "@/pages/Setting.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/setting" element={<Setting />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
