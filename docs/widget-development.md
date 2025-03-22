# SyftUI Widget Development Guide

This document explains how to create custom widgets for the SyftUI dashboard.

## Overview

SyftUI app widgets use a simple approach:

1. **Create a Widgets Directory**:
   - Create a `widgets` directory in your app’s root folder.
   - Add HTML files for each widget, using our existing widgets as examples.

2. **Automatic Widget Display**:
   - Each HTML file in the `widgets` directory will appear as a widget in SyftUI.
   - The widget’s title and description are determined by its meta tags.

3. **Managing Widget Files**:
   - You are responsible for managing and updating these HTML files throughout your app's lifecycle.

4. **Automatic Updates**:
   - The Syft client will automatically update the widgets in the UI whenever the HTML files are modified.

5. **Theming**:
   - SyftUI handles consistent theming by automatically injecting our [widget.css](https://syftboxstage.openmined.org/datasites/tauquir@openmined.org/syftui/widget.css) stylesheet.

6. **Security and Isolation**:
   - Widget content is sanitized using [DOMPurify](https://www.npmjs.com/package/dompurify) and displayed in an iframe for added security and isolation.

## Widget Template

Start with our base template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>My Widget</title>
  <meta name="description" content="Short description of what the widget does">
  <meta name="author" content="Your name here">
  <style>
    /* Your widget-specific styles here */
  </style>
</head>
<body>
  <div>
     <!-- Your main widget content lives here -->
   </div>
  <script>
    // Your widget-specific JavaScript here (optional)
  </script>
</body>
</html>
```

## Theming Support

Your widget automatically receives our [widget.css](https://syftboxstage.openmined.org/datasites/tauquir@openmined.org/syftui/widget.css) stylesheet. Use our CSS variables for theme compatibility:

```css
/* Examples of using theme variables */
.my-element {
  color: var(--widget-text);
  background-color: var(--widget-bg);
  border: 1px solid var(--widget-border);
}

.my-button {
  background-color: var(--widget-primary);
  color: white;
}
```

Available variables:

See [widget.css](https://syftboxstage.openmined.org/datasites/tauquir@openmined.org/syftui/widget.css) for an up-to-date list of available variables.

- `--widget-bg`: Background color
- `--widget-bg-muted`: Muted background color
- `--widget-text`: Text color
- `--widget-muted`: Subdued text color
- `--widget-border`: Border color
- `--widget-primary`: Primary action color
- `--widget-secondary`: Secondary action color
- `--widget-success`: Success indicator color
- `--widget-danger`: Error/danger color
- `--widget-warning`: Warning color
- `--widget-info`: Information color

## Widget Lifecycle

1. User adds your widget to their dashboard
2. SyftUI injects custom css and theme information into your widget
3. SyftUI sanitizes and loads your widget HTML in an isolated iframe
4. Your widget renders and begins functioning
5. Your widget re-renders when:
    1. Your app updates the html files
    2. The user toggles light/dark mode

## Charts and Data Visualization

You're free to use any charting library that works in a browser (Chart.js, D3.js, etc.). Just include the library in your HTML file:

```html
<!-- Example using Chart.js -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  const ctx = document.getElementById('myChart').getContext('2d');
  const chart = new Chart(ctx, {
    // Chart configuration...
  });
</script>
```

## Security Considerations

- Widgets are sanitized using [DOMPurify](https://www.npmjs.com/package/dompurify) during runtime
- Widgets run in a sandboxed iframe with limited permissions
- Only `allow-scripts` permissions are granted
- External API calls must respect CORS policies

## Example: Simple Metric Widget

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Metric Widget</title>
  <meta name="description" content="Monitor system metrics">
  <meta name="author" content="John Doe">
  <style>
    .metric-container {
      text-align: center;
      padding: 20px;
    }
    .metric-value {
      font-size: 32px;
      font-weight: bold;
      color: var(--widget-primary);
    }
    .metric-label {
      font-size: 14px;
      color: var(--widget-muted);
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="metric-container">
    <div class="metric-value" id="metricValue">95%</div>
    <div class="metric-label">System Uptime</div>
  </div>
  
  <script>
    // Simulate real-time updates
    setInterval(() => {
      const value = 90 + Math.floor(Math.random() * 10);
      document.getElementById('metricValue').textContent = `${value}%`;
    }, 5000);
  </script>
</body>
</html>
```

## Support

Raise your queries on our Github [issues](https://github.com/OpenMined/syft/issues) page.
