import type { FileSystemItem } from "@/lib/types";
import { useConnectionStore } from "@/stores/useConnectionStore";

interface WorkspaceItemsResponse {
  items: FileSystemItem[];
}

export async function getWorkspaceItems(
  path: string = "",
  depth: number = 0,
): Promise<FileSystemItem[]> {
  const queryParams = new URLSearchParams();
  if (path) queryParams.append("path", path);
  if (depth) queryParams.append("depth", depth.toString());

  const {
    settings: { url, token },
  } = useConnectionStore.getState();
  const response = await fetch(
    `${url}/v1/workspace/items?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch workspace items: ${response.statusText}`);
  }

  const data: WorkspaceItemsResponse = await response.json();
  return data.items;
}
