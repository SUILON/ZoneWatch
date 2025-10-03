import React, { useCallback, useMemo, useRef, useState } from "react";
import PageLayout from "@/components/layout/PageLayout";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

const ACCEPTED_EXTENSIONS = [".xlsx"];
const ACCEPTED_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const UPLOAD_ENDPOINT =
  (import.meta.env?.VITE_UPLOAD_API as string | undefined) ?? "/api/uploads";
const SHOULD_SIMULATE = (() => {
  const raw = (import.meta.env?.VITE_UPLOAD_SIMULATE as string | undefined) ?? "true";
  return !["false", "0", "off"].includes(raw.toLowerCase());
})();

const createFileId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const Upload: React.FC = () => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<
    { type: "success" | "info" | "warning" | "error"; message: string } | null
  >(null);

  const acceptAttribute = useMemo(
    () => ACCEPTED_EXTENSIONS.join(","),
    []
  );

  const updateFile = useCallback(
    (id: string, patch: Partial<QueuedFile>) => {
      setQueuedFiles(prev =>
        prev.map(item => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;

      const duplicates: string[] = [];
      const disallowed: string[] = [];
      const additions: QueuedFile[] = [];

      Array.from(fileList).forEach(file => {
        const existing = queuedFiles.find(
          item =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified
        );

        if (existing) {
          duplicates.push(file.name);
          return;
        }

        if (
          ACCEPTED_EXTENSIONS.length > 0 &&
          !ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
        ) {
          disallowed.push(file.name);
          return;
        }

        additions.push({
          id: createFileId(),
          file,
          progress: 0,
          status: "pending",
        });
      });

      if (additions.length) {
        setQueuedFiles(prev => [...prev, ...additions]);
        setFeedback({
          type: "success",
          message: `${additions.length} 件のファイルを追加しました。`,
        });
      }

      if (duplicates.length || disallowed.length) {
        const messages: string[] = [];
        if (duplicates.length) {
          messages.push(`重複のためスキップ: ${duplicates.join(", ")}`);
        }
        if (disallowed.length) {
          messages.push(`未対応の形式: ${disallowed.join(", ")}`);
        }
        setFeedback({
          type: "warning",
          message: messages.join(" / "),
        });
      }
    },
    [queuedFiles]
  );

  const resetInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleFiles(event.target.files);
    resetInput();
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!dropRef.current) return;
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFiles(event.dataTransfer?.files ?? null);
  };

  const handleRemove = (id: string) => {
    setQueuedFiles(prev => prev.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setQueuedFiles([]);
    resetInput();
  };

  const runSimulatedUpload = useCallback(
    (file: QueuedFile) =>
      new Promise<void>(resolve => {
        const totalSteps = Math.max(6, Math.min(30, Math.ceil(file.file.size / 65536)));
        let step = 0;
        const interval = window.setInterval(() => {
          step += 1;
          const progress = Math.min(100, Math.round((step / totalSteps) * 100));
          updateFile(file.id, { progress });
          if (progress >= 100) {
            window.clearInterval(interval);
            resolve();
          }
        }, 160);
      }),
    [updateFile]
  );

  const runRealUpload = useCallback(
    (file: QueuedFile) =>
      new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", UPLOAD_ENDPOINT, true);

        xhr.upload.onprogress = event => {
          if (!event.lengthComputable) return;
          const progress = Math.round((event.loaded / event.total) * 100);
          updateFile(file.id, { progress });
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            updateFile(file.id, { progress: 100 });
            resolve();
          } else {
            reject(new Error(xhr.statusText || "アップロードに失敗しました"));
          }
        };

        xhr.onerror = () => {
          reject(new Error("ネットワークエラーが発生しました"));
        };

        const formData = new FormData();
        formData.append("file", file.file);
        xhr.send(formData);
      }),
    [updateFile]
  );

  const handleUploadAll = async () => {
    const targets = queuedFiles.filter(file => file.status === "pending" || file.status === "error");
    if (!targets.length) {
      setFeedback({ type: "info", message: "アップロード待ちのファイルはありません。" });
      return;
    }

    setIsUploading(true);
    setFeedback(null);
    let allSucceeded = true;

    for (const queued of targets) {
      updateFile(queued.id, { status: "uploading", progress: 0, error: undefined });
      try {
        if (SHOULD_SIMULATE) {
          await runSimulatedUpload(queued);
        } else {
          await runRealUpload(queued);
        }
        updateFile(queued.id, { status: "success", progress: 100 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "アップロードに失敗しました";
        updateFile(queued.id, { status: "error", error: message });
        setFeedback({ type: "error", message });
        allSucceeded = false;
      }
    }

    setIsUploading(false);
    if (allSucceeded) {
      setFeedback({ type: "success", message: "アップロードが完了しました。" });
    }
  };

  const pendingCount = queuedFiles.filter(file => file.status === "pending").length;
  const errorCount = queuedFiles.filter(file => file.status === "error").length;
  const hasUploading = queuedFiles.some(file => file.status === "uploading");

  return (
    <PageLayout>
      <Box sx={{ p: { xs: 2, md: 4 }, mx: "auto", maxWidth: 960, width: "100%" }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              ファイルアップロード
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ヒートマップや予測で利用するデータファイルをアップロードします。
              {` 対応形式: ${ACCEPTED_EXTENSIONS.join(", ")}`}
            </Typography>
          </Box>

          {feedback && (
            <Alert
              severity={feedback.type}
              onClose={() => setFeedback(null)}
              variant="outlined"
            >
              {feedback.message}
            </Alert>
          )}

          <Box
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            sx={{
              border: "2px dashed",
              borderColor: isDragActive ? "primary.main" : "divider",
              borderRadius: 2,
              p: { xs: 4, md: 6 },
              textAlign: "center",
              backgroundColor: isDragActive
                ? theme.palette.action.hover
                : theme.palette.background.paper,
              transition: theme.transitions.create(["border-color", "background-color"], {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            <Stack spacing={2} alignItems="center">
              <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
              <Box>
                <Typography variant="h6" component="p">
                  ファイルをここにドラッグ＆ドロップ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  または「ファイルを選択」からアップロードするファイルを指定してください。
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Button
                  variant="contained"
                  startIcon={<CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || hasUploading}
                  sx={{ minWidth: 160 }}
                >
                  ファイルを選択
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleUploadAll}
                  disabled={isUploading || (!pendingCount && !errorCount)}
                  sx={{ minWidth: 180 }}
                >
                  アップロード開始
                </Button>
                <Button
                  variant="text"
                  color="inherit"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleClearAll}
                  disabled={isUploading || queuedFiles.length === 0}
                  sx={{ minWidth: 160 }}
                >
                  すべてクリア
                </Button>
              </Stack>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept={acceptAttribute}
                onChange={handleFileInputChange}
              />
            </Stack>
          </Box>

          {queuedFiles.length > 0 && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6">アップロード待ちファイル</Typography>
                <Divider flexItem orientation="vertical" />
                <Chip
                  size="small"
                  color={pendingCount ? "info" : "default"}
                  label={`待機 ${pendingCount}`}
                />
                <Chip
                  size="small"
                  color={errorCount ? "error" : "default"}
                  label={`エラー ${errorCount}`}
                />
              </Stack>

              <List
                sx={{
                  width: "100%",
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  border: 1,
                  borderColor: "divider",
                  overflow: "hidden",
                }}
                disablePadding
              >
                {queuedFiles.map((item, index) => {
                  const statusChip = (() => {
                    switch (item.status) {
                      case "success":
                        return (
                          <Chip
                            size="small"
                            color="success"
                            icon={<CheckCircleIcon fontSize="small" />}
                            label="完了"
                            variant="outlined"
                          />
                        );
                      case "uploading":
                        return (
                          <Chip
                            size="small"
                            color="info"
                            icon={<CloudUploadIcon fontSize="small" />}
                            label="アップロード中"
                            variant="outlined"
                          />
                        );
                      case "error":
                        return (
                          <Chip
                            size="small"
                            color="error"
                            icon={<ErrorOutlineIcon fontSize="small" />}
                            label="エラー"
                            variant="outlined"
                          />
                        );
                      default:
                        return (
                          <Chip size="small" label="待機中" variant="outlined" />
                        );
                    }
                  })();

                  return (
                    <React.Fragment key={item.id}>
                      <ListItem
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "stretch",
                          gap: 1,
                          py: 2,
                          px: 2,
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%" }}>
                          <InsertDriveFileIcon color="action" />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" noWrap>
                                  {item.file.name}
                                </Typography>
                              }
                              secondary={
                <Typography variant="caption" color="text.secondary">
                  {item.file.type || ""}
                </Typography>
                              }
                            />
                          </Box>
                          {statusChip}
                          <Tooltip title="削除">
                            <span>
                              <IconButton
                                edge="end"
                                onClick={() => handleRemove(item.id)}
                                disabled={item.status === "uploading"}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>

                        {item.status === "uploading" && (
                          <LinearProgress variant="determinate" value={item.progress} sx={{ borderRadius: 999 }} />
                        )}
                        {item.status === "error" && item.error && (
                          <Typography variant="caption" color="error.main">
                            {item.error}
                          </Typography>
                        )}
                      </ListItem>
                      {index < queuedFiles.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  );
                })}
              </List>
            </Box>
          )}
        </Stack>
      </Box>
    </PageLayout>
  );
};

export default Upload;
