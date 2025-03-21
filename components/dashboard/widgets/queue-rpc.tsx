import { WidgetDefinition } from '../mock-data';

export function getQueueRpcContent(widget: WidgetDefinition): string {
  let requests = [];
  try {
    requests = JSON.parse(widget.content || '[]');
  } catch (e) {
    console.error('Failed to parse Queue RPC content', e);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
          margin: 0;
          padding: 10px;
          font-size: 14px;
          height: 100vh;
          overflow-y: auto;
          color: #333;
          background: #f9fafb;
        }
        body.dark {
          background: #1f2937;
          color: #f3f4f6;
        }
        .request-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .request-item {
          padding: 12px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        body.dark .request-item {
          background: #2d3748;
        }
        .request-info {
          flex-grow: 1;
        }
        .request-url {
          font-weight: 600;
          margin: 0 0 4px 0;
          word-break: break-all;
        }
        .request-meta {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        body.dark .request-meta {
          color: #9ca3af;
        }
        .status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          margin-left: 8px;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        body.dark .status-pending {
          background: #78350f;
          color: #fde68a;
        }
        .status-success {
          background: #d1fae5;
          color: #065f46;
        }
        body.dark .status-success {
          background: #065f46;
          color: #a7f3d0;
        }
        .status-failed {
          background: #fee2e2;
          color: #b91c1c;
        }
        body.dark .status-failed {
          background: #b91c1c;
          color: #fecaca;
        }
        .empty-state {
          text-align: center;
          padding: 30px 0;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="request-list">
        ${requests.length > 0 ? requests.map(req => `
          <div class="request-item">
            <div class="request-info">
              <h3 class="request-url">${req.url}</h3>
              <p class="request-meta">
                ${req.uuid.substring(0, 8)}... · ${new Date(req.timestamp).toLocaleTimeString()}
              </p>
            </div>
            <div class="status status-${req.status}">
              ${req.status}
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <p>No requests in queue</p>
          </div>
        `}
      </div>
      <script>
        // Apply theme based on parent document
        function applyTheme() {
          try {
            const isDarkMode = window.parent.document.documentElement.classList.contains('dark');
            document.body.classList.toggle('dark', isDarkMode);
          } catch (e) {
            console.error('Error applying theme:', e);
          }
        }
        
        // Initial theme application
        applyTheme();
        
        // Watch for theme changes in parent document
        try {
          const themeObserver = new MutationObserver(() => {
            applyTheme();
          });
          
          themeObserver.observe(window.parent.document.documentElement, {
            attributes: true
          });
        } catch (e) {
          console.error('Error setting up theme observer:', e);
        }
        
        // Simulate status changes
        setInterval(() => {
          const pendingItems = document.querySelectorAll('.status-pending');
          if (pendingItems.length > 0) {
            const randomIndex = Math.floor(Math.random() * pendingItems.length);
            const item = pendingItems[randomIndex];
            const newStatus = Math.random() > 0.3 ? 'success' : 'failed';
            
            item.classList.remove('status-pending');
            item.classList.add(\`status-\${newStatus}\`);
            item.textContent = newStatus;
          }
        }, 5000);
      </script>
    </body>
    </html>
  `;
}
