import { WidgetDefinition } from './mock-data';
import { getApiRequestsContent } from './widgets/api-requests';
import { getQueueRpcContent } from './widgets/queue-rpc';
import { getProjectsRdsContent } from './widgets/projects-rds';
import { getSystemLoadContent } from './widgets/system-load';

// Function to generate HTML content for each widget type
export function getWidgetContent(widget: WidgetDefinition): string {
  switch (widget.type) {
    case 'api-requests':
      return getApiRequestsContent(widget);
    case 'queue-rpc':
      return getQueueRpcContent(widget);
    case 'projects-rds':
      return getProjectsRdsContent(widget);
    case 'system-load':
      return getSystemLoadContent(widget);
    default:
      return `<div class="flex items-center justify-center h-full">
                <p>Widget content not available</p>
              </div>`;
  }
}
