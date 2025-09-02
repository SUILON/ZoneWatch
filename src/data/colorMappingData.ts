import type { ColorMappingOption } from "@/types/HeatmapTypes";

export const colorMappingOptions: ColorMappingOption[] = [
  {
    key: "emergencyCalls",
    label: "救急出場件数",
    description: "救急出場件数に基づく色分け（件数が多いほど濃い色）",
  },
  {
    key: "fireDepartment",
    label: "管轄消防署",
    description: "各エリアの管轄消防署に基づく色分け",
  },
  {
    key: "populationDensity",
    label: "人口密度",
    description: "人口密度に基づく色分け（密度が高いほど濃い色）",
  },
];

// 町名のリスト
const areaNames = [
  "今川町",
  "今宿西町",
  "今宿東町",
  "今宿南町",
  "川島町",
  "四季美台",
  "白根",
  "白根町",
  "白根一丁目",
  "白根二丁目",
  "白根三丁目",
  "白根四丁目",
  "白根五丁目",
  "白根六丁目",
  "白根七丁目",
  "白根八丁目",
  "鶴ケ峰",
  "鶴ケ峰一丁目",
  "鶴ケ峰二丁目",
  "鶴ケ峰本町",
  "鶴ケ峰本町一丁目",
  "鶴ケ峰本町二丁目",
  "鶴ケ峰本町三丁目",
  "中白根",
  "中白根一丁目",
  "中白根二丁目",
  "中白根三丁目",
  "中白根四丁目",
  "西川島町",
  "本村町",
  "さちが丘",
  "善部町",
  "中希望が丘",
  "東希望が丘",
  "二俣川",
  "二俣川一丁目",
  "二俣川ニ丁目",
  "二俣川二丁目",
  "南希望が丘",
  "上白根",
  "上白根町",
  "上白根一丁目",
  "上白根二丁目",
  "上白根三丁目",
  "川井宿町",
  "川井本町",
  "下川井町",
  "都岡町",
  "大池町",
  "柏町",
  "桐が作",
  "左近山",
  "本宿町",
  "万騎が原",
  "南本宿町",
  "上川井町",
  "若葉台",
  "若葉台一丁目",
  "若葉第二丁目",
  "若葉台二丁目",
  "若葉台三丁目",
  "若葉台四丁目",
  "市沢町",
  "小高町",
  "三反田町",
  "今宿",
  "今宿町",
  "今宿西町",
  "今宿東町",
  "今宿南町",
  "金が谷",
  "笹野台",
  "中尾一丁目",
  "中尾二丁目",
  "中沢",
  "中沢町",
  "矢指町",
];

// 2001年から2030年までの救急出場件数の時系列データを生成
export const emergencyCallsTimeSeriesData: Record<
  string,
  Record<number, number>
> = {};

