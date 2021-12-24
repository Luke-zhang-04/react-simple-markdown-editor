/**
 * React-simple-markdown-editor
 *
 * @version 1.1.0
 * @author Luke Zhang https://luke-zhang-04.github.io
 * @file constant Values used by the main component
 * @copyright 2018 - 2019 satya164, 2020 - 2021 Luke Zhang
 */

// Eslint has a hard time with const enum apparently
/* eslint-disable no-shadow */
/**
 * Special keys to handle
 */
export const enum SpecialKeys {
    enter = "Enter",
    tab = "Tab",
    backspace = "Backspace",
    y = "y",
    z = "z",
    m = "m",
    escape = "Escape",
}

/**
 * Keys that wrap around selected text, or get duplicated
 */
export const wrappingKeys: [start: string, end?: string][] = [
    ["(", ")"],
    ["{", "}"],
    ["[", "]"],
    ['"'],
    ["'"],
    ["*"],
    ["~"],
]

// Somehow stuff in enums are magic numbers
/* eslint-disable no-magic-numbers */
/**
 * A bunch of history values to use
 */
export const enum HistoryPresets {
    /**
     * Limit of history to keep
     */
    historyLimit = 100,

    /**
     * Time between two history keepings
     */
    historyTimeGap = 3000,
}
/* eslint-enable no-shadow, no-magic-numbers */

/**
 * Checking for platforms
 */
export const isWindows = "navigator" in globalThis && /Win/iu.test(navigator.userAgent)
export const isMacLike =
    "navigator" in globalThis && /(Mac|iPhone|iPod|iPad)/iu.test(navigator.userAgent)

/**
 * Some CSS stuff
 */
export const className = "npm__react-simple-code-editor__textarea"
export const cssText = /* CSS */ `
/**
 * Reset the text fill color so that placeholder is visible
 */
.${className}:empty {
  -webkit-text-fill-color: inherit !important;
}

/**
 * Hack to apply on some CSS on IE10 and IE11
 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  /**

   * IE doesn't support '-webkit-text-fill-color'
    * So we use 'color: transparent' to make the text transparent on IE
    * Unlike other browsers, it doesn't affect caret color in IE
    */
  .${className} {
    color: transparent !important;
  }

  .${className}::selection {
    background-color: #accef7 !important;
    color: transparent !important;
  }
}
`
