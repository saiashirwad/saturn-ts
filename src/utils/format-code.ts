import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import parserBabel from "prettier/parser-babel";

export async function formatCode(
  code: string,
  parser: "typescript" | "babel" = "typescript",
) {
  if (!code) {
    return "";
  }

  try {
    const formatted = await prettier.format(code, {
      parser,
      plugins: [parserTypeScript, parserBabel],
      semi: true,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 80,
      tabWidth: 2,
      requirePragma: false,
      insertPragma: false,
      bracketSpacing: true,
      arrowParens: "always",
      endOfLine: "lf",
      // Allow formatting even with syntax errors
      rangeStart: 0,
      rangeEnd: Infinity,
      // Don't error on invalid code
      allowParseErrors: true,
    });

    return formatted.trim();
  } catch (error) {
    // Log the actual error for debugging
    console.warn("Failed to format code:", error);

    // Return original code if formatting fails
    return code.trim();
  }
}
