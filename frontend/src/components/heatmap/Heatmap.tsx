import React, { useCallback, useEffect, useRef, useState } from "react";
import CenterFocusStrongIcon from "@mui/icons-material/CenterFocusStrong";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton,
} from "@mui/material";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ScrollableContainer from "@/components/common/ScrollableContainer";
import {
  asahiFireDepartmentData,
  allViewMapSettings,
} from "@/data/fireDepartmentData";
import {
  dateToValue,
  valueToDate,
  isPredictionPeriod,
  formatDate,
  getDepartmentForArea,
  getColorForAreaByMapping,
} from "@/utils/heatmapUtils";
import { LegendComponent } from "@/components/heatmap/LegendComponent";
import { DateControl } from "@/components/heatmap/DateControl";
import { ColorMappingSelector } from "@/components/heatmap/ColorMappingSelector";
import { colorMappingOptions } from "@/data/colorMappingData";

import type { SelectChangeEvent } from "@mui/material/Select";
import type { ColorMappingType } from "@/types/HeatmapTypes";

const MapController: React.FC<{
  center: [number, number];
  zoom: number;
  triggerResize?: number;
}> = ({ center, zoom, triggerResize }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
    setTimeout(() => {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }, 100);
  }, [map, center, zoom]);

  // マップのリサイズを処理
  useEffect(() => {
    if (triggerResize !== undefined) {
      setTimeout(() => {
        map.invalidateSize();
      }, 300); // アニメーション完了後にリサイズ
    }
  }, [map, triggerResize]);

  return null;
};

