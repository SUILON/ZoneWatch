import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import { Link, useLocation, useNavigate } from "react-router-dom";

import HomeIcon from "@mui/icons-material/Home";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SettingsIcon from "@mui/icons-material/Settings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

export const drawerWidth = 300;
export const miniDrawerWidth = 72;

// 静的なスタイルオブジェクトを外部に定義
const getBaseItemStyle = (isMinimized: boolean) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  textDecoration: "none",
  color: "inherit",
  borderRadius: "8px",
  transition: "background-color 0.2s ease",
  padding: "8px 12px",
  userSelect: "none" as const,
  justifyContent: isMinimized ? "center" : "flex-start",
  overflow: "hidden",
  height: "48px",
  whiteSpace: "nowrap",
});

const getListItemStyle = (isMinimized: boolean) => ({
  padding: 0,
  paddingLeft: isMinimized ? "8px" : "16px",
  paddingRight: isMinimized ? "8px" : "16px",
  overflow: "hidden",
});

const getDrawerStyle = (isMinimized: boolean) => ({
  width: isMinimized ? miniDrawerWidth : drawerWidth,
  flexShrink: 0,
  userSelect: "none" as const,
  transition: "width 0.3s ease",
  transitionDelay: isMinimized ? "0.1s" : "0s",
  "& .MuiDrawer-paper": {
    width: isMinimized ? miniDrawerWidth : drawerWidth,
    boxSizing: "border-box",
    userSelect: "none" as const,
    transition: "width 0.3s ease",
    transitionDelay: isMinimized ? "0.1s" : "0s",
    overflowX: "hidden",
  },
});

const getLogoContainerStyle = () => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  p: 2,
  height: "60px",
  overflow: "hidden",
  position: "relative",
});

const getLogoWrapperStyle = (isMinimized: boolean) => ({
  display: isMinimized ? "none" : "block",
});

const getToggleButtonStyle = (isMinimized: boolean) => ({
  position: "absolute" as const,
  top: "50%",
  right: isMinimized ? "50%" : 8,
  transform: isMinimized ? "translate(50%, -50%)" : "translateY(-50%)",
  zIndex: 1,
});

const listStyle = {
  flexGrow: 1,
};

const getListItemIconStyle = (isMinimized: boolean) => ({
  minWidth: isMinimized ? 0 : 56,
  transition: "min-width 0.3s ease",
  transitionDelay: isMinimized ? "0s" : "0.1s",
});

const getListItemTextStyle = (isMinimized: boolean) => ({
  opacity: isMinimized ? 0 : 1,
  transition: "opacity 0.1s ease",
  transitionDelay: isMinimized ? "0s" : "0.2s",
});

const settingListStyle = {
  borderTop: "1px solid #e0e0e0",
};

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  // localStorageから初期状態を取得
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sidebar-minimized");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // メモ化された関数でパフォーマンスを改善
  const getItemStyle = useMemo(() => {
    return (path: string) => ({
      ...getBaseItemStyle(isMinimized),
      backgroundColor: location.pathname === path ? "#e3f2fd" : "transparent",
      "&:hover": {
        backgroundColor: location.pathname === path ? "#e3f2fd" : "#f5f5f5",
      },
    });
  }, [location.pathname, isMinimized]);

  const handleNavigation = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const toggleMinimize = () => {
    const newMinimizedState = !isMinimized;
    setIsMinimized(newMinimizedState);

    // localStorageに状態を保存
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "sidebar-minimized",
        JSON.stringify(newMinimizedState)
      );
    }
  };

  return (
    <Drawer variant="permanent" sx={getDrawerStyle(isMinimized)}>
      {/* ロゴエリア */}
      <Box sx={getLogoContainerStyle()}>
        {/* 最小化切り替えボタン */}
        <IconButton
          onClick={toggleMinimize}
          sx={getToggleButtonStyle(isMinimized)}
          size="small"
        >
          {isMinimized ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>

        {/* ロゴ */}
        <Box sx={getLogoWrapperStyle(isMinimized)}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              display: "block",
              userSelect: "none",
            }}
            onClick={(e) => handleNavigation(e, "/")}
          >
            <img
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              style={{
                borderRadius: "8px",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
                userSelect: "none",
              }}
            />
          </Link>
        </Box>
      </Box>

      {/* メインメニュー */}
      <List sx={listStyle}>
        <ListItem key="Home" sx={getListItemStyle(isMinimized)}>
          <Link
            to="/"
            style={getItemStyle("/")}
            onClick={(e) => handleNavigation(e, "/")}
            title={isMinimized ? "ホーム" : ""}
          >
            <ListItemIcon sx={getListItemIconStyle(isMinimized)}>
              <HomeIcon />
            </ListItemIcon>
            {!isMinimized && (
              <ListItemText
                primary="ホーム"
                sx={getListItemTextStyle(isMinimized)}
              />
            )}
          </Link>
        </ListItem>
        <ListItem key="Admin" sx={getListItemStyle(isMinimized)}>
          <Link
            to="/admin"
            style={getItemStyle("/admin")}
            onClick={(e) => handleNavigation(e, "/admin")}
            title={isMinimized ? "管理ページ" : ""}
          >
            <ListItemIcon sx={getListItemIconStyle(isMinimized)}>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            {!isMinimized && (
              <ListItemText
                primary="管理ページ"
                sx={getListItemTextStyle(isMinimized)}
              />
            )}
          </Link>
        </ListItem>
      </List>

      {/* Settingを一番下に配置 */}
      <List sx={settingListStyle}>
        <ListItem key="Setting" sx={getListItemStyle(isMinimized)}>
          <Link
            to="/setting"
            style={getItemStyle("/setting")}
            onClick={(e) => handleNavigation(e, "/setting")}
            title={isMinimized ? "設定" : ""}
          >
            <ListItemIcon sx={getListItemIconStyle(isMinimized)}>
              <SettingsIcon />
            </ListItemIcon>
            {!isMinimized && (
              <ListItemText
                primary="設定"
                sx={getListItemTextStyle(isMinimized)}
              />
            )}
          </Link>
        </ListItem>
      </List>
    </Drawer>
  );
}
