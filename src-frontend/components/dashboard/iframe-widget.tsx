"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAssetPath } from "@/lib/utils";
import { Trash2, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTheme } from "next-themes";

interface IframeWidgetProps {
  widget: {
    id: string;
    title: string;
    contentUrl: string;
  };
  onRemove: (id: string) => void;
  isEditing: boolean;
}

export const IframeWidget: React.FC<IframeWidgetProps> = ({
  widget,
  onRemove,
  isEditing,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [widgetContent, setWidgetContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Fetch the widget HTML on mount and inject our code into it
  useEffect(() => {
    const fetchWidgetContent = async () => {
      setIsLoading(true);
      try {
        const widgetType = widget.contentUrl.split("/").pop()?.split(".")[0];

        // Fetch the widget HTML
        const widgetPath = getAssetPath(`/widgets/${widgetType}.html`);
        const widgetResponse = await fetch(widgetPath);
        const widgetHtml = await widgetResponse.text();

        // Fetch the widget CSS url
        const widgetStylesheetPaths = [
          getAssetPath("/widgets/reset.css"),
          getAssetPath("/widgets/widgets.css"),
        ];

        // Parse the widget HTML and inject our code into it
        const parser = new DOMParser();
        const doc = parser.parseFromString(widgetHtml, "text/html");

        // Inject color-scheme attribute into the html tag
        doc.documentElement.setAttribute("color-scheme", theme || "light");

        // Add class attribute to the body tag if it doesn't exist
        const themeClass = `${theme || "light"}-theme`;
        if (!doc.body.classList.contains(themeClass)) {
          doc.body.classList.add(themeClass);
        }

        // Add the stylesheets
        widgetStylesheetPaths.forEach((path) => {
          const existingLink = doc.querySelector(`link[href="${path}"]`);
          if (!existingLink) {
            const link = doc.createElement("link");
            link.rel = "stylesheet";
            link.href = path;
            doc.head.appendChild(link);
          }
        });

        // Add meta tags if they don't exist, and override if they do
        const metaTags = [
          {
            name: "viewport",
            content: "width=device-width, initial-scale=1.0",
          },
          { name: "color-scheme", content: theme || "light" },
          { name: "charset", content: "UTF-8" },
        ];
        metaTags.forEach(({ name, content }) => {
          const existingMeta = doc.querySelector(`meta[name="${name}"]`);
          if (existingMeta) {
            (existingMeta as HTMLMetaElement).content = content;
          } else {
            const meta = doc.createElement("meta");
            meta.name = name;
            meta.content = content;
            doc.head.appendChild(meta);
          }
        });

        // Finally add the widget content to the iframe
        const fullHtml = doc.documentElement.outerHTML;
        setWidgetContent(fullHtml);
      } catch (error) {
        console.error("Error loading widget content:", error);
        const errorHtml = `
          <html>
            <body>
              <div style="color: red; padding: 20px; text-align: center;">
                Error loading widget: ${error instanceof Error ? error.message : String(error)}
              </div>
            </body>
          </html>
        `;
        // Sanitize error message HTML as well
        setWidgetContent(errorHtml);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWidgetContent();
  }, [theme, widget.contentUrl]);

  return (
    <>
      <Card className="h-full w-full overflow-hidden border shadow-xs transition-all duration-200">
        <CardHeader
          className={`p-3 ${isEditing ? "cursor-move" : "cursor-default"} handle bg-accent border-b select-none`}
          data-no-drag={isEditing ? "true" : "false"}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="truncate text-sm font-medium">
              {widget.title}
            </CardTitle>
            <div className="flex items-center space-x-1">
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleExpand}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {isEditing && (
                <div className="remove-handle">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onRemove(widget.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[calc(100%_-_48px)] overflow-hidden p-0">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-t-2 border-b-2"></div>
            </div>
          ) : (
            <iframe
              title={widget.title}
              className="h-full w-full border-0"
              srcDoc={widgetContent}
              sandbox="allow-scripts"
            />
          )}
        </CardContent>
      </Card>

      {/* Full-screen dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="flex h-[80vh] w-[90vw] flex-col md:max-h-[60%] md:max-w-[60%]">
          <DialogHeader>
            <DialogTitle>{widget.title}</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(100%-60px)] flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"></div>
              </div>
            ) : (
              <iframe
                title={`${widget.title} (Expanded)`}
                className="h-full w-full border-0"
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
