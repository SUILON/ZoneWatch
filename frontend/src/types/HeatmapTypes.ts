import React from "react";

export interface BadgeData {
  id: string;
  type: string;
  name: string;
  position: [number, number];
  color: string;
  icon: React.ReactNode;
  details?: any;
}

export interface DataType {
  key: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}

export interface FireDepartmentBranch {
  name: string;
  address: string;
  phoneNumber: string;
  color: string;
  center: [number, number];
  zoom: number;
  areas: string[];
}

export interface FireDepartmentData {
  mainStation: {
    name: string;
    address: string;
    phoneNumber: string;
    color: string;
    center: [number, number];
    zoom: number;
    areas: string[];
  };
  branches: FireDepartmentBranch[];
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
}

export type ColorMappingType =
  | "fireDepartment"
  | "emergencyCalls"
  | "populationDensity";

export interface ColorMappingOption {
  key: ColorMappingType;
  label: string;
  description: string;
}
