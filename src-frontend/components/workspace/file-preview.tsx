"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";
import type { FileSystemItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/workspace/file-icon";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  prism,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import {
  getWorkspaceContent,
  getWorkspaceContentUrl,
} from "@/lib/api/workspace";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface FilePreviewProps {
  file: FileSystemItem;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the correct content type for the file
  const isTextFile = useCallback((): boolean => {
    const textExtensions = [
      "txt",
      "md",
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "json",
      "yaml",
      "yml",
      "py",
      "java",
      "c",
      "cpp",
      "rb",
      "php",
      "go",
      "sh",
      "xml",
      "csv",
      "log",
      "ini",
      "toml",
      "rs",
      "swift",
      "kt",
      "dart",
    ];
    return textExtensions.includes(extension || "");
  }, [extension]);

  // Load the file content
  useEffect(() => {
    if (!file || !file.path) return;

    setIsLoading(true);
    setError(null);

    // For text files, fetch and display the content
    if (isTextFile()) {
      const fetchContent = async () => {
        try {
          const response = await getWorkspaceContent(file.path);
          const text = await response.text();
          setFileContent(text);
          setIsLoading(false);
        } catch (err) {
          console.error("Error fetching file content:", err);
          setError("Failed to load file content");
          setIsLoading(false);
          toast({
            title: "Error loading file",
            description: err instanceof Error ? err.message : "Unknown error",
            variant: "destructive",
          });
        }
      };

      fetchContent();
    } else {
      // For non-text files, we don't need to fetch the content in advance
      setIsLoading(false);
    }
  }, [file, isTextFile]);

  // Handle file download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      // Use our API function that already handles authentication
      const response = await getWorkspaceContent(file.path);
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);

      // Trigger the download
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setIsDownloading(false);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError("Failed to download file");
      setIsDownloading(false);
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const renderPreview = () => {
    // Show loading state if content is being fetched
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading file content...</p>
          </div>
        </div>
      );
    }

    // Show error state if there was a problem
    if (error) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="max-w-md text-center">
            <p className="text-destructive mb-2 font-medium">
              Error loading file
            </p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      );
    }

    // Handle image files
    if (
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      const imageUrl = getWorkspaceContentUrl(file.path);
      return (
        <div className="flex h-full items-center justify-center">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={imageUrl}
            alt={file.name}
            className="max-h-full max-w-full rounded-md object-contain"
          />
        </div>
      );
    }

    // Handle video files
    if (["mp4", "webm"].includes(extension || "")) {
      const videoUrl = getWorkspaceContentUrl(file.path);
      return (
        <div className="flex h-full items-center justify-center">
          <div className="w-full max-w-2xl">
            <video
              className="h-auto w-full rounded-md"
              controls
              autoPlay={false}
              src={videoUrl}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );
    }

    // Handle PDF files
    if (["pdf"].includes(extension || "")) {
      const pdfUrl = getWorkspaceContentUrl(file.path);
      return (
        <div className="flex h-full items-center justify-center">
          <iframe
            src={pdfUrl}
            className="h-full w-full rounded-md"
            title={file.name}
          />
        </div>
      );
    }

    // Handle text and code files
    if (isTextFile() && fileContent !== null) {
      // Map file extensions to language for syntax highlighting
      const getLanguage = () => {
        switch (extension) {
          case "js":
          case "jsx":
            return "javascript";
          case "ts":
          case "tsx":
            return "typescript";
          case "html":
            return "html";
          case "css":
            return "css";
          case "json":
            return "json";
          case "py":
            return "python";
          case "java":
            return "java";
          case "c":
            return "c";
          case "cpp":
            return "cpp";
          case "rb":
            return "ruby";
          case "php":
            return "php";
          case "go":
            return "go";
          case "md":
            return "markdown";
          default:
            return "text";
        }
      };

      const language = getLanguage();
      const codeStyle = isDarkTheme ? vscDarkPlus : prism;

      return (
        <div className="flex h-full flex-col">
          <div className="h-full overflow-auto rounded-md">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <SyntaxHighlighter
                language={language}
                style={codeStyle}
                showLineNumbers
                customStyle={{
                  margin: 0,
                  borderRadius: "0.375rem",
                  height: "100%",
                  fontSize: "0.875rem",
                }}
              >
                {fileContent}
              </SyntaxHighlighter>
            </motion.div>
          </div>
        </div>
      );
    }

    // Default preview for unsupported file types
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FileIcon type="file" extension={extension} className="h-24 w-24" />
        </motion.div>
        <p className="text-muted-foreground">
          Preview not available for this file type
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download file
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border-border flex h-[80vh] w-full max-w-4xl flex-col rounded-lg border shadow-lg"
        >
          <div className="border-border flex items-center justify-between border-b p-4">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">{renderPreview()}</div>
          <div className="border-border flex items-center justify-between border-t p-4">
            <div className="text-muted-foreground text-sm">
              Last modified: {new Date(file.modifiedAt).toLocaleString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
