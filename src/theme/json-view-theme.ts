import { CSSProperties } from "react";

export const jsonViewTheme: CSSProperties & { [key: string]: string } = {
  "--w-rjv-color": "hsl(var(--foreground))", // Default text
  "--w-rjv-key-number": "hsl(var(--primary))", // Primary color
  "--w-rjv-key-string": "hsl(var(--primary))", // Primary color
  "--w-rjv-line-color": "hsl(var(--border))", // Border color
  "--w-rjv-arrow-color": "hsl(var(--muted-foreground))", // Muted text
  "--w-rjv-edit-color": "var(--w-rjv-color)",
  "--w-rjv-info-color": "hsl(var(--muted-foreground))", // Muted text
  "--w-rjv-update-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-copied-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-copied-success-color": "hsl(var(--primary))", // Primary color

  "--w-rjv-curlybraces-color": "hsl(var(--foreground))", // Default text
  "--w-rjv-colon-color": "hsl(var(--foreground))", // Default text
  "--w-rjv-brackets-color": "hsl(var(--foreground))", // Default text
  "--w-rjv-ellipsis-color": "hsl(var(--muted-foreground))", // Muted text
  "--w-rjv-quotes-color": "var(--w-rjv-key-string)",
  "--w-rjv-quotes-string-color": "var(--w-rjv-type-string-color)",

  "--w-rjv-type-string-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-int-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-float-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-bigint-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-boolean-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-date-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-url-color": "hsl(var(--primary))", // Primary color
  "--w-rjv-type-null-color": "hsl(var(--muted-foreground))", // Muted text
  "--w-rjv-type-nan-color": "hsl(var(--destructive))", // Destructive color
  "--w-rjv-type-undefined-color": "hsl(var(--muted-foreground))", // Muted text
} as const;
