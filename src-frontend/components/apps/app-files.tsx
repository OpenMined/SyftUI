import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getWorkspaceItems } from "@/lib/api/workspace";
import { Layers, FileText, ChevronLeft, Database } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { FilePreview } from "../workspace/file-preview";

export function AppFiles({ appPath }: { appPath: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<FileSystemItem[]>([]);
  const [previewFile, setPreviewFile] = useState<FileSystemItem | null>(null);

  const fetchFiles = useCallback(async (path: string, update: boolean) => {
    // Always fetch 1 level deep to properly populate directory children count
    const workspaceItems = (await getWorkspaceItems(path, 1)) || [];
    workspaceItems.sort((a, b) => {
      // Always show folders before files regardless of sort option
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      // If both are the same type (folder or file), then sort by name
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
      });
    });

    if (update) {
      // recursively find and update the item in the state with the fetched items
      setFiles((prevFiles) => {
        const updateItemInTree = (
          items: FileSystemItem[],
        ): FileSystemItem[] => {
          return items.map((item) => {
            if (item.path === path) {
              return { ...item, children: workspaceItems };
            }
            if (item.children) {
              return { ...item, children: updateItemInTree(item.children) };
            }
            return item;
          });
        };
        return updateItemInTree(prevFiles);
      });
    } else {
      setFiles(workspaceItems);
    }
  }, []);

  useEffect(() => {
    fetchFiles(appPath, false);
  }, [fetchFiles, appPath]);

  const handleExpand = (item: FileSystemItem) => {
    if (item.type === "folder") {
      fetchFiles(item.path, true);
    }
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="px-2 text-sm font-medium">App Files</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              router.push(
                `/workspace?path=${appPath.charAt(0) === "/" ? appPath.slice(1) : appPath}`,
              )
            }
          >
            <Database className="mr-1 h-4 w-4" />
            Open in Workspace
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="bg-background overflow-hidden rounded-lg border">
          <div className="bg-muted/50 text-muted-foreground grid grid-cols-12 px-4 py-2 text-xs uppercase">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-4">Modified</div>
          </div>
          <div className="divide-y">
            {files.map((item, index) => (
              <FileTreeItem
                key={index}
                item={item}
                level={0}
                handleExpandDirectory={handleExpand}
                handlePreviewFile={(previewFile) => setPreviewFile(previewFile)}
              />
            ))}
          </div>
        </div>
      </div>
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}

// File Tree Item component
const FileTreeItem = ({
  item,
  level,
  handleExpandDirectory,
  handlePreviewFile,
}: {
  item: FileSystemItem;
  level: number;
  handleExpandDirectory: (item: FileSystemItem) => void;
  handlePreviewFile: (file: FileSystemItem) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFolder = item.type === "folder";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      if (!isExpanded) {
        handleExpandDirectory(item);
      }
      setIsExpanded(!isExpanded);
    } else {
      console.log("previewing file", item);
      handlePreviewFile(item);
    }
  };

  return (
    <>
      <div
        className="hover:bg-muted/30 grid cursor-pointer grid-cols-12 items-center px-4 py-2"
        onClick={handleClick}
      >
        <div className="col-span-6 flex items-center">
          <div
            style={{ marginLeft: `${level * 16}px` }}
            className="flex items-center"
          >
            {isFolder ? (
              <div className="flex items-center">
                <div className="mr-1 w-4">
                  {isExpanded ? (
                    <ChevronLeft className="text-muted-foreground h-4 w-4 rotate-90" />
                  ) : (
                    <ChevronLeft className="text-muted-foreground h-4 w-4 -rotate-90" />
                  )}
                </div>
                <Layers className="mr-2 h-4 w-4 text-blue-500" />
              </div>
            ) : (
              <div className="ml-5">
                <FileText className="mr-2 h-4 w-4 text-gray-500" />
              </div>
            )}
            <span>{item.name}</span>
          </div>
        </div>
        <div className="text-muted-foreground col-span-2 text-sm">
          {isFolder
            ? `${item.children?.length || 0} items`
            : `${item.size} bytes`}
        </div>
        <div className="text-muted-foreground col-span-4 text-sm">
          {item.modifiedAt || ""}
        </div>
      </div>

      {isFolder && isExpanded && item.children && (
        <div className="bg-muted/10">
          {item.children.map((child: FileSystemItem, childIndex: number) => (
            <FileTreeItem
              key={childIndex}
              item={child}
              level={level + 1}
              handleExpandDirectory={handleExpandDirectory}
              handlePreviewFile={handlePreviewFile}
            />
          ))}
        </div>
      )}
    </>
  );
};
