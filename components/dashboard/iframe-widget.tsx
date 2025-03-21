"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTheme } from 'next-themes';

interface IframeWidgetProps {
  widget: {
    id: string;
    title: string;
    contentUrl: string;
  };
  onRemove: (id: string) => void;
  isEditing: boolean;
}

export const IframeWidget: React.FC<IframeWidgetProps> = ({ widget, onRemove, isEditing }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetContent, setWidgetContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Fetch the widget content (HTML, CSS & JS) on mount
  useEffect(() => {
    const fetchWidgetContent = async () => {
      setIsLoading(true);
      try {
        const widgetType = widget.contentUrl.split('/').pop().split('.')[0];

        // Fetch the widget HTML
        const widgetResponse = await fetch(`/widgets/${widgetType}.html`);
        const widgetHtml = await widgetResponse.text();

        // Construct the full HTML document
        const fullHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${widget.title}</title>
            <style>
              * {
                box-sizing: border-box;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              }

              /* Light theme variables */
              body {
                --widget-bg: #ffffff;
                --widget-text: #333333;
                --widget-muted: #6b7280;
                --widget-border: #e5e7eb;
                --widget-primary: #3b82f6;
                --widget-secondary: #10b981;
                --widget-success: #22c55e;
                --widget-danger: #ef4444;
                --widget-warning: #f59e0b;
                --widget-info: #06b6d4;

                color: var(--widget-text);
                background-color: var(--widget-bg);
                margin: 0;
                padding: 0;
                height: 100vh;
                overflow: hidden;
              }

              /* Dark theme styles */
              body.dark-theme {
                --widget-bg: #1f2937;
                --widget-text: #f3f4f6;
                --widget-muted: #9ca3af;
                --widget-border: #4b5563;
                --widget-primary: #60a5fa;
                --widget-secondary: #34d399;
                --widget-success: #4ade80;
                --widget-danger: #f87171;
                --widget-warning: #fbbf24;
                --widget-info: #22d3ee;
              }
            </style>
          </head>
          <body class="${theme || 'light'}-theme">
            ${widgetHtml}
          </body>
          </html>
        `;

        setWidgetContent(fullHtml);
      } catch (error) {
        console.error('Error loading widget content:', error);
        setWidgetContent(`
          <html>
            <body>
              <div style="color: red; padding: 20px; text-align: center;">
                Error loading widget: ${error instanceof Error ? error.message : String(error)}
              </div>
            </body>
          </html>
        `);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWidgetContent();
  }, [theme]);

  return (
    <>
      <Card className="h-full w-full overflow-hidden shadow-sm border-2 border-transparent hover:border-gray-200 transition-all duration-200">
        <CardHeader className={`p-3 ${isEditing ? 'cursor-move' : 'cursor-default'} handle bg-white dark:bg-gray-900 border-b select-none`}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium truncate">{widget.title}</CardTitle>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={toggleExpand}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onRemove(widget.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%_-_48px)] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <iframe
              title={widget.title}
              className="w-full h-full border-0"
              srcDoc={widgetContent}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </CardContent>
      </Card>

      {/* Full-screen dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{widget.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden h-[calc(100%-60px)]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <iframe
                title={`${widget.title} (Expanded)`}
                className="w-full h-full border-0"
                srcDoc={widgetContent}
                sandbox="allow-scripts allow-same-origin"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
