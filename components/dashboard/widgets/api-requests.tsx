import { WidgetDefinition } from '../mock-data';

export function getApiRequestsContent(widget: WidgetDefinition): string {
  let requests = [];
  try {
    requests = JSON.parse(widget.content || '[]');
  } catch (e) {
    console.error('Failed to parse API requests content', e);
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
        .dark body {
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
          align-items: center;
        }
        .dark .request-item {
          background: #2d3748;
        }
        .request-info {
          flex-grow: 1;
        }
        .request-title {
          font-weight: 600;
          margin: 0 0 4px 0;
        }
        .request-desc {
          font-size: 12px;
          color: #666;
          margin: 0;
        }
        .dark .request-desc {
          color: #9ca3af;
        }
        .actions {
          display: flex;
          gap: 8px;
        }
        .btn {
          border: none;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: transparent;
          transition: all 0.2s;
        }
        .btn:hover {
          background: #f0f0f0;
        }
        body.dark .btn:hover {
          background: #4b5563;
        }
        .btn-accept {
          color: #22c55e;
        }
        .btn-reject {
          color: #ef4444;
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
              <h3 class="request-title">${req.title}</h3>
              <p class="request-desc">${req.description}</p>
            </div>
            <div class="actions">
              <button class="btn btn-accept" title="Accept">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </button>
              <button class="btn btn-reject" title="Reject">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <p>No API requests in inbox</p>
          </div>
        `}
      </div>
      <script>
        // Function to update theme based on parent document
        const updateTheme = () => {
          const parentTheme = window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
          if (parentTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        };
        
        // Set initial theme
        updateTheme();
        
        // Watch for theme changes in parent document
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
              updateTheme();
            }
          });
        });
        
        // Start observing
        observer.observe(window.parent.document.documentElement, {
          attributes: true
        });
        
        // Add event listeners for buttons
        document.querySelectorAll('.btn').forEach(btn => {
          btn.addEventListener('click', function(e) {
            // Animation for feedback
            this.style.transform = 'scale(0.9)';
            setTimeout(() => this.style.transform = 'scale(1)', 100);
            
            // Remove item (just for demo)
            const item = this.closest('.request-item');
            item.style.opacity = '0';
            item.style.height = '0';
            item.style.marginTop = '0';
            item.style.marginBottom = '0';
            item.style.padding = '0';
            item.style.overflow = 'hidden';
            item.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
              item.remove();
              if (document.querySelectorAll('.request-item').length === 0) {
                const emptyState = document.createElement('div');
                emptyState.className = 'empty-state';
                emptyState.innerHTML = '<p>No API requests in inbox</p>';
                document.querySelector('.request-list').appendChild(emptyState);
              }
            }, 300);
          });
        });
      </script>
    </body>
    </html>
  `;
}
