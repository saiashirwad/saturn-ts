export async function importModule(url: string) {
  try {
    return await import(/* @vite-ignore */ url)
  } catch (error) {
    throw new Error(`Failed to import module: ${url}`)
  }
}
