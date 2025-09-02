import React from "react";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SchoolIcon from "@mui/icons-material/School";
import StoreIcon from "@mui/icons-material/Store";
import TrainIcon from "@mui/icons-material/Train";
import ParkIcon from "@mui/icons-material/Park";
import ElderlyIcon from "@mui/icons-material/Elderly";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import type { BadgeData, DataType } from "@/types/HeatmapTypes";

// サンプルバッジデータ
export const sampleBadgeData: BadgeData[] = [
  {
    id: "fire-1",
    type: "消防署",
    name: "旭消防署",
    position: [35.48045155372799, 139.54521549753136],
    color: "#E53E3E",
    icon: React.createElement(LocalFireDepartmentIcon),
    details: { address: "旭区鶴ヶ峰1-4-12", phone: "045-951-0119" },
  },
  {
    id: "fire-2",
    type: "消防署",
    name: "さちが丘消防出張所",
    position: [35.45983250516794, 139.52049562756952],
    color: "#E53E3E",
    icon: React.createElement(LocalFireDepartmentIcon),
    details: { address: "旭区さちが丘45-2", phone: "045-367-0119" },
  },
  {
    id: "hospital-1",
    type: "病院",
    name: "旭中央病院",
    position: [35.47, 139.535],
    color: "#2196F3",
    icon: React.createElement(LocalHospitalIcon),
    details: { address: "旭区中央町1-1", phone: "045-123-4567" },
  },
  {
    id: "hospital-2",
    type: "病院",
    name: "鶴ヶ峰病院",
    position: [35.485, 139.545],
    color: "#2196F3",
    icon: React.createElement(LocalHospitalIcon),
    details: { address: "旭区鶴ヶ峰2-3-4", phone: "045-234-5678" },
  },
  {
    id: "school-1",
    type: "学校",
    name: "旭小学校",
    position: [35.475, 139.52],
    color: "#4CAF50",
    icon: React.createElement(SchoolIcon),
    details: { address: "旭区中央3-5-6", type: "小学校" },
  },
  {
    id: "school-2",
    type: "学校",
    name: "鶴ヶ峰中学校",
    position: [35.48, 139.54],
    color: "#4CAF50",
    icon: React.createElement(SchoolIcon),
    details: { address: "旭区鶴ヶ峰4-7-8", type: "中学校" },
  },
  {
    id: "store-1",
    type: "商業施設",
    name: "ズーラシア",
    position: [35.465, 139.52],
    color: "#FF9800",
    icon: React.createElement(StoreIcon),
    details: { address: "旭区上白根町1175-1", type: "動物園" },
  },
  {
    id: "train-1",
    type: "交通",
    name: "鶴ヶ峰駅",
    position: [35.48, 139.544],
    color: "#9C27B0",
    icon: React.createElement(TrainIcon),
    details: { line: "相鉄本線", type: "駅" },
  },
  {
    id: "welfare-1",
    type: "福祉施設",
    name: "旭区福祉センター",
    position: [35.472, 139.538],
    color: "#FF6B9D",
    icon: React.createElement(ElderlyIcon),
    details: { address: "旭区鶴ヶ峰3-2-1", phone: "045-951-2345", type: "高齢者福祉" },
  },
  {
    id: "welfare-2",
    type: "福祉施設",
    name: "さちが丘保育園",
    position: [35.461, 139.522],
    color: "#FF6B9D",
    icon: React.createElement(ChildCareIcon),
    details: { address: "旭区さちが丘50-1", phone: "045-367-2345", type: "保育園" },
  },
  {
    id: "park-1",
    type: "公園",
    name: "鶴ヶ峰公園",
    position: [35.483, 139.547],
    color: "#8BC34A",
    icon: React.createElement(ParkIcon),
    details: { address: "旭区鶴ヶ峰6-1-1", type: "都市公園", area: "2.5ha" },
  },
  {
    id: "park-2",
    type: "公園",
    name: "さちが丘公園",
    position: [35.458, 139.518],
    color: "#8BC34A",
    icon: React.createElement(ParkIcon),
    details: { address: "旭区さちが丘55-1", type: "児童公園", area: "0.8ha" },
  },
];

// データタイプの定義
export const dataTypes: DataType[] = [
  {
    key: "消防署",
    label: "消防署",
    color: "#E53E3E",
    icon: React.createElement(LocalFireDepartmentIcon),
  },
  { 
    key: "病院", 
    label: "病院", 
    color: "#2196F3", 
    icon: React.createElement(LocalHospitalIcon) 
  },
  { 
    key: "学校", 
    label: "学校", 
    color: "#4CAF50", 
    icon: React.createElement(SchoolIcon) 
  },
  { 
    key: "商業施設", 
    label: "商業施設", 
    color: "#FF9800", 
    icon: React.createElement(StoreIcon) 
  },
  { 
    key: "交通", 
    label: "交通", 
    color: "#9C27B0", 
    icon: React.createElement(TrainIcon) 
  },
  {
    key: "福祉施設",
    label: "福祉施設",
    color: "#FF6B9D",
    icon: React.createElement(ElderlyIcon),
  },
  {
    key: "公園",
    label: "公園",
    color: "#8BC34A",
    icon: React.createElement(ParkIcon),
  },
]; 