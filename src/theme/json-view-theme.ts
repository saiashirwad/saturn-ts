import { CSSProperties } from "react";

export const jsonViewTheme: CSSProperties & { [key: string]: string } = {
  "--w-rjv-color": "#cdd6f4", // Catppuccin text
  "--w-rjv-key-number": "#89b4fa", // Catppuccin blue
  "--w-rjv-key-string": "#89dceb", // Catppuccin sky
  "--w-rjv-line-color": "#45475a", // Catppuccin surface1
  "--w-rjv-arrow-color": "#6c7086", // Catppuccin overlay0
  "--w-rjv-edit-color": "var(--w-rjv-color)",
  "--w-rjv-info-color": "#6c70867a", // Catppuccin overlay0 with alpha
  "--w-rjv-update-color": "#89dceb", // Catppuccin sky
  "--w-rjv-copied-color": "#89dceb", // Catppuccin sky
  "--w-rjv-copied-success-color": "#a6e3a1", // Catppuccin green

  "--w-rjv-curlybraces-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-colon-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-brackets-color": "#bac2de", // Catppuccin subtext0
  "--w-rjv-ellipsis-color": "#fab387", // Catppuccin peach
  "--w-rjv-quotes-color": "var(--w-rjv-key-string)",
  "--w-rjv-quotes-string-color": "var(--w-rjv-type-string-color)",

  "--w-rjv-type-string-color": "#f5c2e7", // Catppuccin pink
  "--w-rjv-type-int-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-float-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-bigint-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-boolean-color": "#cba6f7", // Catppuccin mauve
  "--w-rjv-type-date-color": "#a6e3a1", // Catppuccin green
  "--w-rjv-type-url-color": "#89b4fa", // Catppuccin blue
  "--w-rjv-type-null-color": "#cba6f7", // Catppuccin mauve
  "--w-rjv-type-nan-color": "#f38ba8", // Catppuccin red
  "--w-rjv-type-undefined-color": "#cba6f7", // Catppuccin mauve
} as const;
