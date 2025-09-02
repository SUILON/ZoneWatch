import React from "react";
import { Box, Typography, Paper, Chip, Divider } from "@mui/material";
import type {
  FireDepartmentData,
  DataType,
  BadgeData,
  ColorMappingType,
} from "@/types/HeatmapTypes";
import {
  emergencyCallsData,
  populationDensityData,
  emergencyCallsTimeSeriesData,
  populationDensityTimeSeriesData,
} from "@/data/colorMappingData";

interface LegendComponentProps {
  asahiFireDepartmentData: FireDepartmentData;
  dataTypes: DataType[];
  selectedDataTypes: string[];
  badgeData: BadgeData[];
  selectedColorMapping?: ColorMappingType;
  selectedDate?: Date;
}

export const LegendComponent: React.FC<LegendComponentProps> = ({
  asahiFireDepartmentData,
  dataTypes,
  selectedDataTypes,
  badgeData,
  selectedColorMapping = "fireDepartment",
  selectedDate = new Date(),
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
    } else if (selectedColorMapping === "emergencyCalls") {
      const year = selectedDate.getFullYear();
      const yearData = emergencyCallsTimeSeriesData;

      // その年の全データから最大・最小を取得
      const allYearValues: number[] = [];
      Object.values(yearData).forEach((areaData) => {
        if (areaData[year] !== undefined) {
          allYearValues.push(areaData[year]);
        }
      });

      const maxCalls =
        allYearValues.length > 0
          ? Math.max(...allYearValues)
          : Math.max(...Object.values(emergencyCallsData));
      const minCalls =
        allYearValues.length > 0
          ? Math.min(...allYearValues)
          : Math.min(...Object.values(emergencyCallsData));
      const midCalls = Math.round((maxCalls + minCalls) / 2);

      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            救急出場件数
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(220, 53, 69)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxCalls * 0.8)}件以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(255, 108, 0)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxCalls * 0.6)}件以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(255, 193, 7)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxCalls * 0.4)}件以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(40, 167, 69)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxCalls * 0.2)}件以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(0, 123, 255)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxCalls * 0.2)}件未満
              </Typography>
            </Box>
          </Box>
        </Box>
      );
    } else if (selectedColorMapping === "populationDensity") {
      const year = selectedDate.getFullYear();
      const yearData = populationDensityTimeSeriesData;

      // その年の全データから最大・最小を取得
      const allYearValues: number[] = [];
      Object.values(yearData).forEach((areaData) => {
        if (areaData[year] !== undefined) {
          allYearValues.push(areaData[year]);
        }
      });

      const maxDensity =
        allYearValues.length > 0
          ? Math.max(...allYearValues)
          : Math.max(...Object.values(populationDensityData));
      const minDensity =
        allYearValues.length > 0
          ? Math.min(...allYearValues)
          : Math.min(...Object.values(populationDensityData));
      const midDensity = Math.round((maxDensity + minDensity) / 2);

      return (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
            人口密度 (人/km²)
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(220, 53, 69)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxDensity * 0.8)}人以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(255, 108, 0)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxDensity * 0.6)}人以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(255, 193, 7)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxDensity * 0.4)}人以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(40, 167, 69)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxDensity * 0.2)}人以上
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Box
                sx={{
                  width: 16,
                  height: 16,
                  backgroundColor: "rgb(0, 123, 255)",
                  borderRadius: 1,
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="caption"
                sx={{ textAlign: "right", flex: 1 }}
              >
                {Math.round(maxDensity * 0.2)}人未満
              </Typography>
            </Box>
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

      {selectedDataTypes.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: "bold" }}>
              表示中のマーカー
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {selectedDataTypes.map((type) => {
                const dataType = dataTypes.find((dt) => dt.key === type);
                const count = badgeData.filter(
                  (badge) => badge.type === type
                ).length;
                return (
                  <Chip
                    key={type}
                    label={`${dataType?.label || type} (${count})`}
                    size="small"
                    sx={{
                      backgroundColor: dataType?.color || "#ccc",
                      color: "white",
                      fontSize: "0.7rem",
                    }}
                  />
                );
              })}
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};
