import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
}

export function LoaderScreen({
  text = "Loading...",
  className,
  ...props
}: LoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4",
        className,
      )}
      {...props}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

interface ErrorScreenProps extends React.HTMLAttributes<HTMLDivElement> {
  error: string;
}

export function ErrorScreen({ error, className, ...props }: ErrorScreenProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center gap-4 p-4 text-center",
        className,
      )}
      {...props}
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M12 8v4M12 16h.01" />
          <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
        </svg>
      </div>
      <div className="max-w-[400px] space-y-2">
        <h3 className="text-lg font-medium">Initialization Error</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );
}
