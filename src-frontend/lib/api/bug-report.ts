import { useConnectionStore } from "@/stores";

export interface BugReportRequest {
  title: string;
  description: string;
  version: string;
  os: string;
  arch: string;
  logs?: Blob;
  screenshots?: File[];
}

export interface BugReportResponse {
  status: string;
  message: string;
  ticket_id?: string;
}

/**
 * Submit a bug report to the server
 * @param request - The bug report request data including optional files
 * @returns A promise that resolves to the bug report response
 */
export async function submitBugReport(
  request: BugReportRequest,
): Promise<BugReportResponse> {
  const {
    datasite: { email },
  } = useConnectionStore.getState();

  // Create FormData and append all fields
  const formData = new FormData();
  formData.append("email", email);
  formData.append("title", request.title);
  formData.append("description", request.description);
  formData.append("version", request.version);
  formData.append("os", request.os);
  formData.append("arch", request.arch);
  formData.append("captcha_token", "dummy_token"); // TODO: add captcha

  // Append logs if present
  if (request.logs) {
    formData.append("logs", request.logs, "syftbox-logs.zip");
  }

  // Append screenshots if present
  if (request.screenshots) {
    request.screenshots.forEach((file) => {
      formData.append("screenshots", file);
    });
  }

  const response = await fetch("http://localhost:8080/services/report-bug", {
    method: "POST",
    headers: {
      // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Failed to submit bug report`);
  }

  return response.json() as Promise<BugReportResponse>;
}
