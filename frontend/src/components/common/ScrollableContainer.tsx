import React from "react";
import { Box } from "@mui/material";
import type { BoxProps } from "@mui/material";

interface ScrollableContainerProps extends Omit<BoxProps, "sx"> {
  children: React.ReactNode;
  additionalSx?: BoxProps["sx"];
}

const ScrollableContainer: React.FC<ScrollableContainerProps> = ({
  children,
  additionalSx,
  ...boxProps
}) => {
  return (
    <Box
      sx={{
        height: "100%", // パーセンテージベースの高さ
        overflow: "auto",
        // カスタムスクロールバー
        "&::-webkit-scrollbar": {
          width: "8px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "rgba(0, 0, 0, 0.05)",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "rgba(0, 0, 0, 0.2)",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          },
        },
        ...additionalSx,
      }}
      {...boxProps}
    >
      {children}
    </Box>
  );
};

export default ScrollableContainer;
