import Heatmap from "@/components/heatmap/Heatmap";
import PageLayout from "@/components/layout/PageLayout";
import Report from "@/components/report/Report";
import { Tab, Tabs, Box } from "@mui/material";
import { useState } from "react";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ height: value === index ? "100%" : "auto" }}
      {...other}
    >
      {value === index && <Box sx={{ height: "100%" }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function Home() {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <PageLayout>
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
            <Tab label="ヒートマップ" {...a11yProps(0)} />
            <Tab label="レポート" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <TabPanel value={value} index={0}>
            <Heatmap />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Report />
          </TabPanel>
        </Box>
      </Box>
    </PageLayout>
  );
}
