import React from 'react';
import { IframeWidget } from './iframe-widget';
import { WidgetDefinition } from './mock-data';

interface WidgetProps {
  widget: WidgetDefinition;
  onRemove: (id: string) => void;
  isEditing: boolean;
}

export const Widget: React.FC<WidgetProps> = ({ widget, onRemove, isEditing }) => {
  // Get the content URL based on widget type
  const getContentUrl = () => {
    return `/widgets/${widget.type}.html`;
  };

  return (
    <IframeWidget
      widget={{
        id: widget.id,
        title: widget.title,
        contentUrl: getContentUrl()
      }}
      onRemove={onRemove}
      isEditing={isEditing}
    />
  );
};
