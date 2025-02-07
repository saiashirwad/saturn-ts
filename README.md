we might need this, but probably not 
https://www.npmjs.com/package/ts-blank-space

react runner
https://claude.ai/chat/5f1c6382-f4ef-4cbb-9130-f2e9303ee79f

https://uiwjs.github.io/react-codemirror/#/extensions/languages

use sucrase instead of babel

// sucrase: one export per code block
https://claude.ai/chat/d2fed5f8-b230-4c92-ae39-b8f342d0f5b8



# Cell & Reactivity System Design
## Cell Structure:

All cells are regular code cells (no distinct reactive/non-reactive types)
Cells without $() calls are treated as regular code with global injection
Cells with $() calls participate in the reactivity system


## Reactivity Implementation:


Use $() function for both signals and computed values
$(value) creates a signal
$(() => expression) creates a computed value
No special syntax/keywords to maintain TypeScript compatibility


## Output System:


Each cell has an output section below it
log() function to display values:

Regular values print once
Signal values automatically update output when changed




## Example Usage:

typescriptCopy// Regular cell
const x = 123
log(x)

// Reactive cell
const count = $(0)
const doubled = $(count * 2)
log(doubled)
This design prioritizes simplicity and TypeScript compatibility while maintaining an interactive notebook experience.