areaNames.forEach((areaName) => {
  emergencyCallsTimeSeriesData[areaName] = {};

  // 2001年から2030年までのデータを生成
  for (let year = 2001; year <= 2030; year++) {
    // ベース値を設定（地域によって異なる）
    let baseValue = 10;

    // 地域ごとの特性を設定
    if (areaName.includes("鶴ケ峰")) baseValue = 25;
    else if (areaName.includes("上白根")) baseValue = 24;
    else if (areaName.includes("万騎が原")) baseValue = 22;
    else if (areaName.includes("鶴ケ峰本町")) baseValue = 22;
    else if (areaName.includes("二俣川")) baseValue = 21;
    else if (areaName.includes("川島町")) baseValue = 20;
    else if (areaName.includes("中希望が丘")) baseValue = 19;
    else if (areaName.includes("本宿町")) baseValue = 19;
    else if (areaName.includes("東希望が丘")) baseValue = 17;
    else if (areaName.includes("南本宿町")) baseValue = 17;
    else if (areaName.includes("上白根町")) baseValue = 20;
    else if (areaName.includes("川井本町")) baseValue = 18;
    else if (areaName.includes("白根")) baseValue = 18;
    else if (areaName.includes("笹野台")) baseValue = 18;
    else if (areaName.includes("川井宿町")) baseValue = 15;
    else if (areaName.includes("今川町")) baseValue = 15;
    else if (areaName.includes("若葉台")) baseValue = 15;
    else if (areaName.includes("中尾")) baseValue = 15;
    else if (areaName.includes("白根町")) baseValue = 14;
    else if (areaName.includes("今宿")) baseValue = 16;
    else if (areaName.includes("今宿町")) baseValue = 14;
    else if (areaName.includes("さちが丘")) baseValue = 13;
    else if (areaName.includes("小高町")) baseValue = 13;
    else if (areaName.includes("矢指町")) baseValue = 13;
    else if (areaName.includes("今宿東町")) baseValue = 12;
    else if (areaName.includes("左近山")) baseValue = 12;
    else if (areaName.includes("南希望が丘")) baseValue = 12;
    else if (areaName.includes("金が谷")) baseValue = 12;
    else if (areaName.includes("中白根")) baseValue = 16;
    else if (areaName.includes("都岡町")) baseValue = 16;
    else if (areaName.includes("大池町")) baseValue = 14;
    else if (areaName.includes("柏町")) baseValue = 13;
    else if (areaName.includes("三反田町")) baseValue = 11;
    else if (areaName.includes("本村町")) baseValue = 11;
    else if (areaName.includes("下川井町")) baseValue = 11;
    else if (areaName.includes("西川島町")) baseValue = 9;
    else if (areaName.includes("桐が作")) baseValue = 9;
    else if (areaName.includes("中沢")) baseValue = 9;
    else if (areaName.includes("今宿西町")) baseValue = 8;
    else if (areaName.includes("上川井町")) baseValue = 8;
    else if (areaName.includes("市沢町")) baseValue = 10;
    else if (areaName.includes("今宿南町")) baseValue = 6;
    else if (areaName.includes("善部町")) baseValue = 7;
    else if (areaName.includes("四季美台")) baseValue = 10;

    // 年による変動を追加（トレンド + ランダム）
    const trend = (year - 2001) * 0.3; // 年々少しずつ増加
    const random = (Math.random() - 0.5) * 4; // -2から+2のランダム変動
    const seasonal = Math.sin((year - 2001) * 0.5) * 2; // 季節性

    let value = Math.max(0, Math.round(baseValue + trend + random + seasonal));

    // 2020年以降は少し減少傾向
    if (year >= 2020) {
      value = Math.max(0, Math.round(value * (1 - (year - 2020) * 0.02)));
    }

    // 2025年以降は新しいトレンドを追加
    if (year >= 2025) {
      const newTrend = (year - 2025) * 0.5; // 2025年以降は少し増加傾向
      value = Math.max(0, Math.round(value + newTrend));
    }

    emergencyCallsTimeSeriesData[areaName][year] = value;
  }
});

// 2001年から2030年までの人口密度の時系列データを生成
export const populationDensityTimeSeriesData: Record<
  string,
  Record<number, number>
> = {};

areaNames.forEach((areaName) => {
  populationDensityTimeSeriesData[areaName] = {};

  // 2001年から2030年までのデータを生成
  for (let year = 2001; year <= 2030; year++) {
    // ベース値を設定（地域によって異なる）
    let baseValue = 3000;

    // 地域ごとの特性を設定
    if (areaName.includes("上白根")) baseValue = 4600;
    else if (areaName.includes("鶴ケ峰")) baseValue = 4500;
    else if (areaName.includes("二俣川")) baseValue = 4400;
    else if (areaName.includes("万騎が原")) baseValue = 4300;
    else if (areaName.includes("鶴ケ峰本町")) baseValue = 4300;
    else if (areaName.includes("本宿町")) baseValue = 4100;
    else if (areaName.includes("東希望が丘")) baseValue = 4100;
    else if (areaName.includes("笹野台")) baseValue = 4000;
    else if (areaName.includes("川井本町")) baseValue = 4000;
    else if (areaName.includes("川島町")) baseValue = 4200;
    else if (areaName.includes("今宿")) baseValue = 3900;
    else if (areaName.includes("中希望が丘")) baseValue = 3900;
    else if (areaName.includes("川井宿町")) baseValue = 3800;
    else if (areaName.includes("白根")) baseValue = 3800;
    else if (areaName.includes("南本宿町")) baseValue = 3800;
    else if (areaName.includes("都岡町")) baseValue = 3700;
    else if (areaName.includes("今宿町")) baseValue = 3700;
    else if (areaName.includes("大池町")) baseValue = 3600;
    else if (areaName.includes("白根町")) baseValue = 3600;
    else if (areaName.includes("中尾")) baseValue = 3600;
    else if (areaName.includes("今川町")) baseValue = 3500;
    else if (areaName.includes("南希望が丘")) baseValue = 3500;
    else if (areaName.includes("若葉台")) baseValue = 3500;
    else if (areaName.includes("さちが丘")) baseValue = 3400;
    else if (areaName.includes("柏町")) baseValue = 3400;
    else if (areaName.includes("矢指町")) baseValue = 3400;
    else if (areaName.includes("小高町")) baseValue = 3300;
    else if (areaName.includes("本村町")) baseValue = 3300;
    else if (areaName.includes("今宿東町")) baseValue = 3200;
    else if (areaName.includes("左近山")) baseValue = 3200;
    else if (areaName.includes("金が谷")) baseValue = 3200;
    else if (areaName.includes("中白根")) baseValue = 3700;
    else if (areaName.includes("西川島町")) baseValue = 2900;
    else if (areaName.includes("今宿西町")) baseValue = 2800;
    else if (areaName.includes("三反田町")) baseValue = 2800;
    else if (areaName.includes("桐が作")) baseValue = 2700;
    else if (areaName.includes("下川井町")) baseValue = 3000;
    else if (areaName.includes("四季美台")) baseValue = 3100;
    else if (areaName.includes("市沢町")) baseValue = 3100;
    else if (areaName.includes("今宿南町")) baseValue = 2400;
    else if (areaName.includes("善部町")) baseValue = 2600;
    else if (areaName.includes("上川井町")) baseValue = 2500;
    else if (areaName.includes("中沢")) baseValue = 2400;

    // 年による変動を追加（トレンド + ランダム）
    const trend = (year - 2001) * 15; // 年々少しずつ増加
    const random = (Math.random() - 0.5) * 200; // -100から+100のランダム変動

    let value = Math.max(1000, Math.round(baseValue + trend + random));

    // 2020年以降は少し減少傾向
    if (year >= 2020) {
      value = Math.max(1000, Math.round(value * (1 - (year - 2020) * 0.01)));
    }

    // 2025年以降は新しいトレンドを追加
    if (year >= 2025) {
      const newTrend = (year - 2025) * 20; // 2025年以降は少し増加傾向
      value = Math.max(1000, Math.round(value + newTrend));
    }

    populationDensityTimeSeriesData[areaName][year] = value;
  }
});