const PANEL_MIN_WIDTH_PERCENT = 35;
const PANEL_MAX_WIDTH_PERCENT = 75;
const CONTROL_MIN_WIDTH_PX = 360;

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedColorMapping, setSelectedColorMapping] =
    useState<ColorMappingType>("emergencyCalls");
  const [mapPanelWidth, setMapPanelWidth] = useState<number>(60);
  const [lastExpandedMapWidth, setLastExpandedMapWidth] =
    useState<number>(60);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isControlCollapsed, setIsControlCollapsed] = useState<boolean>(false);
  const [resizeTrigger, setResizeTrigger] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // カラーステップ数（凡例/塗りつぶしで共通利用）
  const colorSteps = 5;

  // 日付の範囲設定
  const minDate = new Date(2002, 0, 1);
  const maxDate = new Date(2030, 11, 31);
  const predictionStartDate = new Date(2024, 11, 31);

  const updateWidthFromClientX = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container || isControlCollapsed) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;

    const relativeX = clientX - rect.left;
    const rawWidthPercent = (relativeX / rect.width) * 100;

    const absoluteMax = 100 - (CONTROL_MIN_WIDTH_PX / rect.width) * 100;
    const maxAllowed = Math.max(
      PANEL_MIN_WIDTH_PERCENT,
      Math.min(PANEL_MAX_WIDTH_PERCENT, absoluteMax)
    );

    const nextWidth = Math.min(
      maxAllowed,
      Math.max(PANEL_MIN_WIDTH_PERCENT, rawWidthPercent)
    );

    setMapPanelWidth(nextWidth);
    setLastExpandedMapWidth(nextWidth);
  }, [isControlCollapsed]);

  const handleDragStart = useCallback(
    (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.TouchEvent<HTMLDivElement>
    ) => {
      event.preventDefault();
      const clientX =
        "touches" in event ? event.touches[0]?.clientX : event.clientX;
      if (typeof clientX === "number") {
        updateWidthFromClientX(clientX);
      }
      setIsDragging(true);
    },
    [updateWidthFromClientX]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      updateWidthFromClientX(event.clientX);
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) {
        updateWidthFromClientX(touch.clientX);
      }
    };

    const stopDragging = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("mouseup", stopDragging);
    window.addEventListener("touchend", stopDragging);
    window.addEventListener("touchcancel", stopDragging);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchend", stopDragging);
      window.removeEventListener("touchcancel", stopDragging);
    };
  }, [isDragging, updateWidthFromClientX]);

  // マップパネル幅の変更を監視してマップリサイズをトリガー
  useEffect(() => {
    if (!isDragging) {
      const timeoutId = setTimeout(() => {
        setResizeTrigger(prev => prev + 1);
      }, 250); // ドラッグ完了後少し待ってからリサイズ
      return () => clearTimeout(timeoutId);
    }
  }, [mapPanelWidth, isControlCollapsed, isDragging]);

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
      selectedDepartment,
      colorSteps
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

  // コントロールエリアの開閉トグル
  const handleTogglePanel = useCallback(() => {
    if (isControlCollapsed) {
      let restoredWidth = lastExpandedMapWidth;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0) {
          const absoluteMax = 100 - (CONTROL_MIN_WIDTH_PX / rect.width) * 100;
          if (absoluteMax > PANEL_MIN_WIDTH_PERCENT) {
            const maxAllowed = Math.min(PANEL_MAX_WIDTH_PERCENT, absoluteMax);
            restoredWidth = Math.min(
              Math.max(PANEL_MIN_WIDTH_PERCENT, restoredWidth),
              maxAllowed
            );
          } else {
            restoredWidth = PANEL_MIN_WIDTH_PERCENT;
          }
        }
      }
      setMapPanelWidth(restoredWidth);
      setIsControlCollapsed(false);
    } else {
      setLastExpandedMapWidth(mapPanelWidth);
      setIsControlCollapsed(true);
    }
  }, [isControlCollapsed, lastExpandedMapWidth, mapPanelWidth]);

  return (
    <ScrollableContainer
      additionalSx={{
        p: 2,
        height: "100%",
        userSelect: isDragging ? "none" : "auto",
        touchAction: isDragging ? "none" : "auto",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          height: "100%",
          alignItems: "stretch",
          gap: 0,
        }}
      >
        <Box
          sx={{
            flexBasis: isControlCollapsed ? "auto" : `${mapPanelWidth}%`,
            flexGrow: isControlCollapsed ? 1 : 0,
            flexShrink: isControlCollapsed ? 1 : 0,
            minWidth: "320px",
            minHeight: "500px",
            border: "1px solid #ccc",
            borderRadius: 1,
            position: "relative",
            overflow: "hidden",
            transition: isDragging ? "none" : "flex-basis 0.2s ease",
          }}
        >
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

          <LegendComponent
            asahiFireDepartmentData={asahiFireDepartmentData}
            selectedColorMapping={selectedColorMapping}
            selectedDate={selectedDate}
            colorSteps={colorSteps}
          />

          <MapContainer
            center={allViewMapSettings.center}
            zoom={allViewMapSettings.zoom}
            style={{ height: "100%", width: "100%" }}
          >
            <MapController center={mapCenter} zoom={mapZoom} triggerResize={resizeTrigger} />
            {geoJsonData && (
              <GeoJSON
                data={geoJsonData}
                style={getFeatureStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        </Box>

        <Box
          role="separator"
          aria-orientation="vertical"
          aria-expanded={!isControlCollapsed}
          tabIndex={0}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onDoubleClick={handleTogglePanel}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleTogglePanel();
            }
          }}
          sx={{
            width: isControlCollapsed ? "16px" : "8px",
            cursor: "col-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            px: "2px",
            outline: "none",
            "&:focus-visible": {
              boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              borderRadius: "4px",
            },
          }}
          title={
            isControlCollapsed ? "コントロールを再表示" : "幅を調整 (ダブルクリックで折りたたみ)"
          }
        >
          <Box
            sx={{
              width: "2px",
              height: "40px",
              borderRadius: "1px",
              backgroundColor: isDragging
                ? "primary.main"
                : isControlCollapsed
                ? "primary.main"
                : "divider",
            }}
          />
        </Box>

        {!isControlCollapsed && (
          <Paper
            sx={{
              flexGrow: 1,
              minWidth: `${CONTROL_MIN_WIDTH_PX}px`,
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                pb: 1,
              }}
            ></Box>

            <Box sx={{ p: 2, pt: 1 }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

                <ColorMappingSelector
                  colorMappingOptions={colorMappingOptions}
                  selectedColorMapping={selectedColorMapping}
                  onColorMappingChange={setSelectedColorMapping}
                />

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
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </ScrollableContainer>
  );
};

export default Heatmap;
