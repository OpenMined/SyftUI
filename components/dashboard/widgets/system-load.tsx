import { WidgetDefinition } from '../mock-data';

export function getSystemLoadContent(widget: WidgetDefinition): string {
  let systemData = [];
  try {
    systemData = JSON.parse(widget.content || '[]');
  } catch (e) {
    console.error('Failed to parse System Load content', e);
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
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
          color: #333;
          background: #f9fafb;
        }
        .dark body {
          background: #1f2937;
          color: #f3f4f6;
        }
        .chart-container {
          position: relative;
          height: calc(50% - 10px);
          margin-bottom: 20px;
        }
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #4b5563;
        }
        .dark .chart-title {
          color: #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="chart-container">
        <h3 class="chart-title">CPU Load Average (%)</h3>
        <canvas id="cpuChart"></canvas>
      </div>
      <div class="chart-container">
        <h3 class="chart-title">RAM Usage (%)</h3>
        <canvas id="ramChart"></canvas>
      </div>
      <script>
        // Check parent theme and apply to iframe
        const parentTheme = window.parent.document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        if (parentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
        
        // Parse data
        const data = ${JSON.stringify(systemData)};
        
        // Format data for charts
        const labels = data.map(entry => {
          const date = new Date(entry.time);
          return date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0');
        });
        
        const cpuData = data.map(entry => entry.cpu);
        const ramData = data.map(entry => entry.ram);
        
        // Common chart options
        const commonOptions = {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: 'easeOutQuart',
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                },
                color: parentTheme === 'dark' ? '#9ca3af' : '#6b7280',
              },
              grid: {
                color: parentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              }
            },
            x: {
              ticks: {
                maxRotation: 0,
                autoSkip: true,
                maxTicksLimit: 10,
                color: parentTheme === 'dark' ? '#9ca3af' : '#6b7280',
              },
              grid: {
                display: false,
              }
            }
          },
          elements: {
            point: {
              radius: 0,
              hoverRadius: 4,
            },
            line: {
              tension: 0.2,
            }
          }
        };
        
        // CPU Chart
        const cpuCtx = document.getElementById('cpuChart').getContext('2d');
        const cpuChart = new Chart(cpuCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              data: cpuData,
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              fill: true,
              borderWidth: 2,
            }]
          },
          options: commonOptions
        });
        
        // RAM Chart
        const ramCtx = document.getElementById('ramChart').getContext('2d');
        const ramChart = new Chart(ramCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              data: ramData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              fill: true,
              borderWidth: 2,
            }]
          },
          options: commonOptions
        });
        
        // Simulate real-time updates
        setInterval(() => {
          // Generate new data point
          const lastTime = new Date(data[data.length - 1].time);
          const newTime = new Date(lastTime.getTime() + 60000);
          
          // Add new data point
          const newCpuValue = Math.max(5, Math.min(95, cpuData[cpuData.length - 1] + (Math.random() * 10 - 5)));
          const newRamValue = Math.max(10, Math.min(90, ramData[ramData.length - 1] + (Math.random() * 8 - 4)));
          
          // Update chart data
          labels.push(newTime.getHours() + ':' + newTime.getMinutes().toString().padStart(2, '0'));
          cpuData.push(newCpuValue);
          ramData.push(newRamValue);
          
          // Remove oldest data point
          labels.shift();
          cpuData.shift();
          ramData.shift();
          
          // Update charts
          cpuChart.update();
          ramChart.update();
        }, 10000);
      </script>
    </body>
    </html>
  `;
}
