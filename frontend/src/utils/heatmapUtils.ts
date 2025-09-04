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

// ------------------------------
// Color scale utilities (centralized)
// ------------------------------

// アンカー色（青→緑→黄→オレンジ→赤）
const RED_SCHEME_ANCHORS = [
  [0, 123, 255],
  [40, 167, 69],
  [255, 193, 7],
  [255, 108, 0],
  [220, 53, 69],
];

type SupportedScheme = "red" | "blue" | "green";

// anchor配列からsteps数の連続カラーパレットを生成
export const interpolateAnchors = (
  anchors: number[][],
  steps: number
): string[] => {
  if (steps <= 1) {
    const [r, g, b] = anchors[anchors.length - 1];
    return [`rgb(${r}, ${g}, ${b})`];
  }
  const out: string[] = [];
  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 1 : i / (steps - 1); // 0..1
    const pos = t * (anchors.length - 1);
    const low = Math.floor(pos);
    const high = Math.min(anchors.length - 1, low + 1);
    const localT = pos - low;
    const [r1, g1, b1] = anchors[low];
    const [r2, g2, b2] = anchors[high];
    const r = Math.round(r1 + (r2 - r1) * localT);
    const g = Math.round(g1 + (g2 - g1) * localT);
    const b = Math.round(b1 + (b2 - b1) * localT);
    out.push(`rgb(${r}, ${g}, ${b})`);
  }
  return out;
};

// スキーム名と段階数からパレットを生成
export const getSequentialPalette = (
  scheme: SupportedScheme = "red",
  steps: number = 5
): string[] => {
  if (scheme === "red") {
    return interpolateAnchors(RED_SCHEME_ANCHORS, steps);
  }
  if (scheme === "blue") {
    // 薄い水色→濃い青
    return interpolateAnchors(
      [
        [204, 229, 255],
        [102, 178, 255],
        [51, 153, 255],
        [0, 102, 204],
        [0, 51, 153],
      ],
      steps
    );
  }
  // 緑系（薄→濃）
  return interpolateAnchors(
    [
      [229, 245, 224],
      [161, 217, 155],
      [116, 196, 118],
      [49, 163, 84],
      [0, 109, 44],
    ],
    steps
  );
};

// 値を段階index(0..steps-1)に量子化
export const quantizeValueToStep = (
  value: number,
  minValue: number,
  maxValue: number,
  steps: number
): number => {
  if (!isFinite(minValue) || !isFinite(maxValue) || steps <= 1) return 0;
  const range = maxValue - minValue;
  if (range <= 0) return steps - 1;
  const normalized = (value - minValue) / range; // 0..1
  const idx = Math.floor(normalized * steps);
  return Math.min(Math.max(idx, 0), steps - 1);
};

// 凡例用の離散区分を生成
export const getDiscreteStops = (
  minValue: number,
  maxValue: number,
  steps: number = 5,
  scheme: SupportedScheme = "red"
) => {
  const palette = getSequentialPalette(scheme, steps);
  const stops = [] as { color: string; from: number; to: number | null }[];
  const range = Math.max(0, maxValue - minValue);
  for (let i = 0; i < steps; i++) {
    const from = minValue + (range * i) / steps;
    // 最後の区分は上限なし
    const to = i === steps - 1 ? null : minValue + (range * (i + 1)) / steps;
    stops.push({ color: palette[i], from, to });
  }
  return stops;
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
  colorScheme: SupportedScheme = "red",
  steps: number = 5
): string => {
  const palette = getSequentialPalette(colorScheme, steps);
  const index = quantizeValueToStep(value, minValue, maxValue, steps);
  return palette[index];
};

// カラーマッピングの種類に応じた色を取得する関数
export const getColorForAreaByMapping = (
  areaName: string,
  colorMappingType: ColorMappingType,
  selectedDate: Date,
  selectedDepartment?: string,
  colorSteps: number = 5
): string => {
  if (colorMappingType === "fireDepartment") {
    return getColorForArea(areaName, selectedDepartment);
  } else if (colorMappingType === "emergencyCalls") {
    const year = selectedDate.getFullYear();

    // エリアの当年値を取得（まず完全一致）
    let series = emergencyCallsTimeSeriesData[areaName] || {};
    let calls = series[year] || emergencyCallsData[areaName] || 0;

    // 完全一致しない場合、正規化された町名を試す
    if (calls === 0) {
      const normalizedAreaName = areaName.replace(/[一二三四五六七八九十]丁目$/, "");
      series = emergencyCallsTimeSeriesData[normalizedAreaName] || {};
      calls = series[year] || emergencyCallsData[normalizedAreaName] || 0;
    }

    // その年の全エリアの値から最大・最小を取得（凡例と整合）
    const values: number[] = [];
    Object.values(emergencyCallsTimeSeriesData).forEach((areaData) => {
      const v = areaData[year];
      if (typeof v === "number") values.push(v);
    });
    const maxCalls =
      values.length > 0
        ? Math.max(...values)
        : Math.max(...Object.values(emergencyCallsData));
    const minCalls =
      values.length > 0
        ? Math.min(...values)
        : Math.min(...Object.values(emergencyCallsData));

    return getColorByValue(calls, minCalls, maxCalls, "red", colorSteps);
  } else if (colorMappingType === "populationDensity") {
    const year = selectedDate.getFullYear();

    // エリアの当年値を取得
    let series = populationDensityTimeSeriesData[areaName] || {};
    let density = series[year] || populationDensityData[areaName] || 0;

    if (density === 0) {
      const normalizedAreaName = areaName.replace(/[一二三四五六七八九十]丁目$/, "");
      series = populationDensityTimeSeriesData[normalizedAreaName] || {};
      density = series[year] || populationDensityData[normalizedAreaName] || 0;
    }

    // その年の全エリアの値から最大・最小を取得
    const values: number[] = [];
    Object.values(populationDensityTimeSeriesData).forEach((areaData) => {
      const v = areaData[year];
      if (typeof v === "number") values.push(v);
    });
    const maxDensity =
      values.length > 0
        ? Math.max(...values)
        : Math.max(...Object.values(populationDensityData));
    const minDensity =
      values.length > 0
        ? Math.min(...values)
        : Math.min(...Object.values(populationDensityData));

    return getColorByValue(density, minDensity, maxDensity, "red", colorSteps);
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
