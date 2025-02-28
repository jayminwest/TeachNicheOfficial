import * as React from "react";

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VisuallyHidden = React.forwardRef<HTMLSpanElement, VisuallyHiddenProps>(
  ({ children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
        style={{
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          margin: "-1px",
        }}
        {...props}
      >
        {children}
      </span>
    );
  }
);

VisuallyHidden.displayName = "VisuallyHidden";

export { VisuallyHidden };
