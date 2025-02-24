"use client";

import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/app/lib/utils";
import rehypeSanitize from "rehype-sanitize";
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
  const { theme } = useTheme();
  
  return (
    <div 
      className={cn("w-full", className)} 
      data-color-mode={theme === 'dark' ? 'dark' : 'light'}
    >
      <MDEditor
        value={value}
        onChange={onChange}
        preview="edit"
        previewOptions={{
          rehypePlugins: [[rehypeSanitize]],
        }}
        height={400}
        hideToolbar={disabled}
        readOnly={disabled}
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
          disabled && "!cursor-not-allowed !opacity-50"
        )}
      />
    </div>
  );
}
