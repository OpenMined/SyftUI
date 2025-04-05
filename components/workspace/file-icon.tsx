import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileIcon as FilePdf,
  FileArchive,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileIconProps {
  type: "file" | "folder";
  extension?: string;
  className?: string;
}

export function FileIcon({ type, extension, className }: FileIconProps) {
  if (type === "folder") {
    return <Folder className={cn("h-full w-full text-blue-500", className)} />;
  }

  // Determine icon based on file extension
  switch (extension?.toLowerCase()) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return (
        <FileImage className={cn("h-full w-full text-green-500", className)} />
      );
    case "mp4":
    case "webm":
    case "mov":
    case "avi":
      return (
        <FileVideo className={cn("h-full w-full text-purple-500", className)} />
      );
    case "mp3":
    case "wav":
    case "ogg":
      return (
        <FileAudio className={cn("h-full w-full text-pink-500", className)} />
      );
    case "pdf":
      return (
        <FilePdf className={cn("h-full w-full text-red-500", className)} />
      );
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return (
        <FileArchive
          className={cn("h-full w-full text-yellow-500", className)}
        />
      );
    case "html":
    case "css":
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "json":
    case "yaml":
    case "yml":
    case "xml":
      return (
        <FileCode className={cn("h-full w-full text-cyan-500", className)} />
      );
    case "txt":
    case "md":
    case "doc":
    case "docx":
      return (
        <FileText className={cn("h-full w-full text-blue-400", className)} />
      );
    default:
      return <File className={cn("h-full w-full text-gray-500", className)} />;
  }
}
