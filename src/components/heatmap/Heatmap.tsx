import React, { useEffect, useState } from "react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
} from "@mui/material";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import {
  asahiFireDepartmentData,
  allViewMapSettings,
} from "@/data/fireDepartmentData";
import { sampleBadgeData, dataTypes } from "@/data/badgeData";
import {
  dateToValue,
  valueToDate,
  isPredictionPeriod,
  formatDate,
  getDepartmentForArea,
  getColorForAreaByMapping,
  createCustomIcon,
} from "@/utils/heatmapUtils";
import { LegendComponent } from "@/components/heatmap/LegendComponent";
import { DateControl } from "@/components/heatmap/DateControl";
import { DataTypeSelector } from "@/components/heatmap/DataTypeSelector";
import { ColorMappingSelector } from "@/components/heatmap/ColorMappingSelector";
import { colorMappingOptions } from "@/data/colorMappingData";

import type { SelectChangeEvent } from "@mui/material/Select";
import type { BadgeData, ColorMappingType } from "@/types/HeatmapTypes";

const MapController: React.FC<{
  center: [number, number];
  zoom: number;
}> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
    setTimeout(() => {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }, 100);
  }, [map, center, zoom]);

  return null;
};

interface HeatmapProps {
  title?: string;
}

const Heatmap: React.FC<HeatmapProps> = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    allViewMapSettings.center
  );
  const [mapZoom, setMapZoom] = useState<number>(allViewMapSettings.zoom);
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([]);
  const [badgeData] = useState<BadgeData[]>(sampleBadgeData);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedColorMapping, setSelectedColorMapping] =
    useState<ColorMappingType>("emergencyCalls");

  // 日付の範囲設定
  const minDate = new Date(2002, 0, 1);
  const maxDate = new Date(2030, 11, 31);
  const predictionStartDate = new Date(2024, 11, 31);

  // 日付スライダーの値変更ハンドラー
  const handleDateChange = (_event: Event, newValue: number | number[]) => {
    setSelectedDate(valueToDate(newValue as number));
  };

  // 年、月、日の変更ハンドラー
  const handleYearChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(newDate.getFullYear() + increment);
    if (newDate >= minDate && newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  const handleMonthChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + increment);
    if (newDate >= minDate && newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  const handleDayChange = (increment: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + increment);
    if (newDate >= minDate && newDate <= maxDate) {
      setSelectedDate(newDate);
    }
  };

  // 日付入力ハンドラー
  const handleDateInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputDate = new Date(event.target.value);
    if (inputDate >= minDate && inputDate <= maxDate) {
      setSelectedDate(inputDate);
    }
  };

  // データタイプ選択のハンドラー
  const handleDataTypeChange = (dataType: string) => {
    setSelectedDataTypes((prev) => {
      if (prev.includes(dataType)) {
        return prev.filter((type) => type !== dataType);
      } else {
        return [...prev, dataType];
      }
    });
  };

  // すべてのデータタイプをクリアするハンドラー
  const handleClearAllDataTypes = () => {
    setSelectedDataTypes([]);
  };

  // 今日の日付に設定するハンドラー
  const handleSetToToday = () => {
    const today = new Date();
    if (today >= minDate && today <= maxDate) {
      setSelectedDate(today);
    }
  };

  // GeoJSONの色分けスタイル関数
  const getFeatureStyle = (feature: any) => {
    const areaName =
      feature.properties.S_NAME || feature.properties.name || "不明";
    const color = getColorForAreaByMapping(
      areaName,
      selectedColorMapping,
      selectedDate,
      selectedDepartment
    );
    const department = getDepartmentForArea(areaName);

    const isVisible =
      selectedDepartment === "all" ||
      (selectedDepartment === "main" &&
        department === asahiFireDepartmentData.mainStation.name) ||
      (selectedDepartment !== "all" &&
        selectedDepartment !== "main" &&
        department === selectedDepartment);

    // 予測期間でもヒートマップの種類に応じた色を使用
    const finalColor = color;

    return {
      fillColor: finalColor,
      weight: 2,
      opacity: isVisible ? 1 : 0.3,
      color: "#ffffff",
      dashArray: "",
      fillOpacity: isVisible ? 0.7 : 0.2,
    };
  };

  // ポップアップの内容を生成する関数
  const onEachFeature = (feature: any, layer: any) => {
    const areaName =
      feature.properties.S_NAME || feature.properties.name || "不明";
    const department = getDepartmentForArea(areaName);

    const popupContent = `
      <div style="font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 8px 0; color: #FF4500;">${areaName}</h4>
        <p style="margin: 4px 0; color: #007ACC;"><strong>管轄消防署:</strong> ${department}</p>
        <p style="margin: 4px 0;"><strong>都道府県:</strong> ${
          feature.properties.PREF_NAME || "不明"
        }</p>
        <p style="margin: 4px 0;"><strong>市区町村:</strong> ${
          feature.properties.CITY_NAME || "不明"
        } ${areaName}</p>
        <p style="margin: 4px 0;"><strong>キーコード:</strong> ${
          feature.properties.KEY_CODE || "不明"
        }</p>
        <p style="margin: 4px 0;"><strong>人口:</strong> ${
          feature.properties.JINKO
            ? feature.properties.JINKO.toLocaleString()
            : "不明"
        }人</p>
        <p style="margin: 4px 0;"><strong>世帯数:</strong> ${
          feature.properties.SETAI
            ? feature.properties.SETAI.toLocaleString()
            : "不明"
        }世帯</p>
        <p style="margin: 4px 0;"><strong>面積:</strong> ${
          feature.properties.AREA
            ? Math.round(feature.properties.AREA).toLocaleString()
            : "不明"
        }㎡</p>
      </div>
    `;

    layer.bindPopup(popupContent);

    // マウスホバー時のハイライト効果
    const isVisible =
      selectedDepartment === "all" ||
      (selectedDepartment === "main" &&
        department === asahiFireDepartmentData.mainStation.name) ||
      (selectedDepartment !== "all" &&
        selectedDepartment !== "main" &&
        department === selectedDepartment);

    layer.on({
      mouseover: function (e: any) {
        const layer = e.target;
        // ホバー時にも現在の日付に基づいたスタイルを取得
        const currentStyle = getFeatureStyle(feature);
        layer.setStyle({
          ...currentStyle,
          weight: 4,
          color: isVisible ? "#2196F3" : "#9E9E9E",
          fillOpacity: isVisible ? 0.9 : 0.5,
        });
        layer.bringToFront();
      },
      mouseout: function (e: any) {
        const layer = e.target;
        // マウスアウト時にも現在の日付に基づいたスタイルを取得
        const currentStyle = getFeatureStyle(feature);
        layer.setStyle(currentStyle);
      },
    });
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const loadGeoJsonData = async () => {
      try {
        const response = await fetch("/data/asahi.geojson");
        const data = await response.json();
        setGeoJsonData(data);
      } catch (error) {
        console.error("GeoJSONデータの読み込みに失敗しました:", error);
      }
    };

    loadGeoJsonData();
  }, []);

  // 選択された管轄に応じて地図位置を設定する共通関数
  const setMapPositionForDepartment = (department: string) => {
    if (department === "all") {
      setMapCenter([...allViewMapSettings.center] as [number, number]);
      setMapZoom(allViewMapSettings.zoom);
    } else if (department === "main") {
      setMapCenter([...asahiFireDepartmentData.mainStation.center] as [
        number,
        number
      ]);
      setMapZoom(asahiFireDepartmentData.mainStation.zoom);
    } else {
      const branch = asahiFireDepartmentData.branches.find(
        (b: any) => b.name === department
      );
      if (branch) {
        setMapCenter([...branch.center] as [number, number]);
        setMapZoom(branch.zoom);
      }
    }
  };

  // 管轄選択のハンドラー
  const handleDepartmentChange = (event: SelectChangeEvent) => {
    const value = event.target.value;
    setSelectedDepartment(value);
    setMapPositionForDepartment(value);
  };

  // 地図位置リセットハンドラー
  const handleResetMapPosition = () => {
    setMapPositionForDepartment(selectedDepartment);
  };

  return (
    <ScrollableContainer additionalSx={{ p: 2, height: "100vh" }}>
      <Box sx={{ display: "flex", gap: 3, alignItems: "flex-start" }}>
        {/* 地図エリア */}
        <Box
          sx={{
            flex: 1,
            height: "600px",
            minWidth: "350px",
            border: "1px solid #ccc",
            borderRadius: 1,
            position: "relative",
            transition: "height 0.3s ease-in-out",
          }}
        >
          {/* 地図上の位置リセットボタン */}
          <IconButton
            onClick={handleResetMapPosition}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 1000,
              backgroundColor: "background.paper",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "background.paper",
                boxShadow: 2,
              },
            }}
            aria-label="位置を戻す"
            title="位置を戻す"
          >
            <CenterFocusStrongIcon />
          </IconButton>

          {/* 凡例 */}
          <LegendComponent
            asahiFireDepartmentData={asahiFireDepartmentData}
            dataTypes={dataTypes}
            selectedDataTypes={selectedDataTypes}
            badgeData={badgeData}
            selectedColorMapping={selectedColorMapping}
            selectedDate={selectedDate}
          />

          <MapContainer
            key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            center={allViewMapSettings.center}
            zoom={allViewMapSettings.zoom}
            style={{ height: "100%", width: "100%" }}
          >
            <MapController center={mapCenter} zoom={mapZoom} />
            {geoJsonData && (
              <GeoJSON
                key={`${selectedDepartment}-${selectedColorMapping}-${selectedDate.getTime()}`}
                data={geoJsonData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}

            {/* バッジ（マーカー）の表示 */}
            {badgeData
              .filter((badge) => selectedDataTypes.includes(badge.type))
              .map((badge) => (
                <Marker
                  key={badge.id}
                  position={badge.position}
                  icon={createCustomIcon(badge)}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography
                        variant="h6"
                        sx={{ color: badge.color, mb: 1 }}
                      >
                        {badge.name}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>種別:</strong> {badge.type}
                      </Typography>
                      {badge.details && (
                        <>
                          {badge.details.address && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>住所:</strong> {badge.details.address}
                            </Typography>
                          )}
                          {badge.details.phone && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>電話:</strong> {badge.details.phone}
                            </Typography>
                          )}
                          {badge.details.type && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>分類:</strong> {badge.details.type}
                            </Typography>
                          )}
                          {badge.details.line && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>路線:</strong> {badge.details.line}
                            </Typography>
                          )}
                          {badge.details.density && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>人口密度:</strong> {badge.details.density}
                            </Typography>
                          )}
                        </>
                      )}
                    </Box>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </Box>

        {/* 操作エリア */}
        <Paper
          sx={{
            width: "350px",
            flexShrink: 0,
            boxShadow: 1,
          }}
        >
          {/* ヘッダー部分 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              pb: 1,
            }}
          ></Box>

          {/* コントロール部分 */}
          <Box sx={{ p: 2, pt: 1 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* 管轄消防署選択 */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FormControl sx={{ width: "100%" }}>
                  <InputLabel id="department-select-label">
                    管轄消防署
                  </InputLabel>
                  <Select
                    labelId="department-select-label"
                    id="department-select"
                    value={selectedDepartment}
                    label="管轄消防署"
                    onChange={handleDepartmentChange}
                  >
                    <MenuItem value="all">すべて表示</MenuItem>
                    <MenuItem value="main">
                      {asahiFireDepartmentData.mainStation.name}
                    </MenuItem>
                    {asahiFireDepartmentData.branches.map((branch: any) => (
                      <MenuItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* カラーマッピング選択 */}
              <ColorMappingSelector
                colorMappingOptions={colorMappingOptions}
                selectedColorMapping={selectedColorMapping}
                onColorMappingChange={setSelectedColorMapping}
              />

              {/* 日付コントロール */}
              <DateControl
                selectedDate={selectedDate}
                minDate={minDate}
                maxDate={maxDate}
                predictionStartDate={predictionStartDate}
                onDateChange={handleDateChange}
                onYearChange={handleYearChange}
                onMonthChange={handleMonthChange}
                onDayChange={handleDayChange}
                onDateInputChange={handleDateInputChange}
                dateToValue={dateToValue}
                valueToDate={valueToDate}
                formatDate={formatDate}
                isPredictionPeriod={isPredictionPeriod}
                onSetToToday={handleSetToToday}
              />
              {/* データタイプ選択 */}
              <DataTypeSelector
                dataTypes={dataTypes}
                selectedDataTypes={selectedDataTypes}
                badgeData={badgeData}
                onDataTypeChange={handleDataTypeChange}
                onClearAll={handleClearAllDataTypes}
              />
            </Box>
          </Box>
        </Paper>
      </Box>
    </ScrollableContainer>
  );
};

export default Heatmap;
