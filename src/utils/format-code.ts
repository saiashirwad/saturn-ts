import prettier from "prettier/standalone";
import parserTypeScript from "prettier/parser-typescript";
import parserBabel from "prettier/parser-babel";

export async function formatCode(
  code: string,
  parser: "typescript" | "babel" = "typescript",
) {
  try {
    const formatted = await prettier.format(code, {
      parser,
      plugins: [parserTypeScript, parserBabel],
      semi: true,
      singleQuote: false,
      trailingComma: "all",
      printWidth: 80,
      tabWidth: 2,
    });

    return formatted.trim();
  } catch (error) {
    console.warn("Failed to format code:", error);
    return code; // Return original code if formatting fails
  }
}
