/**
 * React-simple-markdown-editor
 *
 * @author Luke Zhang https://luke-zhang-04.github.io
 *
 * @copyright 2018 - 2019 satya164, 2020 Luke Zhang
 * @version 1.0.3
 *
 * @file constant values used by the main component
 */

// Eslint has a hard time with const enum apparently
/* eslint-disable no-shadow */
/**
 * Special keys to handle
 */
export const enum Keys {
    enter = "Enter",
    tab = "Tab",
    backspace = "Backspace",
    y = "y",
    z = "z",
    m = "m",
    parens = "(",
    brackets = "{",
    squareBrackets = "[",
    quote = "\"",
    singleQuote = "'",
    escape = "Escape",
}

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
    historyTimeGap = 3000
}
/* eslint-enable no-shadow, no-magic-numbers */

/**
 * Checking for platforms
 */
export const isWindows = "navigator" in global && (/Win/ui).test(navigator.platform),
    isMacLike = "navigator" in global && (/(Mac|iPhone|iPod|iPad)/ui).test(navigator.platform)

/**
 * Some CSS stuff
 */
export const className = "npm__react-simple-code-editor__textarea",

    cssText = /* CSS */ `
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
