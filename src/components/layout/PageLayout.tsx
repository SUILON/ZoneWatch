import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Sidebar from "@/components/layout/sidebar";
import { useLocation } from "react-router-dom";

interface PageLayoutProps {
  children: React.ReactNode;
}

// 静的なスタイルオブジェクトを定義
const containerStyle = {
  display: "flex",
  height: "100vh",
};

const mainStyle = {
  flexGrow: 1,
  boxSizing: "border-box",
  position: "relative" as const,
  overflow: "auto",
  height: "100vh",
};

const progressStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1200,
};

function PageLayout({ children }: PageLayoutProps) {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Box sx={containerStyle}>
      <Sidebar />
      <Box component="main" sx={mainStyle}>
        {isLoading && <LinearProgress sx={progressStyle} />}
        {children}
      </Box>
    </Box>
  );
}

export default PageLayout;
