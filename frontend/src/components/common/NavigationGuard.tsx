import React, { createContext, useContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

interface NavigationGuardContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  guardedNavigate: (url: string) => void;
}

const NavigationGuardContext = createContext<
  NavigationGuardContextType | undefined
>(undefined);

export const useNavigationGuard = () => {
  const context = useContext(NavigationGuardContext);
  if (context === undefined) {
    throw new Error(
      "useNavigationGuard must be used within a NavigationGuardProvider"
    );
  }
  return context;
};

interface NavigationGuardProviderProps {
  children: ReactNode;
}

export const NavigationGuardProvider: React.FC<
  NavigationGuardProviderProps
> = ({ children }) => {
  const navigate = useNavigate();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  const guardedNavigate = useCallback(
    (url: string) => {
      if (hasUnsavedChanges) {
        setShowConfirmDialog(true);
        setPendingNavigation(url);
      } else {
        navigate(url);
      }
    },
    [hasUnsavedChanges, navigate]
  );

  const handleConfirmNavigation = () => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      setHasUnsavedChanges(false); // 遷移前に未保存状態をクリア
      navigate(pendingNavigation);
    }
    setPendingNavigation(null);
  };

  const handleCancelNavigation = () => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  };

  const value = {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    guardedNavigate,
  };

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}

      {/* 確認ダイアログ */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelNavigation}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          ページを離れますか？
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            アップロードされていないファイルがあります。このページを離れると、選択されたファイルは失われます。
            それでもページを離れますか？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNavigation} color="primary">
            キャンセル
          </Button>
          <Button onClick={handleConfirmNavigation} color="primary" autoFocus>
            離れる
          </Button>
        </DialogActions>
      </Dialog>
    </NavigationGuardContext.Provider>
  );
};
