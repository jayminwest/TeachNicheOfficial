"use client";

import React from "react";
import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/app/lib/utils";
import { useTheme } from "next-themes";

interface MarkdownEditorProps {
  value: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
  className?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  className
}: MarkdownEditorProps) {
  const { resolvedTheme } = useTheme();
  
  // Use a client-side effect to update the color mode after initial render
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div 
      className={cn("w-full", disabled && "!cursor-not-allowed", className)} 
      data-color-mode={mounted ? (resolvedTheme === 'dark' ? 'dark' : 'light') : 'light'}
      data-testid="md-editor-wrapper"
    >
      <MDEditor
        value={value}
        onChange={onChange}
        previewOptions={{
          rehypePlugins: [],
        }}
        height={400}
        hideToolbar={disabled}
        preview={disabled ? "preview" : "live"}
        enableScroll={!disabled}
        className={cn(
          "!border !border-input !bg-background",
          "wmde-markdown-var [&_.w-md-editor-toolbar]:!bg-background",
          "[&_.w-md-editor-toolbar]:!border-input",
          "[&_.w-md-editor-content]:!bg-background",
          "[&_.w-md-editor-preview]:!bg-background",
          "[&_.wmde-markdown]:!text-foreground",
          "[&_.w-md-editor-text]:!bg-background",
          "[&_.w-md-editor-text]:!text-foreground",
          "[&_.w-md-editor-toolbar-divider]:!bg-border",
          "[&_button]:!text-muted-foreground",
          "[&_button:hover]:!bg-accent",
          "[&_button:hover]:!text-accent-foreground",
          disabled && "!opacity-50"
        )}
      />
    </div>
  );
}
