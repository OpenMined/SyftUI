import type { FileSystemItem } from "@/lib/types";
import { useConnectionStore } from "@/stores/useConnectionStore";

interface WorkspaceItemsResponse {
  items: FileSystemItem[];
}

interface WorkspaceItemCreateRequest {
  path: string;
  type: "file" | "folder";
}

interface WorkspaceItemCreateResponse {
  item: FileSystemItem;
}

interface WorkspaceItemDeleteRequest {
  paths: string[];
}

interface WorkspaceItemMoveRequest {
  sourcePath: string;
  destinationPath: string;
  overwrite?: boolean;
}

interface WorkspaceItemMoveResponse {
  item: FileSystemItem;
}

interface WorkspaceItemCopyRequest {
  sourcePath: string;
  newPath: string;
  overwrite?: boolean;
}

interface WorkspaceItemCopyResponse {
  item: FileSystemItem;
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

export async function deleteWorkspaceItems(
  request: WorkspaceItemDeleteRequest,
): Promise<void> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const response = await fetch(`${url}/v1/workspace/items`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete workspace items: ${response.statusText}`);
  }
}

export async function moveWorkspaceItem(
  oldPath: string,
  newPath: string,
  options: { overwrite?: boolean } = {},
): Promise<FileSystemItem> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const request: WorkspaceItemMoveRequest = {
    oldPath,
    newPath,
    overwrite: options.overwrite,
  };

  const response = await fetch(`${url}/v1/workspace/items/move`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to move workspace item: ${response.statusText}`);
  }

  const data: WorkspaceItemMoveResponse = await response.json();
  return data.item;
}

export async function copyWorkspaceItem(
  sourcePath: string,
  newPath: string,
  options: { overwrite?: boolean } = {},
): Promise<FileSystemItem> {
  const {
    settings: { url, token },
  } = useConnectionStore.getState();

  const request: WorkspaceItemCopyRequest = {
    sourcePath,
    newPath,
    overwrite: options.overwrite,
  };

  const response = await fetch(`${url}/v1/workspace/items/copy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Failed to copy workspace item: ${response.statusText}`);
  }

  const data: WorkspaceItemCopyResponse = await response.json();
  return data.item;
}
