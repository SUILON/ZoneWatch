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
    map.invalidateSize();
  }, [map, triggerResize]);

  return null;
};

const CONTROL_MIN_WIDTH_PX = 360;
const CONTROL_MIN_HEIGHT_PX = 260;
const MAP_INITIAL_WIDTH_PERCENT = 60;
const MAP_INITIAL_HEIGHT_PERCENT = 55;
const MAP_MIN_WIDTH_PX = 200;
const MAP_MIN_HEIGHT_PX = 200;
const SEPARATOR_THICKNESS = 8;
const SEPARATOR_COLLAPSED_THICKNESS = 16;

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
  const [mapPanelWidth, setMapPanelWidth] = useState<number>(0);
  const [mapPanelHeight, setMapPanelHeight] = useState<number>(
    MAP_MIN_HEIGHT_PX + 80
  );
  const [controlPanelWidth, setControlPanelWidth] = useState<number>(
    CONTROL_MIN_WIDTH_PX + 80
  );
  const [lastExpandedLayout, setLastExpandedLayout] = useState<{
    horizontal: { mapWidth: number; controlWidth: number };
    vertical: { mapHeight: number };
  }>({
    horizontal: {
      mapWidth: 0,
      controlWidth: CONTROL_MIN_WIDTH_PX,
    },
    vertical: {
      mapHeight: MAP_MIN_HEIGHT_PX + 80,
    },
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isControlCollapsed, setIsControlCollapsed] = useState<boolean>(false);
  const [isStackedLayout, setIsStackedLayout] = useState<boolean>(false);
  const [resizeTrigger, setResizeTrigger] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const hasInitializedLayout = useRef<boolean>(false);
  const preferredControlPanelWidth = useRef<number>(CONTROL_MIN_WIDTH_PX + 80);
  const preferredMapPanelHeight = useRef<number>(MAP_MIN_HEIGHT_PX + 80);
  const dragOrientationRef = useRef<"horizontal" | "vertical">("horizontal");
  // カラーステップ数（凡例/塗りつぶしで共通利用）
  const colorSteps = 5;

  // 日付の範囲設定
  const minDate = new Date(2002, 0, 1);
  const maxDate = new Date(2030, 11, 31);
  const predictionStartDate = new Date(2024, 11, 31);

  const updateWidthFromClientX = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container || isControlCollapsed || isStackedLayout) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0) return;

      const separatorWidth = SEPARATOR_THICKNESS;
      const relativeX = clientX - rect.left;

      const maxMapWidth = rect.width - separatorWidth - CONTROL_MIN_WIDTH_PX;
      const clampedMapWidth = Math.min(
        Math.max(relativeX, MAP_MIN_WIDTH_PX),
        maxMapWidth
      );
      const nextControlWidth = rect.width - separatorWidth - clampedMapWidth;

      setMapPanelWidth(clampedMapWidth);
      setControlPanelWidth(nextControlWidth);
      preferredControlPanelWidth.current = nextControlWidth;
      setLastExpandedLayout(prev => ({
        ...prev,
        horizontal: {
          mapWidth: clampedMapWidth,
          controlWidth: nextControlWidth,
        },
      }));
    },
    [isControlCollapsed, isStackedLayout]
  );

  const updateHeightFromClientY = useCallback(
    (clientY: number) => {
      const container = containerRef.current;
      if (!container || isControlCollapsed || !isStackedLayout) return;
      const rect = container.getBoundingClientRect();
      if (rect.height === 0) return;

      const separatorThickness = SEPARATOR_THICKNESS;
      const relativeY = clientY - rect.top;

      const maxMapHeight = Math.max(
        MAP_MIN_HEIGHT_PX,
        rect.height - separatorThickness - CONTROL_MIN_HEIGHT_PX
      );
      const clampedMapHeight = Math.min(
        Math.max(relativeY, MAP_MIN_HEIGHT_PX),
        maxMapHeight
      );

      setMapPanelHeight(clampedMapHeight);
      preferredMapPanelHeight.current = clampedMapHeight;
      setLastExpandedLayout(prev => ({
        ...prev,
        vertical: {
          mapHeight: clampedMapHeight,
        },
      }));
    },
    [isControlCollapsed, isStackedLayout]
  );

  // コントロールエリアの開閉トグル
  const handleTogglePanel = useCallback(() => {
    if (isControlCollapsed) {
      setIsControlCollapsed(false);
      if (lastExpandedLayout.horizontal.mapWidth > 0) {
        setMapPanelWidth(lastExpandedLayout.horizontal.mapWidth);
      }
      if (lastExpandedLayout.horizontal.controlWidth > 0) {
        setControlPanelWidth(lastExpandedLayout.horizontal.controlWidth);
        preferredControlPanelWidth.current =
          lastExpandedLayout.horizontal.controlWidth;
      }
      if (lastExpandedLayout.vertical.mapHeight > 0) {
        setMapPanelHeight(lastExpandedLayout.vertical.mapHeight);
        preferredMapPanelHeight.current =
          lastExpandedLayout.vertical.mapHeight;
      }
    } else {
      setLastExpandedLayout(prev => ({
        horizontal: {
          mapWidth: isStackedLayout
            ? prev.horizontal.mapWidth
            : mapPanelWidth,
          controlWidth: isStackedLayout
            ? prev.horizontal.controlWidth
            : controlPanelWidth,
        },
        vertical: {
          mapHeight: isStackedLayout ? mapPanelHeight : prev.vertical.mapHeight,
        },
      }));
      if (isStackedLayout) {
        preferredMapPanelHeight.current = mapPanelHeight;
      } else {
        preferredControlPanelWidth.current = controlPanelWidth;
      }
      setIsControlCollapsed(true);
    }
  }, [
    controlPanelWidth,
    isControlCollapsed,
    isStackedLayout,
    lastExpandedLayout,
    mapPanelHeight,
    mapPanelWidth,
  ]);

  const handleDragStart = useCallback(
    (
      event:
        | React.MouseEvent<HTMLDivElement>
        | React.TouchEvent<HTMLDivElement>
    ) => {
      event.preventDefault();
      if (isControlCollapsed) return;

      const touchPoint = "touches" in event ? event.touches[0] : undefined;

      if (isStackedLayout) {
        const clientY = touchPoint
          ? touchPoint.clientY
          : (event as React.MouseEvent<HTMLDivElement>).clientY;
        if (typeof clientY === "number") {
          dragOrientationRef.current = "vertical";
          updateHeightFromClientY(clientY);
          setIsDragging(true);
        }
      } else {
        const clientX = touchPoint
          ? touchPoint.clientX
          : (event as React.MouseEvent<HTMLDivElement>).clientX;
        if (typeof clientX === "number") {
          dragOrientationRef.current = "horizontal";
          updateWidthFromClientX(clientX);
          setIsDragging(true);
        }
      }
    },
    [
      isControlCollapsed,
      isStackedLayout,
      updateHeightFromClientY,
      updateWidthFromClientX,
    ]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      if (dragOrientationRef.current === "vertical") {
        updateHeightFromClientY(event.clientY);
      } else {
        updateWidthFromClientX(event.clientX);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (dragOrientationRef.current === "vertical") {
        updateHeightFromClientY(touch.clientY);
      } else {
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
  }, [
    isDragging,
    updateHeightFromClientY,
    updateWidthFromClientX,
  ]);

  // マップパネル幅の変更を監視してマップリサイズをトリガー
  useEffect(() => {
    if (!isDragging) {
      const timeoutId = setTimeout(() => {
        setResizeTrigger(prev => prev + 1);
      }, 250); // ドラッグ完了後少し待ってからリサイズ
      return () => clearTimeout(timeoutId);
    }
  }, [
    isControlCollapsed,
    isDragging,
    isStackedLayout,
    mapPanelHeight,
    mapPanelWidth,
  ]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(entries => {
      if (!entries.length) return;
      const { width, height } = entries[0].contentRect;
      setContainerWidth(width);
      setContainerHeight(height);
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerWidth || !containerHeight) return;

    if (isControlCollapsed) {
      setIsStackedLayout(false);
      setMapPanelWidth(containerWidth);
      setMapPanelHeight(containerHeight);
      return;
    }

    const separatorThickness = SEPARATOR_THICKNESS;
    const shouldStack =
      containerWidth - CONTROL_MIN_WIDTH_PX - separatorThickness <
      MAP_MIN_WIDTH_PX;

    if (shouldStack !== isStackedLayout) {
      setIsStackedLayout(shouldStack);
    }

    if (!hasInitializedLayout.current) {
      if (shouldStack) {
        const tentativeMapHeight = Math.max(
          MAP_MIN_HEIGHT_PX,
          (containerHeight * MAP_INITIAL_HEIGHT_PERCENT) / 100
        );
        const maxMapHeight = Math.max(
          MAP_MIN_HEIGHT_PX,
          containerHeight - separatorThickness - CONTROL_MIN_HEIGHT_PX
        );
        const clampedMapHeight = Math.min(tentativeMapHeight, maxMapHeight);

        preferredMapPanelHeight.current = clampedMapHeight;
        setMapPanelHeight(clampedMapHeight);
        setLastExpandedLayout(prev => ({
          ...prev,
          vertical: { mapHeight: clampedMapHeight },
        }));
      } else {
        const tentativeMapWidth = Math.max(
          MAP_MIN_WIDTH_PX,
          (containerWidth * MAP_INITIAL_WIDTH_PERCENT) / 100
        );
        const initialControlWidth =
          containerWidth - separatorThickness - tentativeMapWidth;
        const maxControlWidth = Math.max(
          containerWidth - MAP_MIN_WIDTH_PX - separatorThickness,
          CONTROL_MIN_WIDTH_PX
        );
        const clampedControlWidth = Math.min(
          Math.max(initialControlWidth, CONTROL_MIN_WIDTH_PX),
          maxControlWidth
        );
        const resultingMapWidth =
          containerWidth - separatorThickness - clampedControlWidth;

        preferredControlPanelWidth.current = clampedControlWidth;
        setControlPanelWidth(clampedControlWidth);
        setMapPanelWidth(Math.max(resultingMapWidth, MAP_MIN_WIDTH_PX));
        setLastExpandedLayout(prev => ({
          ...prev,
          horizontal: {
            mapWidth: Math.max(resultingMapWidth, MAP_MIN_WIDTH_PX),
            controlWidth: clampedControlWidth,
          },
        }));
      }

      hasInitializedLayout.current = true;
      return;
    }

    if (shouldStack) {
      const maxMapHeight = Math.max(
        MAP_MIN_HEIGHT_PX,
        containerHeight - separatorThickness - CONTROL_MIN_HEIGHT_PX
      );
      const desiredMapHeight = Math.min(
        Math.max(preferredMapPanelHeight.current, MAP_MIN_HEIGHT_PX),
        maxMapHeight
      );

      if (Math.abs(desiredMapHeight - mapPanelHeight) > 1) {
        setMapPanelHeight(desiredMapHeight);
      }
      preferredMapPanelHeight.current = desiredMapHeight;
      setLastExpandedLayout(prev => ({
        ...prev,
        vertical: { mapHeight: desiredMapHeight },
      }));
    } else {
      const maxControlWidth = Math.max(
        containerWidth - MAP_MIN_WIDTH_PX - separatorThickness,
        CONTROL_MIN_WIDTH_PX
      );
      const desiredControlWidth = Math.min(
        Math.max(preferredControlPanelWidth.current, CONTROL_MIN_WIDTH_PX),
        maxControlWidth
      );
      const availableMapWidth =
        containerWidth - separatorThickness - desiredControlWidth;

      if (Math.abs(availableMapWidth - mapPanelWidth) > 1) {
        setMapPanelWidth(availableMapWidth);
      }
      if (Math.abs(desiredControlWidth - controlPanelWidth) > 1) {
        setControlPanelWidth(desiredControlWidth);
      }
      preferredControlPanelWidth.current = desiredControlWidth;
      setLastExpandedLayout(prev => ({
        ...prev,
        horizontal: {
          mapWidth: availableMapWidth,
          controlWidth: desiredControlWidth,
        },
      }));
    }
  }, [
    containerHeight,
    containerWidth,
    controlPanelWidth,
    isControlCollapsed,
    isStackedLayout,
    mapPanelHeight,
    mapPanelWidth,
  ]);

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

  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        boxSizing: "border-box",
        userSelect: isDragging ? "none" : "auto",
        touchAction: isDragging ? "none" : "auto",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          display: "flex",
          flexDirection: isStackedLayout ? "column" : "row",
          height: "100%",
          alignItems: "stretch",
          gap: 0,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            flexBasis: isControlCollapsed
              ? "auto"
              : isStackedLayout
              ? `${Math.max(mapPanelHeight, MAP_MIN_HEIGHT_PX)}px`
              : `${Math.max(mapPanelWidth, MAP_MIN_WIDTH_PX)}px`,
            flexGrow: isControlCollapsed ? 1 : 0,
            flexShrink: isControlCollapsed ? 1 : 0,
            width: isStackedLayout || isControlCollapsed ? "100%" : "auto",
            minWidth: isStackedLayout ? "100%" : `${MAP_MIN_WIDTH_PX}px`,
            minHeight: `${MAP_MIN_HEIGHT_PX}px`,
            height:
              isStackedLayout && !isControlCollapsed
                ? `${Math.max(mapPanelHeight, MAP_MIN_HEIGHT_PX)}px`
                : "auto",
            border: "1px solid #ccc",
            borderRadius: 1,
            position: "relative",
            overflow: "hidden",
            transition:
              isDragging || isStackedLayout ? "none" : "flex-basis 0.2s ease",
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
          <MapController
            center={mapCenter}
            zoom={mapZoom}
            triggerResize={resizeTrigger}
          />
          {geoJsonData && (
            <GeoJSON
              key={`${selectedDepartment}-${selectedColorMapping}-${selectedDate.getTime()}-${
                isStackedLayout
                  ? Math.round(mapPanelHeight)
                  : Math.round(mapPanelWidth)
              }`}
              data={geoJsonData}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      </Box>

      <Box
        role="separator"
        aria-orientation={isStackedLayout ? "horizontal" : "vertical"}
        aria-expanded={!isControlCollapsed}
        tabIndex={0}
        onMouseDown={!isControlCollapsed ? handleDragStart : undefined}
        onTouchStart={!isControlCollapsed ? handleDragStart : undefined}
        onClick={(event) => {
          // コントロールパネルが閉じている場合はクリックで展開
          if (isControlCollapsed) {
            event.preventDefault();
            handleTogglePanel();
          }
        }}
        onDoubleClick={handleTogglePanel}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleTogglePanel();
          }
        }}
        sx={{
          width: isStackedLayout
            ? "100%"
            : isControlCollapsed
            ? `${SEPARATOR_COLLAPSED_THICKNESS}px`
            : `${SEPARATOR_THICKNESS}px`,
          height: isStackedLayout
            ? isControlCollapsed
              ? `${SEPARATOR_COLLAPSED_THICKNESS}px`
              : `${SEPARATOR_THICKNESS}px`
            : "auto",
          cursor:
            isControlCollapsed
              ? "pointer"
              : isStackedLayout
              ? "row-resize"
              : "col-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          px: isStackedLayout ? 0 : "2px",
          py: isStackedLayout ? "2px" : 0,
          outline: "none",
          my: isStackedLayout ? 1 : 0,
          "&:focus-visible": {
            boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
            borderRadius: "4px",
          },
        }}
        title={
          isControlCollapsed ? "クリックでコントロールを再表示" : "幅を調整 (ダブルクリックで折りたたみ)"
        }
      >
        <Box
          sx={{
            width: isStackedLayout ? "90px" : "3px",
            height: isStackedLayout ? "3px" : "90px",
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
              minWidth: isStackedLayout ? "auto" : `${CONTROL_MIN_WIDTH_PX}px`,
              width: isStackedLayout ? "100%" : "auto",
              mt: isStackedLayout ? 2 : 0,
              minHeight: isStackedLayout ? `${CONTROL_MIN_HEIGHT_PX}px` : "auto",
              boxShadow: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                pb: 1,
                flexShrink: 0,
              }}
            ></Box>

            <Box
              sx={{
                p: 2,
                pt: 1,
                flexGrow: 1,
                overflowY: "auto",
              }}
            >
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
    </Box>

  );
};

export default Heatmap;
