import type { FileSystemItem } from "@/lib/types";
import { useConnectionStore } from "@/stores/useConnectionStore";

interface WorkspaceItemsResponse {
  items: FileSystemItem[];
}

interface WorkspaceItemCreateResponse {
  item: FileSystemItem;
}

interface WorkspaceItemCreateRequest {
  path: string;
  type: "file" | "folder";
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

export async function createWorkspaceItem(
  request: WorkspaceItemCreateRequest,
): Promise<FileSystemItem> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/workspace/items`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workspace item: ${response.statusText}`);
  }

  const data: WorkspaceItemCreateResponse = await response.json();
  return data.item;
}
