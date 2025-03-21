import { WidgetDefinition } from '../mock-data';

export function getProjectsRdsContent(widget: WidgetDefinition): string {
  let projects = [];
  try {
    projects = JSON.parse(widget.content || '[]');
  } catch (e) {
    console.error('Failed to parse Projects RDS content', e);
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
        .project-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .project-item {
          padding: 12px;
          border-radius: 6px;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        body.dark .project-item {
          background: #2d3748;
        }
        .project-name {
          font-weight: 600;
          margin: 0;
        }
        .status {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          white-space: nowrap;
        }
        .status-draft {
          background: #e5e7eb;
          color: #4b5563;
        }
        body.dark .status-draft {
          background: #4b5563;
          color: #e5e7eb;
        }
        .status-awaiting {
          background: #fef3c7;
          color: #92400e;
        }
        body.dark .status-awaiting {
          background: #78350f;
          color: #fde68a;
        }
        .status-processing {
          background: #dbeafe;
          color: #1e40af;
        }
        body.dark .status-processing {
          background: #1e40af;
          color: #bfdbfe;
        }
        .status-rejected {
          background: #fee2e2;
          color: #b91c1c;
        }
        body.dark .status-rejected {
          background: #b91c1c;
          color: #fecaca;
        }
        .status-result {
          background: #d1fae5;
          color: #065f46;
        }
        body.dark .status-result {
          background: #065f46;
          color: #a7f3d0;
        }
        .empty-state {
          text-align: center;
          padding: 30px 0;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="project-list">
        ${projects.length > 0 ? projects.map(project => `
          <div class="project-item">
            <h3 class="project-name">${project.name}</h3>
            <div class="status status-${project.status.split(' ')[0].toLowerCase()}">
              ${project.status}
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <p>No projects available</p>
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
      </script>
    </body>
    </html>
  `;
}
