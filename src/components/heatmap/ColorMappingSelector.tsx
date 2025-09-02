import React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import type { ColorMappingType, ColorMappingOption } from "@/types/HeatmapTypes";

interface ColorMappingSelectorProps {
  colorMappingOptions: ColorMappingOption[];
  selectedColorMapping: ColorMappingType;
  onColorMappingChange: (colorMapping: ColorMappingType) => void;
}

export const ColorMappingSelector: React.FC<ColorMappingSelectorProps> = ({
  colorMappingOptions,
  selectedColorMapping,
  onColorMappingChange,
}) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
    <FormControl sx={{ width: "100%" }}>
      <InputLabel id="color-mapping-select-label">ヒートマップの種類</InputLabel>
      <Select
        labelId="color-mapping-select-label"
        id="color-mapping-select"
        value={selectedColorMapping}
        label="ヒートマップの種類"
        onChange={(e) => onColorMappingChange(e.target.value as ColorMappingType)}
      >
        {colorMappingOptions.map((option) => (
          <MenuItem key={option.key} value={option.key}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Box>
); 