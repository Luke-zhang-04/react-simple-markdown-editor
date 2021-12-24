/**
 * React-simple-markdown-editor
 *
 * @version 1.1.0
 * @author Luke Zhang https://luke-zhang-04.github.io
 * @copyright 2018 - 2019 satya164, 2020 - 2021 Luke Zhang
 */

/* eslint-disable max-lines */

import {
    HistoryPresets,
    SpecialKeys,
    className,
    cssText,
    isMacLike,
    isWindows,
    wrappingKeys,
} from "./constants"
import type {Props} from "./types"
import React from "react"
import {styles} from "./styles"

export type {Props}

type State = {
    capture: boolean
}

type Record = {
    value: string
    selectionStart: number
    selectionEnd: number
}

type History = {
    stack: (Record & {timestamp: number})[]
    offset: number
}

/**
 * React Simple Markdown Editor A simple markdown editor component with syntax highlighting based
 * off of [satya164/react-simple-code-editor](https://github.com/satya164/react-simple-code-editor)
 *
 * @see {@link https://github.com/Luke-zhang-04/react-simple-markdown-editor}
 */
export class Editor extends React.Component<Props, State> {
    public static defaultProps = {
        tabSize: 2,
        shouldInsertSpaces: true,
        shouldIgnoreTabKey: false,
        padding: 0,
    }

    private _history: History = {
        stack: [],
        offset: -1,
    }

    private _input?: HTMLTextAreaElement

    public constructor(props: Props) {
        super(props)

        this.state = {
            capture: true,
        }
    }

    public get session(): {history: History} {
        return {
            history: this._history,
        }
    }

    public set session(session: {history: History}) {
        this._history = session.history
    }

    public componentDidMount = (): void => {
        this._recordCurrentState()
    }

    private _recordCurrentState = (): void => {
        const input = this._input

        if (!input) {
            return
        }

        // Save current state of the input
        const {value, selectionStart, selectionEnd} = input

        this._recordChange({
            value,
            selectionStart,
            selectionEnd,
        })
    }

    private _getLines = (text: string, position: number): string[] =>
        text.substring(0, position).split("\n")

    private _recordChange = (record: Record, overwrite = false): void => {
        const {stack, offset} = this._history

        if (stack.length && offset > -1) {
            // When something updates, drop the redo operations
            this._history.stack = stack.slice(0, offset + 1)

            // Limit the number of operations to 100
            const count = this._history.stack.length

            if (count > HistoryPresets.historyLimit) {
                const extras = count - HistoryPresets.historyLimit

                this._history.stack = stack.slice(extras, count)
                this._history.offset = Math.max(this._history.offset - extras, 0)
            }
        }

        const timestamp = Date.now()

        if (overwrite) {
            const last = this._history.stack[this._history.offset]
            /* eslint-disable-next-line */ // Can't destucture const enums
            const historyTimeGap = HistoryPresets.historyTimeGap

            if (last && timestamp - last.timestamp < historyTimeGap) {
                // A previous entry exists and was in short interval

                // Match the last word in the line
                const re = /[^a-z0-9]([a-z0-9]+)$/iu
                // Get the previous line
                const previous = this._getLines(last.value, last.selectionStart).pop()?.match(re)
                // Get the current line
                const current = this._getLines(record.value, record.selectionStart)
                    .pop()
                    ?.match(re)

                if (previous && current && current?.[1]?.startsWith(previous?.[1] ?? "")) {
                    /**
                     * The last word of the previous line and current line match Overwrite previous
                     * entry so that undo will remove whole word
                     */
                    this._history.stack[this._history.offset] = {
                        ...record,
                        timestamp,
                    }

                    return
                }
            }
        }

        // Add the new operation to the stack
        this._history.stack.push({
            ...record,
            timestamp,
        })
        this._history.offset++
    }

    private _updateInput = (record: Record): void => {
        const input = this._input

        if (!input) {
            return
        }

        // Update values and selection state
        input.value = record.value
        input.selectionStart = record.selectionStart
        input.selectionEnd = record.selectionEnd

        this.props.onValueChange(record.value)
    }

