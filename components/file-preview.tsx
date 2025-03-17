"use client"
import { X, Download } from "lucide-react"
import type { FileSystemItem } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FileIcon } from "@/components/file-icon"
import { motion, AnimatePresence } from "framer-motion"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus, prism } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useTheme } from "next-themes"

interface FilePreviewProps {
  file: FileSystemItem
  onClose: () => void
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const extension = file.name.split(".").pop()?.toLowerCase()
  const { theme } = useTheme()
  const isDarkTheme = theme === "dark"

  const renderPreview = () => {
    // In a real app, this would handle actual file previews
    // For this mock, we'll just show placeholders based on file type

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return (
        <div className="flex items-center justify-center h-full">
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={`/placeholder.svg?height=400&width=600`}
            alt={file.name}
            className="max-h-full max-w-full object-contain rounded-md"
          />
        </div>
      )
    }

    if (["mp4", "webm"].includes(extension || "")) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-muted rounded-md w-full max-w-2xl aspect-video flex items-center justify-center">
            <p className="text-muted-foreground">Video Preview Placeholder</p>
          </div>
        </div>
      )
    }

    if (["pdf"].includes(extension || "")) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <FileIcon type="file" extension="pdf" className="h-24 w-24" />
          </motion.div>
          <p className="text-muted-foreground">PDF Preview Placeholder</p>
        </div>
      )
    }

    if (
      [
        "txt",
        "md",
        "js",
        "jsx",
        "ts",
        "tsx",
        "html",
        "css",
        "json",
        "py",
        "java",
        "c",
        "cpp",
        "rb",
        "php",
        "go",
      ].includes(extension || "")
    ) {
      // Map file extensions to language for syntax highlighting
      const getLanguage = () => {
        switch (extension) {
          case "js":
          case "jsx":
            return "javascript"
          case "ts":
          case "tsx":
            return "typescript"
          case "html":
            return "html"
          case "css":
            return "css"
          case "json":
            return "json"
          case "py":
            return "python"
          case "java":
            return "java"
          case "c":
            return "c"
          case "cpp":
            return "cpp"
          case "rb":
            return "ruby"
          case "php":
            return "php"
          case "go":
            return "go"
          case "md":
            return "markdown"
          default:
            return "text"
        }
      }

      const language = getLanguage()
      const codeStyle = isDarkTheme ? vscDarkPlus : prism

      const sampleCode = `// This is a mock preview for ${file.name}
                
// In a real application, this would show the actual file content
// For demonstration purposes, we're showing this placeholder text

function example() {
  console.log("Hello from ${file.name}!");
  return "This is just a preview placeholder";
}
                
// File metadata:
// Created: ${new Date(file.createdAt).toLocaleString()}
// Modified: ${new Date(file.modifiedAt).toLocaleString()}
// ID: ${file.id}
`

      return (
        <div className="h-full flex flex-col">
          <div className="bg-muted rounded-md h-full overflow-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
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
                {sampleCode}
              </SyntaxHighlighter>
            </motion.div>
          </div>
        </div>
      )
    }

    // Default preview for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <FileIcon type="file" extension={extension} className="h-24 w-24" />
        </motion.div>
        <p className="text-muted-foreground">Preview not available for this file type</p>
      </div>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-card border border-border rounded-lg shadow-lg w-full max-w-4xl h-[80vh] flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-medium">{file.name}</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">{renderPreview()}</div>
          <div className="p-4 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Last modified: {new Date(file.modifiedAt).toLocaleString()}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

