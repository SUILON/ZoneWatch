import { asahiFireDepartmentData } from "@/data/fireDepartmentData";
import {
  emergencyCallsData,
  populationDensityData,
  emergencyCallsTimeSeriesData,
  populationDensityTimeSeriesData,
} from "@/data/colorMappingData";
import { divIcon } from "leaflet";

import type { BadgeData, ColorMappingType } from "@/types/HeatmapTypes";

// 日付を数値に変換する関数
export const dateToValue = (date: Date): number => {
  return date.getTime();
};

// 数値を日付に変換する関数
export const valueToDate = (value: number): Date => {
  return new Date(value);
};

// 日付が予測期間かどうかを判定する関数
export const isPredictionPeriod = (date: Date): boolean => {
  const predictionStartDate = new Date(2024, 11, 31);
  return date > predictionStartDate;
};

// 日付フォーマット関数
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

// 町名から管轄消防署を特定する関数
export const getDepartmentForArea = (areaName: string): string => {
  // まず完全一致を試す
  if (asahiFireDepartmentData.mainStation.areas.includes(areaName)) {
    return asahiFireDepartmentData.mainStation.name;
  }

  for (const branch of asahiFireDepartmentData.branches) {
    if (branch.areas.includes(areaName)) {
      return branch.name;
    }
  }

  // 完全一致しない場合、町名の正規化（丁目情報を除去）を試す
  const normalizedAreaName = areaName.replace(
    /[一二三四五六七八九十]丁目$/,
    ""
  );

  // 旭消防署本署の管轄をチェック
  if (asahiFireDepartmentData.mainStation.areas.includes(normalizedAreaName)) {
    return asahiFireDepartmentData.mainStation.name;
  }

  // 各出張所の管轄をチェック
  for (const branch of asahiFireDepartmentData.branches) {
    if (branch.areas.includes(normalizedAreaName)) {
      return branch.name;
    }
  }

  return "不明";
};

// 町名から管轄消防署の色を取得する関数
export const getColorForArea = (
  areaName: string,
  selectedDepartment?: string
): string => {
  let baseColor = "#CCCCCC"; // デフォルト色

  // まず完全一致を試す
  if (asahiFireDepartmentData.mainStation.areas.includes(areaName)) {
    baseColor = asahiFireDepartmentData.mainStation.color;
  } else {
    // 各出張所の管轄をチェック
    for (const branch of asahiFireDepartmentData.branches) {
      if (branch.areas.includes(areaName)) {
        baseColor = branch.color;
        break;
      }
    }
  }

  // 完全一致しない場合、町名の正規化を試す
  if (baseColor === "#CCCCCC") {
    const normalizedAreaName = areaName.replace(
      /[一二三四五六七八九十]丁目$/,
      ""
    );

    // 旭消防署本署の管轄をチェック
    if (
      asahiFireDepartmentData.mainStation.areas.includes(normalizedAreaName)
    ) {
      baseColor = asahiFireDepartmentData.mainStation.color;
    } else {
      // 各出張所の管轄をチェック
      for (const branch of asahiFireDepartmentData.branches) {
        if (branch.areas.includes(normalizedAreaName)) {
          baseColor = branch.color;
          break;
        }
      }
    }
  }

  // 選択された管轄が指定されている場合、選択されていない管轄の色を薄くする
  if (selectedDepartment && selectedDepartment !== "all") {
    const department = getDepartmentForArea(areaName);
    const isSelected =
      (selectedDepartment === "main" &&
        department === asahiFireDepartmentData.mainStation.name) ||
      (selectedDepartment !== "main" && department === selectedDepartment);

    if (!isSelected) {
      // 選択されていない管轄の色を薄くする（透明度を下げる）
      return baseColor + "80"; // 80は透明度（16進数で50%）
    }
  }

  return baseColor;
};