// 2001年から2030年までの管轄消防署の時系列データを生成（実際には変化しないが、将来的な変更に対応）
export const fireDepartmentTimeSeriesData: Record<
  string,
  Record<number, string>
> = {};

areaNames.forEach((areaName) => {
  fireDepartmentTimeSeriesData[areaName] = {};

  // 2001年から2030年までのデータを生成
  for (let year = 2001; year <= 2030; year++) {
    // 基本的には同じ管轄だが、将来的な変更に対応
    let department = "旭消防署本署";

    // 地域ごとの管轄を設定（実際のデータに基づく）
    if (
      [
        "今川町",
        "今宿西町",
        "今宿東町",
        "今宿南町",
        "川島町",
        "四季美台",
        "白根",
        "白根町",
        "鶴ケ峰",
        "鶴ケ峰本町",
        "中白根",
        "西川島町",
        "本村町",
        "さちが丘",
        "善部町",
        "中希望が丘",
        "東希望が丘",
        "二俣川",
        "南希望が丘",
      ].includes(areaName)
    ) {
      department = "旭消防署本署";
    } else if (
      [
        "上白根",
        "上白根町",
        "川井宿町",
        "川井本町",
        "下川井町",
        "都岡町",
        "大池町",
        "柏町",
        "桐が作",
        "左近山",
        "本宿町",
        "万騎が原",
        "南本宿町",
      ].includes(areaName)
    ) {
      department = "旭消防署川井出張所";
    } else if (
      [
        "上川井町",
        "若葉台",
        "市沢町",
        "小高町",
        "三反田町",
        "今宿",
        "今宿町",
        "金が谷",
        "笹野台",
        "中尾",
        "中沢",
        "矢指町",
      ].includes(areaName)
    ) {
      department = "旭消防署今宿出張所";
    }

    fireDepartmentTimeSeriesData[areaName][year] = department;
  }
});

// 現在の日付に基づくデータを取得する関数
export const getCurrentYearData = (
  data: Record<string, Record<number, number>>,
  year: number
) => {
  const currentData: Record<string, number> = {};
  Object.keys(data).forEach((areaName) => {
    currentData[areaName] = data[areaName][year] || data[areaName][2024] || 0;
  });
  return currentData;
};

// 救急出場件数のサンプルデータ（実際のデータに置き換える）
export const emergencyCallsData: Record<string, number> = getCurrentYearData(
  emergencyCallsTimeSeriesData,
  2024
);

// 人口密度のサンプルデータ（実際のデータに置き換える）
export const populationDensityData: Record<string, number> = getCurrentYearData(
  populationDensityTimeSeriesData,
  2024
);
