import React from "react";
import {
  Box,
  Typography,
  Chip,
  Badge,
  Tooltip,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { DataType, BadgeData } from "@/types/HeatmapTypes";

interface DataTypeSelectorProps {
  dataTypes: DataType[];
  selectedDataTypes: string[];
  badgeData: BadgeData[];
  onDataTypeChange: (dataType: string) => void;
  onClearAll: () => void;
}

export const DataTypeSelector: React.FC<DataTypeSelectorProps> = ({
  dataTypes,
  selectedDataTypes,
  badgeData,
  onDataTypeChange,
  onClearAll,
}) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      マップ上に表示するデータ:
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          paddingY: 1,
          paddingX: 1,
          border: "1px solid #f0f0f0",
          borderRadius: 1,
          backgroundColor: "#f8f8f8",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
          flex: 1,
          minHeight: "60px",
        }}
      >
        {dataTypes.map((dataType) => {
          const isSelected = selectedDataTypes.includes(dataType.key);
          const count = badgeData.filter(
            (badge) => badge.type === dataType.key
          ).length;

          return (
            <Tooltip
              key={dataType.key}
              title={`${dataType.label} (${count}件)`}
            >
              <Chip
                icon={dataType.icon as React.ReactElement}
                label={
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <span>{dataType.label}</span>
                    <Badge
                      badgeContent={count}
                      color="secondary"
                      sx={{
                        "& .MuiBadge-badge": {
                          position: "static",
                          transform: "none",
                          fontSize: "10px",
                          minWidth: "16px",
                          height: "16px",
                          borderRadius: "8px",
                        },
                      }}
                    >
                      <Box sx={{ width: 0 }} />
                    </Badge>
                  </Box>
                }
                onClick={() => onDataTypeChange(dataType.key)}
                color={isSelected ? "primary" : "default"}
                variant={isSelected ? "filled" : "outlined"}
                sx={{
                  flexShrink: 0,
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.1)",
                  "& .MuiChip-icon": {
                    color: isSelected ? "white" : dataType.color,
                  },
                  "& .MuiChip-label": {
                    paddingLeft: "8px",
                    paddingRight: "12px",
                    overflow: "visible",
                  },
                  border: `2px solid ${dataType.color}`,
                  borderColor: dataType.color,
                  backgroundColor: isSelected
                    ? dataType.color
                    : "transparent",
                  color: isSelected ? "white" : "inherit",
                  "&:hover": {
                    backgroundColor: isSelected
                      ? dataType.color
                      : `${dataType.color}20`,
                    boxShadow:
                      "0 3px 6px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)",
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <IconButton
        size="small"
        onClick={onClearAll}
        sx={{
          ml: 1,
          color:
            selectedDataTypes.length > 0
              ? "text.secondary"
              : "text.disabled",
          border: "1px solid",
          "&:hover": {
            color:
              selectedDataTypes.length > 0
                ? "error.main"
                : "text.secondary",
            backgroundColor:
              selectedDataTypes.length > 0
                ? "error.light"
                : "action.hover",
          },
        }}
        aria-label="すべてクリア"
        title="すべてクリア"
        disabled={selectedDataTypes.length === 0}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  </Box>
); 