    private _applyEdits = (record: Record): void => {
        // Save last selection state
        const input = this._input
        const last = this._history.stack[this._history.offset]

        if (last && input) {
            this._history.stack[this._history.offset] = {
                ...last,
                selectionStart: input.selectionStart,
                selectionEnd: input.selectionEnd,
            }
        }

        // Save the changes
        this._recordChange(record)
        this._updateInput(record)
    }

    private _undoEdit = (): void => {
        const {stack, offset} = this._history
        // Get the previous edit
        const record = stack[offset - 1]

        if (record) {
            // Apply the changes and update the offset
            this._updateInput(record)
            this._history.offset = Math.max(offset - 1, 0)
        }
    }

    private _redoEdit = (): void => {
        const {stack, offset} = this._history
        // Get the next edit
        const record = stack[offset + 1]

        if (record) {
            // Apply the changes and update the offset
            this._updateInput(record)
            this._history.offset = Math.min(offset + 1, stack.length - 1)
        }
    }

    // Too lazy to refactor all this code so I'll just leave most of it
    /* eslint-disable max-lines-per-function, complexity, max-statements, id-length, no-negated-condition, no-nested-ternary */
    private _handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        const {tabSize, shouldInsertSpaces, shouldIgnoreTabKey, onKeyDown} = this.props

        if (onKeyDown) {
            onKeyDown(e)

            if (e.defaultPrevented) {
                return
            }
        }

        if (!(e.target instanceof HTMLTextAreaElement)) {
            return
        }

        if (e.key === SpecialKeys.escape) {
            e.target.blur()
        }

        const {value, selectionStart, selectionEnd} = e.target
        const tabCharacter = (shouldInsertSpaces ? " " : "\t").repeat(tabSize ?? 2)

