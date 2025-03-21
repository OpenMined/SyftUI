import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { WidgetDefinition } from './mock-data';
import { getWidgetContent } from './widget-content';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface WidgetProps {
  widget: WidgetDefinition;
  onRemove: (id: string) => void;
  isEditing: boolean;
}

export const Widget: React.FC<WidgetProps> = ({ widget, onRemove, isEditing }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
          <iframe
            title={widget.title}
            className="w-full h-full border-0"
            srcDoc={getWidgetContent(widget)}
          />
        </CardContent>
      </Card>

      {/* Full-screen dialog */}
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="sm:max-w-[90vw] h-[90vh] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{widget.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden h-[calc(100%-60px)]">
            <iframe
              title={`${widget.title} (Expanded)`}
              className="w-full h-full border-0"
              srcDoc={getWidgetContent(widget)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
