/**
 * React-simple-markdown-editor
 *
 * @author Luke Zhang https://luke-zhang-04.github.io
 *
 * @copyright 2018 - 2019 satya164, 2020 Luke Zhang
 * @version 1.0.3
 */

import type {History, Props, Record, State} from "./types"
import {
    HistoryPresets,
    Keys,
    className,
    cssText,
    isMacLike,
    isWindows,
} from "./constants"
import React from "react"

export type {Props}

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

    public constructor (props: Props) {
        super(props)

        this.state = {
            capture: true,
        }
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

    private _getLines = (text: string, position: number): string[] => (
        text.substring(0, position).split("\n")
    )

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
            const last = this._history.stack[this._history.offset],

                /* eslint-disable-next-line */ // Can't destucture const enums
                historyTimeGap = HistoryPresets.historyTimeGap

            if (last && timestamp - last.timestamp < historyTimeGap) {
                // A previous entry exists and was in short interval

                // Match the last word in the line
                const re = /[^a-z0-9]([a-z0-9]+)$/ui,

                    // Get the previous line
                    previous = this._getLines(last.value, last.selectionStart)
                        .pop()
                        ?.match(re),

                    // Get the current line
                    current = this._getLines(record.value, record.selectionStart)
                        .pop()
                        ?.match(re)

                if (previous && current && current?.[1]?.startsWith(previous?.[1] ?? "")) {

                    /**
                     * The last word of the previous line and current line match
                     * Overwrite previous entry so that undo will remove whole word
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
        const input = this._input,
            last = this._history.stack[this._history.offset]

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
        const {stack, offset} = this._history,

            // Get the previous edit
            record = stack[offset - 1]

        if (record) {
        // Apply the changes and update the offset
            this._updateInput(record)
            this._history.offset = Math.max(offset - 1, 0)
        }
    }

    private _redoEdit = (): void => {
        const {stack, offset} = this._history,

            // Get the next edit
            record = stack[offset + 1]

        if (record) {
        // Apply the changes and update the offset
            this._updateInput(record)
            this._history.offset = Math.min(offset + 1, stack.length - 1)
        }
    }

    // Too lazy to refactor all this code so I'll just leave most of it
    /* eslint-disable max-lines-per-function, complexity, max-statements, id-length, no-negated-condition, no-nested-ternary */
    private _handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
    ): void => {
        const {
            tabSize,
            shouldInsertSpaces,
            shouldIgnoreTabKey,
            onKeyDown,
        } = this.props

        if (onKeyDown) {
            onKeyDown(e)

            if (e.defaultPrevented) {
                return
            }
        }

        if (!(e.target instanceof HTMLTextAreaElement)) {
            return
        }

        if (e.key === Keys.escape) {
            e.target.blur()
        }

        const {value, selectionStart, selectionEnd} = e.target,

            tabCharacter = (shouldInsertSpaces ? " " : "\t").repeat(tabSize ?? 2)

        if (
            e.key === Keys.tab &&
            !shouldIgnoreTabKey &&
            this.state.capture
        ) {
            // Prevent focus change
            e.preventDefault()

            if (e.shiftKey) {
                // Unindent selected lines
                const linesBeforeCaret = this._getLines(value, selectionStart),
                    startLine = linesBeforeCaret.length - 1,
                    endLine = this._getLines(value, selectionEnd).length - 1,
                    nextValue = value
                        .split("\n")
                        .map((line, i) => {
                            if (
                                i >= startLine &&
                                i <= endLine &&
                                line.startsWith(tabCharacter)
                            ) {
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
                        selectionEnd: selectionEnd -
                            (value.length - nextValue.length),
                    })
                }
            } else if (selectionStart !== selectionEnd) {
                // Indent selected lines
                const linesBeforeCaret = this._getLines(value, selectionStart),
                    startLine = linesBeforeCaret.length - 1,
                    endLine = this._getLines(value, selectionEnd).length - 1,
                    startLineText = linesBeforeCaret[startLine] ?? ""

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
                    selectionStart: (/\S/u).test(startLineText)
                        ? selectionStart + tabCharacter.length
                        : selectionStart,

                    // Move the end cursor by total number of characters added
                    selectionEnd:
                        selectionEnd +
                        tabCharacter.length * (endLine - startLine + 1),
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
        } else if (e.key === Keys.backspace) {
            const hasSelection = selectionStart !== selectionEnd,
                textBeforeCaret = value.substring(0, selectionStart)

            if (textBeforeCaret.endsWith(tabCharacter) && !hasSelection) {
                // Prevent default delete behaviour
                e.preventDefault()

                const updatedSelection = selectionStart - tabCharacter.length

                this._applyEdits({
                    // Remove tab character at caret
                    value:
                        value.substring(
                            0, selectionStart - tabCharacter.length,
                        ) + value.substring(selectionEnd),
                    // Update caret position
                    selectionStart: updatedSelection,
                    selectionEnd: updatedSelection,
                })
            }
        } else if (e.key === Keys.enter) {
            // Ignore selections
            if (selectionStart === selectionEnd) {
                // Get the current line
                const line = this._getLines(value, selectionStart).pop() ?? "",
                    matches = line.match(/^\s+/u),

                    /**
                     * Match markdown lists after whitespace
                     * To put the Regex in simple words, after possible whitespace,
                     * test for either ordered list bullets ("1"., "2."", etc)
                     * or for unordered list bullets ("*", "+", or "-")
                     */
                    listBullets = line.match(/^\s*?([0-9]+\.|\*|\+|-)/u)

                console.log(listBullets)

                if (matches && matches[0]) {
                    e.preventDefault()

                    // Preserve indentation on inserting a new line
                    const indent = `\n${matches[0]}`,
                        updatedSelection = selectionStart + indent.length

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

                if (listBullets && listBullets[0]) { // Add new list item
                    e.preventDefault()

                    let [bullet] = listBullets
                    const updatedSelection = selectionStart + bullet.length + 4,
                        numberBullet = Number(bullet.replace(/\./gui, ""))

                    console.log(numberBullet, bullet.replace(/\./gui, ""))

                    // If numbered or ordered list, try and get the next item
                    if (!isNaN(numberBullet) && numberBullet > 0) {
                        bullet = `${bullet.match(/\s/gu)?.join("") ?? ""}${numberBullet + 1}.`
                    }

                    this._applyEdits({
                        // Insert indentation character at caret
                        value: // eslint-disable-next-line
                            value.substring(0, selectionStart) +
                            `\n${bullet} ` + // Add newline, bullet, then space
                            value.substring(selectionEnd),
                        // Update caret position
                        selectionStart: updatedSelection,
                        selectionEnd: updatedSelection,
                    })
                }
            }
        } else if (
            e.key === Keys.parens ||
            e.key === Keys.brackets ||
            e.key === Keys.quote ||
            e.key === Keys.singleQuote ||
            e.key === Keys.squareBrackets
        ) {
            let chars: [start: string, end: string] | undefined

            if (e.key === Keys.parens) {
                chars = ["(", ")"]
            } else if (e.key === Keys.brackets) {
                chars = ["{", "}"]
            } else if (e.key === Keys.quote) {
                chars = ["\"", "\""]
            } else if (e.key === Keys.singleQuote) {
                chars = ["'", "'"]
            } else if (e.key === Keys.squareBrackets) {
                chars = ["[", "]"]
            }

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
            } else if (chars) { // Otherwise, just duplicate the characters
                this._applyEdits({
                    value: value.substring(0, selectionStart) +
                        chars.join("") +
                        value.substring(selectionEnd),
                    selectionStart,
                    selectionEnd: selectionEnd + 1,
                })
            }
        } else if (
            (isMacLike
                ? e.metaKey && e.key === Keys.z // Trigger undo with ⌘+Z on Mac
                : e.ctrlKey && e.key === Keys.z) && // Trigger undo with Ctrl+Z on other platforms
            !e.shiftKey &&
            !e.altKey
        ) {
            e.preventDefault()

            this._undoEdit()
        } else if (
            (isMacLike
                ? e.metaKey && e.key === Keys.z && e.shiftKey // Trigger redo with ⌘+Shift+Z on Mac
                : isWindows
                    ? e.ctrlKey && e.key === Keys.y // Trigger redo with Ctrl+Y on Windows
                    : e.ctrlKey && e.key === Keys.z && e.shiftKey) && // Trigger redo with Ctrl+Shift+Z on other platforms
            !e.altKey
        ) {
            e.preventDefault()

            this._redoEdit()
        } else if (
            e.key === Keys.m &&
            e.ctrlKey &&
            (isMacLike ? e.shiftKey : true)
        ) {
            e.preventDefault()

            // Toggle capturing tab key so users can focus away
            this.setState((state) => ({
                capture: !state.capture,
            }))
        }
    }
    /* eslint-enable max-lines-per-function, complexity, max-statements, no-negated-condition, no-nested-ternary */

    private _handleChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
    ): void => {
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

    public get session (): {history: History} {
        return {
            history: this._history,
        }
    }

    public set session (session: { history: History }) {
        this._history = session.history
    }

    // Render should be placed last, couldn't be bothered to setup React eslint. Disabled naming conv. for `__html`
    /* eslint-disable max-lines-per-function, @typescript-eslint/member-ordering, @typescript-eslint/naming-convention */
    public render = (): JSX.Element => {
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
                /* eslint-disable no-unused-vars */
                onKeyDown,
                tabSize,
                shouldInsertSpaces,
                shouldIgnoreTabKey,
                /* eslint-enable no-unused-vars */
                preClassName,
                ...rest
            } = this.props,

            contentStyle = {
                paddingTop: padding,
                paddingRight: padding,
                paddingBottom: padding,
                paddingLeft: padding,
            },

            highlighted = highlight(value)

        return (
            <div
                {...rest}
                style={{
                    ...styles.container,
                    ...style,
                } as React.CSSProperties}
            >
                <textarea
                    ref={(elem): HTMLTextAreaElement | void => (
                        this._input = elem ?? undefined
                    )}
                    style={{
                        ...styles.editor,
                        ...styles.textarea,
                        ...contentStyle,
                    } as React.CSSProperties}
                    className={
                        className + (textareaClassName ? ` ${textareaClassName}` : "")
                    }
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
                    style={{
                        ...styles.editor,
                        ...styles.highlight,
                        ...contentStyle,
                    } as React.CSSProperties}
                    {
                        ...(typeof highlighted === "string"
                            ? {dangerouslySetInnerHTML: {__html: `${highlighted}<br />`}}
                            : {children: highlighted})
                    }
                />
                {/* eslint-disable-next-line */}
                <style type="text/css" dangerouslySetInnerHTML={{__html: cssText}} />
            </div>
        )
    }
    /* eslint-enable max-lines-per-function, @typescript-eslint/member-ordering, @typescript-eslint/naming-convention */

}

const styles = {
    container: {
        position: "relative",
        textAlign: "left",
        boxSizing: "border-box",
        padding: 0,
        overflow: "hidden",
    },
    textarea: {
        position: "absolute",
        top: 0,
        left: 0,
        height: "100%",
        width: "100%",
        resize: "none",
        color: "inherit",
        overflow: "hidden",
        MozOsxFontSmoothing: "grayscale",
        WebkitFontSmoothing: "antialiased",
        WebkitTextFillColor: "transparent",
    },
    highlight: {
        position: "relative",
        pointerEvents: "none",
    },
    editor: {
        margin: 0,
        border: 0,
        background: "none",
        boxSizing: "inherit",
        display: "inherit",
        fontFamily: "inherit",
        fontSize: "inherit",
        fontStyle: "inherit",
        fontVariantLigatures: "inherit",
        fontWeight: "inherit",
        letterSpacing: "inherit",
        lineHeight: "inherit",
        tabSize: "inherit",
        textIndent: "inherit",
        textRendering: "inherit",
        textTransform: "inherit",
        whiteSpace: "pre-wrap",
        wordBreak: "keep-all",
        overflowWrap: "break-word",
    },
}

export default Editor