        if (e.key === SpecialKeys.tab && !shouldIgnoreTabKey && this.state.capture) {
            // Prevent focus change
            e.preventDefault()

            if (e.shiftKey) {
                // Unindent selected lines
                const linesBeforeCaret = this._getLines(value, selectionStart)
                const startLine = linesBeforeCaret.length - 1
                const endLine = this._getLines(value, selectionEnd).length - 1
                const nextValue = value
                    .split("\n")
                    .map((line, i) => {
                        if (i >= startLine && i <= endLine && line.startsWith(tabCharacter)) {
                            return line.substring(tabCharacter.length)
                        }

                        return line
                    })
                    .join("\n")

                if (value !== nextValue) {
                    const startLineText = linesBeforeCaret[startLine]

                    this._applyEdits({
                        value: nextValue,

                        /*
                         * Move the start cursor if first line in selection was modified
                         * It was modified only if it started with a tab
                         */
                        selectionStart: startLineText?.startsWith(tabCharacter)
                            ? selectionStart - tabCharacter.length
                            : selectionStart,
                        // Move the end cursor by total number of characters removed
                        selectionEnd: selectionEnd - (value.length - nextValue.length),
                    })
                }
            } else if (selectionStart !== selectionEnd) {
                // Indent selected lines
                const linesBeforeCaret = this._getLines(value, selectionStart)
                const startLine = linesBeforeCaret.length - 1
                const endLine = this._getLines(value, selectionEnd).length - 1
                const startLineText = linesBeforeCaret[startLine] ?? ""

                this._applyEdits({
                    value: value
                        .split("\n")
                        .map((line, i) => {
                            if (i >= startLine && i <= endLine) {
                                return tabCharacter + line
                            }

                            return line
                        })
                        .join("\n"),

                    /*
                     * Move the start cursor by number of characters added in first line of selection
                     * Don't move it if it there was no text before cursor
                     */
                    selectionStart: /\S/u.test(startLineText)
                        ? selectionStart + tabCharacter.length
                        : selectionStart,

                    // Move the end cursor by total number of characters added
                    selectionEnd: selectionEnd + tabCharacter.length * (endLine - startLine + 1),
                })
            } else {
                const updatedSelection = selectionStart + tabCharacter.length

                this._applyEdits({
                    // Insert tab character at caret
                    value:
                        value.substring(0, selectionStart) +
                        tabCharacter +
                        value.substring(selectionEnd),
                    // Update caret position
                    selectionStart: updatedSelection,
                    selectionEnd: updatedSelection,
                })
            }
        } else if (e.key === SpecialKeys.backspace) {
            const hasSelection = selectionStart !== selectionEnd
            const textBeforeCaret = value.substring(0, selectionStart)

            if (textBeforeCaret.endsWith(tabCharacter) && !hasSelection) {
                // Prevent default delete behaviour
                e.preventDefault()

                const updatedSelection = selectionStart - tabCharacter.length

                this._applyEdits({
                    // Remove tab character at caret
                    value:
                        value.substring(0, selectionStart - tabCharacter.length) +
                        value.substring(selectionEnd),
                    // Update caret position
                    selectionStart: updatedSelection,
                    selectionEnd: updatedSelection,
                })
            }
        } else if (e.key === SpecialKeys.enter) {
            // Ignore selections
            if (selectionStart === selectionEnd) {
                // Get the current line
                const line = this._getLines(value, selectionStart).pop() ?? ""
                const matches = line.match(/^\s+/u)
                /**
                 * Match markdown lists after whitespace To put the Regex in simple words, after
                 * possible whitespace, test for either ordered list bullets (`1.`, `2.`, etc) or
                 * for unordered list bullets (`*`, `+`, or `-`) or for blockquotes `>`
                 */
                const listBullets = line.match(/^\s*?([0-9]+\.|\*|\+|-|>)/u)

                if (matches?.[0]) {
                    e.preventDefault()

                    // Preserve indentation on inserting a new line
                    const indent = `\n${matches[0]}`
                    const updatedSelection = selectionStart + indent.length

                    this._applyEdits({
                        // Insert indentation character at caret
                        value:
                            value.substring(0, selectionStart) +
                            indent +
                            value.substring(selectionEnd),
                        // Update caret position
                        selectionStart: updatedSelection,
                        selectionEnd: updatedSelection,
                    })
                }

                if (listBullets?.[0]) {
                    // Add new list item
                    e.preventDefault()

                    let [bullet] = listBullets
                    const updatedSelection = selectionStart + bullet.length + 2
                    const numberBullet = Number(bullet.replace(/\./giu, ""))

                    // If numbered or ordered list, try and get the next item
                    if (!isNaN(numberBullet) && numberBullet > 0) {
                        bullet = `${bullet.match(/\s/gu)?.join("") ?? ""}${numberBullet + 1}.`
                    }

                    this._applyEdits({
                        // Insert indentation character at caret
                        // eslint-disable-next-line
                        value: `${value.substring(0, selectionStart)}\n${bullet} ${value.substring(
                            selectionEnd,
                        )}`, // Add newline, bullet, then space
                        // Update caret position
                        selectionStart: updatedSelection,
                        selectionEnd: updatedSelection,
                    })
                }
            }
        } else if (wrappingKeys.map((key) => key[0]).includes(e.key)) {
            const chars: [start: string, end: string] | undefined = wrappingKeys
                .map((key): [string, string] => [key[0], key[1] ?? key[0]])
                .find((key) => e.key === key[0])

            // If text is selected, wrap them in the characters
            if (selectionStart !== selectionEnd && chars) {
                e.preventDefault()

                this._applyEdits({
                    value:
                        value.substring(0, selectionStart) +
                        chars[0] +
                        value.substring(selectionStart, selectionEnd) +
                        chars[1] +
                        value.substring(selectionEnd),
                    // Update caret position
                    selectionStart,
                    selectionEnd: selectionEnd + 2,
                })
            } else if (chars) {
                // Otherwise, just duplicate the characters
                this._applyEdits({
                    value:
                        value.substring(0, selectionStart) +
                        chars.join("") +
                        value.substring(selectionEnd),
                    selectionStart,
                    selectionEnd: selectionEnd + 1,
                })
            }
        } else if (
            (isMacLike
                ? e.metaKey && e.key === SpecialKeys.z // Trigger undo with ⌘+Z on Mac
                : e.ctrlKey && e.key === SpecialKeys.z) && // Trigger undo with Ctrl+Z on other platforms
            !e.shiftKey &&
            !e.altKey
        ) {
            e.preventDefault()

            this._undoEdit()
        } else if (
            (isMacLike
                ? e.metaKey && e.key === SpecialKeys.z && e.shiftKey // Trigger redo with ⌘+Shift+Z on Mac
                : isWindows
                ? e.ctrlKey && e.key === SpecialKeys.y // Trigger redo with Ctrl+Y on Windows
                : e.ctrlKey && e.key === SpecialKeys.z && e.shiftKey) && // Trigger redo with Ctrl+Shift+Z on other platforms
            !e.altKey
        ) {
            e.preventDefault()

            this._redoEdit()
        } else if (e.key === SpecialKeys.m && e.ctrlKey && (isMacLike ? e.shiftKey : true)) {
            e.preventDefault()

            // Toggle capturing tab key so users can focus away
            this.setState((state) => ({
                capture: !state.capture,
            }))
        }
    }
    /* eslint-enable max-lines-per-function, complexity, max-statements, no-negated-condition, no-nested-ternary */

    private _handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        if (!(e.target instanceof HTMLTextAreaElement)) {
            return
        }

        const {value, selectionStart, selectionEnd} = e.target

        this._recordChange(
            {
                value,
                selectionStart,
                selectionEnd,
            },
            true,
        )

        this.props.onValueChange(value)
    }
    /* eslint-enable id-length */

    // Render should be placed last, couldn't be bothered to setup React eslint. Disabled naming conv. for `__html`
    /* eslint-disable max-lines-per-function, @typescript-eslint/member-ordering, @typescript-eslint/naming-convention */
    public render = (): JSX.Element => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const {
            value,
            style,
            padding,
            highlight,
            textareaId,
            textareaClassName,
            shouldAutoFocus,
            isDisabled,
            form,
            maxLength,
            minLength,
            name,
            placeholder,
            isReadOnly,
            isRequired,
            onClick,
            onFocus,
            onBlur,
            onKeyUp,
            onKeyDown,
            tabSize,
            shouldInsertSpaces,
            shouldIgnoreTabKey,
            preClassName,
            ...rest
        } = this.props
        /* eslint-enable @typescript-eslint/no-unused-vars */

        const contentStyle = {
            paddingTop: padding,
            paddingRight: padding,
            paddingBottom: padding,
            paddingLeft: padding,
        }
        const highlighted = highlight(value)

        return (
            <div
                {...rest}
                style={
                    {
                        ...styles.container,
                        ...style,
                    } as React.CSSProperties
                }
            >
                <textarea
                    ref={(elem): HTMLTextAreaElement | void => (this._input = elem ?? undefined)}
                    style={
                        {
                            ...styles.editor,
                            ...styles.textarea,
                            ...contentStyle,
                        } as React.CSSProperties
                    }
                    className={className + (textareaClassName ? ` ${textareaClassName}` : "")}
                    id={textareaId}
                    value={value}
                    onChange={this._handleChange}
                    onKeyDown={this._handleKeyDown}
                    onClick={onClick}
                    onKeyUp={onKeyUp}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={isDisabled}
                    form={form}
                    maxLength={maxLength}
                    minLength={minLength}
                    name={name}
                    placeholder={placeholder}
                    readOnly={isReadOnly}
                    required={isRequired}
                    autoFocus={shouldAutoFocus}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-gramm={false}
                />
                <pre
                    className={preClassName}
                    aria-hidden="true"
                    style={
                        {
                            ...styles.editor,
                            ...styles.highlight,
                            ...contentStyle,
                        } as React.CSSProperties
                    }
                    {...(typeof highlighted === "string"
                        ? {dangerouslySetInnerHTML: {__html: `${highlighted}<br />`}}
                        : {children: highlighted})}
                />
                {/* eslint-disable-next-line */}
                <style type="text/css" dangerouslySetInnerHTML={{__html: cssText}} />
            </div>
        )
    }
    /* eslint-enable max-lines-per-function, @typescript-eslint/member-ordering, @typescript-eslint/naming-convention */
}

export default Editor
