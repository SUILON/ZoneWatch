import React from "react";
import {
  Box,
  Typography,
  Chip,
  TextField,
  IconButton,
  Slider,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import TodayIcon from "@mui/icons-material/Today";

interface DateControlProps {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  predictionStartDate: Date;
  onDateChange: (event: Event, newValue: number | number[]) => void;
  onYearChange: (increment: number) => void;
  onMonthChange: (increment: number) => void;
  onDayChange: (increment: number) => void;
  onDateInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSetToToday: () => void;
  dateToValue: (date: Date) => number;
  valueToDate: (value: number) => Date;
  formatDate: (date: Date) => string;
  isPredictionPeriod: (date: Date) => boolean;
}

export const DateControl: React.FC<DateControlProps> = ({
  selectedDate,
  minDate,
  maxDate,
  onDateChange,
  onYearChange,
  onMonthChange,
  onDayChange,
  onDateInputChange,
  onSetToToday,
  dateToValue,
  valueToDate,
  formatDate,
  isPredictionPeriod,
}) => {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const isTodayInRange = today >= minDate && today <= maxDate;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1, minHeight: "32px" }}>
        <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
          日付選択:
        </Typography>
        {isPredictionPeriod(selectedDate) && (
          <Chip
            label="予測データ"
            size="small"
            sx={{
              ml: 1,
              backgroundColor: "#FF6B6B",
              color: "white",
              fontSize: "0.7rem",
              height: "20px",
              "& .MuiChip-label": {
                padding: "0 8px",
                lineHeight: "20px",
              },
            }}
          />
        )}
      </Box>
      
      {/* 日付入力フィールドと今日ボタン */}
      <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
        <TextField
          type="date"
          value={selectedDate.toISOString().split('T')[0]}
          onChange={onDateInputChange}
          size="small"
          sx={{ flex: 1 }}
          inputProps={{
            min: minDate.toISOString().split('T')[0],
            max: maxDate.toISOString().split('T')[0],
          }}
        />
        <Button
          variant={isToday ? "contained" : "outlined"}
          size="small"
          onClick={onSetToToday}
          disabled={!isTodayInRange}
          startIcon={<TodayIcon />}
          sx={{
            minWidth: "auto",
            px: 1,
            fontSize: "0.75rem",
            ...(isToday && {
              backgroundColor: "#4CAF50",
              "&:hover": {
                backgroundColor: "#45a049",
              },
            }),
          }}
        >
          今日
        </Button>
      </Box>

      {/* 年、月、日のボタン操作 */}
      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        {/* 年 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, outline: "1px solid #ccc", borderRadius: "4px" }}>
          <IconButton
            size="small"
            onClick={() => onYearChange(-1)}
            disabled={selectedDate.getFullYear() <= minDate.getFullYear()}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: "40px", textAlign: "center" }}>
            {selectedDate.getFullYear()}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onYearChange(1)}
            disabled={selectedDate.getFullYear() >= maxDate.getFullYear()}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 月 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, outline: "1px solid #ccc", borderRadius: "4px" }}>
          <IconButton
            size="small"
            onClick={() => onMonthChange(-1)}
            disabled={selectedDate <= minDate}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: "30px", textAlign: "center" }}>
            {selectedDate.getMonth() + 1}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onMonthChange(1)}
            disabled={selectedDate >= maxDate}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* 日 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, outline: "1px solid #ccc", borderRadius: "4px" }}>
          <IconButton
            size="small"
            onClick={() => onDayChange(-1)}
            disabled={selectedDate <= minDate}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
          <Typography variant="body2" sx={{ minWidth: "30px", textAlign: "center" }}>
            {selectedDate.getDate()}
          </Typography>
          <IconButton
            size="small"
            onClick={() => onDayChange(1)}
            disabled={selectedDate >= maxDate}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ px: 1 }}>
        <Slider
          value={dateToValue(selectedDate)}
          onChange={onDateChange}
          min={dateToValue(minDate)}
          max={dateToValue(maxDate)}
          step={24 * 60 * 60 * 1000} // 1日単位
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => formatDate(valueToDate(value))}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          過去データ
        </Typography>
        <Typography variant="caption" color="text.secondary">
          予測データ
        </Typography>
      </Box>
    </Box>
  );
}; 