// 数値に基づいて色を生成する関数
export const getColorByValue = (
  value: number,
  minValue: number,
  maxValue: number,
  colorScheme: string = "red"
): string => {
  const normalizedValue = (value - minValue) / (maxValue - minValue);

  if (colorScheme === "red") {
    // 一般的なヒートマップの5段階色分け（青→緑→黄→オレンジ→赤）
    if (normalizedValue <= 0.2) {
      // 青系（最低値）
      return "rgb(0, 123, 255)";
    } else if (normalizedValue <= 0.4) {
      // 緑系（低値）
      return "rgb(40, 167, 69)";
    } else if (normalizedValue <= 0.6) {
      // 黄系（中値）
      return "rgb(255, 193, 7)";
    } else if (normalizedValue <= 0.8) {
      // オレンジ系（高値）
      return "rgb(255, 108, 0)";
    } else {
      // 赤系（最高値）
      return "rgb(220, 53, 69)";
    }
  } else if (colorScheme === "blue") {
    // 青系のグラデーション（より濃い色）
    const intensity = Math.floor(200 - normalizedValue * 150); // より濃い青色
    return `rgb(${Math.max(50, intensity)}, ${Math.max(50, intensity)}, 255)`;
  } else {
    // 緑系のグラデーション
    const intensity = Math.floor(255 - normalizedValue * 100);
    return `rgb(${intensity}, 255, ${intensity})`;
  }
};

// カラーマッピングの種類に応じた色を取得する関数
export const getColorForAreaByMapping = (
  areaName: string,
  colorMappingType: ColorMappingType,
  selectedDate: Date,
  selectedDepartment?: string
): string => {
  if (colorMappingType === "fireDepartment") {
    return getColorForArea(areaName, selectedDepartment);
  } else if (colorMappingType === "emergencyCalls") {
    const year = selectedDate.getFullYear();

    // まず完全一致を試す
    let yearData = emergencyCallsTimeSeriesData[areaName] || {};
    let calls = yearData[year] || emergencyCallsData[areaName] || 0;

    // 完全一致しない場合、正規化された町名を試す
    if (calls === 0) {
      const normalizedAreaName = areaName.replace(
        /[一二三四五六七八九十]丁目$/,
        ""
      );
      yearData = emergencyCallsTimeSeriesData[normalizedAreaName] || {};
      calls = yearData[year] || emergencyCallsData[normalizedAreaName] || 0;
    }

    // その年の全データから最大・最小を取得
    const allYearData = Object.values(yearData);
    const maxCalls =
      allYearData.length > 0
        ? Math.max(...allYearData)
        : Math.max(...Object.values(emergencyCallsData));
    const minCalls =
      allYearData.length > 0
        ? Math.min(...allYearData)
        : Math.min(...Object.values(emergencyCallsData));

    return getColorByValue(calls, minCalls, maxCalls, "red");
  } else if (colorMappingType === "populationDensity") {
    const year = selectedDate.getFullYear();

    // まず完全一致を試す
    let yearData = populationDensityTimeSeriesData[areaName] || {};
    let density = yearData[year] || populationDensityData[areaName] || 0;

    // 完全一致しない場合、正規化された町名を試す
    if (density === 0) {
      const normalizedAreaName = areaName.replace(
        /[一二三四五六七八九十]丁目$/,
        ""
      );
      yearData = populationDensityTimeSeriesData[normalizedAreaName] || {};
      density =
        yearData[year] || populationDensityData[normalizedAreaName] || 0;
    }

    // その年の全データから最大・最小を取得
    const allYearData = Object.values(yearData);
    const maxDensity =
      allYearData.length > 0
        ? Math.max(...allYearData)
        : Math.max(...Object.values(populationDensityData));
    const minDensity =
      allYearData.length > 0
        ? Math.min(...allYearData)
        : Math.min(...Object.values(populationDensityData));

    return getColorByValue(density, minDensity, maxDensity, "red");
  }

  return "#CCCCCC"; // デフォルト色
};

// カスタムアイコンを生成する関数
export const createCustomIcon = (badge: BadgeData) => {
  // SVGアイコンを作成
  const iconHtml = `
    <div style="
      background-color: ${badge.color};
      border: 2px solid white;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.2);
      color: white;
      font-size: 16px;
      line-height: 1;
      overflow: hidden;
      position: relative;
    ">
      <span style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        text-align: center;
      ">
        ${
          badge.type === "消防署"
            ? "🚒"
            : badge.type === "病院"
            ? "🏥"
            : badge.type === "学校"
            ? "🏫"
            : badge.type === "商業施設"
            ? "🏪"
            : badge.type === "交通"
            ? "🚉"
            : badge.type === "福祉施設"
            ? "🏥"
            : badge.type === "公園"
            ? "🌳"
            : "📍"
        }
      </span>
    </div>
  `;

  return divIcon({
    html: iconHtml,
    className: "custom-map-marker",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};
