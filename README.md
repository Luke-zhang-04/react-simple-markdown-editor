# React Simple Markdown Editor

A simple markdown editor component with syntax highlighting based off of [satya164/react-simple-code-editor](https://github.com/satya164/react-simple-code-editor)

## Why?
- Other markdown editors don't let you customize highlighting. This takes it to a whole other level and just makes you use another library to highlight
- The satya164/react-simple-code-editor is great, but does not support features like list bullets on newlines

- I looked, and nothing supports BOTH of the above features, which is unfourtunate

You need to use the editor with a third party library which provides syntax highlighting. For example, it'll look like following with [`prismjs`](https://prismjs.com):

```tsx
import "prismjs/components/prism-clike"
import "prismjs/components/prism-javascript"
import {highlight, languages} from "prismjs/components/prism-core"
import React from "react"
import Editor from "@luke-zhang-04/react-simple-markdown-editor"

const code = `# This is markdown

This is Markdown. You can find out how to use markdown [here](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)`

class App extends React.Component<Record<string, unknown>, {code: string}> {

    public constructor (props: Record<string, unknown>) {
        super(props)

        this.state = {code}
    }

    public render = (): JSX.Element => <Editor
        value={this.state.code}
        onValueChange={(code: string): void => this.setState({code})}
        highlight={(code: string): string => highlight(code, languages.js)}
        padding={10}
        style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 12,
        }}
    />
}
```

Note that depending on your syntax highlighter, you might have to include additional CSS for syntax highlighting to work.

## Props

The editor accepts all the props accepted by `textarea`. In addition, you can pass the following props:

- `value` (`string`): Current value of the editor i.e. the code to display. This must be a [controlled prop](https://reactjs.org/docs/forms.html#controlled-components).
- `onValueChange` (`string => void`): Callback which is called when the value of the editor changes. You'll need to update the value prop when this is called.
- `highlight` (`string => string | React.Node`): Callback which will receive text to highlight. You'll need to return an HTML string or a React element with syntax highlighting using a library such as [`prismjs`](https://prismjs.com).
- `tabSize` (`number`): The number of characters to insert when pressing tab key. For example, for 4 space indentation, `tabSize` will be `4` and `shouldInsertSpaces` will be `true`. Default: `2`.
- `shouldInsertSpaces` (`boolean`): Whether to use spaces for indentation. Default: `true`. If you set it to `false`, you might also want to set `tabSize` to `1`.
- `shouldIgnoreTabKey` (`boolean`): Whether the editor should ignore tab key presses so that keyboard users can tab past the editor. Users can toggle this behaviour using `Ctrl+Shift+M` (Mac) / `Ctrl+M` manually when this is `false`. Default: `false`.
- `padding` (`number`): Optional padding for code. Default: `0`.
- `textareaId` (`string`): An ID for the underlying `textarea`, can be useful for setting a `label`.
- `textareaClassName` (`string`): A className for the underlying `textarea`, can be useful for more precise control of its styles.
- `preClassName` (`string`): A className for the underlying `pre`, can be useful for more precise control of its styles.

## How it works

It works by overlaying a syntax highlighted `<pre>` block over a `<textarea>`. When you type, select, copy text etc., you interact with the underlying `<textarea>`, so the experience feels native. This is a very simple approach compared to other editors which re-implement the behaviour.

The syntax highlighting can be done by any third party library as long as it returns HTML and is fully controllable by the user.

The vanilla `<textarea>` doesn't support inserting tab characters for indentation, so we re-implement it by listening to `keydown` events and programmatically updating the text. One caveat with programmatically updating the text is that we lose the undo stack, so we need to maintain our own undo stack. As a result, we can also implement improved undo behaviour such as undoing whole words similar to editors like VSCode.

## Limitations

Due to the way it works, it has certain limitations:

- The syntax highlighted code cannot have different font family, font weight, font style, line height etc. for its content. Since the editor works by aligning the highlighted code over a `<textarea>`, changing anything that affects the layout can misalign it.
- The custom undo stack is incompatible with undo/redo items browser's context menu. However, other full featured editors don't support browser's undo/redo menu items either.
- The editor is not optimized for performance and large documents can affect the typing speed.
- We hide text in the textarea using `-webkit-text-fill-color: transparent`, which works in all modern browsers (even non-webkit ones such as Firefox and Edge). On IE 10+, we use `color: transparent` which doesn't hide the cursor. Text may appear bolder in unsupported browsers.

