"use client";

import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/app/lib/utils";
import rehypeSanitize from "rehype-sanitize";

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
  return (
    <div className={cn("w-full", className)} data-color-mode="light">
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
        className="!border-input"
      />
    </div>
  );
}
