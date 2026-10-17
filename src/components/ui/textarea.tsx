import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-28 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-base leading-relaxed transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-primary/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/12 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
