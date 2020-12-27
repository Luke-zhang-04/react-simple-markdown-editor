/**
 * React-simple-markdown-editor
 *
 * @author Luke Zhang https://luke-zhang-04.github.io
 *
 * @copyright 2018 - 2019 satya164, 2020 Luke Zhang
 * @version 1.0.4
 */

/**
 * Props for the `Editor` component
 * @typedef
 */
export type Props = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
> & {

    /**
     * Initial value inside of the textbox
     * Must be a [controlled prop](https://reactjs.org/docs/forms.html#controlled-components)
     */
    value: string,
    
    /**
     * Callback that is called when the textarea value changes.
     * Can't be `onChange`, because that name is taken
     * You'll need to update the value prop when this is called.
     * @param vale - contents of textarea
     * @returns void - can be anything but void is default
     */
    onValueChange: (value: string)=> void,

    /**
     * Callback that is called after every update simillar to `onValueChange`.
     * You'll need to return an HTML string or a React element with syntax
     * highlighting using a library such as [`prismjs`](https://prismjs.com)
     * @param value - contents of textarea
     * @returns highlighted contents
     */
    highlight: (value: string)=> string | React.ReactNode,

    /**
     * The number of characters to insert when pressing tab key.
     * For example, for 4 space indentation, `tabSize` will be `4` and
     * `shouldInsertSpaces` will be `true`.
     * @defaultValue 2
     */
    tabSize?: number,

    /**
     * Whether to use spaces for indentation.
     * If you set it to `false`, you might also want to set`tabSize` to `1`.
     * @defaultValue true
     */
    shouldInsertSpaces?: boolean,

    /**
     * Whether the editor should ignore tab key presses so that keyboard users
     * can tab past the editor.
     * Users can toggle this behaviour using `Ctrl+Shift+M` (Mac) / `Ctrl+M`
     * manually when this is `false`.
     * @defaultValue false
     */
    shouldIgnoreTabKey?: boolean,

    /**
     * Optional padding for code.
     * @default 0
     */
    padding?: number | string,

    /**
     * React CSS styling for the textarea component
     */
    style?: React.CSSProperties,

    /**
     * An ID for the underlying `textarea`, can be useful for setting a `label`
     */
    textareaId?: string,

    /**
     * A className for the underlying `textarea`, can be useful for more precise
     * control of its styles.
     */
    textareaClassName?: string,
    shouldAutoFocus?: boolean,
    isDisabled?: boolean,
    form?: string,
    maxLength?: number,
    minLength?: number,
    name?: string,
    placeholder?: string,
    isReadOnly?: boolean,
    isRequired?: boolean,
    onClick?: (e: React.MouseEvent<HTMLTextAreaElement>)=> void,
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>)=> void,
    onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>)=> void,
    onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>)=> void,
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>)=> void,

    /**
     * A className for the underlying `pre`, can be useful for more precise
     * control of its styles
     */
    preClassName?: string,
}
