import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import type {
  FireDepartmentData,
  ColorMappingType,
} from "@/types/HeatmapTypes";
import {
  emergencyCallsTimeSeriesData,
  populationDensityTimeSeriesData,
} from "@/data/colorMappingData";
import { getDiscreteStops } from "@/utils/heatmapUtils";

interface LegendComponentProps {
  asahiFireDepartmentData: FireDepartmentData;
  selectedColorMapping?: ColorMappingType;
  selectedDate?: Date;
  colorSteps?: number; // ヒートマップ段階数（可変）
}

export const LegendComponent: React.FC<LegendComponentProps> = ({
  asahiFireDepartmentData,
  selectedColorMapping = "fireDepartment",
  selectedDate = new Date(),
  colorSteps = 5,
}) => {
  const getLegendContent = () => {
    if (selectedColorMapping === "fireDepartment") {
      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            管轄消防署
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: asahiFireDepartmentData.mainStation.color,
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption">
                {asahiFireDepartmentData.mainStation.name}
              </Typography>
            </Box>
            {asahiFireDepartmentData.branches.map((branch) => (
              <Box
                key={branch.name}
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: branch.color,
                    borderRadius: 1,
                  }}
                />
                <Typography variant="caption">{branch.name}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      );
    } else if (
      selectedColorMapping === "emergencyCalls" ||
      selectedColorMapping === "populationDensity"
    ) {
      const year = selectedDate.getFullYear();

      // 選択年の全エリアの値を収集
      const dataset =
        selectedColorMapping === "emergencyCalls"
          ? emergencyCallsTimeSeriesData
          : populationDensityTimeSeriesData;
      const values: number[] = [];
      Object.values(dataset).forEach((areaData) => {
        const v = areaData[year];
        if (typeof v === "number") values.push(v);
      });

      if (values.length === 0) return null;

      const min = Math.min(...values);
      const max = Math.max(...values);

      // 中央集約したカラー管理を使用して段階を生成
      const stops = getDiscreteStops(min, max, colorSteps, "red");

      const unit = selectedColorMapping === "emergencyCalls" ? "件" : "人";
      const title =
        selectedColorMapping === "emergencyCalls"
          ? "救急出場件数"
          : "人口密度 (人/km²)";

      // 凡例は高い方から下に向かって表示
      const entries = stops.map((s, i) => ({ ...s, index: i })).reverse();

      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            {title}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {entries.map(({ color, from, to, index }, idx) => {
              // ラベル: 中間帯は "from以上to未満"、最上位のみ "from以上"
              const label =
                entries.length - 1 === idx
                  ? `${Math.round(to as number)} ${unit}未満`
                  : `${Math.round(from)} ${unit}以上`;
              return (
                <Box
                  key={`${index}-${idx}`}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Box
                    sx={{
                      width: 16,
                      height: 16,
                      backgroundColor: color,
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ textAlign: "right", flex: 1 }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    }

    return null;
  };

  return (
    <Paper
      sx={{
        position: "absolute",
        bottom: 20,
        right: 10,
        zIndex: 1000,
        p: 1.5,
        maxWidth: 200,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(10px)",
        boxShadow: 2,
      }}
    >
      {getLegendContent()}
    </Paper>
  );
};
