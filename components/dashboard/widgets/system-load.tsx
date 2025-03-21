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
        body.dark {
          background: #1f2937;
          color: #f3f4f6;
        }
        .chart-container {
          position: relative;
          height: calc(50% - 15px);
          margin-bottom: 20px;
        }
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 10px 0;
          color: #4b5563;
        }
        body.dark .chart-title {
          color: #e5e7eb;
        }
        .error-message {
          text-align: center;
          color: #ef4444;
          margin: 20px 0;
          padding: 10px;
          border-radius: 4px;
          background: rgba(239, 68, 68, 0.1);
          display: none;
        }
        body.dark .error-message {
          background: rgba(239, 68, 68, 0.2);
        }
      </style>
    </head>
    <body>
      <div id="errorMessage" class="error-message"></div>
      <div class="chart-container">
        <h3 class="chart-title">CPU Load Average (%)</h3>
        <canvas id="cpuChart"></canvas>
      </div>
      <div class="chart-container">
        <h3 class="chart-title">RAM Usage (%)</h3>
        <canvas id="ramChart"></canvas>
      </div>
      
      <script>
        // Global chart references
        let cpuChart = null;
        let ramChart = null;
        
        // Show error message if needed
        function showError(message) {
          const errorElement = document.getElementById('errorMessage');
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
        
        // Theme handling - simpler implementation
        function applyTheme() {
          try {
            const isDarkMode = window.parent.document.documentElement.classList.contains('dark');
            document.body.classList.toggle('dark', isDarkMode);
            return isDarkMode ? 'dark' : 'light';
          } catch (e) {
            console.error('Error applying theme:', e);
            return 'light';
          }
        }
        
        // Initial theme application
        const currentTheme = applyTheme();
        
        // Theme observer - watch for changes in parent document
        try {
          const themeObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              if (mutation.attributeName === 'class') {
                const newTheme = applyTheme();
                updateChartsForTheme(newTheme);
              }
            }
          });
          
          themeObserver.observe(window.parent.document.documentElement, {
            attributes: true
          });
        } catch (e) {
          console.error('Error setting up theme observer:', e);
          showError('Theme detection error: ' + e.message);
        }
        
        // Get colors based on theme
        function getChartColors(theme) {
          return {
            text: theme === 'dark' ? '#9ca3af' : '#6b7280',
            grid: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            cpuLine: '#3b82f6',
            cpuFill: 'rgba(59, 130, 246, 0.2)',
            ramLine: '#10b981',
            ramFill: 'rgba(16, 185, 129, 0.2)'
          };
        }
        
        // Update chart colors when theme changes
        function updateChartsForTheme(theme) {
          if (!cpuChart || !ramChart) return;
          
          const colors = getChartColors(theme);
          
          // Update CPU chart
          cpuChart.options.scales.y.ticks.color = colors.text;
          cpuChart.options.scales.y.grid.color = colors.grid;
          cpuChart.options.scales.x.ticks.color = colors.text;
          cpuChart.data.datasets[0].borderColor = colors.cpuLine;
          cpuChart.data.datasets[0].backgroundColor = colors.cpuFill;
          
          // Update RAM chart
          ramChart.options.scales.y.ticks.color = colors.text;
          ramChart.options.scales.y.grid.color = colors.grid;
          ramChart.options.scales.x.ticks.color = colors.text;
          ramChart.data.datasets[0].borderColor = colors.ramLine;
          ramChart.data.datasets[0].backgroundColor = colors.ramFill;
          
          // Apply updates
          cpuChart.update();
          ramChart.update();
        }
        
        // Data preparation
        function prepareData() {
          // Get data with fallback
          let rawData = ${JSON.stringify(systemData)};
          
          // Create default data if none available
          if (!Array.isArray(rawData) || rawData.length === 0) {
            rawData = [];
            const now = new Date();
            for (let i = 10; i >= 0; i--) {
              rawData.push({
                time: new Date(now.getTime() - i * 60000).toISOString(),
                cpu: Math.floor(Math.random() * 30) + 10,
                ram: Math.floor(Math.random() * 40) + 30
              });
            }
          }
          
          // Format data for charts
          const times = [];
          const cpuValues = [];
          const ramValues = [];
          
          for (const entry of rawData) {
            if (entry && entry.time) {
              const date = new Date(entry.time);
              times.push(date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0'));
              cpuValues.push(entry.cpu || 0);
              ramValues.push(entry.ram || 0);
            }
          }
          
          return { times, cpuValues, ramValues, rawData };
        }
        
        // Initialize charts
        function initializeCharts() {
          try {
            // Prepare data
            const { times, cpuValues, ramValues } = prepareData();
            if (times.length === 0) {
              throw new Error('No valid data available');
            }
            
            // Get colors based on current theme
            const colors = getChartColors(currentTheme);
            
            // Chart configuration
            const chartConfig = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: { mode: 'index', intersect: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: {
                    callback: (value) => value + '%',
                    color: colors.text
                  },
                  grid: { color: colors.grid }
                },
                x: {
                  ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 10,
                    color: colors.text
                  },
                  grid: { display: false }
                }
              },
              elements: {
                point: { radius: 0, hoverRadius: 4 },
                line: { tension: 0.2 }
              }
            };
            
            // CPU Chart
            const cpuCtx = document.getElementById('cpuChart').getContext('2d');
            cpuChart = new Chart(cpuCtx, {
              type: 'line',
              data: {
                labels: times,
                datasets: [{
                  data: cpuValues,
                  borderColor: colors.cpuLine,
                  backgroundColor: colors.cpuFill,
                  fill: true,
                  borderWidth: 2
                }]
              },
              options: JSON.parse(JSON.stringify(chartConfig))
            });
            
            // RAM Chart
            const ramCtx = document.getElementById('ramChart').getContext('2d');
            ramChart = new Chart(ramCtx, {
              type: 'line',
              data: {
                labels: times,
                datasets: [{
                  data: ramValues,
                  borderColor: colors.ramLine,
                  backgroundColor: colors.ramFill,
                  fill: true,
                  borderWidth: 2
                }]
              },
              options: JSON.parse(JSON.stringify(chartConfig))
            });
            
            return true;
          } catch (error) {
            console.error('Error initializing charts:', error);
            showError('Failed to initialize charts: ' + error.message);
            return false;
          }
        }
        
        // Update charts with new data
        function updateCharts() {
          if (!cpuChart || !ramChart) return;
          
          try {
            // Get current data
            const chartData = cpuChart.data;
            const labels = chartData.labels;
            const cpuData = chartData.datasets[0].data;
            const ramData = ramChart.data.datasets[0].data;
            
            if (!labels || !cpuData || !ramData || labels.length === 0) return;
            
            // Generate new data point
            const lastLabelParts = labels[labels.length - 1].split(':');
            const lastHour = parseInt(lastLabelParts[0]);
            const lastMinute = parseInt(lastLabelParts[1]);
            
            let newHour = lastHour;
            let newMinute = lastMinute + 1;
            
            if (newMinute >= 60) {
              newMinute = 0;
              newHour = (newHour + 1) % 24;
            }
            
            const newLabel = newHour + ':' + newMinute.toString().padStart(2, '0');
            
            // Create new data values with small random changes
            const lastCpuValue = cpuData[cpuData.length - 1];
            const lastRamValue = ramData[ramData.length - 1];
            
            const newCpuValue = Math.max(5, Math.min(95, lastCpuValue + (Math.random() * 10 - 5)));
            const newRamValue = Math.max(10, Math.min(90, lastRamValue + (Math.random() * 8 - 4)));
            
            // Add new data
            labels.push(newLabel);
            cpuData.push(newCpuValue);
            ramData.push(newRamValue);
            
            // Remove oldest data point
            labels.shift();
            cpuData.shift();
            ramData.shift();
            
            // Update charts
            cpuChart.update();
            ramChart.update();
          } catch (error) {
            console.error('Error updating charts:', error);
          }
        }
        
        // Initialize and start updates
        document.addEventListener('DOMContentLoaded', () => {
          // Initialize charts
          const chartsInitialized = initializeCharts();
          
          // Set up updates if charts initialized successfully
          if (chartsInitialized) {
            // Update every 5 seconds
            setInterval(updateCharts, 5000);
          }
        });
      </script>
    </body>
    </html>
  `;
}
