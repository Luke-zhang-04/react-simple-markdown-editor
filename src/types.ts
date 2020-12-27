/**
 * React-simple-markdown-editor
 *
 * @author Luke Zhang https://luke-zhang-04.github.io
 *
 * @copyright 2018 - 2019 satya164, 2020 Luke Zhang
 * @version 1.0.0
 */

/**
 * Props for the editor component
 */
export type Props = React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
> & {
    // Props for the component
    value: string,
    onValueChange: (value: string)=> void,
    highlight: (value: string)=> string | React.ReactNode,
    tabSize?: number,
    shouldInsertSpaces?: boolean,
    shouldIgnoreTabKey?: boolean,
    padding?: number | string,
    style?: React.CSSProperties,

    // Props for the textarea
    textareaId?: string,
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
    preClassName?: string,
}

export type State = {
  capture: boolean,
}

export type Record = {
  value: string,
  selectionStart: number,
  selectionEnd: number,
}

export type History = {
  stack: (Record & { timestamp: number })[],
  offset: number,
}
