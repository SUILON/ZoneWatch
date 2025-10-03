import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@/globals.css";
import Config from "@/config";
import Home from "@/pages/Home.tsx";
import Admin from "@/pages/Admin.tsx";
import Setting from "@/pages/Setting.tsx";
import Upload from "./pages/Upload";

// 設定情報をログ出力（開発環境のみ）
Config.logConfig();

// アプリケーションタイトルを設定
document.title = Config.APP_TITLE;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/setting" element={<Setting />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
