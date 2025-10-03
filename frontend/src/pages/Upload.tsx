import PageLayout from "@/components/layout/PageLayout";
import { Box, Typography } from "@mui/material";

export default function Upload() {
  return (
    <PageLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          ファイルアップロード
        </Typography>
      </Box>
    </PageLayout>
  );
}