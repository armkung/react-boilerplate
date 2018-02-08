(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 28);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const stringWidth = __webpack_require__(16);
const emojiRegex = __webpack_require__(10)();
const escapeStringRegexp = __webpack_require__(11);
const getCjkRegex = __webpack_require__(9);
const getUnicodeRegex = __webpack_require__(20);

const cjkPattern = getCjkRegex().source;

// http://spec.commonmark.org/0.25/#ascii-punctuation-character
const asciiPunctuationCharRange = escapeStringRegexp(
  "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
);

// http://spec.commonmark.org/0.25/#punctuation-character
const punctuationCharRange = `${asciiPunctuationCharRange}${getUnicodeRegex([
  "Pc",
  "Pd",
  "Pe",
  "Pf",
  "Pi",
  "Po",
  "Ps"
]).source.slice(1, -1)}`; // remove bracket expression `[` and `]`

const punctuationRegex = new RegExp(`[${punctuationCharRange}]`);

function isExportDeclaration(node) {
  if (node) {
    switch (node.type) {
      case "ExportDefaultDeclaration":
      case "ExportDefaultSpecifier":
      case "DeclareExportDeclaration":
      case "ExportNamedDeclaration":
      case "ExportAllDeclaration":
        return true;
    }
  }

  return false;
}

function getParentExportDeclaration(path) {
  const parentNode = path.getParentNode();
  if (path.getName() === "declaration" && isExportDeclaration(parentNode)) {
    return parentNode;
  }

  return null;
}

function getPenultimate(arr) {
  if (arr.length > 1) {
    return arr[arr.length - 2];
  }
  return null;
}

function getLast(arr) {
  if (arr.length > 0) {
    return arr[arr.length - 1];
  }
  return null;
}

function skip(chars) {
  return (text, index, opts) => {
    const backwards = opts && opts.backwards;

    // Allow `skip` functions to be threaded together without having
    // to check for failures (did someone say monads?).
    if (index === false) {
      return false;
    }

    const length = text.length;
    let cursor = index;
    while (cursor >= 0 && cursor < length) {
      const c = text.charAt(cursor);
      if (chars instanceof RegExp) {
        if (!chars.test(c)) {
          return cursor;
        }
      } else if (chars.indexOf(c) === -1) {
        return cursor;
      }

      backwards ? cursor-- : cursor++;
    }

    if (cursor === -1 || cursor === length) {
      // If we reached the beginning or end of the file, return the
      // out-of-bounds cursor. It's up to the caller to handle this
      // correctly. We don't want to indicate `false` though if it
      // actually skipped valid characters.
      return cursor;
    }
    return false;
  };
}

const skipWhitespace = skip(/\s/);
const skipSpaces = skip(" \t");
const skipToLineEnd = skip(",; \t");
const skipEverythingButNewLine = skip(/[^\r\n]/);

function skipInlineComment(text, index) {
  if (index === false) {
    return false;
  }

  if (text.charAt(index) === "/" && text.charAt(index + 1) === "*") {
    for (let i = index + 2; i < text.length; ++i) {
      if (text.charAt(i) === "*" && text.charAt(i + 1) === "/") {
        return i + 2;
      }
    }
  }
  return index;
}

function skipTrailingComment(text, index) {
  if (index === false) {
    return false;
  }

  if (text.charAt(index) === "/" && text.charAt(index + 1) === "/") {
    return skipEverythingButNewLine(text, index);
  }
  return index;
}

// This one doesn't use the above helper function because it wants to
// test \r\n in order and `skip` doesn't support ordering and we only
// want to skip one newline. It's simple to implement.
function skipNewline(text, index, opts) {
  const backwards = opts && opts.backwards;
  if (index === false) {
    return false;
  }

  const atIndex = text.charAt(index);
  if (backwards) {
    if (text.charAt(index - 1) === "\r" && atIndex === "\n") {
      return index - 2;
    }
    if (
      atIndex === "\n" ||
      atIndex === "\r" ||
      atIndex === "\u2028" ||
      atIndex === "\u2029"
    ) {
      return index - 1;
    }
  } else {
    if (atIndex === "\r" && text.charAt(index + 1) === "\n") {
      return index + 2;
    }
    if (
      atIndex === "\n" ||
      atIndex === "\r" ||
      atIndex === "\u2028" ||
      atIndex === "\u2029"
    ) {
      return index + 1;
    }
  }

  return index;
}

function hasNewline(text, index, opts) {
  opts = opts || {};
  const idx = skipSpaces(text, opts.backwards ? index - 1 : index, opts);
  const idx2 = skipNewline(text, idx, opts);
  return idx !== idx2;
}

function hasNewlineInRange(text, start, end) {
  for (let i = start; i < end; ++i) {
    if (text.charAt(i) === "\n") {
      return true;
    }
  }
  return false;
}

// Note: this function doesn't ignore leading comments unlike isNextLineEmpty
function isPreviousLineEmpty(text, node) {
  let idx = locStart(node) - 1;
  idx = skipSpaces(text, idx, { backwards: true });
  idx = skipNewline(text, idx, { backwards: true });
  idx = skipSpaces(text, idx, { backwards: true });
  const idx2 = skipNewline(text, idx, { backwards: true });
  return idx !== idx2;
}

function isNextLineEmptyAfterIndex(text, index) {
  let oldIdx = null;
  let idx = index;
  while (idx !== oldIdx) {
    // We need to skip all the potential trailing inline comments
    oldIdx = idx;
    idx = skipToLineEnd(text, idx);
    idx = skipInlineComment(text, idx);
    idx = skipSpaces(text, idx);
  }
  idx = skipTrailingComment(text, idx);
  idx = skipNewline(text, idx);
  return hasNewline(text, idx);
}

function isNextLineEmpty(text, node) {
  return isNextLineEmptyAfterIndex(text, locEnd(node));
}

function getNextNonSpaceNonCommentCharacterIndex(text, node) {
  let oldIdx = null;
  let idx = locEnd(node);
  while (idx !== oldIdx) {
    oldIdx = idx;
    idx = skipSpaces(text, idx);
    idx = skipInlineComment(text, idx);
    idx = skipTrailingComment(text, idx);
    idx = skipNewline(text, idx);
  }
  return idx;
}

function getNextNonSpaceNonCommentCharacter(text, node) {
  return text.charAt(getNextNonSpaceNonCommentCharacterIndex(text, node));
}

function hasSpaces(text, index, opts) {
  opts = opts || {};
  const idx = skipSpaces(text, opts.backwards ? index - 1 : index, opts);
  return idx !== index;
}

function locStart(node) {
  // Handle nodes with decorators. They should start at the first decorator
  if (
    node.declaration &&
    node.declaration.decorators &&
    node.declaration.decorators.length > 0
  ) {
    return locStart(node.declaration.decorators[0]);
  }
  if (node.decorators && node.decorators.length > 0) {
    return locStart(node.decorators[0]);
  }

  if (node.__location) {
    return node.__location.startOffset;
  }
  if (node.range) {
    return node.range[0];
  }
  if (typeof node.start === "number") {
    return node.start;
  }
  if (node.source) {
    return lineColumnToIndex(node.source.start, node.source.input.css) - 1;
  }
  if (node.loc) {
    return node.loc.start;
  }
}

function locEnd(node) {
  const endNode = node.nodes && getLast(node.nodes);
  if (endNode && node.source && !node.source.end) {
    node = endNode;
  }

  let loc;
  if (node.range) {
    loc = node.range[1];
  } else if (typeof node.end === "number") {
    loc = node.end;
  } else if (node.source) {
    loc = lineColumnToIndex(node.source.end, node.source.input.css);
  }

  if (node.__location) {
    return node.__location.endOffset;
  }
  if (node.typeAnnotation) {
    return Math.max(loc, locEnd(node.typeAnnotation));
  }

  if (node.loc && !loc) {
    return node.loc.end;
  }

  return loc;
}

// Super inefficient, needs to be cached.
function lineColumnToIndex(lineColumn, text) {
  let index = 0;
  for (let i = 0; i < lineColumn.line - 1; ++i) {
    index = text.indexOf("\n", index) + 1;
    if (index === -1) {
      return -1;
    }
  }
  return index + lineColumn.column;
}

function setLocStart(node, index) {
  if (node.range) {
    node.range[0] = index;
  } else {
    node.start = index;
  }
}

function setLocEnd(node, index) {
  if (node.range) {
    node.range[1] = index;
  } else {
    node.end = index;
  }
}

const PRECEDENCE = {};
[
  ["|>"],
  ["||", "??"],
  ["&&"],
  ["|"],
  ["^"],
  ["&"],
  ["==", "===", "!=", "!=="],
  ["<", ">", "<=", ">=", "in", "instanceof"],
  [">>", "<<", ">>>"],
  ["+", "-"],
  ["*", "/", "%"],
  ["**"]
].forEach((tier, i) => {
  tier.forEach(op => {
    PRECEDENCE[op] = i;
  });
});

function getPrecedence(op) {
  return PRECEDENCE[op];
}

const equalityOperators = {
  "==": true,
  "!=": true,
  "===": true,
  "!==": true
};
const multiplicativeOperators = {
  "*": true,
  "/": true,
  "%": true
};
const bitshiftOperators = {
  ">>": true,
  ">>>": true,
  "<<": true
};

function shouldFlatten(parentOp, nodeOp) {
  if (getPrecedence(nodeOp) !== getPrecedence(parentOp)) {
    return false;
  }

  // ** is right-associative
  // x ** y ** z --> x ** (y ** z)
  if (parentOp === "**") {
    return false;
  }

  // x == y == z --> (x == y) == z
  if (equalityOperators[parentOp] && equalityOperators[nodeOp]) {
    return false;
  }

  // x * y % z --> (x * y) % z
  if (
    (nodeOp === "%" && multiplicativeOperators[parentOp]) ||
    (parentOp === "%" && multiplicativeOperators[nodeOp])
  ) {
    return false;
  }

  // x << y << z --> (x << y) << z
  if (bitshiftOperators[parentOp] && bitshiftOperators[nodeOp]) {
    return false;
  }

  return true;
}

function isBitwiseOperator(operator) {
  return (
    !!bitshiftOperators[operator] ||
    operator === "|" ||
    operator === "^" ||
    operator === "&"
  );
}

// Tests if an expression starts with `{`, or (if forbidFunctionAndClass holds) `function` or `class`.
// Will be overzealous if there's already necessary grouping parentheses.
function startsWithNoLookaheadToken(node, forbidFunctionAndClass) {
  node = getLeftMost(node);
  switch (node.type) {
    // Hack. Remove after https://github.com/eslint/typescript-eslint-parser/issues/331
    case "ObjectPattern":
      return !forbidFunctionAndClass;
    case "FunctionExpression":
    case "ClassExpression":
      return forbidFunctionAndClass;
    case "ObjectExpression":
      return true;
    case "MemberExpression":
      return startsWithNoLookaheadToken(node.object, forbidFunctionAndClass);
    case "TaggedTemplateExpression":
      if (node.tag.type === "FunctionExpression") {
        // IIFEs are always already parenthesized
        return false;
      }
      return startsWithNoLookaheadToken(node.tag, forbidFunctionAndClass);
    case "CallExpression":
      if (node.callee.type === "FunctionExpression") {
        // IIFEs are always already parenthesized
        return false;
      }
      return startsWithNoLookaheadToken(node.callee, forbidFunctionAndClass);
    case "ConditionalExpression":
      return startsWithNoLookaheadToken(node.test, forbidFunctionAndClass);
    case "UpdateExpression":
      return (
        !node.prefix &&
        startsWithNoLookaheadToken(node.argument, forbidFunctionAndClass)
      );
    case "BindExpression":
      return (
        node.object &&
        startsWithNoLookaheadToken(node.object, forbidFunctionAndClass)
      );
    case "SequenceExpression":
      return startsWithNoLookaheadToken(
        node.expressions[0],
        forbidFunctionAndClass
      );
    case "TSAsExpression":
      return startsWithNoLookaheadToken(
        node.expression,
        forbidFunctionAndClass
      );
    default:
      return false;
  }
}

function getLeftMost(node) {
  if (node.left) {
    return getLeftMost(node.left);
  }
  return node;
}

function hasBlockComments(node) {
  return node.comments && node.comments.some(isBlockComment);
}

function isBlockComment(comment) {
  return comment.type === "Block" || comment.type === "CommentBlock";
}

function hasClosureCompilerTypeCastComment(text, node) {
  // https://github.com/google/closure-compiler/wiki/Annotating-Types#type-casts
  // Syntax example: var x = /** @type {string} */ (fruit);
  return (
    node.comments &&
    node.comments.some(
      comment =>
        comment.leading &&
        isBlockComment(comment) &&
        comment.value.match(/^\*\s*@type\s*{[^}]+}\s*$/) &&
        getNextNonSpaceNonCommentCharacter(text, comment) === "("
    )
  );
}

function getAlignmentSize(value, tabWidth, startIndex) {
  startIndex = startIndex || 0;

  let size = 0;
  for (let i = startIndex; i < value.length; ++i) {
    if (value[i] === "\t") {
      // Tabs behave in a way that they are aligned to the nearest
      // multiple of tabWidth:
      // 0 -> 4, 1 -> 4, 2 -> 4, 3 -> 4
      // 4 -> 8, 5 -> 8, 6 -> 8, 7 -> 8 ...
      size = size + tabWidth - size % tabWidth;
    } else {
      size++;
    }
  }

  return size;
}

function getIndentSize(value, tabWidth) {
  const lastNewlineIndex = value.lastIndexOf("\n");
  if (lastNewlineIndex === -1) {
    return 0;
  }

  return getAlignmentSize(
    // All the leading whitespaces
    value.slice(lastNewlineIndex + 1).match(/^[ \t]*/)[0],
    tabWidth
  );
}

function printString(raw, options, isDirectiveLiteral) {
  // `rawContent` is the string exactly like it appeared in the input source
  // code, without its enclosing quotes.
  const rawContent = raw.slice(1, -1);

  const double = { quote: '"', regex: /"/g };
  const single = { quote: "'", regex: /'/g };

  const preferred = options.singleQuote ? single : double;
  const alternate = preferred === single ? double : single;

  let shouldUseAlternateQuote = false;
  let canChangeDirectiveQuotes = false;

  // If `rawContent` contains at least one of the quote preferred for enclosing
  // the string, we might want to enclose with the alternate quote instead, to
  // minimize the number of escaped quotes.
  // Also check for the alternate quote, to determine if we're allowed to swap
  // the quotes on a DirectiveLiteral.
  if (
    rawContent.includes(preferred.quote) ||
    rawContent.includes(alternate.quote)
  ) {
    const numPreferredQuotes = (rawContent.match(preferred.regex) || []).length;
    const numAlternateQuotes = (rawContent.match(alternate.regex) || []).length;

    shouldUseAlternateQuote = numPreferredQuotes > numAlternateQuotes;
  } else {
    canChangeDirectiveQuotes = true;
  }

  const enclosingQuote =
    options.parser === "json"
      ? double.quote
      : shouldUseAlternateQuote ? alternate.quote : preferred.quote;

  // Directives are exact code unit sequences, which means that you can't
  // change the escape sequences they use.
  // See https://github.com/prettier/prettier/issues/1555
  // and https://tc39.github.io/ecma262/#directive-prologue
  if (isDirectiveLiteral) {
    if (canChangeDirectiveQuotes) {
      return enclosingQuote + rawContent + enclosingQuote;
    }
    return raw;
  }

  // It might sound unnecessary to use `makeString` even if the string already
  // is enclosed with `enclosingQuote`, but it isn't. The string could contain
  // unnecessary escapes (such as in `"\'"`). Always using `makeString` makes
  // sure that we consistently output the minimum amount of escaped quotes.
  return makeString(
    rawContent,
    enclosingQuote,
    !(
      options.parser === "css" ||
      options.parser === "less" ||
      options.parser === "scss"
    )
  );
}

function makeString(rawContent, enclosingQuote, unescapeUnnecessaryEscapes) {
  const otherQuote = enclosingQuote === '"' ? "'" : '"';

  // Matches _any_ escape and unescaped quotes (both single and double).
  const regex = /\\([\s\S])|(['"])/g;

  // Escape and unescape single and double quotes as needed to be able to
  // enclose `rawContent` with `enclosingQuote`.
  const newContent = rawContent.replace(regex, (match, escaped, quote) => {
    // If we matched an escape, and the escaped character is a quote of the
    // other type than we intend to enclose the string with, there's no need for
    // it to be escaped, so return it _without_ the backslash.
    if (escaped === otherQuote) {
      return escaped;
    }

    // If we matched an unescaped quote and it is of the _same_ type as we
    // intend to enclose the string with, it must be escaped, so return it with
    // a backslash.
    if (quote === enclosingQuote) {
      return "\\" + quote;
    }

    if (quote) {
      return quote;
    }

    // Unescape any unnecessarily escaped character.
    // Adapted from https://github.com/eslint/eslint/blob/de0b4ad7bd820ade41b1f606008bea68683dc11a/lib/rules/no-useless-escape.js#L27
    return unescapeUnnecessaryEscapes &&
      /^[^\\nrvtbfux\r\n\u2028\u2029"'0-7]$/.test(escaped)
      ? escaped
      : "\\" + escaped;
  });

  return enclosingQuote + newContent + enclosingQuote;
}

function printNumber(rawNumber) {
  return (
    rawNumber
      .toLowerCase()
      // Remove unnecessary plus and zeroes from scientific notation.
      .replace(/^([+-]?[\d.]+e)(?:\+|(-))?0*(\d)/, "$1$2$3")
      // Remove unnecessary scientific notation (1e0).
      .replace(/^([+-]?[\d.]+)e[+-]?0+$/, "$1")
      // Make sure numbers always start with a digit.
      .replace(/^([+-])?\./, "$10.")
      // Remove extraneous trailing decimal zeroes.
      .replace(/(\.\d+?)0+(?=e|$)/, "$1")
      // Remove trailing dot.
      .replace(/\.(?=e|$)/, "")
  );
}

function getMaxContinuousCount(str, target) {
  const results = str.match(
    new RegExp(`(${escapeStringRegexp(target)})+`, "g")
  );

  if (results === null) {
    return 0;
  }

  return results.reduce(
    (maxCount, result) => Math.max(maxCount, result.length / target.length),
    0
  );
}

function mapDoc(doc, callback) {
  if (doc.parts) {
    const parts = doc.parts.map(part => mapDoc(part, callback));
    return callback(Object.assign({}, doc, { parts }));
  }

  if (doc.contents) {
    const contents = mapDoc(doc.contents, callback);
    return callback(Object.assign({}, doc, { contents }));
  }

  return callback(doc);
}

/**
 * split text into whitespaces and words
 * @param {string} text
 * @return {Array<{ type: "whitespace", value: " " | "\n" | "" } | { type: "word", value: string }>}
 */
function splitText(text) {
  const KIND_NON_CJK = "non-cjk";
  const KIND_CJK_CHARACTER = "cjk-character";
  const KIND_CJK_PUNCTUATION = "cjk-punctuation";

  const nodes = [];

  text
    .replace(new RegExp(`(${cjkPattern})\n(${cjkPattern})`, "g"), "$1$2")
    .split(/([ \t\n]+)/)
    .forEach((token, index, tokens) => {
      // whitespace
      if (index % 2 === 1) {
        nodes.push({
          type: "whitespace",
          value: /\n/.test(token) ? "\n" : " "
        });
        return;
      }

      // word separated by whitespace

      if ((index === 0 || index === tokens.length - 1) && token === "") {
        return;
      }

      token
        .split(new RegExp(`(${cjkPattern})`))
        .forEach((innerToken, innerIndex, innerTokens) => {
          if (
            (innerIndex === 0 || innerIndex === innerTokens.length - 1) &&
            innerToken === ""
          ) {
            return;
          }

          // non-CJK word
          if (innerIndex % 2 === 0) {
            if (innerToken !== "") {
              appendNode({
                type: "word",
                value: innerToken,
                kind: KIND_NON_CJK,
                hasLeadingPunctuation: punctuationRegex.test(innerToken[0]),
                hasTrailingPunctuation: punctuationRegex.test(
                  getLast(innerToken)
                )
              });
            }
            return;
          }

          // CJK character
          appendNode(
            punctuationRegex.test(innerToken)
              ? {
                  type: "word",
                  value: innerToken,
                  kind: KIND_CJK_PUNCTUATION,
                  hasLeadingPunctuation: true,
                  hasTrailingPunctuation: true
                }
              : {
                  type: "word",
                  value: innerToken,
                  kind: KIND_CJK_CHARACTER,
                  hasLeadingPunctuation: false,
                  hasTrailingPunctuation: false
                }
          );
        });
    });

  return nodes;

  function appendNode(node) {
    const lastNode = getLast(nodes);
    if (lastNode && lastNode.type === "word") {
      if (
        (lastNode.kind === KIND_NON_CJK &&
          node.kind === KIND_CJK_CHARACTER &&
          !lastNode.hasTrailingPunctuation) ||
        (lastNode.kind === KIND_CJK_CHARACTER &&
          node.kind === KIND_NON_CJK &&
          !node.hasLeadingPunctuation)
      ) {
        nodes.push({ type: "whitespace", value: " " });
      } else if (
        !isBetween(KIND_NON_CJK, KIND_CJK_PUNCTUATION) &&
        // disallow leading/trailing full-width whitespace
        ![lastNode.value, node.value].some(value => /\u3000/.test(value))
      ) {
        nodes.push({ type: "whitespace", value: "" });
      }
    }
    nodes.push(node);

    function isBetween(kind1, kind2) {
      return (
        (lastNode.kind === kind1 && node.kind === kind2) ||
        (lastNode.kind === kind2 && node.kind === kind1)
      );
    }
  }
}

function getStringWidth(text) {
  if (!text) {
    return 0;
  }

  // emojis are considered 2-char width for consistency
  // see https://github.com/sindresorhus/string-width/issues/11
  // for the reason why not implemented in `string-width`
  return stringWidth(text.replace(emojiRegex, "  "));
}

function hasIgnoreComment(path) {
  const node = path.getValue();
  return hasNodeIgnoreComment(node);
}

function hasNodeIgnoreComment(node) {
  return (
    node &&
    node.comments &&
    node.comments.length > 0 &&
    node.comments.some(comment => comment.value.trim() === "prettier-ignore")
  );
}

function arrayify(object, keyName) {
  return Object.keys(object).reduce(
    (array, key) =>
      array.concat(Object.assign({ [keyName]: key }, object[key])),
    []
  );
}

module.exports = {
  arrayify,
  punctuationRegex,
  punctuationCharRange,
  getStringWidth,
  splitText,
  mapDoc,
  getMaxContinuousCount,
  getPrecedence,
  shouldFlatten,
  isBitwiseOperator,
  isExportDeclaration,
  getParentExportDeclaration,
  getPenultimate,
  getLast,
  getNextNonSpaceNonCommentCharacterIndex,
  getNextNonSpaceNonCommentCharacter,
  skipWhitespace,
  skipSpaces,
  skipNewline,
  isNextLineEmptyAfterIndex,
  isNextLineEmpty,
  isPreviousLineEmpty,
  hasNewline,
  hasNewlineInRange,
  hasSpaces,
  locStart,
  locEnd,
  setLocStart,
  setLocEnd,
  startsWithNoLookaheadToken,
  hasBlockComments,
  isBlockComment,
  hasClosureCompilerTypeCastComment,
  getAlignmentSize,
  getIndentSize,
  printString,
  printNumber,
  hasIgnoreComment,
  hasNodeIgnoreComment
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
  builders: __webpack_require__(3),
  printer: __webpack_require__(24),
  utils: __webpack_require__(25),
  debug: __webpack_require__(23)
};


/***/ }),
/* 2 */
/***/ (function(module, exports) {

/*
  Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

    // See `tools/generate-identifier-regex.js`.
    ES5Regex = {
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
        // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
    };

    ES6Regex = {
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
        NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
        // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
        NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
    };

    function isDecimalDigit(ch) {
        return 0x30 <= ch && ch <= 0x39;  // 0..9
    }

    function isHexDigit(ch) {
        return 0x30 <= ch && ch <= 0x39 ||  // 0..9
            0x61 <= ch && ch <= 0x66 ||     // a..f
            0x41 <= ch && ch <= 0x46;       // A..F
    }

    function isOctalDigit(ch) {
        return ch >= 0x30 && ch <= 0x37;  // 0..7
    }

    // 7.2 White Space

    NON_ASCII_WHITESPACES = [
        0x1680, 0x180E,
        0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A,
        0x202F, 0x205F,
        0x3000,
        0xFEFF
    ];

    function isWhiteSpace(ch) {
        return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 ||
            ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
    }

    // 7.3 Line Terminators

    function isLineTerminator(ch) {
        return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
    }

    // 7.6 Identifier Names and Identifiers

    function fromCodePoint(cp) {
        if (cp <= 0xFFFF) { return String.fromCharCode(cp); }
        var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
        var cu2 = String.fromCharCode(((cp - 0x10000) % 0x400) + 0xDC00);
        return cu1 + cu2;
    }

    IDENTIFIER_START = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_START[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    IDENTIFIER_PART = new Array(0x80);
    for(ch = 0; ch < 0x80; ++ch) {
        IDENTIFIER_PART[ch] =
            ch >= 0x61 && ch <= 0x7A ||  // a..z
            ch >= 0x41 && ch <= 0x5A ||  // A..Z
            ch >= 0x30 && ch <= 0x39 ||  // 0..9
            ch === 0x24 || ch === 0x5F;  // $ (dollar) and _ (underscore)
    }

    function isIdentifierStartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES5(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    function isIdentifierStartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
    }

    function isIdentifierPartES6(ch) {
        return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
    }

    module.exports = {
        isDecimalDigit: isDecimalDigit,
        isHexDigit: isHexDigit,
        isOctalDigit: isOctalDigit,
        isWhiteSpace: isWhiteSpace,
        isLineTerminator: isLineTerminator,
        isIdentifierStartES5: isIdentifierStartES5,
        isIdentifierPartES5: isIdentifierPartES5,
        isIdentifierStartES6: isIdentifierStartES6,
        isIdentifierPartES6: isIdentifierPartES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function assertDoc(val) {
  /* istanbul ignore if */
  if (
    !(typeof val === "string" || (val != null && typeof val.type === "string"))
  ) {
    throw new Error(
      "Value " + JSON.stringify(val) + " is not a valid document"
    );
  }
}

function concat(parts) {
  if (process.env.NODE_ENV !== "production") {
    parts.forEach(assertDoc);
  }

  // We cannot do this until we change `printJSXElement` to not
  // access the internals of a document directly.
  // if(parts.length === 1) {
  //   // If it's a single document, no need to concat it.
  //   return parts[0];
  // }
  return { type: "concat", parts };
}

function indent(contents) {
  if (process.env.NODE_ENV !== "production") {
    assertDoc(contents);
  }

  return { type: "indent", contents };
}

function align(n, contents) {
  if (process.env.NODE_ENV !== "production") {
    assertDoc(contents);
  }

  return { type: "align", contents, n };
}

function group(contents, opts) {
  opts = opts || {};

  if (process.env.NODE_ENV !== "production") {
    assertDoc(contents);
  }

  return {
    type: "group",
    contents: contents,
    break: !!opts.shouldBreak,
    expandedStates: opts.expandedStates
  };
}

function dedentToRoot(contents) {
  return align(-Infinity, contents);
}

function markAsRoot(contents) {
  return align({ type: "root" }, contents);
}

function dedent(contents) {
  return align(-1, contents);
}

function conditionalGroup(states, opts) {
  return group(
    states[0],
    Object.assign(opts || {}, { expandedStates: states })
  );
}

function fill(parts) {
  if (process.env.NODE_ENV !== "production") {
    parts.forEach(assertDoc);
  }

  return { type: "fill", parts };
}

function ifBreak(breakContents, flatContents) {
  if (process.env.NODE_ENV !== "production") {
    if (breakContents) {
      assertDoc(breakContents);
    }
    if (flatContents) {
      assertDoc(flatContents);
    }
  }

  return { type: "if-break", breakContents, flatContents };
}

function lineSuffix(contents) {
  if (process.env.NODE_ENV !== "production") {
    assertDoc(contents);
  }
  return { type: "line-suffix", contents };
}

const lineSuffixBoundary = { type: "line-suffix-boundary" };
const breakParent = { type: "break-parent" };
const line = { type: "line" };
const softline = { type: "line", soft: true };
const hardline = concat([{ type: "line", hard: true }, breakParent]);
const literalline = concat([
  { type: "line", hard: true, literal: true },
  breakParent
]);
const cursor = { type: "cursor", placeholder: Symbol("cursor") };

function join(sep, arr) {
  const res = [];

  for (let i = 0; i < arr.length; i++) {
    if (i !== 0) {
      res.push(sep);
    }

    res.push(arr[i]);
  }

  return concat(res);
}

function addAlignmentToDoc(doc, size, tabWidth) {
  let aligned = doc;
  if (size > 0) {
    // Use indent to add tabs for all the levels of tabs we need
    for (let i = 0; i < Math.floor(size / tabWidth); ++i) {
      aligned = indent(aligned);
    }
    // Use align for all the spaces that are needed
    aligned = align(size % tabWidth, aligned);
    // size is absolute from 0 and not relative to the current
    // indentation, so we use -Infinity to reset the indentation to 0
    aligned = align(-Infinity, aligned);
  }
  return aligned;
}

module.exports = {
  concat,
  join,
  line,
  softline,
  hardline,
  literalline,
  group,
  conditionalGroup,
  fill,
  lineSuffix,
  lineSuffixBoundary,
  cursor,
  breakParent,
  ifBreak,
  indent,
  align,
  addAlignmentToDoc,
  markAsRoot,
  dedentToRoot,
  dedent
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const CATEGORY_JAVASCRIPT = "JavaScript";

// format based on https://github.com/prettier/prettier/blob/master/src/common/support.js
module.exports = {
	ignorePattern: {
    since: "0.0.0",
    category: CATEGORY_JAVASCRIPT,
    type: "string",
    default: false,
    description: "",
    oppositeDescription: ""
	},
  arrowParens: {
    since: "1.9.0",
    category: CATEGORY_JAVASCRIPT,
    type: "choice",
    default: "avoid",
    description: "Include parentheses around a sole arrow function parameter.",
    choices: [
      {
        value: "avoid",
        description: "Omit parens when possible. Example: `x => x`"
      },
      {
        value: "always",
        description: "Always include parens. Example: `(x) => x`"
      }
    ]
  },
  bracketSpacing: {
    since: "0.0.0",
    category: CATEGORY_JAVASCRIPT,
    type: "boolean",
    default: true,
    description: "Print spaces between brackets.",
    oppositeDescription: "Do not print spaces between brackets."
  },
  jsxBracketSameLine: {
    since: "0.17.0",
    category: CATEGORY_JAVASCRIPT,
    type: "boolean",
    default: false,
    description: "Put > on the last line instead of at a new line."
  },
  semi: {
    since: "1.0.0",
    category: CATEGORY_JAVASCRIPT,
    type: "boolean",
    default: true,
    description: "Print semicolons.",
    oppositeDescription:
      "Do not print semicolons, except at the beginning of lines which may need them."
  },
  singleQuote: {
    since: "0.0.0",
    category: CATEGORY_JAVASCRIPT,
    type: "boolean",
    default: false,
    description: "Use single quotes instead of double quotes."
  },
  trailingComma: {
    since: "0.0.0",
    category: CATEGORY_JAVASCRIPT,
    type: "choice",
    default: [
      { since: "0.0.0", value: false },
      { since: "0.19.0", value: "none" }
    ],
    description: "Print trailing commas wherever possible when multi-line.",
    choices: [
      { value: "none", description: "No trailing commas." },
      {
        value: "es5",
        description:
          "Trailing commas where valid in ES5 (objects, arrays, etc.)"
      },
      {
        value: "all",
        description:
          "Trailing commas wherever possible (including function arguments)."
      },
      { value: true, deprecated: "0.19.0", redirect: "es5" },
      { value: false, deprecated: "0.19.0", redirect: "none" }
    ]
  }
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const createError = __webpack_require__(22);

function parse(text, parsers, opts) {
  // Inline the require to avoid loading all the JS if we don't use it
  const babylon = __webpack_require__(8);

  const babylonOptions = {
    sourceType: "module",
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
      "jsx",
      "flow",
      "doExpressions",
      "objectRestSpread",
      "decorators",
      "classProperties",
      "exportDefaultFrom",
      "exportNamespaceFrom",
      "asyncGenerators",
      "functionBind",
      "functionSent",
      "dynamicImport",
      "numericSeparator",
      "importMeta",
      "optionalCatchBinding",
      "optionalChaining",
      "classPrivateProperties",
      "pipelineOperator",
      "nullishCoalescingOperator"
    ]
  };

  const parseMethod =
    opts && opts.parser === "json" ? "parseExpression" : "parse";

  let ast;
  try {
    ast = babylon[parseMethod](text, babylonOptions);
  } catch (originalError) {
    try {
      ast = babylon[parseMethod](
        text,
        Object.assign({}, babylonOptions, { strictMode: false })
      );
    } catch (nonStrictError) {
      throw createError(
        // babel error prints (l:c) with cols that are zero indexed
        // so we need our custom error
        originalError.message.replace(/ \(.*\)/, ""),
        {
          start: {
            line: originalError.loc.line,
            column: originalError.loc.column + 1
          }
        }
      );
    }
  }
  delete ast.tokens;
  return ast;
}

module.exports = parse;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


let globalOptions = {}
const assert = __webpack_require__(4);
// TODO(azz): anything that imports from main shouldn't be in a `language-*` dir.
const comments = __webpack_require__(29);
const util = __webpack_require__(0);
const isIdentifierName = __webpack_require__(14).keyword.isIdentifierNameES6;
const embed = __webpack_require__(27);
const clean = __webpack_require__(26);

const doc = __webpack_require__(1);
const docBuilders = doc.builders;
const concat = docBuilders.concat;
const join = docBuilders.join;
const line = docBuilders.line;
const hardline = docBuilders.hardline;
const softline = docBuilders.softline;
const literalline = docBuilders.literalline;
const group = docBuilders.group;
const indent = docBuilders.indent;
const align = docBuilders.align;
const conditionalGroup = docBuilders.conditionalGroup;
const fill = docBuilders.fill;
const ifBreak = docBuilders.ifBreak;
const breakParent = docBuilders.breakParent;
const lineSuffixBoundary = docBuilders.lineSuffixBoundary;
const addAlignmentToDoc = docBuilders.addAlignmentToDoc;
const dedent = docBuilders.dedent;

const docUtils = doc.utils;
const willBreak = docUtils.willBreak;
const isLineNext = docUtils.isLineNext;
const isEmpty = docUtils.isEmpty;
const rawText = docUtils.rawText;

function shouldPrintComma(options, level) {
  level = level || "es5";

  switch (options.trailingComma) {
    case "all":
      if (level === "all") {
        return true;
      }
    // fallthrough
    case "es5":
      if (level === "es5") {
        return true;
      }
    // fallthrough
    case "none":
    default:
      return false;
  }
}

function genericPrint(path, options, printPath, args) {
	globalOptions = options
  const node = path.getValue();
  let needsParens = false;
  const linesWithoutParens = printPathNoParens(path, options, printPath, args);

  if (!node || isEmpty(linesWithoutParens)) {
    return linesWithoutParens;
  }

  const decorators = [];
  if (
    node.decorators &&
    node.decorators.length > 0 &&
    // If the parent node is an export declaration, it will be
    // responsible for printing node.decorators.
    !util.getParentExportDeclaration(path)
  ) {
    let separator = hardline;
    path.each(decoratorPath => {
      let prefix = "@";
      let decorator = decoratorPath.getValue();
      if (decorator.expression) {
        decorator = decorator.expression;
        prefix = "";
      }

      if (
        node.decorators.length === 1 &&
        node.type !== "ClassDeclaration" &&
        node.type !== "MethodDefinition" &&
        node.type !== "ClassMethod" &&
        (decorator.type === "Identifier" ||
          decorator.type === "MemberExpression" ||
          (decorator.type === "CallExpression" &&
            (decorator.arguments.length === 0 ||
              (decorator.arguments.length === 1 &&
                (isStringLiteral(decorator.arguments[0]) ||
                  decorator.arguments[0].type === "Identifier" ||
                  decorator.arguments[0].type === "MemberExpression")))))
      ) {
        separator = line;
      }

      decorators.push(prefix, printPath(decoratorPath), separator);
    }, "decorators");
  } else if (
    util.isExportDeclaration(node) &&
    node.declaration &&
    node.declaration.decorators
  ) {
    // Export declarations are responsible for printing any decorators
    // that logically apply to node.declaration.
    path.each(
      decoratorPath => {
        const decorator = decoratorPath.getValue();
        const prefix = decorator.type === "Decorator" ? "" : "@";
        decorators.push(prefix, printPath(decoratorPath), hardline);
      },
      "declaration",
      "decorators"
    );
  } else {
    // Nodes with decorators can't have parentheses, so we can avoid
    // computing path.needsParens() except in this case.
    needsParens = path.needsParens(options);
  }

  const parts = [];
  if (needsParens) {
    parts.unshift("(");
  }

  parts.push(linesWithoutParens);

  if (needsParens) {
    parts.push(")");
  }

  if (decorators.length > 0) {
    return group(concat(decorators.concat(parts)));
  }
  return concat(parts);
}

const isExclude = (name) => /^(flow|pipe|compose)$/.test(name)

function hasPrettierIgnore(path) {
	const node = path.getValue()
	if (
		(node && node.callee && isExclude(node.callee.name)) ||
		(node && node.arguments && node.arguments.some((node) => {
			return node && node.callee && isExclude(node.callee.name)
		}))
	) {
		return true
	}

  return util.hasIgnoreComment(path) || hasJsxIgnoreComment(path);
}

function hasJsxIgnoreComment(path) {
  const node = path.getValue();
  const parent = path.getParentNode();
  if (!parent || !node || !isJSXNode(node) || !isJSXNode(parent)) {
    return false;
  }

  // Lookup the previous sibling, ignoring any empty JSXText elements
  const index = parent.children.indexOf(node);
  let prevSibling = null;
  for (let i = index; i > 0; i--) {
    const candidate = parent.children[i - 1];
    if (candidate.type === "JSXText" && !isMeaningfulJSXText(candidate)) {
      continue;
    }
    prevSibling = candidate;
    break;
  }

  return (
    prevSibling &&
    prevSibling.type === "JSXExpressionContainer" &&
    prevSibling.expression.type === "JSXEmptyExpression" &&
    prevSibling.expression.comments &&
    prevSibling.expression.comments.find(
      comment => comment.value.trim() === "prettier-ignore"
    )
  );
}

function printPathNoParens(path, options, print, args) {
  const n = path.getValue();
  const semi = options.semi ? ";" : "";

  if (!n) {
    return "";
  }

  if (typeof n === "string") {
    return n;
  }

  let parts = [];
  switch (n.type) {
    case "File":
      return path.call(print, "program");
    case "Program":
      // Babel 6
      if (n.directives) {
        path.each(childPath => {
          parts.push(print(childPath), semi, hardline);
          if (
            util.isNextLineEmpty(options.originalText, childPath.getValue())
          ) {
            parts.push(hardline);
          }
        }, "directives");
      }

      parts.push(
        path.call(bodyPath => {
          return printStatementSequence(bodyPath, options, print);
        }, "body")
      );

      parts.push(
        comments.printDanglingComments(path, options, /* sameIndent */ true)
      );

      // Only force a trailing newline if there were any contents.
      if (n.body.length || n.comments) {
        parts.push(hardline);
      }

      return concat(parts);
    // Babel extension.
    case "EmptyStatement":
      return "";
    case "ExpressionStatement":
      // Detect Flow-parsed directives
      if (n.directive) {
        return concat([nodeStr(n.expression, options, true), semi]);
      }
      // Do not append semicolon after the only JSX element in a program
      return concat([
        path.call(print, "expression"),
        isTheOnlyJSXElementInMarkdown(options, path) ? "" : semi
      ]); // Babel extension.
    case "ParenthesizedExpression":
      return concat(["(", path.call(print, "expression"), ")"]);
    case "AssignmentExpression":
      return printAssignment(
        n.left,
        path.call(print, "left"),
        concat([" ", n.operator]),
        n.right,
        path.call(print, "right"),
        options
      );
    case "BinaryExpression":
    case "LogicalExpression": {
      const parent = path.getParentNode();
      const parentParent = path.getParentNode(1);
      const isInsideParenthesis =
        n !== parent.body &&
        (parent.type === "IfStatement" ||
          parent.type === "WhileStatement" ||
          parent.type === "DoWhileStatement");

      const parts = printBinaryishExpressions(
        path,
        print,
        options,
        /* isNested */ false,
        isInsideParenthesis
      );

      //   if (
      //     this.hasPlugin("dynamicImports") && this.lookahead().type === tt.parenLeft
      //   ) {
      //
      // looks super weird, we want to break the children if the parent breaks
      //
      //   if (
      //     this.hasPlugin("dynamicImports") &&
      //     this.lookahead().type === tt.parenLeft
      //   ) {
      if (isInsideParenthesis) {
        return concat(parts);
      }

      // Break between the parens in unaries or in a member expression, i.e.
      //
      //   (
      //     a &&
      //     b &&
      //     c
      //   ).call()
      if (
        parent.type === "UnaryExpression" ||
        (parent.type === "MemberExpression" && !parent.computed)
      ) {
        return group(
          concat([indent(concat([softline, concat(parts)])), softline])
        );
      }

      // Avoid indenting sub-expressions in some cases where the first sub-expression is already
      // indented accordingly. We should indent sub-expressions where the first case isn't indented.
      const shouldNotIndent =
        parent.type === "ReturnStatement" ||
        (parent.type === "JSXExpressionContainer" &&
          parentParent.type === "JSXAttribute") ||
        (n === parent.body && parent.type === "ArrowFunctionExpression") ||
        (n !== parent.body && parent.type === "ForStatement") ||
        (parent.type === "ConditionalExpression" &&
          parentParent.type !== "ReturnStatement");

      const shouldIndentIfInlining =
        parent.type === "AssignmentExpression" ||
        parent.type === "VariableDeclarator" ||
        parent.type === "ObjectProperty" ||
        parent.type === "Property";

      const samePrecedenceSubExpression =
        isBinaryish(n.left) && util.shouldFlatten(n.operator, n.left.operator);

      if (
        shouldNotIndent ||
        (shouldInlineLogicalExpression(n) && !samePrecedenceSubExpression) ||
        (!shouldInlineLogicalExpression(n) && shouldIndentIfInlining)
      ) {
        return group(concat(parts));
      }

      const rest = concat(parts.slice(1));

      return group(
        concat([
          // Don't include the initial expression in the indentation
          // level. The first item is guaranteed to be the first
          // left-most expression.
          parts.length > 0 ? parts[0] : "",
          indent(rest)
        ])
      );
    }
    case "AssignmentPattern":
      return concat([
        path.call(print, "left"),
        " = ",
        path.call(print, "right")
      ]);
    case "TSTypeAssertionExpression":
      return concat([
        "<",
        path.call(print, "typeAnnotation"),
        ">",
        path.call(print, "expression")
      ]);
    case "MemberExpression": {
      const parent = path.getParentNode();
      let firstNonMemberParent;
      let i = 0;
      do {
        firstNonMemberParent = path.getParentNode(i);
        i++;
      } while (
        firstNonMemberParent &&
        (firstNonMemberParent.type === "MemberExpression" ||
          firstNonMemberParent.type === "TSNonNullExpression")
      );

      const shouldInline =
        (firstNonMemberParent &&
          (firstNonMemberParent.type === "NewExpression" ||
            (firstNonMemberParent.type === "VariableDeclarator" &&
              firstNonMemberParent.id.type !== "Identifier") ||
            (firstNonMemberParent.type === "AssignmentExpression" &&
              firstNonMemberParent.left.type !== "Identifier"))) ||
        n.computed ||
        (n.object.type === "Identifier" &&
          n.property.type === "Identifier" &&
          parent.type !== "MemberExpression");

      return concat([
        path.call(print, "object"),
        shouldInline
          ? printMemberLookup(path, options, print)
          : group(
              indent(
                concat([softline, printMemberLookup(path, options, print)])
              )
            )
      ]);
    }
    case "MetaProperty":
      return concat([
        path.call(print, "meta"),
        ".",
        path.call(print, "property")
      ]);
    case "BindExpression":
      if (n.object) {
        parts.push(path.call(print, "object"));
      }

      parts.push(printBindExpressionCallee(path, options, print));

      return concat(parts);
    case "Identifier": {
      return concat([
        n.name,
        printOptionalToken(path),
        printTypeAnnotation(path, options, print)
      ]);
    }
    case "SpreadElement":
    case "SpreadElementPattern":
    case "RestProperty":
    case "ExperimentalRestProperty":
    case "ExperimentalSpreadProperty":
    case "SpreadProperty":
    case "SpreadPropertyPattern":
    case "RestElement":
    case "ObjectTypeSpreadProperty":
      return concat([
        "...",
        path.call(print, "argument"),
        printTypeAnnotation(path, options, print)
      ]);
    case "FunctionDeclaration":
    case "FunctionExpression":
      if (isNodeStartingWithDeclare(n, options)) {
        parts.push("declare ");
      }
      parts.push(printFunctionDeclaration(path, print, options));
      if (!n.body) {
        parts.push(semi);
      }
      return concat(parts);
    case "ArrowFunctionExpression": {
      if (n.async) {
        parts.push("async ");
      }

      if (shouldPrintParamsWithoutParens(path, options)) {
        parts.push(path.call(print, "params", 0));
      } else {
        parts.push(
          group(
            concat([
              printFunctionParams(
                path,
                print,
                options,
                /* expandLast */ args &&
                  (args.expandLastArg || args.expandFirstArg),
                /* printTypeParams */ true
              ),
              printReturnType(path, print, options)
            ])
          )
        );
      }

      const dangling = comments.printDanglingComments(
        path,
        options,
        /* sameIndent */ true,
        comment => {
          const nextCharacter = util.getNextNonSpaceNonCommentCharacterIndex(
            options.originalText,
            comment
          );
          return options.originalText.substr(nextCharacter, 2) === "=>";
        }
      );
      if (dangling) {
        parts.push(" ", dangling);
      }

      parts.push(" =>");

      const body = path.call(bodyPath => print(bodyPath, args), "body");

      // We want to always keep these types of nodes on the same line
      // as the arrow.
      if (
        !hasLeadingOwnLineComment(options.originalText, n.body) &&
        (n.body.type === "ArrayExpression" ||
          n.body.type === "ObjectExpression" ||
          n.body.type === "BlockStatement" ||
          isJSXNode(n.body) ||
          isTemplateOnItsOwnLine(n.body, options.originalText) ||
          n.body.type === "ArrowFunctionExpression")
      ) {
        return group(concat([concat(parts), " ", body]));
      }

      // We handle sequence expressions as the body of arrows specially,
      // so that the required parentheses end up on their own lines.
      if (n.body.type === "SequenceExpression") {
        return group(
          concat([
            concat(parts),
            group(
              concat([" (", indent(concat([softline, body])), softline, ")"])
            )
          ])
        );
      }

      // if the arrow function is expanded as last argument, we are adding a
      // level of indentation and need to add a softline to align the closing )
      // with the opening (, or if it's inside a JSXExpression (e.g. an attribute)
      // we should align the expression's closing } with the line with the opening {.
      const shouldAddSoftLine =
        ((args && args.expandLastArg) ||
          path.getParentNode().type === "JSXExpressionContainer") &&
        !(n.comments && n.comments.length);

      const printTrailingComma =
        args && args.expandLastArg && shouldPrintComma(options, "all");

      // In order to avoid confusion between
      // a => a ? a : a
      // a <= a ? a : a
      const shouldAddParens =
        n.body.type === "ConditionalExpression" &&
        !util.startsWithNoLookaheadToken(
          n.body,
          /* forbidFunctionAndClass */ false
        );

      return group(
        concat([
          concat(parts),
          group(
            concat([
              indent(
                concat([
                  line,
                  shouldAddParens ? ifBreak("", "(") : "",
                  body,
                  shouldAddParens ? ifBreak("", ")") : ""
                ])
              ),
              shouldAddSoftLine
                ? concat([ifBreak(printTrailingComma ? "," : ""), softline])
                : ""
            ])
          )
        ])
      );
    }
    case "MethodDefinition":
    case "TSAbstractMethodDefinition":
      if (n.accessibility) {
        parts.push(n.accessibility + " ");
      }
      if (n.static) {
        parts.push("static ");
      }
      if (n.type === "TSAbstractMethodDefinition") {
        parts.push("abstract ");
      }

      parts.push(printMethod(path, options, print));

      return concat(parts);
    case "YieldExpression":
      parts.push("yield");

      if (n.delegate) {
        parts.push("*");
      }
      if (n.argument) {
        parts.push(" ", path.call(print, "argument"));
      }

      return concat(parts);
    case "AwaitExpression":
      return concat(["await ", path.call(print, "argument")]);
    case "ImportSpecifier":
      if (n.importKind) {
        parts.push(path.call(print, "importKind"), " ");
      }

      parts.push(path.call(print, "imported"));

      if (n.local && n.local.name !== n.imported.name) {
        parts.push(" as ", path.call(print, "local"));
      }

      return concat(parts);
    case "ExportSpecifier":
      parts.push(path.call(print, "local"));

      if (n.exported && n.exported.name !== n.local.name) {
        parts.push(" as ", path.call(print, "exported"));
      }

      return concat(parts);
    case "ImportNamespaceSpecifier":
      parts.push("* as ");

      if (n.local) {
        parts.push(path.call(print, "local"));
      } else if (n.id) {
        parts.push(path.call(print, "id"));
      }

      return concat(parts);
    case "ImportDefaultSpecifier":
      if (n.local) {
        return path.call(print, "local");
      }

      return path.call(print, "id");
    case "TSExportAssignment":
      return concat(["export = ", path.call(print, "expression"), semi]);
    case "ExportDefaultDeclaration":
    case "ExportNamedDeclaration":
      return printExportDeclaration(path, options, print);
    case "ExportAllDeclaration":
      parts.push("export ");

      if (n.exportKind === "type") {
        parts.push("type ");
      }

      parts.push("* from ", path.call(print, "source"), semi);

      return concat(parts);

    case "ExportNamespaceSpecifier":
    case "ExportDefaultSpecifier":
      return path.call(print, "exported");
    case "ImportDeclaration": {
      parts.push("import ");

      if (n.importKind && n.importKind !== "value") {
        parts.push(n.importKind + " ");
      }

      const standalones = [];
      const grouped = [];
      if (n.specifiers && n.specifiers.length > 0) {
        path.each(specifierPath => {
          const value = specifierPath.getValue();
          if (
            value.type === "ImportDefaultSpecifier" ||
            value.type === "ImportNamespaceSpecifier"
          ) {
            standalones.push(print(specifierPath));
          } else {
            grouped.push(print(specifierPath));
          }
        }, "specifiers");

        if (standalones.length > 0) {
          parts.push(join(", ", standalones));
        }

        if (standalones.length > 0 && grouped.length > 0) {
          parts.push(", ");
        }

        if (
          grouped.length === 1 &&
          standalones.length === 0 &&
          n.specifiers &&
          !n.specifiers.some(node => node.comments)
        ) {
          parts.push(
            concat([
              "{",
              options.bracketSpacing ? " " : "",
              concat(grouped),
              options.bracketSpacing ? " " : "",
              "}"
            ])
          );
        } else if (grouped.length >= 1) {
          parts.push(
            group(
              concat([
                "{",
                indent(
                  concat([
                    options.bracketSpacing ? line : softline,
                    join(concat([",", line]), grouped)
                  ])
                ),
                ifBreak(shouldPrintComma(options) ? "," : ""),
                options.bracketSpacing ? line : softline,
                "}"
              ])
            )
          );
        }

        parts.push(" from ");
      } else if (
        (n.importKind && n.importKind === "type") ||
        // import {} from 'x'
        /{\s*}/.test(
          options.originalText.slice(util.locStart(n), util.locStart(n.source))
        )
      ) {
        parts.push("{} from ");
      }

      parts.push(path.call(print, "source"), semi);

      return concat(parts);
    }

    case "Import":
      return "import";
    case "BlockStatement": {
      const naked = path.call(bodyPath => {
        return printStatementSequence(bodyPath, options, print);
      }, "body");

      const hasContent = n.body.find(node => node.type !== "EmptyStatement");
      const hasDirectives = n.directives && n.directives.length > 0;

      const parent = path.getParentNode();
      const parentParent = path.getParentNode(1);
      if (
        !hasContent &&
        !hasDirectives &&
        !hasDanglingComments(n) &&
        (parent.type === "ArrowFunctionExpression" ||
          parent.type === "FunctionExpression" ||
          parent.type === "FunctionDeclaration" ||
          parent.type === "ObjectMethod" ||
          parent.type === "ClassMethod" ||
          parent.type === "ForStatement" ||
          parent.type === "WhileStatement" ||
          parent.type === "DoWhileStatement" ||
          (parent.type === "CatchClause" && !parentParent.finalizer))
      ) {
        return "{}";
      }

      parts.push("{");

      // Babel 6
      if (hasDirectives) {
        path.each(childPath => {
          parts.push(indent(concat([hardline, print(childPath), semi])));
          if (
            util.isNextLineEmpty(options.originalText, childPath.getValue())
          ) {
            parts.push(hardline);
          }
        }, "directives");
      }

      if (hasContent) {
        parts.push(indent(concat([hardline, naked])));
      }

      parts.push(comments.printDanglingComments(path, options));
      parts.push(hardline, "}");

      return concat(parts);
    }
    case "ReturnStatement":
      parts.push("return");

      if (n.argument) {
        if (returnArgumentHasLeadingComment(options, n.argument)) {
          parts.push(
            concat([
              " (",
              indent(concat([hardline, path.call(print, "argument")])),
              hardline,
              ")"
            ])
          );
        } else if (
          n.argument.type === "LogicalExpression" ||
          n.argument.type === "BinaryExpression" ||
          n.argument.type === "SequenceExpression"
        ) {
          parts.push(
            group(
              concat([
                ifBreak(" (", " "),
                indent(concat([softline, path.call(print, "argument")])),
                softline,
                ifBreak(")")
              ])
            )
          );
        } else {
          parts.push(" ", path.call(print, "argument"));
        }
      }

      if (hasDanglingComments(n)) {
        parts.push(
          " ",
          comments.printDanglingComments(path, options, /* sameIndent */ true)
        );
      }

      parts.push(semi);

      return concat(parts);
    case "NewExpression":
    case "CallExpression": {
      const isNew = n.type === "NewExpression";

      const optional = printOptionalToken(path);
      if (
        // We want to keep CommonJS- and AMD-style require calls, and AMD-style
        // define calls, as a unit.
        // e.g. `define(["some/lib", (lib) => {`
        (!isNew &&
          n.callee.type === "Identifier" &&
          (n.callee.name === "require" || n.callee.name === "define")) ||
        n.callee.type === "Import" ||
        // Template literals as single arguments
        (n.arguments.length === 1 &&
          isTemplateOnItsOwnLine(n.arguments[0], options.originalText)) ||
        // Keep test declarations on a single line
        // e.g. `it('long name', () => {`
        (!isNew && isTestCall(n))
      ) {
        return concat([
          isNew ? "new " : "",
          path.call(print, "callee"),
          optional,
          path.call(print, "typeParameters"),
          concat(["(", join(", ", path.map(print, "arguments")), ")"])
        ]);
      }

      // We detect calls on member lookups and possibly print them in a
      // special chain format. See `printMemberChain` for more info.
      if (!isNew && isMemberish(n.callee)) {
        return printMemberChain(path, options, print);
      }

      return concat([
        isNew ? "new " : "",
        path.call(print, "callee"),
        optional,
        printFunctionTypeParameters(path, options, print),
        printArgumentsList(path, options, print)
      ]);
    }
    case "TSInterfaceDeclaration":
      if (isNodeStartingWithDeclare(n, options)) {
        parts.push("declare ");
      }

      parts.push(
        n.abstract ? "abstract " : "",
        printTypeScriptModifiers(path, options, print),
        "interface ",
        path.call(print, "id"),
        n.typeParameters ? path.call(print, "typeParameters") : "",
        " "
      );

      if (n.heritage.length) {
        parts.push(
          group(
            indent(
              concat([
                softline,
                "extends ",
                indent(join(concat([",", line]), path.map(print, "heritage"))),
                " "
              ])
            )
          )
        );
      }

      parts.push(path.call(print, "body"));

      return concat(parts);
    case "ObjectExpression":
    case "ObjectPattern":
    case "ObjectTypeAnnotation":
    case "TSInterfaceBody":
    case "TSTypeLiteral": {
      const isTypeAnnotation = n.type === "ObjectTypeAnnotation";
      const shouldBreak =
        n.type === "TSInterfaceBody" ||
        (n.type !== "ObjectPattern" &&
          util.hasNewlineInRange(
            options.originalText,
            util.locStart(n),
            util.locEnd(n)
          ));
      const parent = path.getParentNode(0);
      const isFlowInterfaceLikeBody =
        isTypeAnnotation &&
        parent &&
        (parent.type === "InterfaceDeclaration" ||
          parent.type === "DeclareInterface" ||
          parent.type === "DeclareClass") &&
        path.getName() === "body";
      const separator = isFlowInterfaceLikeBody
        ? ";"
        : n.type === "TSInterfaceBody" || n.type === "TSTypeLiteral"
          ? ifBreak(semi, ";")
          : ",";
      const fields = [];
      const leftBrace = n.exact ? "{|" : "{";
      const rightBrace = n.exact ? "|}" : "}";

      let propertiesField;

      if (n.type === "TSTypeLiteral") {
        propertiesField = "members";
      } else if (n.type === "TSInterfaceBody") {
        propertiesField = "body";
      } else {
        propertiesField = "properties";
      }

      if (isTypeAnnotation) {
        fields.push("indexers", "callProperties");
      }
      fields.push(propertiesField);

      // Unfortunately, things are grouped together in the ast can be
      // interleaved in the source code. So we need to reorder them before
      // printing them.
      const propsAndLoc = [];
      fields.forEach(field => {
        path.each(childPath => {
          const node = childPath.getValue();
          propsAndLoc.push({
            node: node,
            printed: print(childPath),
            loc: util.locStart(node)
          });
        }, field);
      });

      let separatorParts = [];
      const props = propsAndLoc.sort((a, b) => a.loc - b.loc).map(prop => {
        const result = concat(separatorParts.concat(group(prop.printed)));
        separatorParts = [separator, line];
        if (
          prop.node.type === "TSPropertySignature" &&
          util.hasNodeIgnoreComment(prop.node)
        ) {
          separatorParts.shift();
        }
        if (util.isNextLineEmpty(options.originalText, prop.node)) {
          separatorParts.push(hardline);
        }
        return result;
      });

      const lastElem = util.getLast(n[propertiesField]);

      const canHaveTrailingSeparator = !(
        lastElem &&
        (lastElem.type === "RestProperty" ||
          lastElem.type === "RestElement" ||
          lastElem.type === "ExperimentalRestProperty" ||
          util.hasNodeIgnoreComment(lastElem))
      );

      let content;
      if (props.length === 0 && !n.typeAnnotation) {
        if (!hasDanglingComments(n)) {
          return concat([leftBrace, rightBrace]);
        }

        content = group(
          concat([
            leftBrace,
            comments.printDanglingComments(path, options),
            softline,
            rightBrace,
            printOptionalToken(path)
          ])
        );
      } else {
        content = concat([
          leftBrace,
          indent(
            concat([options.bracketSpacing ? line : softline, concat(props)])
          ),
          ifBreak(
            canHaveTrailingSeparator &&
            (separator !== "," || shouldPrintComma(options))
              ? separator
              : ""
          ),
          concat([options.bracketSpacing ? line : softline, rightBrace]),
          printOptionalToken(path),
          printTypeAnnotation(path, options, print)
        ]);
      }

      // If we inline the object as first argument of the parent, we don't want
      // to create another group so that the object breaks before the return
      // type
      const parentParentParent = path.getParentNode(2);
      if (
        (n.type === "ObjectPattern" &&
          parent &&
          shouldHugArguments(parent) &&
          parent.params[0] === n) ||
        (shouldHugType(n) &&
          parentParentParent &&
          shouldHugArguments(parentParentParent) &&
          parentParentParent.params[0].typeAnnotation.typeAnnotation === n)
      ) {
        return content;
      }

      return group(content, { shouldBreak });
    }
    // Babel 6
    case "ObjectProperty": // Non-standard AST node type.
    case "Property":
      if (n.method || n.kind === "get" || n.kind === "set") {
        return printMethod(path, options, print);
      }

      if (n.shorthand) {
        parts.push(path.call(print, "value"));
      } else {
        let printedLeft;
        if (n.computed) {
          printedLeft = concat(["[", path.call(print, "key"), "]"]);
        } else {
          printedLeft = printPropertyKey(path, options, print);
        }
        parts.push(
          printAssignment(
            n.key,
            printedLeft,
            ":",
            n.value,
            path.call(print, "value"),
            options
          )
        );
      }

      return concat(parts); // Babel 6
    case "ClassMethod":
      if (n.static) {
        parts.push("static ");
      }

      parts = parts.concat(printObjectMethod(path, options, print));

      return concat(parts); // Babel 6
    case "ObjectMethod":
      return printObjectMethod(path, options, print);
    case "Decorator":
      return concat(["@", path.call(print, "expression")]);
    case "ArrayExpression":
    case "ArrayPattern":
      if (n.elements.length === 0) {
        if (!hasDanglingComments(n)) {
          parts.push("[]");
        } else {
          parts.push(
            group(
              concat([
                "[",
                comments.printDanglingComments(path, options),
                softline,
                "]"
              ])
            )
          );
        }
      } else {
        const lastElem = util.getLast(n.elements);
        const canHaveTrailingComma = !(
          lastElem && lastElem.type === "RestElement"
        );

        // JavaScript allows you to have empty elements in an array which
        // changes its length based on the number of commas. The algorithm
        // is that if the last argument is null, we need to force insert
        // a comma to ensure JavaScript recognizes it.
        //   [,].length === 1
        //   [1,].length === 1
        //   [1,,].length === 2
        //
        // Note that util.getLast returns null if the array is empty, but
        // we already check for an empty array just above so we are safe
        const needsForcedTrailingComma =
          canHaveTrailingComma && lastElem === null;

        parts.push(
          group(
            concat([
              "[",
              indent(
                concat([
                  softline,
                  printArrayItems(path, options, "elements", print)
                ])
              ),
              needsForcedTrailingComma ? "," : "",
              ifBreak(
                canHaveTrailingComma &&
                !needsForcedTrailingComma &&
                shouldPrintComma(options)
                  ? ","
                  : ""
              ),
              comments.printDanglingComments(
                path,
                options,
                /* sameIndent */ true
              ),
              softline,
              "]"
            ])
          )
        );
      }

      parts.push(
        printOptionalToken(path),
        printTypeAnnotation(path, options, print)
      );

      return concat(parts);
    case "SequenceExpression": {
      const parent = path.getParentNode(0);
      if (
        parent.type === "ExpressionStatement" ||
        parent.type === "ForStatement"
      ) {
        // For ExpressionStatements and for-loop heads, which are among
        // the few places a SequenceExpression appears unparenthesized, we want
        // to indent expressions after the first.
        const parts = [];
        path.each(p => {
          if (p.getName() === 0) {
            parts.push(print(p));
          } else {
            parts.push(",", indent(concat([line, print(p)])));
          }
        }, "expressions");
        return group(concat(parts));
      }
      return group(
        concat([join(concat([",", line]), path.map(print, "expressions"))])
      );
    }
    case "ThisExpression":
      return "this";
    case "Super":
      return "super";
    case "NullLiteral": // Babel 6 Literal split
      return "null";
    case "RegExpLiteral": // Babel 6 Literal split
      return printRegex(n);
    case "NumericLiteral": // Babel 6 Literal split
      return util.printNumber(n.extra.raw);
    case "BooleanLiteral": // Babel 6 Literal split
    case "StringLiteral": // Babel 6 Literal split
    case "Literal": {
      if (n.regex) {
        return printRegex(n.regex);
      }
      if (typeof n.value === "number") {
        return util.printNumber(n.raw);
      }
      if (typeof n.value !== "string") {
        return "" + n.value;
      }
      // TypeScript workaround for eslint/typescript-eslint-parser#267
      // See corresponding workaround in fast-path.js needsParens()
      const grandParent = path.getParentNode(1);
      const isTypeScriptDirective =
        options.parser === "typescript" &&
        typeof n.value === "string" &&
        grandParent &&
        (grandParent.type === "Program" ||
          grandParent.type === "BlockStatement");

      return nodeStr(n, options, isTypeScriptDirective);
    }
    case "Directive":
      return path.call(print, "value"); // Babel 6
    case "DirectiveLiteral":
      return nodeStr(n, options);
    case "UnaryExpression":
      parts.push(n.operator);

      if (/[a-z]$/.test(n.operator)) {
        parts.push(" ");
      }

      parts.push(path.call(print, "argument"));

      return concat(parts);
    case "UpdateExpression":
      parts.push(path.call(print, "argument"), n.operator);

      if (n.prefix) {
        parts.reverse();
      }

      return concat(parts);
    case "ConditionalExpression": {
      // We print a ConditionalExpression in either "JSX mode" or "normal mode".
      // See tests/jsx/conditional-expression.js for more info.
      let jsxMode = false;
      const parent = path.getParentNode();
      let forceNoIndent = parent.type === "ConditionalExpression";

      // Find the outermost non-ConditionalExpression parent, and the outermost
      // ConditionalExpression parent. We'll use these to determine if we should
      // print in JSX mode.
      let currentParent;
      let previousParent;
      let i = 0;
      do {
        previousParent = currentParent || n;
        currentParent = path.getParentNode(i);
        i++;
      } while (currentParent && currentParent.type === "ConditionalExpression");
      const firstNonConditionalParent = currentParent || parent;
      const lastConditionalParent = previousParent;

      if (
        isJSXNode(n.test) ||
        isJSXNode(n.consequent) ||
        isJSXNode(n.alternate) ||
        conditionalExpressionChainContainsJSX(lastConditionalParent)
      ) {
        jsxMode = true;
        forceNoIndent = true;

        // Even though they don't need parens, we wrap (almost) everything in
        // parens when using ?: within JSX, because the parens are analogous to
        // curly braces in an if statement.
        const wrap = doc =>
          concat([
            ifBreak("(", ""),
            indent(concat([softline, doc])),
            softline,
            ifBreak(")", "")
          ]);

        // The only things we don't wrap are:
        // * Nested conditional expressions in alternates
        // * null
        const isNull = node =>
          node.type === "NullLiteral" ||
          (node.type === "Literal" && node.value === null);

        parts.push(
          " ? ",
          isNull(n.consequent)
            ? path.call(print, "consequent")
            : wrap(path.call(print, "consequent")),
          " : ",
          n.alternate.type === "ConditionalExpression" || isNull(n.alternate)
            ? path.call(print, "alternate")
            : wrap(path.call(print, "alternate"))
        );
      } else {
        // normal mode
        const part = concat([
          line,
          "? ",
          n.consequent.type === "ConditionalExpression" ? ifBreak("", "(") : "",
          align(2, path.call(print, "consequent")),
          n.consequent.type === "ConditionalExpression" ? ifBreak("", ")") : "",
          line,
          ": ",
          align(2, path.call(print, "alternate"))
        ]);
        parts.push(
          parent.type === "ConditionalExpression"
            ? options.useTabs
              ? dedent(indent(part))
              : align(Math.max(0, options.tabWidth - 2), part)
            : part
        );
      }

      // In JSX mode, we want a whole chain of ConditionalExpressions to all
      // break if any of them break. That means we should only group around the
      // outer-most ConditionalExpression.
      const maybeGroup = doc =>
        jsxMode
          ? parent === firstNonConditionalParent ? group(doc) : doc
          : group(doc); // Always group in normal mode.

      // Break the closing paren to keep the chain right after it:
      // (a
      //   ? b
      //   : c
      // ).call()
      const breakClosingParen =
        !jsxMode && parent.type === "MemberExpression" && !parent.computed;

      return maybeGroup(
        concat([
          path.call(print, "test"),
          forceNoIndent ? concat(parts) : indent(concat(parts)),
          breakClosingParen ? softline : ""
        ])
      );
    }
    case "VariableDeclaration": {
      const printed = path.map(childPath => {
        return print(childPath);
      }, "declarations");

      // We generally want to terminate all variable declarations with a
      // semicolon, except when they in the () part of for loops.
      const parentNode = path.getParentNode();

      const isParentForLoop =
        parentNode.type === "ForStatement" ||
        parentNode.type === "ForInStatement" ||
        parentNode.type === "ForOfStatement" ||
        parentNode.type === "ForAwaitStatement";

      const hasValue = n.declarations.some(decl => decl.init);

      let firstVariable;
      if (printed.length === 1) {
        firstVariable = printed[0];
      } else if (printed.length > 1) {
        // Indent first var to comply with eslint one-var rule
        firstVariable = indent(printed[0]);
      }

      parts = [
        isNodeStartingWithDeclare(n, options) ? "declare " : "",
        n.kind,
        firstVariable ? concat([" ", firstVariable]) : "",
        indent(
          concat(
            printed
              .slice(1)
              .map(p =>
                concat([",", hasValue && !isParentForLoop ? hardline : line, p])
              )
          )
        )
      ];

      if (!(isParentForLoop && parentNode.body !== n)) {
        parts.push(semi);
      }

      return group(concat(parts));
    }
    case "VariableDeclarator":
      return printAssignment(
        n.id,
        concat([path.call(print, "id"), path.call(print, "typeParameters")]),
        " =",
        n.init,
        n.init && path.call(print, "init"),
        options
      );
    case "WithStatement":
      return group(
        concat([
          "with (",
          path.call(print, "object"),
          ")",
          adjustClause(n.body, path.call(print, "body"))
        ])
      );
    case "IfStatement": {
      const con = adjustClause(n.consequent, path.call(print, "consequent"));
      const opening = group(
        concat([
          "if (",
          group(
            concat([
              indent(concat([softline, path.call(print, "test")])),
              softline
            ])
          ),
          ")",
          con
        ])
      );

      parts.push(opening);

      if (n.alternate) {
        if (n.consequent.type === "BlockStatement") {
          parts.push(" else");
        } else {
          parts.push(hardline, "else");
        }

        parts.push(
          group(
            adjustClause(
              n.alternate,
              path.call(print, "alternate"),
              n.alternate.type === "IfStatement"
            )
          )
        );
      }

      return concat(parts);
    }
    case "ForStatement": {
      const body = adjustClause(n.body, path.call(print, "body"));

      // We want to keep dangling comments above the loop to stay consistent.
      // Any comment positioned between the for statement and the parentheses
      // is going to be printed before the statement.
      const dangling = comments.printDanglingComments(
        path,
        options,
        /* sameLine */ true
      );
      const printedComments = dangling ? concat([dangling, softline]) : "";

      if (!n.init && !n.test && !n.update) {
        return concat([printedComments, group(concat(["for (;;)", body]))]);
      }

      return concat([
        printedComments,
        group(
          concat([
            "for (",
            group(
              concat([
                indent(
                  concat([
                    softline,
                    path.call(print, "init"),
                    ";",
                    line,
                    path.call(print, "test"),
                    ";",
                    line,
                    path.call(print, "update")
                  ])
                ),
                softline
              ])
            ),
            ")",
            body
          ])
        )
      ]);
    }
    case "WhileStatement":
      return group(
        concat([
          "while (",
          group(
            concat([
              indent(concat([softline, path.call(print, "test")])),
              softline
            ])
          ),
          ")",
          adjustClause(n.body, path.call(print, "body"))
        ])
      );
    case "ForInStatement":
      // Note: esprima can't actually parse "for each (".
      return group(
        concat([
          n.each ? "for each (" : "for (",
          path.call(print, "left"),
          " in ",
          path.call(print, "right"),
          ")",
          adjustClause(n.body, path.call(print, "body"))
        ])
      );

    case "ForOfStatement":
    case "ForAwaitStatement": {
      // Babylon 7 removed ForAwaitStatement in favor of ForOfStatement
      // with `"await": true`:
      // https://github.com/estree/estree/pull/138
      const isAwait = n.type === "ForAwaitStatement" || n.await;

      return group(
        concat([
          "for",
          isAwait ? " await" : "",
          " (",
          path.call(print, "left"),
          " of ",
          path.call(print, "right"),
          ")",
          adjustClause(n.body, path.call(print, "body"))
        ])
      );
    }

    case "DoWhileStatement": {
      const clause = adjustClause(n.body, path.call(print, "body"));
      const doBody = group(concat(["do", clause]));
      parts = [doBody];

      if (n.body.type === "BlockStatement") {
        parts.push(" ");
      } else {
        parts.push(hardline);
      }
      parts.push("while (");

      parts.push(
        group(
          concat([
            indent(concat([softline, path.call(print, "test")])),
            softline
          ])
        ),
        ")",
        semi
      );

      return concat(parts);
    }
    case "DoExpression":
      return concat(["do ", path.call(print, "body")]);
    case "BreakStatement":
      parts.push("break");

      if (n.label) {
        parts.push(" ", path.call(print, "label"));
      }

      parts.push(semi);

      return concat(parts);
    case "ContinueStatement":
      parts.push("continue");

      if (n.label) {
        parts.push(" ", path.call(print, "label"));
      }

      parts.push(semi);

      return concat(parts);
    case "LabeledStatement":
      if (n.body.type === "EmptyStatement") {
        return concat([path.call(print, "label"), ":;"]);
      }

      return concat([
        path.call(print, "label"),
        ": ",
        path.call(print, "body")
      ]);
    case "TryStatement":
      return concat([
        "try ",
        path.call(print, "block"),
        n.handler ? concat([" ", path.call(print, "handler")]) : "",
        n.finalizer ? concat([" finally ", path.call(print, "finalizer")]) : ""
      ]);
    case "CatchClause":
      return concat([
        "catch ",
        n.param ? concat(["(", path.call(print, "param"), ") "]) : "",
        path.call(print, "body")
      ]);
    case "ThrowStatement":
      return concat(["throw ", path.call(print, "argument"), semi]);
    // Note: ignoring n.lexical because it has no printing consequences.
    case "SwitchStatement":
      return concat([
        "switch (",
        path.call(print, "discriminant"),
        ") {",
        n.cases.length > 0
          ? indent(
              concat([
                hardline,
                join(
                  hardline,
                  path.map(casePath => {
                    const caseNode = casePath.getValue();
                    return concat([
                      casePath.call(print),
                      n.cases.indexOf(caseNode) !== n.cases.length - 1 &&
                      util.isNextLineEmpty(options.originalText, caseNode)
                        ? hardline
                        : ""
                    ]);
                  }, "cases")
                )
              ])
            )
          : "",
        hardline,
        "}"
      ]);
    case "SwitchCase": {
      if (n.test) {
        parts.push("case ", path.call(print, "test"), ":");
      } else {
        parts.push("default:");
      }

      const consequent = n.consequent.filter(
        node => node.type !== "EmptyStatement"
      );

      if (consequent.length > 0) {
        const cons = path.call(consequentPath => {
          return printStatementSequence(consequentPath, options, print);
        }, "consequent");

        parts.push(
          consequent.length === 1 && consequent[0].type === "BlockStatement"
            ? concat([" ", cons])
            : indent(concat([hardline, cons]))
        );
      }

      return concat(parts);
    }
    // JSX extensions below.
    case "DebuggerStatement":
      return concat(["debugger", semi]);
    case "JSXAttribute":
      parts.push(path.call(print, "name"));

      if (n.value) {
        let res;
        if (isStringLiteral(n.value)) {
          const value = rawText(n.value);
          res = '"' + value.slice(1, -1).replace(/"/g, "&quot;") + '"';
        } else {
          res = path.call(print, "value");
        }
        parts.push("=", res);
      }

      return concat(parts);
    case "JSXIdentifier":
      // Can be removed when this is fixed:
      // https://github.com/eslint/typescript-eslint-parser/issues/337
      if (!n.name) {
        return "this";
      }
      return "" + n.name;
    case "JSXNamespacedName":
      return join(":", [
        path.call(print, "namespace"),
        path.call(print, "name")
      ]);
    case "JSXMemberExpression":
      return join(".", [
        path.call(print, "object"),
        path.call(print, "property")
      ]);
    case "TSQualifiedName":
      return join(".", [path.call(print, "left"), path.call(print, "right")]);
    case "JSXSpreadAttribute":
    case "JSXSpreadChild": {
      return concat([
        "{",
        path.call(p => {
          const printed = concat(["...", print(p)]);
          const n = p.getValue();
          if (!n.comments || !n.comments.length) {
            return printed;
          }
          return concat([
            indent(
              concat([
                softline,
                comments.printComments(p, () => printed, options)
              ])
            ),
            softline
          ]);
        }, n.type === "JSXSpreadAttribute" ? "argument" : "expression"),
        "}"
      ]);
    }
    case "JSXExpressionContainer": {
      const parent = path.getParentNode(0);

      const preventInline =
        parent.type === "JSXAttribute" &&
        n.expression.comments &&
        n.expression.comments.length > 0;

      const shouldInline =
        !preventInline &&
        (n.expression.type === "ArrayExpression" ||
          n.expression.type === "ObjectExpression" ||
          n.expression.type === "ArrowFunctionExpression" ||
          n.expression.type === "CallExpression" ||
          n.expression.type === "FunctionExpression" ||
          n.expression.type === "JSXEmptyExpression" ||
          n.expression.type === "TemplateLiteral" ||
          n.expression.type === "TaggedTemplateExpression" ||
          n.expression.type === "DoExpression" ||
          (isJSXNode(parent) &&
            (n.expression.type === "ConditionalExpression" ||
              isBinaryish(n.expression))));

      if (shouldInline) {
        return group(
          concat(["{", path.call(print, "expression"), lineSuffixBoundary, "}"])
        );
      }

      return group(
        concat([
          "{",
          indent(concat([softline, path.call(print, "expression")])),
          softline,
          lineSuffixBoundary,
          "}"
        ])
      );
    }
    case "JSXFragment":
    case "TSJsxFragment":
    case "JSXElement": {
      const elem = comments.printComments(
        path,
        () => printJSXElement(path, options, print),
        options
      );
      return maybeWrapJSXElementInParens(path, elem);
    }
    case "JSXOpeningElement": {
      const n = path.getValue();

      const nameHasComments =
        n.name && n.name.comments && n.name.comments.length > 0;

      // Don't break self-closing elements with no attributes and no comments
      if (n.selfClosing && !n.attributes.length && !nameHasComments) {
        return concat(["<", path.call(print, "name"), " />"]);
      }

      // don't break up opening elements with a single long text attribute
      if (
        n.attributes &&
        n.attributes.length === 1 &&
        n.attributes[0].value &&
        isStringLiteral(n.attributes[0].value) &&
        // We should break for the following cases:
        // <div
        //   // comment
        //   attr="value"
        // >
        // <div
        //   attr="value"
        //   // comment
        // >
        !nameHasComments &&
        (!n.attributes[0].comments || !n.attributes[0].comments.length)
      ) {
        return group(
          concat([
            "<",
            path.call(print, "name"),
            " ",
            concat(path.map(print, "attributes")),
            n.selfClosing ? " />" : ">"
          ])
        );
      }

      const lastAttrHasTrailingComments =
        n.attributes.length && hasTrailingComment(util.getLast(n.attributes));

      const bracketSameLine =
        options.jsxBracketSameLine &&
        // We should print the bracket in a new line for the following cases:
        // <div
        //   // comment
        // >
        // <div
        //   attr // comment
        // >
        (!nameHasComments || n.attributes.length) &&
        !lastAttrHasTrailingComments;

      return group(
        concat([
          "<",
          path.call(print, "name"),
          concat([
            indent(
              concat(
                path.map(attr => concat([line, print(attr)]), "attributes")
              )
            ),
            n.selfClosing ? line : bracketSameLine ? ">" : softline
          ]),
          n.selfClosing ? "/>" : bracketSameLine ? "" : ">"
        ])
      );
    }
    case "JSXClosingElement":
      return concat(["</", path.call(print, "name"), ">"]);
    case "JSXOpeningFragment":
    case "JSXClosingFragment":
    case "TSJsxOpeningFragment":
    case "TSJsxClosingFragment": {
      const hasComment = n.comments && n.comments.length;
      const hasOwnLineComment =
        hasComment && !n.comments.every(util.isBlockComment);
      const isOpeningFragment =
        n.type === "JSXOpeningFragment" || n.type === "TSJsxOpeningFragment";
      return concat([
        isOpeningFragment ? "<" : "</",
        indent(
          concat([
            hasOwnLineComment
              ? hardline
              : hasComment && !isOpeningFragment ? " " : "",
            comments.printDanglingComments(path, options, true)
          ])
        ),
        hasOwnLineComment ? hardline : "",
        ">"
      ]);
    }
    case "JSXText":
      /* istanbul ignore next */
      throw new Error("JSXTest should be handled by JSXElement");
    case "JSXEmptyExpression": {
      const requiresHardline =
        n.comments && !n.comments.every(util.isBlockComment);

      return concat([
        comments.printDanglingComments(
          path,
          options,
          /* sameIndent */ !requiresHardline
        ),
        requiresHardline ? hardline : ""
      ]);
    }
    case "ClassBody":
      if (!n.comments && n.body.length === 0) {
        return "{}";
      }

      return concat([
        "{",
        n.body.length > 0
          ? indent(
              concat([
                hardline,
                path.call(bodyPath => {
                  return printStatementSequence(bodyPath, options, print);
                }, "body")
              ])
            )
          : comments.printDanglingComments(path, options),
        hardline,
        "}"
      ]);
    case "ClassProperty":
    case "TSAbstractClassProperty":
    case "ClassPrivateProperty": {
      if (n.accessibility) {
        parts.push(n.accessibility + " ");
      }
      if (n.static) {
        parts.push("static ");
      }
      if (n.type === "TSAbstractClassProperty") {
        parts.push("abstract ");
      }
      if (n.readonly) {
        parts.push("readonly ");
      }
      const variance = getFlowVariance(n);
      if (variance) {
        parts.push(variance);
      }
      if (n.computed) {
        parts.push("[", path.call(print, "key"), "]");
      } else {
        parts.push(printPropertyKey(path, options, print));
      }
      parts.push(printTypeAnnotation(path, options, print));
      if (n.value) {
        parts.push(
          " =",
          printAssignmentRight(
            n.value,
            path.call(print, "value"),
            false, // canBreak
            options
          )
        );
      }

      parts.push(semi);

      return concat(parts);
    }
    case "ClassDeclaration":
    case "ClassExpression":
    case "TSAbstractClassDeclaration":
      if (isNodeStartingWithDeclare(n, options)) {
        parts.push("declare ");
      }
      parts.push(concat(printClass(path, options, print)));
      return concat(parts);
    case "TSInterfaceHeritage":
      parts.push(path.call(print, "id"));

      if (n.typeParameters) {
        parts.push(path.call(print, "typeParameters"));
      }

      return concat(parts);
    case "TemplateElement":
      return join(literalline, n.value.raw.split(/\r?\n/g));
    case "TemplateLiteral": {
      const expressions = path.map(print, "expressions");

      parts.push("`");

      path.each(childPath => {
        const i = childPath.getName();

        parts.push(print(childPath));

        if (i < expressions.length) {
          // For a template literal of the following form:
          //   `someQuery {
          //     ${call({
          //       a,
          //       b,
          //     })}
          //   }`
          // the expression is on its own line (there is a \n in the previous
          // quasi literal), therefore we want to indent the JavaScript
          // expression inside at the beginning of ${ instead of the beginning
          // of the `.
          const tabWidth = options.tabWidth;
          const indentSize = util.getIndentSize(
            childPath.getValue().value.raw,
            tabWidth
          );

          let printed = expressions[i];

          if (
            (n.expressions[i].comments && n.expressions[i].comments.length) ||
            n.expressions[i].type === "MemberExpression" ||
            n.expressions[i].type === "ConditionalExpression"
          ) {
            printed = concat([indent(concat([softline, printed])), softline]);
          }

          const aligned = addAlignmentToDoc(printed, indentSize, tabWidth);

          parts.push(group(concat(["${", aligned, lineSuffixBoundary, "}"])));
        }
      }, "quasis");

      parts.push("`");

      return concat(parts);
    }
    // These types are unprintable because they serve as abstract
    // supertypes for other (printable) types.
    case "TaggedTemplateExpression":
      return concat([path.call(print, "tag"), path.call(print, "quasi")]);
    case "Node":
    case "Printable":
    case "SourceLocation":
    case "Position":
    case "Statement":
    case "Function":
    case "Pattern":
    case "Expression":
    case "Declaration":
    case "Specifier":
    case "NamedSpecifier":
    case "Comment":
    case "MemberTypeAnnotation": // Flow
    case "Type":
      /* istanbul ignore next */
      throw new Error("unprintable type: " + JSON.stringify(n.type));
    // Type Annotations for Facebook Flow, typically stripped out or
    // transformed away before printing.
    case "TypeAnnotation":
    case "TSTypeAnnotation":
      if (n.typeAnnotation) {
        return path.call(print, "typeAnnotation");
      }

      /* istanbul ignore next */
      return "";
    case "TSTupleType":
    case "TupleTypeAnnotation": {
      const typesField = n.type === "TSTupleType" ? "elementTypes" : "types";
      return group(
        concat([
          "[",
          indent(
            concat([
              softline,
              printArrayItems(path, options, typesField, print)
            ])
          ),
          // TypeScript doesn't support trailing commas in tuple types
          n.type === "TSTupleType"
            ? ""
            : ifBreak(shouldPrintComma(options) ? "," : ""),
          comments.printDanglingComments(path, options, /* sameIndent */ true),
          softline,
          "]"
        ])
      );
    }

    case "ExistsTypeAnnotation":
      return "*";
    case "EmptyTypeAnnotation":
      return "empty";
    case "AnyTypeAnnotation":
      return "any";
    case "MixedTypeAnnotation":
      return "mixed";
    case "ArrayTypeAnnotation":
      return concat([path.call(print, "elementType"), "[]"]);
    case "BooleanTypeAnnotation":
      return "boolean";
    case "BooleanLiteralTypeAnnotation":
      return "" + n.value;
    case "DeclareClass":
      return printFlowDeclaration(path, printClass(path, options, print));
    case "DeclareFunction":
      // For TypeScript the DeclareFunction node shares the AST
      // structure with FunctionDeclaration
      if (n.params) {
        return concat([
          "declare ",
          printFunctionDeclaration(path, print, options),
          semi
        ]);
      }
      return printFlowDeclaration(path, [
        "function ",
        path.call(print, "id"),
        n.predicate ? " " : "",
        path.call(print, "predicate"),
        semi
      ]);
    case "DeclareModule":
      return printFlowDeclaration(path, [
        "module ",
        path.call(print, "id"),
        " ",
        path.call(print, "body")
      ]);
    case "DeclareModuleExports":
      return printFlowDeclaration(path, [
        "module.exports",
        ": ",
        path.call(print, "typeAnnotation"),
        semi
      ]);
    case "DeclareVariable":
      return printFlowDeclaration(path, ["var ", path.call(print, "id"), semi]);
    case "DeclareExportAllDeclaration":
      return concat(["declare export * from ", path.call(print, "source")]);
    case "DeclareExportDeclaration":
      return concat(["declare ", printExportDeclaration(path, options, print)]);
    case "DeclareOpaqueType":
    case "OpaqueType": {
      parts.push(
        "opaque type ",
        path.call(print, "id"),
        path.call(print, "typeParameters")
      );

      if (n.supertype) {
        parts.push(": ", path.call(print, "supertype"));
      }

      if (n.impltype) {
        parts.push(" = ", path.call(print, "impltype"));
      }

      parts.push(semi);

      if (n.type === "DeclareOpaqueType") {
        return printFlowDeclaration(path, parts);
      }

      return concat(parts);
    }

    case "FunctionTypeAnnotation":
    case "TSFunctionType": {
      // FunctionTypeAnnotation is ambiguous:
      // declare function foo(a: B): void; OR
      // var A: (a: B) => void;
      const parent = path.getParentNode(0);
      const parentParent = path.getParentNode(1);
      const parentParentParent = path.getParentNode(2);
      let isArrowFunctionTypeAnnotation =
        n.type === "TSFunctionType" ||
        !(
          (parent.type === "ObjectTypeProperty" &&
            !getFlowVariance(parent) &&
            !parent.optional &&
            util.locStart(parent) === util.locStart(n)) ||
          parent.type === "ObjectTypeCallProperty" ||
          (parentParentParent && parentParentParent.type === "DeclareFunction")
        );

      let needsColon =
        isArrowFunctionTypeAnnotation &&
        (parent.type === "TypeAnnotation" ||
          parent.type === "TSTypeAnnotation");

      // Sadly we can't put it inside of FastPath::needsColon because we are
      // printing ":" as part of the expression and it would put parenthesis
      // around :(
      const needsParens =
        needsColon &&
        isArrowFunctionTypeAnnotation &&
        (parent.type === "TypeAnnotation" ||
          parent.type === "TSTypeAnnotation") &&
        parentParent.type === "ArrowFunctionExpression";

      if (isObjectTypePropertyAFunction(parent)) {
        isArrowFunctionTypeAnnotation = true;
        needsColon = true;
      }

      if (needsParens) {
        parts.push("(");
      }

      parts.push(
        printFunctionParams(
          path,
          print,
          options,
          /* expandArg */ false,
          /* printTypeParams */ true
        )
      );

      // The returnType is not wrapped in a TypeAnnotation, so the colon
      // needs to be added separately.
      if (n.returnType || n.predicate || n.typeAnnotation) {
        parts.push(
          isArrowFunctionTypeAnnotation ? " => " : ": ",
          path.call(print, "returnType"),
          path.call(print, "predicate"),
          path.call(print, "typeAnnotation")
        );
      }
      if (needsParens) {
        parts.push(")");
      }

      return group(concat(parts));
    }
    case "FunctionTypeParam":
      return concat([
        path.call(print, "name"),
        printOptionalToken(path),
        n.name ? ": " : "",
        path.call(print, "typeAnnotation")
      ]);
    case "GenericTypeAnnotation":
      return concat([
        path.call(print, "id"),
        path.call(print, "typeParameters")
      ]);
    case "DeclareInterface":
    case "InterfaceDeclaration": {
      if (
        n.type === "DeclareInterface" ||
        isNodeStartingWithDeclare(n, options)
      ) {
        parts.push("declare ");
      }

      parts.push(
        "interface ",
        path.call(print, "id"),
        path.call(print, "typeParameters")
      );

      if (n["extends"].length > 0) {
        parts.push(
          group(
            indent(
              concat([line, "extends ", join(", ", path.map(print, "extends"))])
            )
          )
        );
      }

      parts.push(" ");
      parts.push(path.call(print, "body"));

      return group(concat(parts));
    }
    case "ClassImplements":
    case "InterfaceExtends":
      return concat([
        path.call(print, "id"),
        path.call(print, "typeParameters")
      ]);
    case "TSIntersectionType":
    case "IntersectionTypeAnnotation": {
      const types = path.map(print, "types");
      const result = [];
      let wasIndented = false;
      for (let i = 0; i < types.length; ++i) {
        if (i === 0) {
          result.push(types[i]);
        } else if (isObjectType(n.types[i - 1]) && isObjectType(n.types[i])) {
          // If both are objects, don't indent
          result.push(
            concat([" & ", wasIndented ? indent(types[i]) : types[i]])
          );
        } else if (!isObjectType(n.types[i - 1]) && !isObjectType(n.types[i])) {
          // If no object is involved, go to the next line if it breaks
          result.push(indent(concat([" &", line, types[i]])));
        } else {
          // If you go from object to non-object or vis-versa, then inline it
          if (i > 1) {
            wasIndented = true;
          }
          result.push(" & ", i > 1 ? indent(types[i]) : types[i]);
        }
      }
      return group(concat(result));
    }
    case "TSUnionType":
    case "UnionTypeAnnotation": {
      // single-line variation
      // A | B | C

      // multi-line variation
      // | A
      // | B
      // | C

      const parent = path.getParentNode();

      // If there's a leading comment, the parent is doing the indentation
      const shouldIndent =
        parent.type !== "TypeParameterInstantiation" &&
        parent.type !== "TSTypeParameterInstantiation" &&
        parent.type !== "GenericTypeAnnotation" &&
        parent.type !== "TSTypeReference" &&
        parent.type !== "FunctionTypeParam" &&
        !(
          (parent.type === "TypeAlias" ||
            parent.type === "VariableDeclarator") &&
          hasLeadingOwnLineComment(options.originalText, n)
        );

      // {
      //   a: string
      // } | null | void
      // should be inlined and not be printed in the multi-line variant
      const shouldHug = shouldHugType(n);

      // We want to align the children but without its comment, so it looks like
      // | child1
      // // comment
      // | child2
      const printed = path.map(typePath => {
        let printedType = typePath.call(print);
        if (!shouldHug) {
          printedType = align(2, printedType);
        }
        return comments.printComments(typePath, () => printedType, options);
      }, "types");

      if (shouldHug) {
        return join(" | ", printed);
      }

      const code = concat([
        ifBreak(concat([shouldIndent ? line : "", "| "])),
        join(concat([line, "| "]), printed)
      ]);

      let hasParens;

      if (n.type === "TSUnionType") {
        const greatGrandParent = path.getParentNode(2);
        const greatGreatGrandParent = path.getParentNode(3);

        hasParens =
          greatGrandParent &&
          greatGrandParent.type === "TSParenthesizedType" &&
          greatGreatGrandParent &&
          (greatGreatGrandParent.type === "TSUnionType" ||
            greatGreatGrandParent.type === "TSIntersectionType");
      } else {
        hasParens = path.needsParens(options);
      }

      if (hasParens) {
        return group(concat([indent(code), softline]));
      }

      return group(shouldIndent ? indent(code) : code);
    }
    case "NullableTypeAnnotation":
      return concat(["?", path.call(print, "typeAnnotation")]);
    case "TSNullKeyword":
    case "NullLiteralTypeAnnotation":
      return "null";
    case "ThisTypeAnnotation":
      return "this";
    case "NumberTypeAnnotation":
      return "number";
    case "ObjectTypeCallProperty":
      if (n.static) {
        parts.push("static ");
      }

      parts.push(path.call(print, "value"));

      return concat(parts);
    case "ObjectTypeIndexer": {
      const variance = getFlowVariance(n);
      return concat([
        variance || "",
        "[",
        path.call(print, "id"),
        n.id ? ": " : "",
        path.call(print, "key"),
        "]: ",
        path.call(print, "value")
      ]);
    }
    case "ObjectTypeProperty": {
      const variance = getFlowVariance(n);

      return concat([
        n.static ? "static " : "",
        isGetterOrSetter(n) ? n.kind + " " : "",
        variance || "",
        printPropertyKey(path, options, print),
        printOptionalToken(path),
        isFunctionNotation(n) ? "" : ": ",
        path.call(print, "value")
      ]);
    }
    case "QualifiedTypeIdentifier":
      return concat([
        path.call(print, "qualification"),
        ".",
        path.call(print, "id")
      ]);
    case "StringLiteralTypeAnnotation":
      return nodeStr(n, options);
    case "NumberLiteralTypeAnnotation":
      assert.strictEqual(typeof n.value, "number");

      if (n.extra != null) {
        return util.printNumber(n.extra.raw);
      }
      return util.printNumber(n.raw);

    case "StringTypeAnnotation":
      return "string";
    case "DeclareTypeAlias":
    case "TypeAlias": {
      if (
        n.type === "DeclareTypeAlias" ||
        isNodeStartingWithDeclare(n, options)
      ) {
        parts.push("declare ");
      }

      const canBreak = n.right.type === "StringLiteralTypeAnnotation";

      const printed = printAssignmentRight(
        n.right,
        path.call(print, "right"),
        canBreak,
        options
      );

      parts.push(
        "type ",
        path.call(print, "id"),
        path.call(print, "typeParameters"),
        " =",
        printed,
        semi
      );

      return group(concat(parts));
    }
    case "TypeCastExpression":
      return concat([
        "(",
        path.call(print, "expression"),
        ": ",
        path.call(print, "typeAnnotation"),
        ")"
      ]);
    case "TypeParameterDeclaration":
    case "TypeParameterInstantiation":
    case "TSTypeParameterDeclaration":
    case "TSTypeParameterInstantiation":
      return printTypeParameters(path, options, print, "params");

    case "TSTypeParameter":
    case "TypeParameter": {
      const parent = path.getParentNode();
      if (parent.type === "TSMappedType") {
        parts.push(path.call(print, "name"));
        if (n.constraint) {
          parts.push(" in ", path.call(print, "constraint"));
        }
        return concat(parts);
      }

      const variance = getFlowVariance(n);

      if (variance) {
        parts.push(variance);
      }

      parts.push(path.call(print, "name"));

      if (n.bound) {
        parts.push(": ");
        parts.push(path.call(print, "bound"));
      }

      if (n.constraint) {
        parts.push(" extends ", path.call(print, "constraint"));
      }

      if (n["default"]) {
        parts.push(" = ", path.call(print, "default"));
      }

      return concat(parts);
    }
    case "TypeofTypeAnnotation":
      return concat(["typeof ", path.call(print, "argument")]);
    case "VoidTypeAnnotation":
      return "void";
    case "InferredPredicate":
      return "%checks";
    // Unhandled types below. If encountered, nodes of these types should
    // be either left alone or desugared into AST types that are fully
    // supported by the pretty-printer.
    case "DeclaredPredicate":
      return concat(["%checks(", path.call(print, "value"), ")"]);
    case "TSAbstractKeyword":
      return "abstract";
    case "TSAnyKeyword":
      return "any";
    case "TSAsyncKeyword":
      return "async";
    case "TSBooleanKeyword":
      return "boolean";
    case "TSConstKeyword":
      return "const";
    case "TSDeclareKeyword":
      return "declare";
    case "TSExportKeyword":
      return "export";
    case "TSNeverKeyword":
      return "never";
    case "TSNumberKeyword":
      return "number";
    case "TSObjectKeyword":
      return "object";
    case "TSProtectedKeyword":
      return "protected";
    case "TSPrivateKeyword":
      return "private";
    case "TSPublicKeyword":
      return "public";
    case "TSReadonlyKeyword":
      return "readonly";
    case "TSSymbolKeyword":
      return "symbol";
    case "TSStaticKeyword":
      return "static";
    case "TSStringKeyword":
      return "string";
    case "TSUndefinedKeyword":
      return "undefined";
    case "TSVoidKeyword":
      return "void";
    case "TSAsExpression":
      return concat([
        path.call(print, "expression"),
        " as ",
        path.call(print, "typeAnnotation")
      ]);
    case "TSArrayType":
      return concat([path.call(print, "elementType"), "[]"]);
    case "TSPropertySignature": {
      if (n.export) {
        parts.push("export ");
      }
      if (n.accessibility) {
        parts.push(n.accessibility + " ");
      }
      if (n.static) {
        parts.push("static ");
      }
      if (n.readonly) {
        parts.push("readonly ");
      }
      if (n.computed) {
        parts.push("[");
      }

      parts.push(printPropertyKey(path, options, print));

      if (n.computed) {
        parts.push("]");
      }

      parts.push(printOptionalToken(path));

      if (n.typeAnnotation) {
        parts.push(": ");
        parts.push(path.call(print, "typeAnnotation"));
      }

      // This isn't valid semantically, but it's in the AST so we can print it.
      if (n.initializer) {
        parts.push(" = ", path.call(print, "initializer"));
      }

      return concat(parts);
    }
    case "TSParameterProperty":
      if (n.accessibility) {
        parts.push(n.accessibility + " ");
      }
      if (n.export) {
        parts.push("export ");
      }
      if (n.static) {
        parts.push("static ");
      }
      if (n.readonly) {
        parts.push("readonly ");
      }

      parts.push(path.call(print, "parameter"));

      return concat(parts);
    case "TSTypeReference":
      return concat([
        path.call(print, "typeName"),
        printTypeParameters(path, options, print, "typeParameters")
      ]);
    case "TSTypeQuery":
      return concat(["typeof ", path.call(print, "exprName")]);
    case "TSParenthesizedType": {
      return path.call(print, "typeAnnotation");
    }
    case "TSIndexSignature": {
      const parent = path.getParentNode();

      return concat([
        n.export ? "export " : "",
        n.accessibility ? concat([n.accessibility, " "]) : "",
        n.static ? "static " : "",
        n.readonly ? "readonly " : "",
        "[",
        path.call(print, "index"),
        "]: ",
        path.call(print, "typeAnnotation"),
        parent.type === "ClassBody" ? semi : ""
      ]);
    }
    case "TSTypePredicate":
      return concat([
        path.call(print, "parameterName"),
        " is ",
        path.call(print, "typeAnnotation")
      ]);
    case "TSNonNullExpression":
      return concat([path.call(print, "expression"), "!"]);
    case "TSThisType":
      return "this";
    case "TSLastTypeNode":
      return path.call(print, "literal");
    case "TSIndexedAccessType":
      return concat([
        path.call(print, "objectType"),
        "[",
        path.call(print, "indexType"),
        "]"
      ]);
    case "TSConstructSignature":
    case "TSConstructorType":
    case "TSCallSignature": {
      if (n.type !== "TSCallSignature") {
        parts.push("new ");
      }

      parts.push(
        group(
          printFunctionParams(
            path,
            print,
            options,
            /* expandArg */ false,
            /* printTypeParams */ true
          )
        )
      );

      if (n.typeAnnotation) {
        const isType = n.type === "TSConstructorType";
        parts.push(isType ? " => " : ": ", path.call(print, "typeAnnotation"));
      }
      return concat(parts);
    }
    case "TSTypeOperator":
      return concat(["keyof ", path.call(print, "typeAnnotation")]);
    case "TSMappedType":
      return group(
        concat([
          "{",
          indent(
            concat([
              options.bracketSpacing ? line : softline,
              n.readonlyToken
                ? concat([path.call(print, "readonlyToken"), " "])
                : "",
              printTypeScriptModifiers(path, options, print),
              "[",
              path.call(print, "typeParameter"),
              "]",
              n.questionToken ? "?" : "",
              ": ",
              path.call(print, "typeAnnotation")
            ])
          ),
          comments.printDanglingComments(path, options, /* sameIndent */ true),
          options.bracketSpacing ? line : softline,
          "}"
        ])
      );
    case "TSMethodSignature":
      parts.push(
        n.accessibility ? concat([n.accessibility, " "]) : "",
        n.export ? "export " : "",
        n.static ? "static " : "",
        n.readonly ? "readonly " : "",
        n.computed ? "[" : "",
        path.call(print, "key"),
        n.computed ? "]" : "",
        printOptionalToken(path),
        printFunctionParams(
          path,
          print,
          options,
          /* expandArg */ false,
          /* printTypeParams */ true
        )
      );

      if (n.typeAnnotation) {
        parts.push(": ", path.call(print, "typeAnnotation"));
      }
      return group(concat(parts));
    case "TSNamespaceExportDeclaration":
      parts.push("export as namespace ", path.call(print, "name"));

      if (options.semi) {
        parts.push(";");
      }

      return group(concat(parts));
    case "TSEnumDeclaration":
      if (isNodeStartingWithDeclare(n, options)) {
        parts.push("declare ");
      }

      if (n.modifiers) {
        parts.push(printTypeScriptModifiers(path, options, print));
      }
      if (n.const) {
        parts.push("const ");
      }

      parts.push("enum ", path.call(print, "id"), " ");

      if (n.members.length === 0) {
        parts.push(
          group(
            concat([
              "{",
              comments.printDanglingComments(path, options),
              softline,
              "}"
            ])
          )
        );
      } else {
        parts.push(
          group(
            concat([
              "{",
              indent(
                concat([
                  hardline,
                  printArrayItems(path, options, "members", print),
                  shouldPrintComma(options, "es5") ? "," : ""
                ])
              ),
              comments.printDanglingComments(
                path,
                options,
                /* sameIndent */ true
              ),
              hardline,
              "}"
            ])
          )
        );
      }

      return concat(parts);
    case "TSEnumMember":
      parts.push(path.call(print, "id"));
      if (n.initializer) {
        parts.push(" = ", path.call(print, "initializer"));
      }
      return concat(parts);
    case "TSImportEqualsDeclaration":
      parts.push(
        printTypeScriptModifiers(path, options, print),
        "import ",
        path.call(print, "name"),
        " = ",
        path.call(print, "moduleReference")
      );

      if (options.semi) {
        parts.push(";");
      }

      return group(concat(parts));
    case "TSExternalModuleReference":
      return concat(["require(", path.call(print, "expression"), ")"]);
    case "TSModuleDeclaration": {
      const parent = path.getParentNode();
      const isExternalModule = isLiteral(n.id);
      const parentIsDeclaration = parent.type === "TSModuleDeclaration";
      const bodyIsDeclaration = n.body && n.body.type === "TSModuleDeclaration";

      if (parentIsDeclaration) {
        parts.push(".");
      } else {
        if (n.declare === true) {
          parts.push("declare ");
        }
        parts.push(printTypeScriptModifiers(path, options, print));

        // Global declaration looks like this:
        // (declare)? global { ... }
        const isGlobalDeclaration =
          n.id.type === "Identifier" &&
          n.id.name === "global" &&
          !/namespace|module/.test(
            options.originalText.slice(util.locStart(n), util.locStart(n.id))
          );

        if (!isGlobalDeclaration) {
          parts.push(isExternalModule ? "module " : "namespace ");
        }
      }

      parts.push(path.call(print, "id"));

      if (bodyIsDeclaration) {
        parts.push(path.call(print, "body"));
      } else if (n.body) {
        parts.push(
          " {",
          indent(
            concat([
              line,
              path.call(
                bodyPath =>
                  comments.printDanglingComments(bodyPath, options, true),
                "body"
              ),
              group(path.call(print, "body"))
            ])
          ),
          line,
          "}"
        );
      } else {
        parts.push(semi);
      }

      return concat(parts);
    }
    case "TSModuleBlock":
      return path.call(bodyPath => {
        return printStatementSequence(bodyPath, options, print);
      }, "body");

    case "PrivateName":
      return concat(["#", path.call(print, "id")]);

    default:
      /* istanbul ignore next */
      throw new Error("unknown type: " + JSON.stringify(n.type));
  }
}

function printStatementSequence(path, options, print) {
  const printed = [];

  const bodyNode = path.getNode();
  const isClass = bodyNode.type === "ClassBody";

  path.map((stmtPath, i) => {
    const stmt = stmtPath.getValue();

    // Just in case the AST has been modified to contain falsy
    // "statements," it's safer simply to skip them.
    /* istanbul ignore if */
    if (!stmt) {
      return;
    }

    // Skip printing EmptyStatement nodes to avoid leaving stray
    // semicolons lying around.
    if (stmt.type === "EmptyStatement") {
      return;
    }

    const stmtPrinted = print(stmtPath);
    const text = options.originalText;
    const parts = [];

    // in no-semi mode, prepend statement with semicolon if it might break ASI
    // don't prepend the only JSX element in a program with semicolon
    if (
      !options.semi &&
      !isClass &&
      !isTheOnlyJSXElementInMarkdown(options, stmtPath) &&
      stmtNeedsASIProtection(stmtPath, options)
    ) {
      if (stmt.comments && stmt.comments.some(comment => comment.leading)) {
        parts.push(print(stmtPath, { needsSemi: true }));
      } else {
        parts.push(";", stmtPrinted);
      }
    } else {
      parts.push(stmtPrinted);
    }

    if (!options.semi && isClass) {
      if (classPropMayCauseASIProblems(stmtPath)) {
        parts.push(";");
      } else if (stmt.type === "ClassProperty") {
        const nextChild = bodyNode.body[i + 1];
        if (classChildNeedsASIProtection(nextChild)) {
          parts.push(";");
        }
      }
    }

    if (util.isNextLineEmpty(text, stmt) && !isLastStatement(stmtPath)) {
      parts.push(hardline);
    }

    printed.push(concat(parts));
  });

  return join(hardline, printed);
}

function printPropertyKey(path, options, print) {
  const node = path.getNode();
  const key = node.key;

  if (
    isStringLiteral(key) &&
    isIdentifierName(key.value) &&
    !node.computed &&
    options.parser !== "json"
  ) {
    // 'a' -> a
    return path.call(
      keyPath => comments.printComments(keyPath, () => key.value, options),
      "key"
    );
  }
  return path.call(print, "key");
}

function printMethod(path, options, print) {
  const node = path.getNode();
  const semi = options.semi ? ";" : "";
  const kind = node.kind;
  const parts = [];

  if (node.type === "ObjectMethod" || node.type === "ClassMethod") {
    node.value = node;
  }

  if (node.value.async) {
    parts.push("async ");
  }

  if (!kind || kind === "init" || kind === "method" || kind === "constructor") {
    if (node.value.generator) {
      parts.push("*");
    }
  } else {
    assert.ok(kind === "get" || kind === "set");

    parts.push(kind, " ");
  }

  let key = printPropertyKey(path, options, print);

  if (node.computed) {
    key = concat(["[", key, "]"]);
  }

  parts.push(
    key,
    concat(
      path.call(
        valuePath => [
          printFunctionTypeParameters(valuePath, options, print),
          group(
            concat([
              printFunctionParams(valuePath, print, options),
              printReturnType(valuePath, print, options)
            ])
          )
        ],
        "value"
      )
    )
  );

  if (!node.value.body || node.value.body.length === 0) {
    parts.push(semi);
  } else {
    parts.push(" ", path.call(print, "value", "body"));
  }

  return concat(parts);
}

function couldGroupArg(arg) {
  return (
    (arg.type === "ObjectExpression" &&
      (arg.properties.length > 0 || arg.comments)) ||
    (arg.type === "ArrayExpression" &&
      (arg.elements.length > 0 || arg.comments)) ||
    arg.type === "TSTypeAssertionExpression" ||
    arg.type === "TSAsExpression" ||
    arg.type === "FunctionExpression" ||
    (arg.type === "ArrowFunctionExpression" &&
      (arg.body.type === "BlockStatement" ||
        arg.body.type === "ArrowFunctionExpression" ||
        arg.body.type === "ObjectExpression" ||
        arg.body.type === "ArrayExpression" ||
        arg.body.type === "CallExpression" ||
        isJSXNode(arg.body)))
  );
}

function shouldGroupLastArg(args) {
  const lastArg = util.getLast(args);
  const penultimateArg = util.getPenultimate(args);
  return (
    !hasLeadingComment(lastArg) &&
    !hasTrailingComment(lastArg) &&
    couldGroupArg(lastArg) &&
    // If the last two arguments are of the same type,
    // disable last element expansion.
    (!penultimateArg || penultimateArg.type !== lastArg.type)
  );
}

function shouldGroupFirstArg(args) {
  if (args.length !== 2) {
    return false;
  }

  const firstArg = args[0];
  const secondArg = args[1];
  return (
    (!firstArg.comments || !firstArg.comments.length) &&
    (firstArg.type === "FunctionExpression" ||
      (firstArg.type === "ArrowFunctionExpression" &&
        firstArg.body.type === "BlockStatement")) &&
    !couldGroupArg(secondArg)
  );
}

function printArgumentsList(path, options, print) {
  const args = path.getValue().arguments;

  if (args.length === 0) {
    return concat([
      "(",
      comments.printDanglingComments(path, options, /* sameIndent */ true),
      ")"
    ]);
  }

  let anyArgEmptyLine = false;
  let hasEmptyLineFollowingFirstArg = false;
  const lastArgIndex = args.length - 1;
  const printedArguments = path.map((argPath, index) => {
    const arg = argPath.getNode();
    const parts = [print(argPath)];

    if (index === lastArgIndex) {
      // do nothing
    } else if (util.isNextLineEmpty(options.originalText, arg)) {
      if (index === 0) {
        hasEmptyLineFollowingFirstArg = true;
      }

      anyArgEmptyLine = true;
      parts.push(",", hardline, hardline);
    } else {
      parts.push(",", line);
    }

    return concat(parts);
  }, "arguments");

  // This is just an optimization; I think we could return the
  // conditional group for all function calls, but it's more expensive
  // so only do it for specific forms.
  const shouldGroupFirst = shouldGroupFirstArg(args);
  const shouldGroupLast = shouldGroupLastArg(args);
  if (shouldGroupFirst || shouldGroupLast) {
    const shouldBreak =
      (shouldGroupFirst
        ? printedArguments.slice(1).some(willBreak)
        : printedArguments.slice(0, -1).some(willBreak)) || anyArgEmptyLine;

    // We want to print the last argument with a special flag
    let printedExpanded;
    let i = 0;
    path.each(argPath => {
      if (shouldGroupFirst && i === 0) {
        printedExpanded = [
          concat([
            argPath.call(p => print(p, { expandFirstArg: true })),
            printedArguments.length > 1 ? "," : "",
            hasEmptyLineFollowingFirstArg ? hardline : line,
            hasEmptyLineFollowingFirstArg ? hardline : ""
          ])
        ].concat(printedArguments.slice(1));
      }
      if (shouldGroupLast && i === args.length - 1) {
        printedExpanded = printedArguments
          .slice(0, -1)
          .concat(argPath.call(p => print(p, { expandLastArg: true })));
      }
      i++;
    }, "arguments");

    const somePrintedArgumentsWillBreak = printedArguments.some(willBreak);

    const maybeTrailingComma = shouldPrintComma(options, "all") ? "," : "";

    return concat([
      somePrintedArgumentsWillBreak ? breakParent : "",
      conditionalGroup(
        [
          concat([
            ifBreak(
              indent(concat(["(", softline, concat(printedExpanded)])),
              concat(["(", concat(printedExpanded)])
            ),
            somePrintedArgumentsWillBreak
              ? concat([ifBreak(maybeTrailingComma), softline])
              : "",
            ")"
          ]),
          shouldGroupFirst
            ? concat([
                "(",
                group(printedExpanded[0], { shouldBreak: true }),
                concat(printedExpanded.slice(1)),
                ")"
              ])
            : concat([
                "(",
                concat(printedArguments.slice(0, -1)),
                group(util.getLast(printedExpanded), {
                  shouldBreak: true
                }),
                ")"
              ]),
          group(
            concat([
              "(",
              indent(concat([line, concat(printedArguments)])),
              maybeTrailingComma,
              line,
              ")"
            ]),
            { shouldBreak: true }
          )
        ],
        { shouldBreak }
      )
    ]);
  }

  return group(
    concat([
      "(",
      indent(concat([softline, concat(printedArguments)])),
      ifBreak(shouldPrintComma(options, "all") ? "," : ""),
      softline,
      ")"
    ]),
    { shouldBreak: printedArguments.some(willBreak) || anyArgEmptyLine }
  );
}

function printTypeAnnotation(path, options, print) {
  const node = path.getValue();
  if (!node.typeAnnotation) {
    return "";
  }

  const parentNode = path.getParentNode();
  const isFunctionDeclarationIdentifier =
    parentNode.type === "DeclareFunction" && parentNode.id === node;

  if (isFlowAnnotationComment(options.originalText, node.typeAnnotation)) {
    return concat([" /*: ", path.call(print, "typeAnnotation"), " */"]);
  }

  return concat([
    isFunctionDeclarationIdentifier ? "" : ": ",
    path.call(print, "typeAnnotation")
  ]);
}

function printFunctionTypeParameters(path, options, print) {
  const fun = path.getValue();
  if (fun.typeParameters) {
    return path.call(print, "typeParameters");
  }
  return "";
}

function printFunctionParams(path, print, options, expandArg, printTypeParams) {
  const fun = path.getValue();
  const paramsField = fun.parameters ? "parameters" : "params";

  const typeParams = printTypeParams
    ? printFunctionTypeParameters(path, options, print)
    : "";

  let printed = [];
  if (fun[paramsField]) {
    printed = path.map(print, paramsField);
  }

  if (fun.rest) {
    printed.push(concat(["...", path.call(print, "rest")]));
  }

  if (printed.length === 0) {
    return concat([
      typeParams,
      "(",
      comments.printDanglingComments(
        path,
        options,
        /* sameIndent */ true,
        comment =>
          util.getNextNonSpaceNonCommentCharacter(
            options.originalText,
            comment
          ) === ")"
      ),
      ")"
    ]);
  }

  const lastParam = util.getLast(fun[paramsField]);

  // If the parent is a call with the first/last argument expansion and this is the
  // params of the first/last argument, we dont want the arguments to break and instead
  // want the whole expression to be on a new line.
  //
  // Good:                 Bad:
  //   verylongcall(         verylongcall((
  //     (a, b) => {           a,
  //     }                     b,
  //   })                    ) => {
  //                         })
  if (
    expandArg &&
    !(fun[paramsField] && fun[paramsField].some(n => n.comments))
  ) {
    return group(
      concat([
        docUtils.removeLines(typeParams),
        "(",
        join(", ", printed.map(docUtils.removeLines)),
        ")"
      ])
    );
  }

  // Single object destructuring should hug
  //
  // function({
  //   a,
  //   b,
  //   c
  // }) {}
  if (shouldHugArguments(fun)) {
    return concat([typeParams, "(", join(", ", printed), ")"]);
  }

  const parent = path.getParentNode();

  // don't break in specs, eg; `it("should maintain parens around done even when long", (done) => {})`
  if (parent.type === "CallExpression" && isTestCall(parent)) {
    return concat([typeParams, "(", join(", ", printed), ")"]);
  }

  const flowTypeAnnotations = [
    "AnyTypeAnnotation",
    "NullLiteralTypeAnnotation",
    "GenericTypeAnnotation",
    "ThisTypeAnnotation",
    "NumberTypeAnnotation",
    "VoidTypeAnnotation",
    "EmptyTypeAnnotation",
    "MixedTypeAnnotation",
    "BooleanTypeAnnotation",
    "BooleanLiteralTypeAnnotation",
    "StringTypeAnnotation"
  ];

  const isFlowShorthandWithOneArg =
    (isObjectTypePropertyAFunction(parent) ||
      isTypeAnnotationAFunction(parent) ||
      parent.type === "TypeAlias" ||
      parent.type === "UnionTypeAnnotation" ||
      parent.type === "TSUnionType" ||
      parent.type === "IntersectionTypeAnnotation" ||
      (parent.type === "FunctionTypeAnnotation" &&
        parent.returnType === fun)) &&
    fun[paramsField].length === 1 &&
    fun[paramsField][0].name === null &&
    fun[paramsField][0].typeAnnotation &&
    fun.typeParameters === null &&
    flowTypeAnnotations.indexOf(fun[paramsField][0].typeAnnotation.type) !==
      -1 &&
    !(
      fun[paramsField][0].typeAnnotation.type === "GenericTypeAnnotation" &&
      fun[paramsField][0].typeAnnotation.typeParameters
    ) &&
    !fun.rest;

  if (isFlowShorthandWithOneArg) {
    if (options.arrowParens === "always") {
      return concat(["(", concat(printed), ")"]);
    }
    return concat(printed);
  }

  const canHaveTrailingComma =
    !(lastParam && lastParam.type === "RestElement") && !fun.rest;

  return concat([
    typeParams,
    "(",
    indent(concat([softline, join(concat([",", line]), printed)])),
    ifBreak(
      canHaveTrailingComma && shouldPrintComma(options, "all") ? "," : ""
    ),
    softline,
    ")"
  ]);
}

function shouldPrintParamsWithoutParens(path, options) {
  if (options.arrowParens === "always") {
    return false;
  }

  if (options.arrowParens === "avoid") {
    const node = path.getValue();
    return canPrintParamsWithoutParens(node);
  }

  // Fallback default; should be unreachable
  return false;
}

function canPrintParamsWithoutParens(node) {
  return (
    node.params.length === 1 &&
    !node.rest &&
    !node.typeParameters &&
    !hasDanglingComments(node) &&
    node.params[0].type === "Identifier" &&
    !node.params[0].typeAnnotation &&
    !node.params[0].comments &&
    !node.params[0].optional &&
    !node.predicate &&
    !node.returnType
  );
}

function printFunctionDeclaration(path, print, options) {
  const n = path.getValue();
  const parts = [];

  if (n.async) {
    parts.push("async ");
  }

  parts.push("function");

  if (n.generator) {
    parts.push("*");
  }
  if (n.id) {
    parts.push(" ", path.call(print, "id"));
  }

  parts.push(
    printFunctionTypeParameters(path, options, print),
    group(
      concat([
        printFunctionParams(path, print, options),
        printReturnType(path, print, options)
      ])
    ),
    n.body ? " " : "",
    path.call(print, "body")
  );

  return concat(parts);
}

function printObjectMethod(path, options, print) {
  const objMethod = path.getValue();
  const parts = [];

  if (objMethod.async) {
    parts.push("async ");
  }
  if (objMethod.generator) {
    parts.push("*");
  }
  if (
    objMethod.method ||
    objMethod.kind === "get" ||
    objMethod.kind === "set"
  ) {
    return printMethod(path, options, print);
  }

  const key = printPropertyKey(path, options, print);

  if (objMethod.computed) {
    parts.push("[", key, "]");
  } else {
    parts.push(key);
  }

  parts.push(
    printFunctionTypeParameters(path, options, print),
    group(
      concat([
        printFunctionParams(path, print, options),
        printReturnType(path, print, options)
      ])
    ),
    " ",
    path.call(print, "body")
  );

  return concat(parts);
}

function printReturnType(path, print, options) {
  const n = path.getValue();
  const returnType = path.call(print, "returnType");

  if (
    n.returnType &&
    isFlowAnnotationComment(options.originalText, n.returnType)
  ) {
    return concat([" /*: ", returnType, " */"]);
  }

  const parts = [returnType];

  // prepend colon to TypeScript type annotation
  if (n.returnType && n.returnType.typeAnnotation) {
    parts.unshift(": ");
  }

  if (n.predicate) {
    // The return type will already add the colon, but otherwise we
    // need to do it ourselves
    parts.push(n.returnType ? " " : ": ", path.call(print, "predicate"));
  }

  return concat(parts);
}

function printExportDeclaration(path, options, print) {
  const decl = path.getValue();
  const semi = options.semi ? ";" : "";
  const parts = ["export "];

  if (decl["default"] || decl.type === "ExportDefaultDeclaration") {
    parts.push("default ");
  }

  parts.push(
    comments.printDanglingComments(path, options, /* sameIndent */ true)
  );

  if (decl.declaration) {
    parts.push(path.call(print, "declaration"));

    if (
      decl.type === "ExportDefaultDeclaration" &&
      (decl.declaration.type !== "ClassDeclaration" &&
        decl.declaration.type !== "FunctionDeclaration" &&
        decl.declaration.type !== "TSAbstractClassDeclaration")
    ) {
      parts.push(semi);
    }
  } else {
    if (decl.specifiers && decl.specifiers.length > 0) {
      const specifiers = [];
      const defaultSpecifiers = [];
      const namespaceSpecifiers = [];
      path.each(specifierPath => {
        const specifierType = path.getValue().type;
        if (specifierType === "ExportSpecifier") {
          specifiers.push(print(specifierPath));
        } else if (specifierType === "ExportDefaultSpecifier") {
          defaultSpecifiers.push(print(specifierPath));
        } else if (specifierType === "ExportNamespaceSpecifier") {
          namespaceSpecifiers.push(concat(["* as ", print(specifierPath)]));
        }
      }, "specifiers");

      const isNamespaceFollowed =
        namespaceSpecifiers.length !== 0 && specifiers.length !== 0;

      const isDefaultFollowed =
        defaultSpecifiers.length !== 0 &&
        (namespaceSpecifiers.length !== 0 || specifiers.length !== 0);

      parts.push(
        decl.exportKind === "type" ? "type " : "",
        concat(defaultSpecifiers),
        concat([isDefaultFollowed ? ", " : ""]),
        concat(namespaceSpecifiers),
        concat([isNamespaceFollowed ? ", " : ""]),
        specifiers.length !== 0
          ? group(
              concat([
                "{",
                indent(
                  concat([
                    options.bracketSpacing ? line : softline,
                    join(concat([",", line]), specifiers)
                  ])
                ),
                ifBreak(shouldPrintComma(options) ? "," : ""),
                options.bracketSpacing ? line : softline,
                "}"
              ])
            )
          : ""
      );
    } else {
      parts.push("{}");
    }

    if (decl.source) {
      parts.push(" from ", path.call(print, "source"));
    }

    parts.push(semi);
  }

  return concat(parts);
}

function printFlowDeclaration(path, parts) {
  const parentExportDecl = util.getParentExportDeclaration(path);

  if (parentExportDecl) {
    assert.strictEqual(parentExportDecl.type, "DeclareExportDeclaration");
  } else {
    // If the parent node has type DeclareExportDeclaration, then it
    // will be responsible for printing the "declare" token. Otherwise
    // it needs to be printed with this non-exported declaration node.
    parts.unshift("declare ");
  }

  return concat(parts);
}

function getFlowVariance(path) {
  if (!path.variance) {
    return null;
  }

  // Babylon 7.0 currently uses variance node type, and flow should
  // follow suit soon:
  // https://github.com/babel/babel/issues/4722
  const variance = path.variance.kind || path.variance;

  switch (variance) {
    case "plus":
      return "+";
    case "minus":
      return "-";
    default:
      /* istanbul ignore next */
      return variance;
  }
}

function printTypeScriptModifiers(path, options, print) {
  const n = path.getValue();
  if (!n.modifiers || !n.modifiers.length) {
    return "";
  }
  return concat([join(" ", path.map(print, "modifiers")), " "]);
}

function printTypeParameters(path, options, print, paramsKey) {
  const n = path.getValue();

  if (!n[paramsKey]) {
    return "";
  }

  // for TypeParameterDeclaration typeParameters is a single node
  if (!Array.isArray(n[paramsKey])) {
    return path.call(print, paramsKey);
  }

  const grandparent = path.getNode(2);

  const isParameterInTestCall =
    grandparent != null &&
    grandparent.type === "CallExpression" &&
    isTestCall(grandparent);

  const shouldInline =
    isParameterInTestCall ||
    n[paramsKey].length === 0 ||
    (n[paramsKey].length === 1 &&
      (shouldHugType(n[paramsKey][0]) ||
        (n[paramsKey][0].type === "GenericTypeAnnotation" &&
          shouldHugType(n[paramsKey][0].id)) ||
        (n[paramsKey][0].type === "TSTypeReference" &&
          shouldHugType(n[paramsKey][0].typeName)) ||
        n[paramsKey][0].type === "NullableTypeAnnotation"));

  if (shouldInline) {
    return concat(["<", join(", ", path.map(print, paramsKey)), ">"]);
  }

  return group(
    concat([
      "<",
      indent(
        concat([
          softline,
          join(concat([",", line]), path.map(print, paramsKey))
        ])
      ),
      ifBreak(
        options.parser !== "typescript" && shouldPrintComma(options, "all")
          ? ","
          : ""
      ),
      softline,
      ">"
    ])
  );
}

function printClass(path, options, print) {
  const n = path.getValue();
  const parts = [];

  if (n.type === "TSAbstractClassDeclaration") {
    parts.push("abstract ");
  }

  parts.push("class");

  if (n.id) {
    parts.push(" ", path.call(print, "id"));
  }

  parts.push(path.call(print, "typeParameters"));

  const partsGroup = [];
  if (n.superClass) {
    const printed = concat([
      "extends ",
      path.call(print, "superClass"),
      path.call(print, "superTypeParameters")
    ]);
    // Keep old behaviour of extends in same line
    // If there is only on extends and there are not comments
    if (
      (!n.implements || n.implements.length === 0) &&
      (!n.superClass.comments || n.superClass.comments.length === 0)
    ) {
      parts.push(
        concat([
          " ",
          path.call(
            superClass =>
              comments.printComments(superClass, () => printed, options),
            "superClass"
          )
        ])
      );
    } else {
      partsGroup.push(
        group(
          concat([
            line,
            path.call(
              superClass =>
                comments.printComments(superClass, () => printed, options),
              "superClass"
            )
          ])
        )
      );
    }
  } else if (n.extends && n.extends.length > 0) {
    parts.push(" extends ", join(", ", path.map(print, "extends")));
  }

  if (n["implements"] && n["implements"].length > 0) {
    partsGroup.push(
      line,
      "implements",
      group(
        indent(
          concat([
            line,
            join(concat([",", line]), path.map(print, "implements"))
          ])
        )
      )
    );
  }

  if (n["mixins"] && n["mixins"].length > 0) {
    partsGroup.push(
      line,
      "mixins ",
      group(indent(join(concat([",", line]), path.map(print, "mixins"))))
    );
  }

  if (partsGroup.length > 0) {
    parts.push(group(indent(concat(partsGroup))));
  }

  if (
    n.body &&
    n.body.comments &&
    hasLeadingOwnLineComment(options.originalText, n.body)
  ) {
    parts.push(hardline);
  } else {
    parts.push(" ");
  }
  parts.push(path.call(print, "body"));

  return parts;
}

function printOptionalToken(path) {
  const node = path.getValue();
  if (!node.optional) {
    return "";
  }
  if (
    node.type === "CallExpression" ||
    (node.type === "MemberExpression" && node.computed)
  ) {
    return "?.";
  }
  return "?";
}

function printMemberLookup(path, options, print) {
  const property = path.call(print, "property");
  const n = path.getValue();
  const optional = printOptionalToken(path);

  if (!n.computed) {
    return concat([optional, ".", property]);
  }

  if (!n.property || isNumericLiteral(n.property)) {
    return concat([optional, "[", property, "]"]);
  }

  return group(
    concat([optional, "[", indent(concat([softline, property])), softline, "]"])
  );
}

function printBindExpressionCallee(path, options, print) {
  return concat(["::", path.call(print, "callee")]);
}

// We detect calls on member expressions specially to format a
// common pattern better. The pattern we are looking for is this:
//
// arr
//   .map(x => x + 1)
//   .filter(x => x > 10)
//   .some(x => x % 2)
//
// The way it is structured in the AST is via a nested sequence of
// MemberExpression and CallExpression. We need to traverse the AST
// and make groups out of it to print it in the desired way.
function printMemberChain(path, options, print) {
  // The first phase is to linearize the AST by traversing it down.
  //
  //   a().b()
  // has the following AST structure:
  //   CallExpression(MemberExpression(CallExpression(Identifier)))
  // and we transform it into
  //   [Identifier, CallExpression, MemberExpression, CallExpression]
  const printedNodes = [];

  // Here we try to retain one typed empty line after each call expression or
  // the first group whether it is in parentheses or not
  function shouldInsertEmptyLineAfter(node) {
    const originalText = options.originalText;
    const nextCharIndex = util.getNextNonSpaceNonCommentCharacterIndex(
      originalText,
      node
    );
    const nextChar = originalText.charAt(nextCharIndex);

    // if it is cut off by a parenthesis, we only account for one typed empty
    // line after that parenthesis
    if (nextChar == ")") {
      return util.isNextLineEmptyAfterIndex(originalText, nextCharIndex + 1);
    }

    return util.isNextLineEmpty(originalText, node);
  }

  function rec(path) {
    const node = path.getValue();
    if (
      node.type === "CallExpression" &&
      (isMemberish(node.callee) || node.callee.type === "CallExpression")
    ) {
      printedNodes.unshift({
        node: node,
        printed: concat([
          comments.printComments(
            path,
            () =>
              concat([
                printOptionalToken(path),
                printFunctionTypeParameters(path, options, print),
                printArgumentsList(path, options, print)
              ]),
            options
          ),
          shouldInsertEmptyLineAfter(node) ? hardline : ""
        ])
      });
      path.call(callee => rec(callee), "callee");
    } else if (isMemberish(node)) {
      printedNodes.unshift({
        node: node,
        printed: comments.printComments(
          path,
          () =>
            node.type === "MemberExpression"
              ? printMemberLookup(path, options, print)
              : printBindExpressionCallee(path, options, print),
          options
        )
      });
      path.call(object => rec(object), "object");
    } else {
      printedNodes.unshift({
        node: node,
        printed: path.call(print)
      });
    }
  }
  // Note: the comments of the root node have already been printed, so we
  // need to extract this first call without printing them as they would
  // if handled inside of the recursive call.
  const node = path.getValue();
  printedNodes.unshift({
    node,
    printed: concat([
      printOptionalToken(path),
      printFunctionTypeParameters(path, options, print),
      printArgumentsList(path, options, print)
    ])
  });
  path.call(callee => rec(callee), "callee");

  // Once we have a linear list of printed nodes, we want to create groups out
  // of it.
  //
  //   a().b.c().d().e
  // will be grouped as
  //   [
  //     [Identifier, CallExpression],
  //     [MemberExpression, MemberExpression, CallExpression],
  //     [MemberExpression, CallExpression],
  //     [MemberExpression],
  //   ]
  // so that we can print it as
  //   a()
  //     .b.c()
  //     .d()
  //     .e

  // The first group is the first node followed by
  //   - as many CallExpression as possible
  //       < fn()()() >.something()
  //   - as many array acessors as possible
  //       < fn()[0][1][2] >.something()
  //   - then, as many MemberExpression as possible but the last one
  //       < this.items >.something()
  const groups = [];
  let currentGroup = [printedNodes[0]];
  let i = 1;
  for (; i < printedNodes.length; ++i) {
    if (
      printedNodes[i].node.type === "CallExpression" ||
      (printedNodes[i].node.type === "MemberExpression" &&
        printedNodes[i].node.computed &&
        isNumericLiteral(printedNodes[i].node.property))
    ) {
      currentGroup.push(printedNodes[i]);
    } else {
      break;
    }
  }
  if (printedNodes[0].node.type !== "CallExpression") {
    for (; i + 1 < printedNodes.length; ++i) {
      if (
        isMemberish(printedNodes[i].node) &&
        isMemberish(printedNodes[i + 1].node)
      ) {
        currentGroup.push(printedNodes[i]);
      } else {
        break;
      }
    }
  }
  groups.push(currentGroup);
  currentGroup = [];

  // Then, each following group is a sequence of MemberExpression followed by
  // a sequence of CallExpression. To compute it, we keep adding things to the
  // group until we has seen a CallExpression in the past and reach a
  // MemberExpression
  let hasSeenCallExpression = false;
  for (; i < printedNodes.length; ++i) {
    if (hasSeenCallExpression && isMemberish(printedNodes[i].node)) {
      // [0] should be appended at the end of the group instead of the
      // beginning of the next one
      if (
        printedNodes[i].node.computed &&
        isNumericLiteral(printedNodes[i].node.property)
      ) {
        currentGroup.push(printedNodes[i]);
        continue;
      }

      groups.push(currentGroup);
      currentGroup = [];
      hasSeenCallExpression = false;
    }

    if (printedNodes[i].node.type === "CallExpression") {
      hasSeenCallExpression = true;
    }
    currentGroup.push(printedNodes[i]);

    if (
      printedNodes[i].node.comments &&
      printedNodes[i].node.comments.some(comment => comment.trailing)
    ) {
      groups.push(currentGroup);
      currentGroup = [];
      hasSeenCallExpression = false;
    }
  }
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // There are cases like Object.keys(), Observable.of(), _.values() where
  // they are the subject of all the chained calls and therefore should
  // be kept on the same line:
  //
  //   Object.keys(items)
  //     .filter(x => x)
  //     .map(x => x)
  //
  // In order to detect those cases, we use an heuristic: if the first
  // node is just an identifier with the name starting with a capital
  // letter, just a sequence of _$ or this. The rationale is that they are
  // likely to be factories.
  function isFactory(name) {
    return name.match(/(^[A-Z])|^[_$]+$/);
  }
  const shouldMerge =
    groups.length >= 2 &&
    !groups[1][0].node.comments &&
    ((groups[0].length === 1 &&
      (groups[0][0].node.type === "ThisExpression" ||
        (groups[0][0].node.type === "Identifier" &&
          (isFactory(groups[0][0].node.name) ||
            (groups[1].length && groups[1][0].node.computed))))) ||
      (groups[0].length > 1 &&
        groups[0][groups[0].length - 1].node.type === "MemberExpression" &&
        groups[0][groups[0].length - 1].node.property.type === "Identifier" &&
        (isFactory(groups[0][groups[0].length - 1].node.property.name) ||
          (groups[1].length && groups[1][0].node.computed))));

  function printGroup(printedGroup) {
    return concat(printedGroup.map(tuple => tuple.printed));
  }

  function printIndentedGroup(groups) {
    if (groups.length === 0) {
      return "";
    }
    return indent(
      group(concat([hardline, join(hardline, groups.map(printGroup))]))
    );
  }

  const printedGroups = groups.map(printGroup);
  const oneLine = concat(printedGroups);

  const cutoff = shouldMerge ? 3 : 2;
  const flatGroups = groups
    .slice(0, cutoff)
    .reduce((res, group) => res.concat(group), []);

  const hasComment =
    flatGroups.slice(1, -1).some(node => hasLeadingComment(node.node)) ||
    flatGroups.slice(0, -1).some(node => hasTrailingComment(node.node)) ||
    (groups[cutoff] && hasLeadingComment(groups[cutoff][0].node));

  // If we only have a single `.`, we shouldn't do anything fancy and just
  // render everything concatenated together.
  if (groups.length <= cutoff && !hasComment) {
    return group(oneLine);
  }

  // Find out the last node in the first group and check if it has an
  // empty line after
  const lastNodeBeforeIndent = util.getLast(
    shouldMerge ? groups.slice(1, 2)[0] : groups[0]
  ).node;
  const shouldHaveEmptyLineBeforeIndent =
    lastNodeBeforeIndent.type !== "CallExpression" &&
    shouldInsertEmptyLineAfter(lastNodeBeforeIndent);

  const expanded = concat([
    printGroup(groups[0]),
    shouldMerge ? concat(groups.slice(1, 2).map(printGroup)) : "",
    shouldHaveEmptyLineBeforeIndent ? hardline : "",
    printIndentedGroup(groups.slice(shouldMerge ? 2 : 1))
  ]);

  const callExpressionCount = printedNodes.filter(
    tuple => tuple.node.type === "CallExpression"
  ).length;

  // We don't want to print in one line if there's:
  //  * A comment.
  //  * 3 or more chained calls.
  //  * Any group but the last one has a hard line.
  // If the last group is a function it's okay to inline if it fits.
  if (
    hasComment ||
    callExpressionCount >= 3 ||
    printedGroups.slice(0, -1).some(willBreak)
  ) {
    return group(expanded);
  }

  return concat([
    // We only need to check `oneLine` because if `expanded` is chosen
    // that means that the parent group has already been broken
    // naturally
    willBreak(oneLine) || shouldHaveEmptyLineBeforeIndent ? breakParent : "",
    conditionalGroup([oneLine, expanded])
  ]);
}

function isJSXNode(node) {
  return (
    node.type === "JSXElement" ||
    node.type === "JSXFragment" ||
    node.type === "TSJsxFragment"
  );
}

function isEmptyJSXElement(node) {
  if (node.children.length === 0) {
    return true;
  }
  if (node.children.length > 1) {
    return false;
  }

  // if there is one text child and does not contain any meaningful text
  // we can treat the element as empty.
  const child = node.children[0];
  return isLiteral(child) && !isMeaningfulJSXText(child);
}

// Only space, newline, carriage return, and tab are treated as whitespace
// inside JSX.
const jsxWhitespaceChars = " \n\r\t";
const containsNonJsxWhitespaceRegex = new RegExp(
  "[^" + jsxWhitespaceChars + "]"
);
const matchJsxWhitespaceRegex = new RegExp("([" + jsxWhitespaceChars + "]+)");

// Meaningful if it contains non-whitespace characters,
// or it contains whitespace without a new line.
function isMeaningfulJSXText(node) {
  return (
    isLiteral(node) &&
    (containsNonJsxWhitespaceRegex.test(rawText(node)) ||
      !/\n/.test(rawText(node)))
  );
}

function conditionalExpressionChainContainsJSX(node) {
  return Boolean(getConditionalChainContents(node).find(isJSXNode));
}

// If we have nested conditional expressions, we want to print them in JSX mode
// if there's at least one JSXElement somewhere in the tree.
//
// A conditional expression chain like this should be printed in normal mode,
// because there aren't JSXElements anywhere in it:
//
// isA ? "A" : isB ? "B" : isC ? "C" : "Unknown";
//
// But a conditional expression chain like this should be printed in JSX mode,
// because there is a JSXElement in the last ConditionalExpression:
//
// isA ? "A" : isB ? "B" : isC ? "C" : <span className="warning">Unknown</span>;
//
// This type of ConditionalExpression chain is structured like this in the AST:
//
// ConditionalExpression {
//   test: ...,
//   consequent: ...,
//   alternate: ConditionalExpression {
//     test: ...,
//     consequent: ...,
//     alternate: ConditionalExpression {
//       test: ...,
//       consequent: ...,
//       alternate: ...,
//     }
//   }
// }
//
// We want to traverse over that shape and convert it into a flat structure so
// that we can find if there's a JSXElement somewhere inside.
function getConditionalChainContents(node) {
  // Given this code:
  //
  // // Using a ConditionalExpression as the consequent is uncommon, but should
  // // be handled.
  // A ? B : C ? D : E ? F ? G : H : I
  //
  // which has this AST:
  //
  // ConditionalExpression {
  //   test: Identifier(A),
  //   consequent: Identifier(B),
  //   alternate: ConditionalExpression {
  //     test: Identifier(C),
  //     consequent: Identifier(D),
  //     alternate: ConditionalExpression {
  //       test: Identifier(E),
  //       consequent: ConditionalExpression {
  //         test: Identifier(F),
  //         consequent: Identifier(G),
  //         alternate: Identifier(H),
  //       },
  //       alternate: Identifier(I),
  //     }
  //   }
  // }
  //
  // we should return this Array:
  //
  // [
  //   Identifier(A),
  //   Identifier(B),
  //   Identifier(C),
  //   Identifier(D),
  //   Identifier(E),
  //   Identifier(F),
  //   Identifier(G),
  //   Identifier(H),
  //   Identifier(I)
  // ];
  //
  // This loses the information about whether each node was the test,
  // consequent, or alternate, but we don't care about that here- we are only
  // flattening this structure to find if there's any JSXElements inside.
  const nonConditionalExpressions = [];

  function recurse(node) {
    if (node.type === "ConditionalExpression") {
      recurse(node.test);
      recurse(node.consequent);
      recurse(node.alternate);
    } else {
      nonConditionalExpressions.push(node);
    }
  }
  recurse(node);

  return nonConditionalExpressions;
}

// Detect an expression node representing `{" "}`
function isJSXWhitespaceExpression(node) {
  return (
    node.type === "JSXExpressionContainer" &&
    isLiteral(node.expression) &&
    node.expression.value === " " &&
    !node.expression.comments
  );
}

// JSX Children are strange, mostly for two reasons:
// 1. JSX reads newlines into string values, instead of skipping them like JS
// 2. up to one whitespace between elements within a line is significant,
//    but not between lines.
//
// Leading, trailing, and lone whitespace all need to
// turn themselves into the rather ugly `{' '}` when breaking.
//
// We print JSX using the `fill` doc primitive.
// This requires that we give it an array of alternating
// content and whitespace elements.
// To ensure this we add dummy `""` content elements as needed.
function printJSXChildren(path, options, print, jsxWhitespace) {
  const n = path.getValue();
  const children = [];

  // using `map` instead of `each` because it provides `i`
  path.map((childPath, i) => {
    const child = childPath.getValue();
    if (isLiteral(child)) {
      const text = rawText(child);

      // Contains a non-whitespace character
      if (isMeaningfulJSXText(child)) {
        const words = text.split(matchJsxWhitespaceRegex);

        // Starts with whitespace
        if (words[0] === "") {
          children.push("");
          words.shift();
          if (/\n/.test(words[0])) {
            children.push(hardline);
          } else {
            children.push(jsxWhitespace);
          }
          words.shift();
        }

        let endWhitespace;
        // Ends with whitespace
        if (util.getLast(words) === "") {
          words.pop();
          endWhitespace = words.pop();
        }

        // This was whitespace only without a new line.
        if (words.length === 0) {
          return;
        }

        words.forEach((word, i) => {
          if (i % 2 === 1) {
            children.push(line);
          } else {
            children.push(word);
          }
        });

        if (endWhitespace !== undefined) {
          if (/\n/.test(endWhitespace)) {
            children.push(hardline);
          } else {
            children.push(jsxWhitespace);
          }
        } else {
          // Ideally this would be a `hardline` to allow a break between
          // tags and text.
          // Unfortunately Facebook have a custom translation pipeline
          // (https://github.com/prettier/prettier/issues/1581#issuecomment-300975032)
          // that uses the JSX syntax, but does not follow the React whitespace
          // rules.
          // Ensuring that we never have a break between tags and text in JSX
          // will allow Facebook to adopt Prettier without too much of an
          // adverse effect on formatting algorithm.
          children.push("");
        }
      } else if (/\n/.test(text)) {
        // Keep (up to one) blank line between tags/expressions/text.
        // Note: We don't keep blank lines between text elements.
        if (text.match(/\n/g).length > 1) {
          children.push("");
          children.push(hardline);
        }
      } else {
        children.push("");
        children.push(jsxWhitespace);
      }
    } else {
      const printedChild = print(childPath);
      children.push(printedChild);

      const next = n.children[i + 1];
      const directlyFollowedByMeaningfulText =
        next && isMeaningfulJSXText(next) && !/^[ \n\r\t]/.test(rawText(next));
      if (directlyFollowedByMeaningfulText) {
        // Potentially this could be a hardline as well.
        // See the comment above about the Facebook translation pipeline as
        // to why this is an empty string.
        children.push("");
      } else {
        children.push(hardline);
      }
    }
  }, "children");

  return children;
}

// JSX expands children from the inside-out, instead of the outside-in.
// This is both to break children before attributes,
// and to ensure that when children break, their parents do as well.
//
// Any element that is written without any newlines and fits on a single line
// is left that way.
// Not only that, any user-written-line containing multiple JSX siblings
// should also be kept on one line if possible,
// so each user-written-line is wrapped in its own group.
//
// Elements that contain newlines or don't fit on a single line (recursively)
// are fully-split, using hardline and shouldBreak: true.
//
// To support that case properly, all leading and trailing spaces
// are stripped from the list of children, and replaced with a single hardline.
function printJSXElement(path, options, print) {
  const n = path.getValue();

  // Turn <div></div> into <div />
  if (n.type === "JSXElement" && isEmptyJSXElement(n)) {
    n.openingElement.selfClosing = true;
    return path.call(print, "openingElement");
  }

  const openingLines =
    n.type === "JSXElement"
      ? path.call(print, "openingElement")
      : path.call(print, "openingFragment");
  const closingLines =
    n.type === "JSXElement"
      ? path.call(print, "closingElement")
      : path.call(print, "closingFragment");

  if (
    n.children.length === 1 &&
    n.children[0].type === "JSXExpressionContainer" &&
    (n.children[0].expression.type === "TemplateLiteral" ||
      n.children[0].expression.type === "TaggedTemplateExpression")
  ) {
    return concat([
      openingLines,
      concat(path.map(print, "children")),
      closingLines
    ]);
  }

  // Convert `{" "}` to text nodes containing a space.
  // This makes it easy to turn them into `jsxWhitespace` which
  // can then print as either a space or `{" "}` when breaking.
  n.children = n.children.map(child => {
    if (isJSXWhitespaceExpression(child)) {
      return {
        type: "JSXText",
        value: " ",
        raw: " "
      };
    }
    return child;
  });

  const containsTag = n.children.filter(isJSXNode).length > 0;
  const containsMultipleExpressions =
    n.children.filter(child => child.type === "JSXExpressionContainer").length >
    1;
  const containsMultipleAttributes =
    n.type === "JSXElement" && n.openingElement.attributes.length > 1;

  // Record any breaks. Should never go from true to false, only false to true.
  let forcedBreak =
    willBreak(openingLines) ||
    containsTag ||
    containsMultipleAttributes ||
    containsMultipleExpressions;

  const rawJsxWhitespace = options.singleQuote ? "{' '}" : '{" "}';
  const jsxWhitespace = ifBreak(concat([rawJsxWhitespace, softline]), " ");

  const children = printJSXChildren(path, options, print, jsxWhitespace);

  const containsText =
    n.children.filter(child => isMeaningfulJSXText(child)).length > 0;

  // We can end up we multiple whitespace elements with empty string
  // content between them.
  // We need to remove empty whitespace and softlines before JSX whitespace
  // to get the correct output.
  for (let i = children.length - 2; i >= 0; i--) {
    const isPairOfEmptyStrings = children[i] === "" && children[i + 1] === "";
    const isPairOfHardlines =
      children[i] === hardline &&
      children[i + 1] === "" &&
      children[i + 2] === hardline;
    const isLineFollowedByJSXWhitespace =
      (children[i] === softline || children[i] === hardline) &&
      children[i + 1] === "" &&
      children[i + 2] === jsxWhitespace;
    const isJSXWhitespaceFollowedByLine =
      children[i] === jsxWhitespace &&
      children[i + 1] === "" &&
      (children[i + 2] === softline || children[i + 2] === hardline);
    const isDoubleJSXWhitespace =
      children[i] === jsxWhitespace &&
      children[i + 1] === "" &&
      children[i + 2] === jsxWhitespace;

    if (
      (isPairOfHardlines && containsText) ||
      isPairOfEmptyStrings ||
      isLineFollowedByJSXWhitespace ||
      isDoubleJSXWhitespace
    ) {
      children.splice(i, 2);
    } else if (isJSXWhitespaceFollowedByLine) {
      children.splice(i + 1, 2);
    }
  }

  // Trim trailing lines (or empty strings)
  while (
    children.length &&
    (isLineNext(util.getLast(children)) || isEmpty(util.getLast(children)))
  ) {
    children.pop();
  }

  // Trim leading lines (or empty strings)
  while (
    children.length &&
    (isLineNext(children[0]) || isEmpty(children[0])) &&
    (isLineNext(children[1]) || isEmpty(children[1]))
  ) {
    children.shift();
    children.shift();
  }

  // Tweak how we format children if outputting this element over multiple lines.
  // Also detect whether we will force this element to output over multiple lines.
  const multilineChildren = [];
  children.forEach((child, i) => {
    // There are a number of situations where we need to ensure we display
    // whitespace as `{" "}` when outputting this element over multiple lines.
    if (child === jsxWhitespace) {
      if (i === 1 && children[i - 1] === "") {
        if (children.length === 2) {
          // Solitary whitespace
          multilineChildren.push(rawJsxWhitespace);
          return;
        }
        // Leading whitespace
        multilineChildren.push(concat([rawJsxWhitespace, hardline]));
        return;
      } else if (i === children.length - 1) {
        // Trailing whitespace
        multilineChildren.push(rawJsxWhitespace);
        return;
      } else if (children[i - 1] === "" && children[i - 2] === hardline) {
        // Whitespace after line break
        multilineChildren.push(rawJsxWhitespace);
        return;
      }
    }

    multilineChildren.push(child);

    if (willBreak(child)) {
      forcedBreak = true;
    }
  });

  // If there is text we use `fill` to fit as much onto each line as possible.
  // When there is no text (just tags and expressions) we use `group`
  // to output each on a separate line.
  const content = containsText
    ? fill(multilineChildren)
    : group(concat(multilineChildren), { shouldBreak: true });

  const multiLineElem = group(
    concat([
      openingLines,
      indent(concat([hardline, content])),
      hardline,
      closingLines
    ])
  );

  if (forcedBreak) {
    return multiLineElem;
  }

  return conditionalGroup([
    group(concat([openingLines, concat(children), closingLines])),
    multiLineElem
  ]);
}

function maybeWrapJSXElementInParens(path, elem) {
  const parent = path.getParentNode();
  if (!parent) {
    return elem;
  }

  const NO_WRAP_PARENTS = {
    ArrayExpression: true,
    JSXAttribute: true,
    JSXElement: true,
    JSXExpressionContainer: true,
    JSXFragment: true,
    TSJsxFragment: true,
    ExpressionStatement: true,
    CallExpression: true,
    ConditionalExpression: true
  };
  if (NO_WRAP_PARENTS[parent.type]) {
    return elem;
  }

  return group(
    concat([
      ifBreak("("),
      indent(concat([softline, elem])),
      softline,
      ifBreak(")")
    ])
  );
}

function isBinaryish(node) {
  return node.type === "BinaryExpression" || node.type === "LogicalExpression";
}

function isMemberish(node) {
  return (
    node.type === "MemberExpression" ||
    (node.type === "BindExpression" && node.object)
  );
}

function shouldInlineLogicalExpression(node) {
  if (node.type !== "LogicalExpression") {
    return false;
  }

  if (
    node.right.type === "ObjectExpression" &&
    node.right.properties.length !== 0
  ) {
    return true;
  }

  if (
    node.right.type === "ArrayExpression" &&
    node.right.elements.length !== 0
  ) {
    return true;
  }

  if (isJSXNode(node.right)) {
    return true;
  }

  return false;
}

// For binary expressions to be consistent, we need to group
// subsequent operators with the same precedence level under a single
// group. Otherwise they will be nested such that some of them break
// onto new lines but not all. Operators with the same precedence
// level should either all break or not. Because we group them by
// precedence level and the AST is structured based on precedence
// level, things are naturally broken up correctly, i.e. `&&` is
// broken before `+`.
function printBinaryishExpressions(
  path,
  print,
  options,
  isNested,
  isInsideParenthesis
) {
  let parts = [];
  const node = path.getValue();

  // We treat BinaryExpression and LogicalExpression nodes the same.
  if (isBinaryish(node)) {
    // Put all operators with the same precedence level in the same
    // group. The reason we only need to do this with the `left`
    // expression is because given an expression like `1 + 2 - 3`, it
    // is always parsed like `((1 + 2) - 3)`, meaning the `left` side
    // is where the rest of the expression will exist. Binary
    // expressions on the right side mean they have a difference
    // precedence level and should be treated as a separate group, so
    // print them normally. (This doesn't hold for the `**` operator,
    // which is unique in that it is right-associative.)
    if (util.shouldFlatten(node.operator, node.left.operator)) {
      // Flatten them out by recursively calling this function.
      parts = parts.concat(
        path.call(
          left =>
            printBinaryishExpressions(
              left,
              print,
              options,
              /* isNested */ true,
              isInsideParenthesis
            ),
          "left"
        )
      );
    } else {
      parts.push(path.call(print, "left"));
    }

    const shouldInline = shouldInlineLogicalExpression(node);
    const lineBeforeOperator = node.operator === "|>";

    const right = shouldInline
      ? concat([node.operator, " ", path.call(print, "right")])
      : concat([
          lineBeforeOperator ? softline : "",
          node.operator,
          lineBeforeOperator ? " " : line,
          path.call(print, "right")
        ]);

    // If there's only a single binary expression, we want to create a group
    // in order to avoid having a small right part like -1 be on its own line.
    const parent = path.getParentNode();
    const shouldGroup =
      !(isInsideParenthesis && node.type === "LogicalExpression") &&
      parent.type !== node.type &&
      node.left.type !== node.type &&
      node.right.type !== node.type;

    parts.push(" ", shouldGroup ? group(right) : right);

    // The root comments are already printed, but we need to manually print
    // the other ones since we don't call the normal print on BinaryExpression,
    // only for the left and right parts
    if (isNested && node.comments) {
      parts = comments.printComments(path, () => concat(parts), options);
    }
  } else {
    // Our stopping case. Simply print the node normally.
    parts.push(path.call(print));
  }

  return parts;
}

function printAssignmentRight(rightNode, printedRight, canBreak, options) {
  if (hasLeadingOwnLineComment(options.originalText, rightNode)) {
    return indent(concat([hardline, printedRight]));
  }

  if (canBreak) {
    return indent(concat([line, printedRight]));
  }

  return concat([" ", printedRight]);
}

function printAssignment(
  leftNode,
  printedLeft,
  operator,
  rightNode,
  printedRight,
  options
) {
  if (!rightNode) {
    return printedLeft;
  }

  const canBreak =
    (isBinaryish(rightNode) && !shouldInlineLogicalExpression(rightNode)) ||
    (rightNode.type === "ConditionalExpression" &&
      isBinaryish(rightNode.test) &&
      !shouldInlineLogicalExpression(rightNode.test)) ||
    ((leftNode.type === "Identifier" ||
      isStringLiteral(leftNode) ||
      leftNode.type === "MemberExpression") &&
      (isStringLiteral(rightNode) || isMemberExpressionChain(rightNode)));

  const printed = printAssignmentRight(
    rightNode,
    printedRight,
    canBreak,
    options
  );

  return group(concat([printedLeft, operator, printed]));
}

function adjustClause(node, clause, forceSpace) {
  if (node.type === "EmptyStatement") {
    return ";";
  }

  if (node.type === "BlockStatement" || forceSpace) {
    return concat([" ", clause]);
  }

  return indent(concat([line, clause]));
}

function nodeStr(node, options, isFlowOrTypeScriptDirectiveLiteral) {
  const raw = rawText(node);
  const isDirectiveLiteral =
    isFlowOrTypeScriptDirectiveLiteral || node.type === "DirectiveLiteral";
  return util.printString(raw, options, isDirectiveLiteral);
}

function printRegex(node) {
  const flags = node.flags
    .split("")
    .sort()
    .join("");
  return `/${node.pattern}/${flags}`;
}

function isLastStatement(path) {
  const parent = path.getParentNode();
  if (!parent) {
    return true;
  }
  const node = path.getValue();
  const body = (parent.body || parent.consequent).filter(
    stmt => stmt.type !== "EmptyStatement"
  );
  return body && body[body.length - 1] === node;
}

function hasLeadingComment(node) {
  return node.comments && node.comments.some(comment => comment.leading);
}

function hasTrailingComment(node) {
  return node.comments && node.comments.some(comment => comment.trailing);
}

function hasLeadingOwnLineComment(text, node) {
  if (isJSXNode(node)) {
    return util.hasNodeIgnoreComment(node);
  }

  const res =
    node.comments &&
    node.comments.some(
      comment => comment.leading && util.hasNewline(text, util.locEnd(comment))
    );
  return res;
}

function hasNakedLeftSide(node) {
  return (
    node.type === "AssignmentExpression" ||
    node.type === "BinaryExpression" ||
    node.type === "LogicalExpression" ||
    node.type === "ConditionalExpression" ||
    node.type === "CallExpression" ||
    node.type === "MemberExpression" ||
    node.type === "SequenceExpression" ||
    node.type === "TaggedTemplateExpression" ||
    (node.type === "BindExpression" && !node.object) ||
    (node.type === "UpdateExpression" && !node.prefix)
  );
}

function isFlowAnnotationComment(text, typeAnnotation) {
  const start = util.locStart(typeAnnotation);
  const end = util.skipWhitespace(text, util.locEnd(typeAnnotation));
  return text.substr(start, 2) === "/*" && text.substr(end, 2) === "*/";
}

function getLeftSide(node) {
  if (node.expressions) {
    return node.expressions[0];
  }
  return (
    node.left ||
    node.test ||
    node.callee ||
    node.object ||
    node.tag ||
    node.argument ||
    node.expression
  );
}

function getLeftSidePathName(path, node) {
  if (node.expressions) {
    return ["expressions", 0];
  }
  if (node.left) {
    return ["left"];
  }
  if (node.test) {
    return ["test"];
  }
  if (node.callee) {
    return ["callee"];
  }
  if (node.object) {
    return ["object"];
  }
  if (node.tag) {
    return ["tag"];
  }
  if (node.argument) {
    return ["argument"];
  }
  if (node.expression) {
    return ["expression"];
  }
  throw new Error("Unexpected node has no left side", node);
}

function exprNeedsASIProtection(path, options) {
  const node = path.getValue();

  const maybeASIProblem =
    path.needsParens(options) ||
    node.type === "ParenthesizedExpression" ||
    node.type === "TypeCastExpression" ||
    (node.type === "ArrowFunctionExpression" &&
      !shouldPrintParamsWithoutParens(path, options)) ||
    node.type === "ArrayExpression" ||
    node.type === "ArrayPattern" ||
    (node.type === "UnaryExpression" &&
      node.prefix &&
      (node.operator === "+" || node.operator === "-")) ||
    node.type === "TemplateLiteral" ||
    node.type === "TemplateElement" ||
    isJSXNode(node) ||
    node.type === "BindExpression" ||
    node.type === "RegExpLiteral" ||
    (node.type === "Literal" && node.pattern) ||
    (node.type === "Literal" && node.regex);

  if (maybeASIProblem) {
    return true;
  }

  if (!hasNakedLeftSide(node)) {
    return false;
  }

  return path.call.apply(
    path,
    [childPath => exprNeedsASIProtection(childPath, options)].concat(
      getLeftSidePathName(path, node)
    )
  );
}

function stmtNeedsASIProtection(path, options) {
  const node = path.getNode();

  if (node.type !== "ExpressionStatement") {
    return false;
  }

  return path.call(
    childPath => exprNeedsASIProtection(childPath, options),
    "expression"
  );
}

function classPropMayCauseASIProblems(path) {
  const node = path.getNode();

  if (node.type !== "ClassProperty") {
    return false;
  }

  const name = node.key && node.key.name;

  // this isn't actually possible yet with most parsers available today
  // so isn't properly tested yet.
  if (
    (name === "static" || name === "get" || name === "set") &&
    !node.value &&
    !node.typeAnnotation
  ) {
    return true;
  }
}

function classChildNeedsASIProtection(node) {
  if (!node) {
    return;
  }

  if (!node.computed) {
    const name = node.key && node.key.name;
    if (name === "in" || name === "instanceof") {
      return true;
    }
  }
  switch (node.type) {
    case "ClassProperty":
    case "TSAbstractClassProperty":
      return node.computed;
    case "MethodDefinition": // Flow
    case "TSAbstractMethodDefinition": // TypeScript
    case "ClassMethod": {
      // Babylon
      const isAsync = node.value ? node.value.async : node.async;
      const isGenerator = node.value ? node.value.generator : node.generator;
      if (
        isAsync ||
        node.static ||
        node.kind === "get" ||
        node.kind === "set"
      ) {
        return false;
      }
      if (node.computed || isGenerator) {
        return true;
      }
      return false;
    }

    default:
      /* istanbul ignore next */
      return false;
  }
}

// This recurses the return argument, looking for the first token
// (the leftmost leaf node) and, if it (or its parents) has any
// leadingComments, returns true (so it can be wrapped in parens).
function returnArgumentHasLeadingComment(options, argument) {
  if (hasLeadingOwnLineComment(options.originalText, argument)) {
    return true;
  }

  if (hasNakedLeftSide(argument)) {
    let leftMost = argument;
    let newLeftMost;
    while ((newLeftMost = getLeftSide(leftMost))) {
      leftMost = newLeftMost;

      if (hasLeadingOwnLineComment(options.originalText, leftMost)) {
        return true;
      }
    }
  }

  return false;
}

function isMemberExpressionChain(node) {
  if (node.type !== "MemberExpression") {
    return false;
  }
  if (node.object.type === "Identifier") {
    return true;
  }
  return isMemberExpressionChain(node.object);
}

// Hack to differentiate between the following two which have the same ast
// type T = { method: () => void };
// type T = { method(): void };
function isObjectTypePropertyAFunction(node) {
  return (
    node.type === "ObjectTypeProperty" &&
    node.value.type === "FunctionTypeAnnotation" &&
    !node.static &&
    !isFunctionNotation(node)
  );
}

// TODO: This is a bad hack and we need a better way to distinguish between
// arrow functions and otherwise
function isFunctionNotation(node) {
  return isGetterOrSetter(node) || sameLocStart(node, node.value);
}

function isGetterOrSetter(node) {
  return node.kind === "get" || node.kind === "set";
}

function sameLocStart(nodeA, nodeB) {
  return util.locStart(nodeA) === util.locStart(nodeB);
}

// Hack to differentiate between the following two which have the same ast
// declare function f(a): void;
// var f: (a) => void;
function isTypeAnnotationAFunction(node) {
  return (
    (node.type === "TypeAnnotation" || node.type === "TSTypeAnnotation") &&
    node.typeAnnotation.type === "FunctionTypeAnnotation" &&
    !node.static &&
    !sameLocStart(node, node.typeAnnotation)
  );
}

function isNodeStartingWithDeclare(node, options) {
  if (!(options.parser === "flow" || options.parser === "typescript")) {
    return false;
  }
  return (
    options.originalText
      .slice(0, util.locStart(node))
      .match(/declare[ \t]*$/) ||
    options.originalText
      .slice(node.range[0], node.range[1])
      .startsWith("declare ")
  );
}

function shouldHugType(node) {
  if (isObjectType(node)) {
    return true;
  }

  if (node.type === "UnionTypeAnnotation" || node.type === "TSUnionType") {
    const voidCount = node.types.filter(
      n =>
        n.type === "VoidTypeAnnotation" ||
        n.type === "TSVoidKeyword" ||
        n.type === "NullLiteralTypeAnnotation" ||
        n.type === "TSNullKeyword"
    ).length;

    const objectCount = node.types.filter(
      n =>
        n.type === "ObjectTypeAnnotation" ||
        n.type === "TSTypeLiteral" ||
        // This is a bit aggressive but captures Array<{x}>
        n.type === "GenericTypeAnnotation" ||
        n.type === "TSTypeReference"
    ).length;

    if (node.types.length - 1 === voidCount && objectCount > 0) {
      return true;
    }
  }

  return false;
}

function shouldHugArguments(fun) {
  return (
    fun &&
    fun.params &&
    fun.params.length === 1 &&
    !fun.params[0].comments &&
    (fun.params[0].type === "ObjectPattern" ||
      fun.params[0].type === "ArrayPattern" ||
      (fun.params[0].type === "Identifier" &&
        fun.params[0].typeAnnotation &&
        (fun.params[0].typeAnnotation.type === "TypeAnnotation" ||
          fun.params[0].typeAnnotation.type === "TSTypeAnnotation") &&
        isObjectType(fun.params[0].typeAnnotation.typeAnnotation)) ||
      (fun.params[0].type === "FunctionTypeParam" &&
        isObjectType(fun.params[0].typeAnnotation)) ||
      (fun.params[0].type === "AssignmentPattern" &&
        (fun.params[0].left.type === "ObjectPattern" ||
          fun.params[0].left.type === "ArrayPattern") &&
        (fun.params[0].right.type === "Identifier" ||
          (fun.params[0].right.type === "ObjectExpression" &&
            fun.params[0].right.properties.length === 0) ||
          (fun.params[0].right.type === "ArrayExpression" &&
            fun.params[0].right.elements.length === 0)))) &&
    !fun.rest
  );
}

function templateLiteralHasNewLines(template) {
  return template.quasis.some(quasi => quasi.value.raw.includes("\n"));
}

function isTemplateOnItsOwnLine(n, text) {
  return (
    ((n.type === "TemplateLiteral" && templateLiteralHasNewLines(n)) ||
      (n.type === "TaggedTemplateExpression" &&
        templateLiteralHasNewLines(n.quasi))) &&
    !util.hasNewline(text, util.locStart(n), { backwards: true })
  );
}

function printArrayItems(path, options, printPath, print) {
  const printedElements = [];
  let separatorParts = [];

  path.each(childPath => {
    printedElements.push(concat(separatorParts));
    printedElements.push(group(print(childPath)));

    separatorParts = [",", line];
    if (
      childPath.getValue() &&
      util.isNextLineEmpty(options.originalText, childPath.getValue())
    ) {
      separatorParts.push(softline);
    }
  }, printPath);

  return concat(printedElements);
}

function hasDanglingComments(node) {
  return (
    node.comments &&
    node.comments.some(comment => !comment.leading && !comment.trailing)
  );
}

function isLiteral(node) {
  return (
    node.type === "BooleanLiteral" ||
    node.type === "DirectiveLiteral" ||
    node.type === "Literal" ||
    node.type === "NullLiteral" ||
    node.type === "NumericLiteral" ||
    node.type === "RegExpLiteral" ||
    node.type === "StringLiteral" ||
    node.type === "TemplateLiteral" ||
    node.type === "TSTypeLiteral" ||
    node.type === "JSXText"
  );
}

function isNumericLiteral(node) {
  return (
    node.type === "NumericLiteral" ||
    (node.type === "Literal" && typeof node.value === "number")
  );
}

function isStringLiteral(node) {
  return (
    node.type === "StringLiteral" ||
    (node.type === "Literal" && typeof node.value === "string")
  );
}

function isObjectType(n) {
  return n.type === "ObjectTypeAnnotation" || n.type === "TSTypeLiteral";
}

// eg; `describe("some string", (done) => {})`
function isTestCall(n) {
  const unitTestRe = /^(skip|(f|x)?(it|describe|test))$/;
  return (
    ((n.callee.type === "Identifier" && unitTestRe.test(n.callee.name)) ||
      (n.callee.type === "MemberExpression" &&
        n.callee.object.type === "Identifier" &&
        n.callee.property.type === "Identifier" &&
        unitTestRe.test(n.callee.object.name) &&
        (n.callee.property.name === "only" ||
          n.callee.property.name === "skip"))) &&
    n.arguments.length === 2 &&
    (n.arguments[0].type === "StringLiteral" ||
      n.arguments[0].type === "TemplateLiteral" ||
      (n.arguments[0].type === "Literal" &&
        typeof n.arguments[0].value === "string")) &&
    (n.arguments[1].type === "FunctionExpression" ||
      n.arguments[1].type === "ArrowFunctionExpression") &&
    n.arguments[1].params.length <= 1
  );
}

function isTheOnlyJSXElementInMarkdown(options, path) {
  if (options.parentParser !== "markdown") {
    return false;
  }

  const node = path.getNode();

  if (!node.expression || !isJSXNode(node.expression)) {
    return false;
  }

  const parent = path.getParentNode();

  return parent.type === "Program" && parent.body.length == 1;
}

function willPrintOwnComments(path) {
  const node = path.getValue();
  const parent = path.getParentNode();

  return (
    ((node && isJSXNode(node)) ||
      (parent &&
        (parent.type === "JSXSpreadAttribute" ||
          parent.type === "JSXSpreadChild" ||
          parent.type === "UnionTypeAnnotation" ||
          parent.type === "TSUnionType" ||
          ((parent.type === "ClassDeclaration" ||
            parent.type === "ClassExpression") &&
            parent.superClass === node)))) &&
    !util.hasIgnoreComment(path)
  );
}

function canAttachComment(node) {
  return (
    node.type &&
    node.type !== "CommentBlock" &&
    node.type !== "CommentLine" &&
    node.type !== "Line" &&
    node.type !== "Block" &&
    node.type !== "EmptyStatement" &&
    node.type !== "TemplateElement" &&
    node.type !== "Import" &&
    !(node.callee && node.callee.type === "Import")
  );
}

function printComment(commentPath, options) {
  const comment = commentPath.getValue();

  switch (comment.type) {
    case "CommentBlock":
    case "Block": {
      if (isJsDocComment(comment)) {
        return printJsDocComment(comment);
      }

      const isInsideFlowComment =
        options.originalText.substr(util.locEnd(comment) - 3, 3) === "*-/";

      return "/*" + comment.value + (isInsideFlowComment ? "*-/" : "*/");
    }
    case "CommentLine":
    case "Line":
      // Print shebangs with the proper comment characters
      if (options.originalText.slice(util.locStart(comment)).startsWith("#!")) {
        return "#!" + comment.value.trimRight();
      }
      return "//" + comment.value.trimRight();
    default:
      throw new Error("Not a comment: " + JSON.stringify(comment));
  }
}

function isJsDocComment(comment) {
  const lines = comment.value.split("\n");
  return (
    lines.length > 1 &&
    lines.slice(0, lines.length - 1).every(line => line.trim()[0] === "*")
  );
}

function printJsDocComment(comment) {
  const lines = comment.value.split("\n");

  return concat([
    "/*",
    join(
      hardline,
      lines.map(
        (line, index) =>
          (index > 0 ? " " : "") +
          (index < lines.length - 1 ? line.trim() : line.trimLeft())
      )
    ),
    "*/"
  ]);
}

module.exports = {
  print: genericPrint,
  embed,
  massageAstNode: clean,
  hasPrettierIgnore,
  willPrintOwnComments,
  canAttachComment,
  printComment
};


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, '__esModule', { value: true });

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:
var defaultOptions = {
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // Source filename.
  sourceFilename: undefined,
  // Line from which to start counting source. Useful for
  // integration with other tools.
  startLine: 1,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // TODO
  allowSuperOutsideMethod: false,
  // An array of plugins to enable
  plugins: [],
  // TODO
  strictMode: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // Adds all parsed tokens to a `tokens` property on the `File` node
  tokens: false
}; // Interpret and default an options object

function getOptions(opts) {
  var options = {};

  for (var key in defaultOptions) {
    options[key] = opts && opts[key] != null ? opts[key] : defaultOptions[key];
  }

  return options;
}

// ## Token types
// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.
// All token type variables start with an underscore, to make them
// easy to recognize.
// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.
var beforeExpr = true;
var startsExpr = true;
var isLoop = true;
var isAssign = true;
var prefix = true;
var postfix = true;
var TokenType = function TokenType(label, conf) {
  if (conf === void 0) {
    conf = {};
  }

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.rightAssociative = !!conf.rightAssociative;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop === 0 ? 0 : conf.binop || null;
  this.updateContext = null;
};

var KeywordTokenType =
/*#__PURE__*/
function (_TokenType) {
  _inheritsLoose(KeywordTokenType, _TokenType);

  function KeywordTokenType(name, options) {
    if (options === void 0) {
      options = {};
    }

    options.keyword = name;
    return _TokenType.call(this, name, options) || this;
  }

  return KeywordTokenType;
}(TokenType);

var BinopTokenType =
/*#__PURE__*/
function (_TokenType2) {
  _inheritsLoose(BinopTokenType, _TokenType2);

  function BinopTokenType(name, prec) {
    return _TokenType2.call(this, name, {
      beforeExpr,
      binop: prec
    }) || this;
  }

  return BinopTokenType;
}(TokenType);
var types = {
  num: new TokenType("num", {
    startsExpr
  }),
  bigint: new TokenType("bigint", {
    startsExpr
  }),
  regexp: new TokenType("regexp", {
    startsExpr
  }),
  string: new TokenType("string", {
    startsExpr
  }),
  name: new TokenType("name", {
    startsExpr
  }),
  eof: new TokenType("eof"),
  // Punctuation token types.
  bracketL: new TokenType("[", {
    beforeExpr,
    startsExpr
  }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {
    beforeExpr,
    startsExpr
  }),
  braceBarL: new TokenType("{|", {
    beforeExpr,
    startsExpr
  }),
  braceR: new TokenType("}"),
  braceBarR: new TokenType("|}"),
  parenL: new TokenType("(", {
    beforeExpr,
    startsExpr
  }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", {
    beforeExpr
  }),
  semi: new TokenType(";", {
    beforeExpr
  }),
  colon: new TokenType(":", {
    beforeExpr
  }),
  doubleColon: new TokenType("::", {
    beforeExpr
  }),
  dot: new TokenType("."),
  question: new TokenType("?", {
    beforeExpr
  }),
  questionDot: new TokenType("?."),
  arrow: new TokenType("=>", {
    beforeExpr
  }),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", {
    beforeExpr
  }),
  backQuote: new TokenType("`", {
    startsExpr
  }),
  dollarBraceL: new TokenType("${", {
    beforeExpr,
    startsExpr
  }),
  at: new TokenType("@"),
  hash: new TokenType("#"),
  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.
  eq: new TokenType("=", {
    beforeExpr,
    isAssign
  }),
  assign: new TokenType("_=", {
    beforeExpr,
    isAssign
  }),
  incDec: new TokenType("++/--", {
    prefix,
    postfix,
    startsExpr
  }),
  bang: new TokenType("!", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  tilde: new TokenType("~", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  pipeline: new BinopTokenType("|>", 0),
  nullishCoalescing: new BinopTokenType("??", 1),
  logicalOR: new BinopTokenType("||", 1),
  logicalAND: new BinopTokenType("&&", 2),
  bitwiseOR: new BinopTokenType("|", 3),
  bitwiseXOR: new BinopTokenType("^", 4),
  bitwiseAND: new BinopTokenType("&", 5),
  equality: new BinopTokenType("==/!=", 6),
  relational: new BinopTokenType("</>", 7),
  bitShift: new BinopTokenType("<</>>", 8),
  plusMin: new TokenType("+/-", {
    beforeExpr,
    binop: 9,
    prefix,
    startsExpr
  }),
  modulo: new BinopTokenType("%", 10),
  star: new BinopTokenType("*", 10),
  slash: new BinopTokenType("/", 10),
  exponent: new TokenType("**", {
    beforeExpr,
    binop: 11,
    rightAssociative: true
  })
};
var keywords = {
  break: new KeywordTokenType("break"),
  case: new KeywordTokenType("case", {
    beforeExpr
  }),
  catch: new KeywordTokenType("catch"),
  continue: new KeywordTokenType("continue"),
  debugger: new KeywordTokenType("debugger"),
  default: new KeywordTokenType("default", {
    beforeExpr
  }),
  do: new KeywordTokenType("do", {
    isLoop,
    beforeExpr
  }),
  else: new KeywordTokenType("else", {
    beforeExpr
  }),
  finally: new KeywordTokenType("finally"),
  for: new KeywordTokenType("for", {
    isLoop
  }),
  function: new KeywordTokenType("function", {
    startsExpr
  }),
  if: new KeywordTokenType("if"),
  return: new KeywordTokenType("return", {
    beforeExpr
  }),
  switch: new KeywordTokenType("switch"),
  throw: new KeywordTokenType("throw", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  try: new KeywordTokenType("try"),
  var: new KeywordTokenType("var"),
  let: new KeywordTokenType("let"),
  const: new KeywordTokenType("const"),
  while: new KeywordTokenType("while", {
    isLoop
  }),
  with: new KeywordTokenType("with"),
  new: new KeywordTokenType("new", {
    beforeExpr,
    startsExpr
  }),
  this: new KeywordTokenType("this", {
    startsExpr
  }),
  super: new KeywordTokenType("super", {
    startsExpr
  }),
  class: new KeywordTokenType("class"),
  extends: new KeywordTokenType("extends", {
    beforeExpr
  }),
  export: new KeywordTokenType("export"),
  import: new KeywordTokenType("import", {
    startsExpr
  }),
  yield: new KeywordTokenType("yield", {
    beforeExpr,
    startsExpr
  }),
  null: new KeywordTokenType("null", {
    startsExpr
  }),
  true: new KeywordTokenType("true", {
    startsExpr
  }),
  false: new KeywordTokenType("false", {
    startsExpr
  }),
  in: new KeywordTokenType("in", {
    beforeExpr,
    binop: 7
  }),
  instanceof: new KeywordTokenType("instanceof", {
    beforeExpr,
    binop: 7
  }),
  typeof: new KeywordTokenType("typeof", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  void: new KeywordTokenType("void", {
    beforeExpr,
    prefix,
    startsExpr
  }),
  delete: new KeywordTokenType("delete", {
    beforeExpr,
    prefix,
    startsExpr
  })
}; // Map keyword names to token types.

Object.keys(keywords).forEach(function (name) {
  types["_" + name] = keywords[name];
});

/* eslint max-len: 0 */
function makePredicate(words) {
  var wordsArr = words.split(" ");
  return function (str) {
    return wordsArr.indexOf(str) >= 0;
  };
} // Reserved word lists for various dialects of the language


var reservedWords = {
  "6": makePredicate("enum await"),
  strict: makePredicate("implements interface let package private protected public static yield"),
  strictBind: makePredicate("eval arguments")
}; // And the keywords

var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this let const class extends export import yield super"); // ## Character categories
// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
nonASCIIidentifierStartChars = nonASCIIidentifierChars = null; // These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by `bin/generate-identifier-regex.js`.
// eslint-disable-next-line comma-spacing

/* prettier-ignore */

var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 19, 35, 5, 35, 5, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 66, 18, 2, 1, 11, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 56, 50, 14, 50, 785, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 2, 0, 36, 17, 2, 24, 85, 6, 2, 0, 2, 3, 2, 14, 2, 9, 8, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 19, 0, 13, 4, 159, 52, 19, 3, 54, 47, 21, 1, 2, 0, 185, 46, 42, 3, 37, 47, 21, 0, 60, 42, 86, 25, 391, 63, 32, 0, 449, 56, 264, 8, 2, 36, 18, 0, 50, 29, 881, 921, 103, 110, 18, 195, 2749, 1070, 4050, 582, 8634, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 65, 0, 32, 6124, 20, 754, 9486, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 60, 67, 1213, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 3, 5761, 10591, 541]; // eslint-disable-next-line comma-spacing

/* prettier-ignore */

var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 10, 2, 4, 9, 83, 11, 7, 0, 161, 11, 6, 9, 7, 3, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 193, 17, 10, 9, 87, 19, 13, 9, 214, 6, 3, 8, 28, 1, 83, 16, 16, 9, 82, 12, 9, 9, 84, 14, 5, 9, 423, 9, 838, 7, 2, 7, 17, 9, 57, 21, 2, 13, 19882, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 513, 54, 5, 49, 9, 0, 15, 0, 23, 4, 2, 14, 1361, 6, 2, 16, 3, 6, 2, 1, 2, 4, 2214, 6, 110, 6, 6, 9, 792487, 239]; // This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.

function isInAstralSet(code, set) {
  var pos = 0x10000;

  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }

  return false;
} // Test whether a given character code starts an identifier.


function isIdentifierStart(code) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;

  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  }

  return isInAstralSet(code, astralIdentifierStartCodes);
} // Test whether a given character is part of an identifier.

function isIdentifierChar(code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;

  if (code <= 0xffff) {
    return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  }

  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
var lineBreakG = new RegExp(lineBreak.source, "g");
function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029;
}
var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design
var TokContext = function TokContext(token, isExpr, preserveSpace, override) // Takes a Tokenizer as a this-parameter, and returns void.
{
  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
};
var types$1 = {
  braceStatement: new TokContext("{", false),
  braceExpression: new TokContext("{", true),
  templateQuasi: new TokContext("${", true),
  parenStatement: new TokContext("(", false),
  parenExpression: new TokContext("(", true),
  template: new TokContext("`", true, true, function (p) {
    return p.readTmplToken();
  }),
  functionExpression: new TokContext("function", true)
}; // Token-specific context update code

types.parenR.updateContext = types.braceR.updateContext = function () {
  if (this.state.context.length === 1) {
    this.state.exprAllowed = true;
    return;
  }

  var out = this.state.context.pop();

  if (out === types$1.braceStatement && this.curContext() === types$1.functionExpression) {
    this.state.context.pop();
    this.state.exprAllowed = false;
  } else if (out === types$1.templateQuasi) {
    this.state.exprAllowed = true;
  } else {
    this.state.exprAllowed = !out.isExpr;
  }
};

types.name.updateContext = function (prevType) {
  if (this.state.value === "of" && this.curContext() === types$1.parenStatement) {
    this.state.exprAllowed = !prevType.beforeExpr;
    return;
  }

  this.state.exprAllowed = false;

  if (prevType === types._let || prevType === types._const || prevType === types._var) {
    if (lineBreak.test(this.input.slice(this.state.end))) {
      this.state.exprAllowed = true;
    }
  }
};

types.braceL.updateContext = function (prevType) {
  this.state.context.push(this.braceIsBlock(prevType) ? types$1.braceStatement : types$1.braceExpression);
  this.state.exprAllowed = true;
};

types.dollarBraceL.updateContext = function () {
  this.state.context.push(types$1.templateQuasi);
  this.state.exprAllowed = true;
};

types.parenL.updateContext = function (prevType) {
  var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
  this.state.context.push(statementParens ? types$1.parenStatement : types$1.parenExpression);
  this.state.exprAllowed = true;
};

types.incDec.updateContext = function () {// tokExprAllowed stays unchanged
};

types._function.updateContext = function () {
  if (this.curContext() !== types$1.braceStatement) {
    this.state.context.push(types$1.functionExpression);
  }

  this.state.exprAllowed = false;
};

types.backQuote.updateContext = function () {
  if (this.curContext() === types$1.template) {
    this.state.context.pop();
  } else {
    this.state.context.push(types$1.template);
  }

  this.state.exprAllowed = false;
};

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.
var Position = function Position(line, col) {
  this.line = line;
  this.column = col;
};
var SourceLocation = function SourceLocation(start, end) {
  this.start = start; // $FlowIgnore (may start as null, but initialized later)

  this.end = end;
}; // The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur;
    var match = lineBreakG.exec(input);

    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  } // istanbul ignore next


  throw new Error("Unreachable");
}

var BaseParser =
/*#__PURE__*/
function () {
  function BaseParser() {}

  var _proto = BaseParser.prototype;

  // Properties set by constructor in index.js
  // Initialized by Tokenizer
  _proto.isReservedWord = function isReservedWord(word) {
    if (word === "await") {
      return this.inModule;
    } else {
      return reservedWords[6](word);
    }
  };

  _proto.hasPlugin = function hasPlugin(name) {
    return !!this.plugins[name];
  };

  return BaseParser;
}();

/* eslint max-len: 0 */

/**
 * Based on the comment attachment algorithm used in espree and estraverse.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * * Redistributions of source code must retain the above copyright
 *   notice, this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright
 *   notice, this list of conditions and the following disclaimer in the
 *   documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
function last(stack) {
  return stack[stack.length - 1];
}

var CommentsParser =
/*#__PURE__*/
function (_BaseParser) {
  _inheritsLoose(CommentsParser, _BaseParser);

  function CommentsParser() {
    return _BaseParser.apply(this, arguments) || this;
  }

  var _proto = CommentsParser.prototype;

  _proto.addComment = function addComment(comment) {
    if (this.filename) comment.loc.filename = this.filename;
    this.state.trailingComments.push(comment);
    this.state.leadingComments.push(comment);
  };

  _proto.processComment = function processComment(node) {
    if (node.type === "Program" && node.body.length > 0) return;
    var stack = this.state.commentStack;
    var firstChild, lastChild, trailingComments, i, j;

    if (this.state.trailingComments.length > 0) {
      // If the first comment in trailingComments comes after the
      // current node, then we're good - all comments in the array will
      // come after the node and so it's safe to add them as official
      // trailingComments.
      if (this.state.trailingComments[0].start >= node.end) {
        trailingComments = this.state.trailingComments;
        this.state.trailingComments = [];
      } else {
        // Otherwise, if the first comment doesn't come after the
        // current node, that means we have a mix of leading and trailing
        // comments in the array and that leadingComments contains the
        // same items as trailingComments. Reset trailingComments to
        // zero items and we'll handle this by evaluating leadingComments
        // later.
        this.state.trailingComments.length = 0;
      }
    } else {
      if (stack.length > 0) {
        var lastInStack = last(stack);

        if (lastInStack.trailingComments && lastInStack.trailingComments[0].start >= node.end) {
          trailingComments = lastInStack.trailingComments;
          lastInStack.trailingComments = null;
        }
      }
    } // Eating the stack.


    if (stack.length > 0 && last(stack).start >= node.start) {
      firstChild = stack.pop();
    }

    while (stack.length > 0 && last(stack).start >= node.start) {
      lastChild = stack.pop();
    }

    if (!lastChild && firstChild) lastChild = firstChild; // Attach comments that follow a trailing comma on the last
    // property in an object literal or a trailing comma in function arguments
    // as trailing comments

    if (firstChild && this.state.leadingComments.length > 0) {
      var lastComment = last(this.state.leadingComments);

      if (firstChild.type === "ObjectProperty") {
        if (lastComment.start >= node.start) {
          if (this.state.commentPreviousNode) {
            for (j = 0; j < this.state.leadingComments.length; j++) {
              if (this.state.leadingComments[j].end < this.state.commentPreviousNode.end) {
                this.state.leadingComments.splice(j, 1);
                j--;
              }
            }

            if (this.state.leadingComments.length > 0) {
              firstChild.trailingComments = this.state.leadingComments;
              this.state.leadingComments = [];
            }
          }
        }
      } else if (node.type === "CallExpression" && node.arguments && node.arguments.length) {
        var lastArg = last(node.arguments);

        if (lastArg && lastComment.start >= lastArg.start && lastComment.end <= node.end) {
          if (this.state.commentPreviousNode) {
            if (this.state.leadingComments.length > 0) {
              lastArg.trailingComments = this.state.leadingComments;
              this.state.leadingComments = [];
            }
          }
        }
      }
    }

    if (lastChild) {
      if (lastChild.leadingComments) {
        if (lastChild !== node && lastChild.leadingComments.length > 0 && last(lastChild.leadingComments).end <= node.start) {
          node.leadingComments = lastChild.leadingComments;
          lastChild.leadingComments = null;
        } else {
          // A leading comment for an anonymous class had been stolen by its first ClassMethod,
          // so this takes back the leading comment.
          // See also: https://github.com/eslint/espree/issues/158
          for (i = lastChild.leadingComments.length - 2; i >= 0; --i) {
            if (lastChild.leadingComments[i].end <= node.start) {
              node.leadingComments = lastChild.leadingComments.splice(0, i + 1);
              break;
            }
          }
        }
      }
    } else if (this.state.leadingComments.length > 0) {
      if (last(this.state.leadingComments).end <= node.start) {
        if (this.state.commentPreviousNode) {
          for (j = 0; j < this.state.leadingComments.length; j++) {
            if (this.state.leadingComments[j].end < this.state.commentPreviousNode.end) {
              this.state.leadingComments.splice(j, 1);
              j--;
            }
          }
        }

        if (this.state.leadingComments.length > 0) {
          node.leadingComments = this.state.leadingComments;
          this.state.leadingComments = [];
        }
      } else {
        // https://github.com/eslint/espree/issues/2
        //
        // In special cases, such as return (without a value) and
        // debugger, all comments will end up as leadingComments and
        // will otherwise be eliminated. This step runs when the
        // commentStack is empty and there are comments left
        // in leadingComments.
        //
        // This loop figures out the stopping point between the actual
        // leading and trailing comments by finding the location of the
        // first comment that comes after the given node.
        for (i = 0; i < this.state.leadingComments.length; i++) {
          if (this.state.leadingComments[i].end > node.start) {
            break;
          }
        } // Split the array based on the location of the first comment
        // that comes after the node. Keep in mind that this could
        // result in an empty array, and if so, the array must be
        // deleted.


        var leadingComments = this.state.leadingComments.slice(0, i);
        node.leadingComments = leadingComments.length === 0 ? null : leadingComments; // Similarly, trailing comments are attached later. The variable
        // must be reset to null if there are no trailing comments.

        trailingComments = this.state.leadingComments.slice(i);

        if (trailingComments.length === 0) {
          trailingComments = null;
        }
      }
    }

    this.state.commentPreviousNode = node;

    if (trailingComments) {
      if (trailingComments.length && trailingComments[0].start >= node.start && last(trailingComments).end <= node.end) {
        node.innerComments = trailingComments;
      } else {
        node.trailingComments = trailingComments;
      }
    }

    stack.push(node);
  };

  return CommentsParser;
}(BaseParser);

// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

var LocationParser =
/*#__PURE__*/
function (_CommentsParser) {
  _inheritsLoose(LocationParser, _CommentsParser);

  function LocationParser() {
    return _CommentsParser.apply(this, arguments) || this;
  }

  var _proto = LocationParser.prototype;

  _proto.raise = function raise(pos, message, missingPluginNames) {
    var loc = getLineInfo(this.input, pos);
    message += ` (${loc.line}:${loc.column})`; // $FlowIgnore

    var err = new SyntaxError(message);
    err.pos = pos;
    err.loc = loc;

    if (missingPluginNames) {
      err.missingPlugin = missingPluginNames;
    }

    throw err;
  };

  return LocationParser;
}(CommentsParser);

var State =
/*#__PURE__*/
function () {
  function State() {}

  var _proto = State.prototype;

  _proto.init = function init(options, input) {
    this.strict = options.strictMode === false ? false : options.sourceType === "module";
    this.input = input;
    this.potentialArrowAt = -1;
    this.noArrowAt = [];
    this.noArrowParamsConversionAt = []; // eslint-disable-next-line max-len

    this.inMethod = this.inFunction = this.inParameters = this.maybeInArrowParameters = this.inGenerator = this.inAsync = this.inPropertyName = this.inType = this.inClassProperty = this.noAnonFunctionType = false;
    this.classLevel = 0;
    this.labels = [];
    this.decoratorStack = [[]];
    this.yieldInPossibleArrowParameters = null;
    this.tokens = [];
    this.comments = [];
    this.trailingComments = [];
    this.leadingComments = [];
    this.commentStack = []; // $FlowIgnore

    this.commentPreviousNode = null;
    this.pos = this.lineStart = 0;
    this.curLine = options.startLine;
    this.type = types.eof;
    this.value = null;
    this.start = this.end = this.pos;
    this.startLoc = this.endLoc = this.curPosition(); // $FlowIgnore

    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;
    this.context = [types$1.braceStatement];
    this.exprAllowed = true;
    this.containsEsc = this.containsOctal = false;
    this.octalPosition = null;
    this.invalidTemplateEscapePosition = null;
    this.exportedIdentifiers = [];
  }; // TODO


  _proto.curPosition = function curPosition() {
    return new Position(this.curLine, this.pos - this.lineStart);
  };

  _proto.clone = function clone(skipArrays) {
    var _this = this;

    var state = new State();
    Object.keys(this).forEach(function (key) {
      // $FlowIgnore
      var val = _this[key];

      if ((!skipArrays || key === "context") && Array.isArray(val)) {
        val = val.slice();
      } // $FlowIgnore


      state[key] = val;
    });
    return state;
  };

  return State;
}();

var _isDigit = function isDigit(code) {
  return code >= 48 && code <= 57;
};

/* eslint max-len: 0 */
// an immediate sibling of NumericLiteralSeparator _

var forbiddenNumericSeparatorSiblings = {
  decBinOct: [46, 66, 69, 79, 95, // multiple separators are not allowed
  98, 101, 111],
  hex: [46, 88, 95, // multiple separators are not allowed
  120]
};
var allowedNumericSeparatorSiblings = {};
allowedNumericSeparatorSiblings.bin = [// 0 - 1
48, 49];
allowedNumericSeparatorSiblings.oct = allowedNumericSeparatorSiblings.bin.concat([50, 51, 52, 53, 54, 55]);
allowedNumericSeparatorSiblings.dec = allowedNumericSeparatorSiblings.oct.concat([56, 57]);
allowedNumericSeparatorSiblings.hex = allowedNumericSeparatorSiblings.dec.concat([65, 66, 67, 68, 69, 70, 97, 98, 99, 100, 101, 102]); // Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(state) {
  this.type = state.type;
  this.value = state.value;
  this.start = state.start;
  this.end = state.end;
  this.loc = new SourceLocation(state.startLoc, state.endLoc);
}; // ## Tokenizer

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xffff) {
    return String.fromCharCode(code);
  } else {
    return String.fromCharCode((code - 0x10000 >> 10) + 0xd800, (code - 0x10000 & 1023) + 0xdc00);
  }
}

var Tokenizer =
/*#__PURE__*/
function (_LocationParser) {
  _inheritsLoose(Tokenizer, _LocationParser);

  // Forward-declarations
  // parser/util.js
  function Tokenizer(options, input) {
    var _this;

    _this = _LocationParser.call(this) || this;
    _this.state = new State();

    _this.state.init(options, input);

    _this.isLookahead = false;
    return _this;
  } // Move to the next token


  var _proto = Tokenizer.prototype;

  _proto.next = function next() {
    if (this.options.tokens && !this.isLookahead) {
      this.state.tokens.push(new Token(this.state));
    }

    this.state.lastTokEnd = this.state.end;
    this.state.lastTokStart = this.state.start;
    this.state.lastTokEndLoc = this.state.endLoc;
    this.state.lastTokStartLoc = this.state.startLoc;
    this.nextToken();
  }; // TODO


  _proto.eat = function eat(type) {
    if (this.match(type)) {
      this.next();
      return true;
    } else {
      return false;
    }
  }; // TODO


  _proto.match = function match(type) {
    return this.state.type === type;
  }; // TODO


  _proto.isKeyword = function isKeyword$$1(word) {
    return isKeyword(word);
  }; // TODO


  _proto.lookahead = function lookahead() {
    var old = this.state;
    this.state = old.clone(true);
    this.isLookahead = true;
    this.next();
    this.isLookahead = false;
    var curr = this.state;
    this.state = old;
    return curr;
  }; // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).


  _proto.setStrict = function setStrict(strict) {
    this.state.strict = strict;
    if (!this.match(types.num) && !this.match(types.string)) return;
    this.state.pos = this.state.start;

    while (this.state.pos < this.state.lineStart) {
      this.state.lineStart = this.input.lastIndexOf("\n", this.state.lineStart - 2) + 1;
      --this.state.curLine;
    }

    this.nextToken();
  };

  _proto.curContext = function curContext() {
    return this.state.context[this.state.context.length - 1];
  }; // Read a single token, updating the parser object's token-related
  // properties.


  _proto.nextToken = function nextToken() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) this.skipSpace();
    this.state.containsOctal = false;
    this.state.octalPosition = null;
    this.state.start = this.state.pos;
    this.state.startLoc = this.state.curPosition();

    if (this.state.pos >= this.input.length) {
      this.finishToken(types.eof);
      return;
    }

    if (curContext.override) {
      curContext.override(this);
    } else {
      this.readToken(this.fullCharCodeAtPos());
    }
  };

  _proto.readToken = function readToken(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92) {
      this.readWord();
    } else {
      this.getTokenFromCode(code);
    }
  };

  _proto.fullCharCodeAtPos = function fullCharCodeAtPos() {
    var code = this.input.charCodeAt(this.state.pos);
    if (code <= 0xd7ff || code >= 0xe000) return code;
    var next = this.input.charCodeAt(this.state.pos + 1);
    return (code << 10) + next - 0x35fdc00;
  };

  _proto.pushComment = function pushComment(block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? "CommentBlock" : "CommentLine",
      value: text,
      start: start,
      end: end,
      loc: new SourceLocation(startLoc, endLoc)
    };

    if (!this.isLookahead) {
      if (this.options.tokens) this.state.tokens.push(comment);
      this.state.comments.push(comment);
      this.addComment(comment);
    }
  };

  _proto.skipBlockComment = function skipBlockComment() {
    var startLoc = this.state.curPosition();
    var start = this.state.pos;
    var end = this.input.indexOf("*/", this.state.pos += 2);
    if (end === -1) this.raise(this.state.pos - 2, "Unterminated comment");
    this.state.pos = end + 2;
    lineBreakG.lastIndex = start;
    var match;

    while ((match = lineBreakG.exec(this.input)) && match.index < this.state.pos) {
      ++this.state.curLine;
      this.state.lineStart = match.index + match[0].length;
    }

    this.pushComment(true, this.input.slice(start + 2, end), start, this.state.pos, startLoc, this.state.curPosition());
  };

  _proto.skipLineComment = function skipLineComment(startSkip) {
    var start = this.state.pos;
    var startLoc = this.state.curPosition();
    var ch = this.input.charCodeAt(this.state.pos += startSkip);

    if (this.state.pos < this.input.length) {
      while (ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233 && ++this.state.pos < this.input.length) {
        ch = this.input.charCodeAt(this.state.pos);
      }
    }

    this.pushComment(false, this.input.slice(start + startSkip, this.state.pos), start, this.state.pos, startLoc, this.state.curPosition());
  }; // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.


  _proto.skipSpace = function skipSpace() {
    loop: while (this.state.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.state.pos);

      switch (ch) {
        case 32:
        case 160:
          ++this.state.pos;
          break;

        case 13:
          if (this.input.charCodeAt(this.state.pos + 1) === 10) {
            ++this.state.pos;
          }

        case 10:
        case 8232:
        case 8233:
          ++this.state.pos;
          ++this.state.curLine;
          this.state.lineStart = this.state.pos;
          break;

        case 47:
          switch (this.input.charCodeAt(this.state.pos + 1)) {
            case 42:
              this.skipBlockComment();
              break;

            case 47:
              this.skipLineComment(2);
              break;

            default:
              break loop;
          }

          break;

        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this.state.pos;
          } else {
            break loop;
          }

      }
    }
  }; // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.


  _proto.finishToken = function finishToken(type, val) {
    this.state.end = this.state.pos;
    this.state.endLoc = this.state.curPosition();
    var prevType = this.state.type;
    this.state.type = type;
    this.state.value = val;
    this.updateContext(prevType);
  }; // ### Token reading
  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //


  _proto.readToken_dot = function readToken_dot() {
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next >= 48 && next <= 57) {
      this.readNumber(true);
      return;
    }

    var next2 = this.input.charCodeAt(this.state.pos + 2);

    if (next === 46 && next2 === 46) {
      this.state.pos += 3;
      this.finishToken(types.ellipsis);
    } else {
      ++this.state.pos;
      this.finishToken(types.dot);
    }
  };

  _proto.readToken_slash = function readToken_slash() {
    // '/'
    if (this.state.exprAllowed) {
      ++this.state.pos;
      this.readRegexp();
      return;
    }

    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.slash, 1);
    }
  };

  _proto.readToken_mult_modulo = function readToken_mult_modulo(code) {
    // '%*'
    var type = code === 42 ? types.star : types.modulo;
    var width = 1;
    var next = this.input.charCodeAt(this.state.pos + 1);
    var exprAllowed = this.state.exprAllowed; // Exponentiation operator **

    if (code === 42 && next === 42) {
      width++;
      next = this.input.charCodeAt(this.state.pos + 2);
      type = types.exponent;
    }

    if (next === 61 && !exprAllowed) {
      width++;
      type = types.assign;
    }

    this.finishOp(type, width);
  };

  _proto.readToken_pipe_amp = function readToken_pipe_amp(code) {
    // '|&'
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === code) {
      this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2);
      return;
    }

    if (code === 124) {
      // '|>'
      if (next === 62) {
        this.finishOp(types.pipeline, 2);
        return;
      } else if (next === 125 && this.hasPlugin("flow")) {
        // '|}'
        this.finishOp(types.braceBarR, 2);
        return;
      }
    }

    if (next === 61) {
      this.finishOp(types.assign, 2);
      return;
    }

    this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1);
  };

  _proto.readToken_caret = function readToken_caret() {
    // '^'
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.bitwiseXOR, 1);
    }
  };

  _proto.readToken_plus_min = function readToken_plus_min(code) {
    // '+-'
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === code) {
      if (next === 45 && !this.inModule && this.input.charCodeAt(this.state.pos + 2) === 62 && lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.pos))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        this.nextToken();
        return;
      }

      this.finishOp(types.incDec, 2);
      return;
    }

    if (next === 61) {
      this.finishOp(types.assign, 2);
    } else {
      this.finishOp(types.plusMin, 1);
    }
  };

  _proto.readToken_lt_gt = function readToken_lt_gt(code) {
    // '<>'
    var next = this.input.charCodeAt(this.state.pos + 1);
    var size = 1;

    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.state.pos + 2) === 62 ? 3 : 2;

      if (this.input.charCodeAt(this.state.pos + size) === 61) {
        this.finishOp(types.assign, size + 1);
        return;
      }

      this.finishOp(types.bitShift, size);
      return;
    }

    if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.state.pos + 2) === 45 && this.input.charCodeAt(this.state.pos + 3) === 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      this.nextToken();
      return;
    }

    if (next === 61) {
      // <= | >=
      size = 2;
    }

    this.finishOp(types.relational, size);
  };

  _proto.readToken_eq_excl = function readToken_eq_excl(code) {
    // '=!'
    var next = this.input.charCodeAt(this.state.pos + 1);

    if (next === 61) {
      this.finishOp(types.equality, this.input.charCodeAt(this.state.pos + 2) === 61 ? 3 : 2);
      return;
    }

    if (code === 61 && next === 62) {
      // '=>'
      this.state.pos += 2;
      this.finishToken(types.arrow);
      return;
    }

    this.finishOp(code === 61 ? types.eq : types.bang, 1);
  };

  _proto.readToken_question = function readToken_question() {
    // '?'
    var next = this.input.charCodeAt(this.state.pos + 1);
    var next2 = this.input.charCodeAt(this.state.pos + 2);

    if (next === 63) {
      // '??'
      this.finishOp(types.nullishCoalescing, 2);
    } else if (next === 46 && !(next2 >= 48 && next2 <= 57)) {
      // '.' not followed by a number
      this.state.pos += 2;
      this.finishToken(types.questionDot);
    } else {
      ++this.state.pos;
      this.finishToken(types.question);
    }
  };

  _proto.getTokenFromCode = function getTokenFromCode(code) {
    switch (code) {
      case 35:
        if ((this.hasPlugin("classPrivateProperties") || this.hasPlugin("classPrivateMethods")) && this.state.classLevel > 0) {
          ++this.state.pos;
          this.finishToken(types.hash);
          return;
        } else {
          this.raise(this.state.pos, `Unexpected character '${codePointToString(code)}'`);
        }

      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.

      case 46:
        this.readToken_dot();
        return;
      // Punctuation tokens.

      case 40:
        ++this.state.pos;
        this.finishToken(types.parenL);
        return;

      case 41:
        ++this.state.pos;
        this.finishToken(types.parenR);
        return;

      case 59:
        ++this.state.pos;
        this.finishToken(types.semi);
        return;

      case 44:
        ++this.state.pos;
        this.finishToken(types.comma);
        return;

      case 91:
        ++this.state.pos;
        this.finishToken(types.bracketL);
        return;

      case 93:
        ++this.state.pos;
        this.finishToken(types.bracketR);
        return;

      case 123:
        if (this.hasPlugin("flow") && this.input.charCodeAt(this.state.pos + 1) === 124) {
          this.finishOp(types.braceBarL, 2);
        } else {
          ++this.state.pos;
          this.finishToken(types.braceL);
        }

        return;

      case 125:
        ++this.state.pos;
        this.finishToken(types.braceR);
        return;

      case 58:
        if (this.hasPlugin("functionBind") && this.input.charCodeAt(this.state.pos + 1) === 58) {
          this.finishOp(types.doubleColon, 2);
        } else {
          ++this.state.pos;
          this.finishToken(types.colon);
        }

        return;

      case 63:
        this.readToken_question();
        return;

      case 64:
        ++this.state.pos;
        this.finishToken(types.at);
        return;

      case 96:
        ++this.state.pos;
        this.finishToken(types.backQuote);
        return;

      case 48:
        {
          var next = this.input.charCodeAt(this.state.pos + 1); // '0x', '0X' - hex number

          if (next === 120 || next === 88) {
            this.readRadixNumber(16);
            return;
          } // '0o', '0O' - octal number


          if (next === 111 || next === 79) {
            this.readRadixNumber(8);
            return;
          } // '0b', '0B' - binary number


          if (next === 98 || next === 66) {
            this.readRadixNumber(2);
            return;
          }
        }
      // Anything else beginning with a digit is an integer, octal
      // number, or float.

      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        this.readNumber(false);
        return;
      // Quotes produce strings.

      case 34:
      case 39:
        this.readString(code);
        return;
      // Operators are parsed inline in tiny state machines. '=' (charCodes.equalsTo) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

      case 47:
        this.readToken_slash();
        return;

      case 37:
      case 42:
        this.readToken_mult_modulo(code);
        return;

      case 124:
      case 38:
        this.readToken_pipe_amp(code);
        return;

      case 94:
        this.readToken_caret();
        return;

      case 43:
      case 45:
        this.readToken_plus_min(code);
        return;

      case 60:
      case 62:
        this.readToken_lt_gt(code);
        return;

      case 61:
      case 33:
        this.readToken_eq_excl(code);
        return;

      case 126:
        this.finishOp(types.tilde, 1);
        return;
    }

    this.raise(this.state.pos, `Unexpected character '${codePointToString(code)}'`);
  };

  _proto.finishOp = function finishOp(type, size) {
    var str = this.input.slice(this.state.pos, this.state.pos + size);
    this.state.pos += size;
    this.finishToken(type, str);
  };

  _proto.readRegexp = function readRegexp() {
    var start = this.state.pos;
    var escaped, inClass;

    for (;;) {
      if (this.state.pos >= this.input.length) {
        this.raise(start, "Unterminated regular expression");
      }

      var ch = this.input.charAt(this.state.pos);

      if (lineBreak.test(ch)) {
        this.raise(start, "Unterminated regular expression");
      }

      if (escaped) {
        escaped = false;
      } else {
        if (ch === "[") {
          inClass = true;
        } else if (ch === "]" && inClass) {
          inClass = false;
        } else if (ch === "/" && !inClass) {
          break;
        }

        escaped = ch === "\\";
      }

      ++this.state.pos;
    }

    var content = this.input.slice(start, this.state.pos);
    ++this.state.pos; // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).

    var mods = this.readWord1();

    if (mods) {
      var validFlags = /^[gmsiyu]*$/;

      if (!validFlags.test(mods)) {
        this.raise(start, "Invalid regular expression flag");
      }
    }

    this.finishToken(types.regexp, {
      pattern: content,
      flags: mods
    });
  }; // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.


  _proto.readInt = function readInt(radix, len) {
    var start = this.state.pos;
    var forbiddenSiblings = radix === 16 ? forbiddenNumericSeparatorSiblings.hex : forbiddenNumericSeparatorSiblings.decBinOct;
    var allowedSiblings = radix === 16 ? allowedNumericSeparatorSiblings.hex : radix === 10 ? allowedNumericSeparatorSiblings.dec : radix === 8 ? allowedNumericSeparatorSiblings.oct : allowedNumericSeparatorSiblings.bin;
    var total = 0;

    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this.input.charCodeAt(this.state.pos);
      var val = void 0;

      if (this.hasPlugin("numericSeparator")) {
        var prev = this.input.charCodeAt(this.state.pos - 1);
        var next = this.input.charCodeAt(this.state.pos + 1);

        if (code === 95) {
          if (allowedSiblings.indexOf(next) === -1) {
            this.raise(this.state.pos, "Invalid or unexpected token");
          }

          if (forbiddenSiblings.indexOf(prev) > -1 || forbiddenSiblings.indexOf(next) > -1 || Number.isNaN(next)) {
            this.raise(this.state.pos, "Invalid or unexpected token");
          } // Ignore this _ character


          ++this.state.pos;
          continue;
        }
      }

      if (code >= 97) {
        val = code - 97 + 10;
      } else if (code >= 65) {
        val = code - 65 + 10;
      } else if (_isDigit(code)) {
        val = code - 48; // 0-9
      } else {
        val = Infinity;
      }

      if (val >= radix) break;
      ++this.state.pos;
      total = total * radix + val;
    }

    if (this.state.pos === start || len != null && this.state.pos - start !== len) {
      return null;
    }

    return total;
  };

  _proto.readRadixNumber = function readRadixNumber(radix) {
    var start = this.state.pos;
    var isBigInt = false;
    this.state.pos += 2; // 0x

    var val = this.readInt(radix);

    if (val == null) {
      this.raise(this.state.start + 2, "Expected number in radix " + radix);
    }

    if (this.hasPlugin("bigInt")) {
      if (this.input.charCodeAt(this.state.pos) === 110) {
        ++this.state.pos;
        isBigInt = true;
      }
    }

    if (isIdentifierStart(this.fullCharCodeAtPos())) {
      this.raise(this.state.pos, "Identifier directly after number");
    }

    if (isBigInt) {
      var str = this.input.slice(start, this.state.pos).replace(/[_n]/g, "");
      this.finishToken(types.bigint, str);
      return;
    }

    this.finishToken(types.num, val);
  }; // Read an integer, octal integer, or floating-point number.


  _proto.readNumber = function readNumber(startsWithDot) {
    var start = this.state.pos;
    var octal = this.input.charCodeAt(start) === 48;
    var isFloat = false;
    var isBigInt = false;

    if (!startsWithDot && this.readInt(10) === null) {
      this.raise(start, "Invalid number");
    }

    if (octal && this.state.pos == start + 1) octal = false; // number === 0

    var next = this.input.charCodeAt(this.state.pos);

    if (next === 46 && !octal) {
      ++this.state.pos;
      this.readInt(10);
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }

    if ((next === 69 || next === 101) && !octal) {
      next = this.input.charCodeAt(++this.state.pos);

      if (next === 43 || next === 45) {
        ++this.state.pos;
      }

      if (this.readInt(10) === null) this.raise(start, "Invalid number");
      isFloat = true;
      next = this.input.charCodeAt(this.state.pos);
    }

    if (this.hasPlugin("bigInt")) {
      if (next === 110) {
        // disallow floats and legacy octal syntax, new style octal ("0o") is handled in this.readRadixNumber
        if (isFloat || octal) this.raise(start, "Invalid BigIntLiteral");
        ++this.state.pos;
        isBigInt = true;
      }
    }

    if (isIdentifierStart(this.fullCharCodeAtPos())) {
      this.raise(this.state.pos, "Identifier directly after number");
    } // remove "_" for numeric literal separator, and "n" for BigInts


    var str = this.input.slice(start, this.state.pos).replace(/[_n]/g, "");

    if (isBigInt) {
      this.finishToken(types.bigint, str);
      return;
    }

    var val;

    if (isFloat) {
      val = parseFloat(str);
    } else if (!octal || str.length === 1) {
      val = parseInt(str, 10);
    } else if (this.state.strict) {
      this.raise(start, "Invalid number");
    } else if (/[89]/.test(str)) {
      val = parseInt(str, 10);
    } else {
      val = parseInt(str, 8);
    }

    this.finishToken(types.num, val);
  }; // Read a string value, interpreting backslash-escapes.


  _proto.readCodePoint = function readCodePoint(throwOnInvalid) {
    var ch = this.input.charCodeAt(this.state.pos);
    var code;

    if (ch === 123) {
      var codePos = ++this.state.pos;
      code = this.readHexChar(this.input.indexOf("}", this.state.pos) - this.state.pos, throwOnInvalid);
      ++this.state.pos;

      if (code === null) {
        // $FlowFixMe (is this always non-null?)
        --this.state.invalidTemplateEscapePosition; // to point to the '\'' instead of the 'u'
      } else if (code > 0x10ffff) {
        if (throwOnInvalid) {
          this.raise(codePos, "Code point out of bounds");
        } else {
          this.state.invalidTemplateEscapePosition = codePos - 2;
          return null;
        }
      }
    } else {
      code = this.readHexChar(4, throwOnInvalid);
    }

    return code;
  };

  _proto.readString = function readString(quote) {
    var out = "",
        chunkStart = ++this.state.pos;

    for (;;) {
      if (this.state.pos >= this.input.length) {
        this.raise(this.state.start, "Unterminated string constant");
      }

      var ch = this.input.charCodeAt(this.state.pos);
      if (ch === quote) break;

      if (ch === 92) {
        out += this.input.slice(chunkStart, this.state.pos); // $FlowFixMe

        out += this.readEscapedChar(false);
        chunkStart = this.state.pos;
      } else {
        if (isNewLine(ch)) {
          this.raise(this.state.start, "Unterminated string constant");
        }

        ++this.state.pos;
      }
    }

    out += this.input.slice(chunkStart, this.state.pos++);
    this.finishToken(types.string, out);
  }; // Reads template string tokens.


  _proto.readTmplToken = function readTmplToken() {
    var out = "",
        chunkStart = this.state.pos,
        containsInvalid = false;

    for (;;) {
      if (this.state.pos >= this.input.length) {
        this.raise(this.state.start, "Unterminated template");
      }

      var ch = this.input.charCodeAt(this.state.pos);

      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.state.pos + 1) === 123) {
        if (this.state.pos === this.state.start && this.match(types.template)) {
          if (ch === 36) {
            this.state.pos += 2;
            this.finishToken(types.dollarBraceL);
            return;
          } else {
            ++this.state.pos;
            this.finishToken(types.backQuote);
            return;
          }
        }

        out += this.input.slice(chunkStart, this.state.pos);
        this.finishToken(types.template, containsInvalid ? null : out);
        return;
      }

      if (ch === 92) {
        out += this.input.slice(chunkStart, this.state.pos);
        var escaped = this.readEscapedChar(true);

        if (escaped === null) {
          containsInvalid = true;
        } else {
          out += escaped;
        }

        chunkStart = this.state.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.state.pos);
        ++this.state.pos;

        switch (ch) {
          case 13:
            if (this.input.charCodeAt(this.state.pos) === 10) {
              ++this.state.pos;
            }

          case 10:
            out += "\n";
            break;

          default:
            out += String.fromCharCode(ch);
            break;
        }

        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
        chunkStart = this.state.pos;
      } else {
        ++this.state.pos;
      }
    }
  }; // Used to read escaped characters


  _proto.readEscapedChar = function readEscapedChar(inTemplate) {
    var throwOnInvalid = !inTemplate;
    var ch = this.input.charCodeAt(++this.state.pos);
    ++this.state.pos;

    switch (ch) {
      case 110:
        return "\n";

      case 114:
        return "\r";

      case 120:
        {
          var code = this.readHexChar(2, throwOnInvalid);
          return code === null ? null : String.fromCharCode(code);
        }

      case 117:
        {
          var _code = this.readCodePoint(throwOnInvalid);

          return _code === null ? null : codePointToString(_code);
        }

      case 116:
        return "\t";

      case 98:
        return "\b";

      case 118:
        return "\u000b";

      case 102:
        return "\f";

      case 13:
        if (this.input.charCodeAt(this.state.pos) === 10) {
          ++this.state.pos;
        }

      case 10:
        this.state.lineStart = this.state.pos;
        ++this.state.curLine;
        return "";

      default:
        if (ch >= 48 && ch <= 55) {
          var codePos = this.state.pos - 1; // $FlowFixMe

          var octalStr = this.input.substr(this.state.pos - 1, 3).match(/^[0-7]+/)[0];
          var octal = parseInt(octalStr, 8);

          if (octal > 255) {
            octalStr = octalStr.slice(0, -1);
            octal = parseInt(octalStr, 8);
          }

          if (octal > 0) {
            if (inTemplate) {
              this.state.invalidTemplateEscapePosition = codePos;
              return null;
            } else if (this.state.strict) {
              this.raise(codePos, "Octal literal in strict mode");
            } else if (!this.state.containsOctal) {
              // These properties are only used to throw an error for an octal which occurs
              // in a directive which occurs prior to a "use strict" directive.
              this.state.containsOctal = true;
              this.state.octalPosition = codePos;
            }
          }

          this.state.pos += octalStr.length - 1;
          return String.fromCharCode(octal);
        }

        return String.fromCharCode(ch);
    }
  }; // Used to read character escape sequences ('\x', '\u').


  _proto.readHexChar = function readHexChar(len, throwOnInvalid) {
    var codePos = this.state.pos;
    var n = this.readInt(16, len);

    if (n === null) {
      if (throwOnInvalid) {
        this.raise(codePos, "Bad character escape sequence");
      } else {
        this.state.pos = codePos - 1;
        this.state.invalidTemplateEscapePosition = codePos - 1;
      }
    }

    return n;
  }; // Read an identifier, and return it as a string. Sets `this.state.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.


  _proto.readWord1 = function readWord1() {
    this.state.containsEsc = false;
    var word = "",
        first = true,
        chunkStart = this.state.pos;

    while (this.state.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();

      if (isIdentifierChar(ch)) {
        this.state.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) {
        this.state.containsEsc = true;
        word += this.input.slice(chunkStart, this.state.pos);
        var escStart = this.state.pos;

        if (this.input.charCodeAt(++this.state.pos) !== 117) {
          this.raise(this.state.pos, "Expecting Unicode escape sequence \\uXXXX");
        }

        ++this.state.pos;
        var esc = this.readCodePoint(true); // $FlowFixMe (thinks esc may be null, but throwOnInvalid is true)

        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, true)) {
          this.raise(escStart, "Invalid Unicode escape");
        } // $FlowFixMe


        word += codePointToString(esc);
        chunkStart = this.state.pos;
      } else {
        break;
      }

      first = false;
    }

    return word + this.input.slice(chunkStart, this.state.pos);
  }; // Read an identifier or keyword token. Will check for reserved
  // words when necessary.


  _proto.readWord = function readWord() {
    var word = this.readWord1();
    var type = types.name;

    if (this.isKeyword(word)) {
      if (this.state.containsEsc) {
        this.raise(this.state.pos, `Escape sequence in keyword ${word}`);
      }

      type = keywords[word];
    }

    this.finishToken(type, word);
  };

  _proto.braceIsBlock = function braceIsBlock(prevType) {
    if (prevType === types.colon) {
      var parent = this.curContext();

      if (parent === types$1.braceStatement || parent === types$1.braceExpression) {
        return !parent.isExpr;
      }
    }

    if (prevType === types._return) {
      return lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start));
    }

    if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR) {
      return true;
    }

    if (prevType === types.braceL) {
      return this.curContext() === types$1.braceStatement;
    }

    if (prevType === types.relational) {
      // `class C<T> { ... }`
      return true;
    }

    return !this.state.exprAllowed;
  };

  _proto.updateContext = function updateContext(prevType) {
    var type = this.state.type;
    var update;

    if (type.keyword && (prevType === types.dot || prevType === types.questionDot)) {
      this.state.exprAllowed = false;
    } else if (update = type.updateContext) {
      update.call(this, prevType);
    } else {
      this.state.exprAllowed = type.beforeExpr;
    }
  };

  return Tokenizer;
}(LocationParser);

var UtilParser =
/*#__PURE__*/
function (_Tokenizer) {
  _inheritsLoose(UtilParser, _Tokenizer);

  function UtilParser() {
    return _Tokenizer.apply(this, arguments) || this;
  }

  var _proto = UtilParser.prototype;

  // TODO
  _proto.addExtra = function addExtra(node, key, val) {
    if (!node) return;
    var extra = node.extra = node.extra || {};
    extra[key] = val;
  }; // TODO


  _proto.isRelational = function isRelational(op) {
    return this.match(types.relational) && this.state.value === op;
  }; // TODO


  _proto.expectRelational = function expectRelational(op) {
    if (this.isRelational(op)) {
      this.next();
    } else {
      this.unexpected(null, types.relational);
    }
  }; // eat() for relational operators.


  _proto.eatRelational = function eatRelational(op) {
    if (this.isRelational(op)) {
      this.next();
      return true;
    }

    return false;
  }; // Tests whether parsed token is a contextual keyword.


  _proto.isContextual = function isContextual(name) {
    return this.match(types.name) && this.state.value === name;
  };

  _proto.isLookaheadContextual = function isLookaheadContextual(name) {
    var l = this.lookahead();
    return l.type === types.name && l.value === name;
  }; // Consumes contextual keyword if possible.


  _proto.eatContextual = function eatContextual(name) {
    return this.state.value === name && this.eat(types.name);
  }; // Asserts that following token is given contextual keyword.


  _proto.expectContextual = function expectContextual(name, message) {
    if (!this.eatContextual(name)) this.unexpected(null, message);
  }; // Test whether a semicolon can be inserted at the current position.


  _proto.canInsertSemicolon = function canInsertSemicolon() {
    return this.match(types.eof) || this.match(types.braceR) || this.hasPrecedingLineBreak();
  };

  _proto.hasPrecedingLineBreak = function hasPrecedingLineBreak() {
    return lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start));
  }; // TODO


  _proto.isLineTerminator = function isLineTerminator() {
    return this.eat(types.semi) || this.canInsertSemicolon();
  }; // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.


  _proto.semicolon = function semicolon() {
    if (!this.isLineTerminator()) this.unexpected(null, types.semi);
  }; // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error at given pos.


  _proto.expect = function expect(type, pos) {
    this.eat(type) || this.unexpected(pos, type);
  }; // Raise an unexpected token error. Can take the expected token type
  // instead of a message string.


  _proto.unexpected = function unexpected(pos, messageOrType) {
    if (messageOrType === void 0) {
      messageOrType = "Unexpected token";
    }

    if (typeof messageOrType !== "string") {
      messageOrType = `Unexpected token, expected "${messageOrType.label}"`;
    }

    throw this.raise(pos != null ? pos : this.state.start, messageOrType);
  };

  _proto.expectPlugin = function expectPlugin(name, pos) {
    if (!this.hasPlugin(name)) {
      throw this.raise(pos != null ? pos : this.state.start, `This experimental syntax requires enabling the parser plugin: '${name}'`, [name]);
    }

    return true;
  };

  _proto.expectOnePlugin = function expectOnePlugin(names, pos) {
    var _this = this;

    if (!names.some(function (n) {
      return _this.hasPlugin(n);
    })) {
      throw this.raise(pos != null ? pos : this.state.start, `This experimental syntax requires enabling one of the following parser plugin(s): '${names.join(", ")}'`, names);
    }
  };

  return UtilParser;
}(Tokenizer);

// Start an AST node, attaching a start offset.
var commentKeys = ["leadingComments", "trailingComments", "innerComments"];

var Node =
/*#__PURE__*/
function () {
  function Node(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    this.loc = new SourceLocation(loc);
    if (parser && parser.options.ranges) this.range = [pos, 0];
    if (parser && parser.filename) this.loc.filename = parser.filename;
  }

  var _proto = Node.prototype;

  _proto.__clone = function __clone() {
    var _this = this;

    // $FlowIgnore
    var node2 = new Node();
    Object.keys(this).forEach(function (key) {
      // Do not clone comments that are already attached to the node
      if (commentKeys.indexOf(key) < 0) {
        // $FlowIgnore
        node2[key] = _this[key];
      }
    });
    return node2;
  };

  return Node;
}();

var NodeUtils =
/*#__PURE__*/
function (_UtilParser) {
  _inheritsLoose(NodeUtils, _UtilParser);

  function NodeUtils() {
    return _UtilParser.apply(this, arguments) || this;
  }

  var _proto2 = NodeUtils.prototype;

  _proto2.startNode = function startNode() {
    // $FlowIgnore
    return new Node(this, this.state.start, this.state.startLoc);
  };

  _proto2.startNodeAt = function startNodeAt(pos, loc) {
    // $FlowIgnore
    return new Node(this, pos, loc);
  };
  /** Start a new node with a previous node's location. */


  _proto2.startNodeAtNode = function startNodeAtNode(type) {
    return this.startNodeAt(type.start, type.loc.start);
  }; // Finish an AST node, adding `type` and `end` properties.


  _proto2.finishNode = function finishNode(node, type) {
    return this.finishNodeAt(node, type, this.state.lastTokEnd, this.state.lastTokEndLoc);
  }; // Finish node at given position


  _proto2.finishNodeAt = function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    node.loc.end = loc;
    if (this.options.ranges) node.range[1] = pos;
    this.processComment(node);
    return node;
  };
  /**
   * Reset the start location of node to the start location of locationNode
   */


  _proto2.resetStartLocationFromNode = function resetStartLocationFromNode(node, locationNode) {
    node.start = locationNode.start;
    node.loc.start = locationNode.loc.start;
    if (this.options.ranges) node.range[0] = locationNode.range[0];
  };

  return NodeUtils;
}(UtilParser);

var LValParser =
/*#__PURE__*/
function (_NodeUtils) {
  _inheritsLoose(LValParser, _NodeUtils);

  function LValParser() {
    return _NodeUtils.apply(this, arguments) || this;
  }

  var _proto = LValParser.prototype;

  // Forward-declaration: defined in expression.js
  // Forward-declaration: defined in statement.js
  // Convert existing expression atom to assignable pattern
  // if possible.
  _proto.toAssignable = function toAssignable(node, isBinding, contextDescription) {
    if (node) {
      switch (node.type) {
        case "Identifier":
        case "ObjectPattern":
        case "ArrayPattern":
        case "AssignmentPattern":
          break;

        case "ObjectExpression":
          node.type = "ObjectPattern";

          for (var index = 0; index < node.properties.length; index++) {
            var prop = node.properties[index];
            var isLast = index === node.properties.length - 1;
            this.toAssignableObjectExpressionProp(prop, isBinding, isLast);
          }

          break;

        case "ObjectProperty":
          this.toAssignable(node.value, isBinding, contextDescription);
          break;

        case "SpreadElement":
          {
            this.checkToRestConversion(node);
            node.type = "RestElement";
            var arg = node.argument;
            this.toAssignable(arg, isBinding, contextDescription);
            break;
          }

        case "ArrayExpression":
          node.type = "ArrayPattern";
          this.toAssignableList(node.elements, isBinding, contextDescription);
          break;

        case "AssignmentExpression":
          if (node.operator === "=") {
            node.type = "AssignmentPattern";
            delete node.operator;
          } else {
            this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
          }

          break;

        case "MemberExpression":
          if (!isBinding) break;

        default:
          {
            var message = "Invalid left-hand side" + (contextDescription ? " in " + contextDescription :
            /* istanbul ignore next */
            "expression");
            this.raise(node.start, message);
          }
      }
    }

    return node;
  };

  _proto.toAssignableObjectExpressionProp = function toAssignableObjectExpressionProp(prop, isBinding, isLast) {
    if (prop.type === "ObjectMethod") {
      var error = prop.kind === "get" || prop.kind === "set" ? "Object pattern can't contain getter or setter" : "Object pattern can't contain methods";
      this.raise(prop.key.start, error);
    } else if (prop.type === "SpreadElement" && !isLast) {
      this.raise(prop.start, "The rest element has to be the last element when destructuring");
    } else {
      this.toAssignable(prop, isBinding, "object destructuring pattern");
    }
  }; // Convert list of expression atoms to binding list.


  _proto.toAssignableList = function toAssignableList(exprList, isBinding, contextDescription) {
    var end = exprList.length;

    if (end) {
      var last = exprList[end - 1];

      if (last && last.type === "RestElement") {
        --end;
      } else if (last && last.type === "SpreadElement") {
        last.type = "RestElement";
        var arg = last.argument;
        this.toAssignable(arg, isBinding, contextDescription);

        if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern") {
          this.unexpected(arg.start);
        }

        --end;
      }
    }

    for (var i = 0; i < end; i++) {
      var elt = exprList[i];

      if (elt && elt.type === "SpreadElement") {
        this.raise(elt.start, "The rest element has to be the last element when destructuring");
      }

      if (elt) this.toAssignable(elt, isBinding, contextDescription);
    }

    return exprList;
  }; // Convert list of expression atoms to a list of


  _proto.toReferencedList = function toReferencedList(exprList) {
    return exprList;
  }; // Parses spread element.


  _proto.parseSpread = function parseSpread(refShorthandDefaultPos) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(false, refShorthandDefaultPos);
    return this.finishNode(node, "SpreadElement");
  };

  _proto.parseRest = function parseRest() {
    var node = this.startNode();
    this.next();
    node.argument = this.parseBindingAtom();
    return this.finishNode(node, "RestElement");
  };

  _proto.shouldAllowYieldIdentifier = function shouldAllowYieldIdentifier() {
    return this.match(types._yield) && !this.state.strict && !this.state.inGenerator;
  };

  _proto.parseBindingIdentifier = function parseBindingIdentifier() {
    return this.parseIdentifier(this.shouldAllowYieldIdentifier());
  }; // Parses lvalue (assignable) atom.


  _proto.parseBindingAtom = function parseBindingAtom() {
    switch (this.state.type) {
      case types._yield:
      case types.name:
        return this.parseBindingIdentifier();

      case types.bracketL:
        {
          var node = this.startNode();
          this.next();
          node.elements = this.parseBindingList(types.bracketR, true);
          return this.finishNode(node, "ArrayPattern");
        }

      case types.braceL:
        return this.parseObj(true);

      default:
        throw this.unexpected();
    }
  };

  _proto.parseBindingList = function parseBindingList(close, allowEmpty, allowModifiers) {
    var elts = [];
    var first = true;

    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);
      }

      if (allowEmpty && this.match(types.comma)) {
        // $FlowFixMe This method returns `$ReadOnlyArray<?Pattern>` if `allowEmpty` is set.
        elts.push(null);
      } else if (this.eat(close)) {
        break;
      } else if (this.match(types.ellipsis)) {
        elts.push(this.parseAssignableListItemTypes(this.parseRest()));
        this.expect(close);
        break;
      } else {
        var decorators = [];

        if (this.match(types.at) && this.hasPlugin("decorators2")) {
          this.raise(this.state.start, "Stage 2 decorators cannot be used to decorate parameters");
        }

        while (this.match(types.at)) {
          decorators.push(this.parseDecorator());
        }

        elts.push(this.parseAssignableListItem(allowModifiers, decorators));
      }
    }

    return elts;
  };

  _proto.parseAssignableListItem = function parseAssignableListItem(allowModifiers, decorators) {
    var left = this.parseMaybeDefault();
    this.parseAssignableListItemTypes(left);
    var elt = this.parseMaybeDefault(left.start, left.loc.start, left);

    if (decorators.length) {
      left.decorators = decorators;
    }

    return elt;
  };

  _proto.parseAssignableListItemTypes = function parseAssignableListItemTypes(param) {
    return param;
  }; // Parses assignment pattern around given atom if possible.


  _proto.parseMaybeDefault = function parseMaybeDefault(startPos, startLoc, left) {
    startLoc = startLoc || this.state.startLoc;
    startPos = startPos || this.state.start;
    left = left || this.parseBindingAtom();
    if (!this.eat(types.eq)) return left;
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern");
  }; // Verify that a node is an lval — something that can be assigned
  // to.


  _proto.checkLVal = function checkLVal(expr, isBinding, checkClashes, contextDescription) {
    switch (expr.type) {
      case "Identifier":
        this.checkReservedWord(expr.name, expr.start, false, true);

        if (checkClashes) {
          // we need to prefix this with an underscore for the cases where we have a key of
          // `__proto__`. there's a bug in old V8 where the following wouldn't work:
          //
          //   > var obj = Object.create(null);
          //   undefined
          //   > obj.__proto__
          //   null
          //   > obj.__proto__ = true;
          //   true
          //   > obj.__proto__
          //   null
          var _key = `_${expr.name}`;

          if (checkClashes[_key]) {
            this.raise(expr.start, "Argument name clash in strict mode");
          } else {
            checkClashes[_key] = true;
          }
        }

        break;

      case "MemberExpression":
        if (isBinding) this.raise(expr.start, "Binding member expression");
        break;

      case "ObjectPattern":
        for (var _i2 = 0, _expr$properties2 = expr.properties; _i2 < _expr$properties2.length; _i2++) {
          var prop = _expr$properties2[_i2];
          if (prop.type === "ObjectProperty") prop = prop.value;
          this.checkLVal(prop, isBinding, checkClashes, "object destructuring pattern");
        }

        break;

      case "ArrayPattern":
        for (var _i4 = 0, _expr$elements2 = expr.elements; _i4 < _expr$elements2.length; _i4++) {
          var elem = _expr$elements2[_i4];

          if (elem) {
            this.checkLVal(elem, isBinding, checkClashes, "array destructuring pattern");
          }
        }

        break;

      case "AssignmentPattern":
        this.checkLVal(expr.left, isBinding, checkClashes, "assignment pattern");
        break;

      case "RestElement":
        this.checkLVal(expr.argument, isBinding, checkClashes, "rest element");
        break;

      default:
        {
          var message = (isBinding ?
          /* istanbul ignore next */
          "Binding invalid" : "Invalid") + " left-hand side" + (contextDescription ? " in " + contextDescription :
          /* istanbul ignore next */
          "expression");
          this.raise(expr.start, message);
        }
    }
  };

  _proto.checkToRestConversion = function checkToRestConversion(node) {
    var validArgumentTypes = ["Identifier", "MemberExpression"];

    if (validArgumentTypes.indexOf(node.argument.type) !== -1) {
      return;
    }

    this.raise(node.argument.start, "Invalid rest operator's argument");
  };

  return LValParser;
}(NodeUtils);

/* eslint max-len: 0 */
// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser
var ExpressionParser =
/*#__PURE__*/
function (_LValParser) {
  _inheritsLoose(ExpressionParser, _LValParser);

  function ExpressionParser() {
    return _LValParser.apply(this, arguments) || this;
  }

  var _proto = ExpressionParser.prototype;

  // Forward-declaration: defined in statement.js
  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.
  _proto.checkPropClash = function checkPropClash(prop, propHash) {
    if (prop.computed || prop.kind) return;
    var key = prop.key; // It is either an Identifier or a String/NumericLiteral

    var name = key.type === "Identifier" ? key.name : String(key.value);

    if (name === "__proto__") {
      if (propHash.proto) {
        this.raise(key.start, "Redefinition of __proto__ property");
      }

      propHash.proto = true;
    }
  }; // Convenience method to parse an Expression only


  _proto.getExpression = function getExpression() {
    this.nextToken();
    var expr = this.parseExpression();

    if (!this.match(types.eof)) {
      this.unexpected();
    }

    expr.comments = this.state.comments;
    return expr;
  }; // ### Expression parsing
  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function (s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.
  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initialization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).


  _proto.parseExpression = function parseExpression(noIn, refShorthandDefaultPos) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var expr = this.parseMaybeAssign(noIn, refShorthandDefaultPos);

    if (this.match(types.comma)) {
      var _node = this.startNodeAt(startPos, startLoc);

      _node.expressions = [expr];

      while (this.eat(types.comma)) {
        _node.expressions.push(this.parseMaybeAssign(noIn, refShorthandDefaultPos));
      }

      this.toReferencedList(_node.expressions);
      return this.finishNode(_node, "SequenceExpression");
    }

    return expr;
  }; // Parse an assignment expression. This includes applications of
  // operators like `+=`.


  _proto.parseMaybeAssign = function parseMaybeAssign(noIn, refShorthandDefaultPos, afterLeftParse, refNeedsArrowPos) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;

    if (this.match(types._yield) && this.state.inGenerator) {
      var _left = this.parseYield();

      if (afterLeftParse) {
        _left = afterLeftParse.call(this, _left, startPos, startLoc);
      }

      return _left;
    }

    var failOnShorthandAssign;

    if (refShorthandDefaultPos) {
      failOnShorthandAssign = false;
    } else {
      refShorthandDefaultPos = {
        start: 0
      };
      failOnShorthandAssign = true;
    }

    if (this.match(types.parenL) || this.match(types.name) || this.match(types._yield)) {
      this.state.potentialArrowAt = this.state.start;
    }

    var left = this.parseMaybeConditional(noIn, refShorthandDefaultPos, refNeedsArrowPos);

    if (afterLeftParse) {
      left = afterLeftParse.call(this, left, startPos, startLoc);
    }

    if (this.state.type.isAssign) {
      var _node2 = this.startNodeAt(startPos, startLoc);

      _node2.operator = this.state.value;
      _node2.left = this.match(types.eq) ? this.toAssignable(left, undefined, "assignment expression") : left;
      refShorthandDefaultPos.start = 0; // reset because shorthand default was used correctly

      this.checkLVal(left, undefined, undefined, "assignment expression");

      if (left.extra && left.extra.parenthesized) {
        var errorMsg;

        if (left.type === "ObjectPattern") {
          errorMsg = "`({a}) = 0` use `({a} = 0)`";
        } else if (left.type === "ArrayPattern") {
          errorMsg = "`([a]) = 0` use `([a] = 0)`";
        }

        if (errorMsg) {
          this.raise(left.start, `You're trying to assign to a parenthesized expression, eg. instead of ${errorMsg}`);
        }
      }

      this.next();
      _node2.right = this.parseMaybeAssign(noIn);
      return this.finishNode(_node2, "AssignmentExpression");
    } else if (failOnShorthandAssign && refShorthandDefaultPos.start) {
      this.unexpected(refShorthandDefaultPos.start);
    }

    return left;
  }; // Parse a ternary conditional (`?:`) operator.


  _proto.parseMaybeConditional = function parseMaybeConditional(noIn, refShorthandDefaultPos, refNeedsArrowPos) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var potentialArrowAt = this.state.potentialArrowAt;
    var expr = this.parseExprOps(noIn, refShorthandDefaultPos);

    if (expr.type === "ArrowFunctionExpression" && expr.start === potentialArrowAt) {
      return expr;
    }

    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;
    return this.parseConditional(expr, noIn, startPos, startLoc, refNeedsArrowPos);
  };

  _proto.parseConditional = function parseConditional(expr, noIn, startPos, startLoc, // FIXME: Disabling this for now since can't seem to get it to play nicely
  refNeedsArrowPos) {
    if (this.eat(types.question)) {
      var _node3 = this.startNodeAt(startPos, startLoc);

      _node3.test = expr;
      _node3.consequent = this.parseMaybeAssign();
      this.expect(types.colon);
      _node3.alternate = this.parseMaybeAssign(noIn);
      return this.finishNode(_node3, "ConditionalExpression");
    }

    return expr;
  }; // Start the precedence parser.


  _proto.parseExprOps = function parseExprOps(noIn, refShorthandDefaultPos) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var potentialArrowAt = this.state.potentialArrowAt;
    var expr = this.parseMaybeUnary(refShorthandDefaultPos);

    if (expr.type === "ArrowFunctionExpression" && expr.start === potentialArrowAt) {
      return expr;
    }

    if (refShorthandDefaultPos && refShorthandDefaultPos.start) {
      return expr;
    }

    return this.parseExprOp(expr, startPos, startLoc, -1, noIn);
  }; // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.


  _proto.parseExprOp = function parseExprOp(left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.state.type.binop;

    if (prec != null && (!noIn || !this.match(types._in))) {
      if (prec > minPrec) {
        var _node4 = this.startNodeAt(leftStartPos, leftStartLoc);

        _node4.left = left;
        _node4.operator = this.state.value;

        if (_node4.operator === "**" && left.type === "UnaryExpression" && left.extra && !left.extra.parenthesizedArgument && !left.extra.parenthesized) {
          this.raise(left.argument.start, "Illegal expression. Wrap left hand side or entire exponentiation in parentheses.");
        }

        var op = this.state.type;
        this.next();
        var startPos = this.state.start;
        var startLoc = this.state.startLoc;

        if (_node4.operator === "|>") {
          this.expectPlugin("pipelineOperator"); // Support syntax such as 10 |> x => x + 1

          this.state.potentialArrowAt = startPos;
        }

        if (_node4.operator === "??") {
          this.expectPlugin("nullishCoalescingOperator");
        }

        _node4.right = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, op.rightAssociative ? prec - 1 : prec, noIn);
        this.finishNode(_node4, op === types.logicalOR || op === types.logicalAND || op === types.nullishCoalescing ? "LogicalExpression" : "BinaryExpression");
        return this.parseExprOp(_node4, leftStartPos, leftStartLoc, minPrec, noIn);
      }
    }

    return left;
  }; // Parse unary operators, both prefix and postfix.


  _proto.parseMaybeUnary = function parseMaybeUnary(refShorthandDefaultPos) {
    if (this.state.type.prefix) {
      var _node5 = this.startNode();

      var update = this.match(types.incDec);
      _node5.operator = this.state.value;
      _node5.prefix = true;

      if (_node5.operator === "throw") {
        this.expectPlugin("throwExpressions");
      }

      this.next();
      var argType = this.state.type;
      _node5.argument = this.parseMaybeUnary();
      this.addExtra(_node5, "parenthesizedArgument", argType === types.parenL && (!_node5.argument.extra || !_node5.argument.extra.parenthesized));

      if (refShorthandDefaultPos && refShorthandDefaultPos.start) {
        this.unexpected(refShorthandDefaultPos.start);
      }

      if (update) {
        this.checkLVal(_node5.argument, undefined, undefined, "prefix operation");
      } else if (this.state.strict && _node5.operator === "delete") {
        var arg = _node5.argument;

        if (arg.type === "Identifier") {
          this.raise(_node5.start, "Deleting local variable in strict mode");
        } else if (arg.type === "MemberExpression" && arg.property.type === "PrivateName") {
          this.raise(_node5.start, "Deleting a private field is not allowed");
        }
      }

      return this.finishNode(_node5, update ? "UpdateExpression" : "UnaryExpression");
    }

    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var expr = this.parseExprSubscripts(refShorthandDefaultPos);
    if (refShorthandDefaultPos && refShorthandDefaultPos.start) return expr;

    while (this.state.type.postfix && !this.canInsertSemicolon()) {
      var _node6 = this.startNodeAt(startPos, startLoc);

      _node6.operator = this.state.value;
      _node6.prefix = false;
      _node6.argument = expr;
      this.checkLVal(expr, undefined, undefined, "postfix operation");
      this.next();
      expr = this.finishNode(_node6, "UpdateExpression");
    }

    return expr;
  }; // Parse call, dot, and `[]`-subscript expressions.


  _proto.parseExprSubscripts = function parseExprSubscripts(refShorthandDefaultPos) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var potentialArrowAt = this.state.potentialArrowAt;
    var expr = this.parseExprAtom(refShorthandDefaultPos);

    if (expr.type === "ArrowFunctionExpression" && expr.start === potentialArrowAt) {
      return expr;
    }

    if (refShorthandDefaultPos && refShorthandDefaultPos.start) {
      return expr;
    }

    return this.parseSubscripts(expr, startPos, startLoc);
  };

  _proto.parseSubscripts = function parseSubscripts(base, startPos, startLoc, noCalls) {
    var state = {
      stop: false
    };

    do {
      base = this.parseSubscript(base, startPos, startLoc, noCalls, state);
    } while (!state.stop);

    return base;
  };
  /** @param state Set 'state.stop = true' to indicate that we should stop parsing subscripts. */


  _proto.parseSubscript = function parseSubscript(base, startPos, startLoc, noCalls, state) {
    if (!noCalls && this.eat(types.doubleColon)) {
      var _node7 = this.startNodeAt(startPos, startLoc);

      _node7.object = base;
      _node7.callee = this.parseNoCallExpr();
      state.stop = true;
      return this.parseSubscripts(this.finishNode(_node7, "BindExpression"), startPos, startLoc, noCalls);
    } else if (this.match(types.questionDot)) {
      this.expectPlugin("optionalChaining");

      if (noCalls && this.lookahead().type == types.parenL) {
        state.stop = true;
        return base;
      }

      this.next();

      var _node8 = this.startNodeAt(startPos, startLoc);

      if (this.eat(types.bracketL)) {
        _node8.object = base;
        _node8.property = this.parseExpression();
        _node8.computed = true;
        _node8.optional = true;
        this.expect(types.bracketR);
        return this.finishNode(_node8, "MemberExpression");
      } else if (this.eat(types.parenL)) {
        var possibleAsync = this.atPossibleAsync(base);
        _node8.callee = base;
        _node8.arguments = this.parseCallExpressionArguments(types.parenR, possibleAsync);
        _node8.optional = true;
        return this.finishNode(_node8, "CallExpression");
      } else {
        _node8.object = base;
        _node8.property = this.parseIdentifier(true);
        _node8.computed = false;
        _node8.optional = true;
        return this.finishNode(_node8, "MemberExpression");
      }
    } else if (this.eat(types.dot)) {
      var _node9 = this.startNodeAt(startPos, startLoc);

      _node9.object = base;
      _node9.property = this.parseMaybePrivateName();
      _node9.computed = false;
      return this.finishNode(_node9, "MemberExpression");
    } else if (this.eat(types.bracketL)) {
      var _node10 = this.startNodeAt(startPos, startLoc);

      _node10.object = base;
      _node10.property = this.parseExpression();
      _node10.computed = true;
      this.expect(types.bracketR);
      return this.finishNode(_node10, "MemberExpression");
    } else if (!noCalls && this.match(types.parenL)) {
      var _possibleAsync = this.atPossibleAsync(base);

      this.next();

      var _node11 = this.startNodeAt(startPos, startLoc);

      _node11.callee = base; // TODO: Clean up/merge this into `this.state` or a class like acorn's
      // `DestructuringErrors` alongside refShorthandDefaultPos and
      // refNeedsArrowPos.

      var refTrailingCommaPos = {
        start: -1
      };
      _node11.arguments = this.parseCallExpressionArguments(types.parenR, _possibleAsync, refTrailingCommaPos);
      this.finishCallExpression(_node11);

      if (_possibleAsync && this.shouldParseAsyncArrow()) {
        state.stop = true;

        if (refTrailingCommaPos.start > -1) {
          this.raise(refTrailingCommaPos.start, "A trailing comma is not permitted after the rest element");
        }

        return this.parseAsyncArrowFromCallExpression(this.startNodeAt(startPos, startLoc), _node11);
      } else {
        this.toReferencedList(_node11.arguments);
      }

      return _node11;
    } else if (this.match(types.backQuote)) {
      var _node12 = this.startNodeAt(startPos, startLoc);

      _node12.tag = base;
      _node12.quasi = this.parseTemplate(true);
      return this.finishNode(_node12, "TaggedTemplateExpression");
    } else {
      state.stop = true;
      return base;
    }
  };

  _proto.atPossibleAsync = function atPossibleAsync(base) {
    return this.state.potentialArrowAt === base.start && base.type === "Identifier" && base.name === "async" && !this.canInsertSemicolon();
  };

  _proto.finishCallExpression = function finishCallExpression(node) {
    if (node.callee.type === "Import") {
      if (node.arguments.length !== 1) {
        this.raise(node.start, "import() requires exactly one argument");
      }

      var importArg = node.arguments[0];

      if (importArg && importArg.type === "SpreadElement") {
        this.raise(importArg.start, "... is not allowed in import()");
      }
    }

    return this.finishNode(node, "CallExpression");
  };

  _proto.parseCallExpressionArguments = function parseCallExpressionArguments(close, possibleAsyncArrow, refTrailingCommaPos) {
    var elts = [];
    var innerParenStart;
    var first = true;

    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);
        if (this.eat(close)) break;
      } // we need to make sure that if this is an async arrow functions, that we don't allow inner parens inside the params


      if (this.match(types.parenL) && !innerParenStart) {
        innerParenStart = this.state.start;
      }

      elts.push(this.parseExprListItem(false, possibleAsyncArrow ? {
        start: 0
      } : undefined, possibleAsyncArrow ? {
        start: 0
      } : undefined, possibleAsyncArrow ? refTrailingCommaPos : undefined));
    } // we found an async arrow function so let's not allow any inner parens


    if (possibleAsyncArrow && innerParenStart && this.shouldParseAsyncArrow()) {
      this.unexpected();
    }

    return elts;
  };

  _proto.shouldParseAsyncArrow = function shouldParseAsyncArrow() {
    return this.match(types.arrow);
  };

  _proto.parseAsyncArrowFromCallExpression = function parseAsyncArrowFromCallExpression(node, call) {
    var oldYield = this.state.yieldInPossibleArrowParameters;
    this.state.yieldInPossibleArrowParameters = null;
    this.expect(types.arrow);
    this.parseArrowExpression(node, call.arguments, true);
    this.state.yieldInPossibleArrowParameters = oldYield;
    return node;
  }; // Parse a no-call expression (like argument of `new` or `::` operators).


  _proto.parseNoCallExpr = function parseNoCallExpr() {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    return this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  }; // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.


  _proto.parseExprAtom = function parseExprAtom(refShorthandDefaultPos) {
    var canBeArrow = this.state.potentialArrowAt === this.state.start;
    var node;

    switch (this.state.type) {
      case types._super:
        if (!this.state.inMethod && !this.state.inClassProperty && !this.options.allowSuperOutsideMethod) {
          this.raise(this.state.start, "super is only allowed in object methods and classes");
        }

        node = this.startNode();
        this.next();

        if (!this.match(types.parenL) && !this.match(types.bracketL) && !this.match(types.dot)) {
          this.unexpected();
        }

        if (this.match(types.parenL) && this.state.inMethod !== "constructor" && !this.options.allowSuperOutsideMethod) {
          this.raise(node.start, "super() is only valid inside a class constructor. Make sure the method name is spelled exactly as 'constructor'.");
        }

        return this.finishNode(node, "Super");

      case types._import:
        if (this.lookahead().type === types.dot) {
          return this.parseImportMetaProperty();
        }

        this.expectPlugin("dynamicImport");
        node = this.startNode();
        this.next();

        if (!this.match(types.parenL)) {
          this.unexpected(null, types.parenL);
        }

        return this.finishNode(node, "Import");

      case types._this:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "ThisExpression");

      case types._yield:
        if (this.state.inGenerator) this.unexpected();

      case types.name:
        {
          node = this.startNode();
          var allowAwait = this.state.value === "await" && this.state.inAsync;
          var allowYield = this.shouldAllowYieldIdentifier();
          var id = this.parseIdentifier(allowAwait || allowYield);

          if (id.name === "await") {
            if (this.state.inAsync || this.inModule) {
              return this.parseAwait(node);
            }
          } else if (id.name === "async" && this.match(types._function) && !this.canInsertSemicolon()) {
            this.next();
            return this.parseFunction(node, false, false, true);
          } else if (canBeArrow && id.name === "async" && this.match(types.name)) {
            var oldYield = this.state.yieldInPossibleArrowParameters;
            this.state.yieldInPossibleArrowParameters = null;
            var params = [this.parseIdentifier()];
            this.expect(types.arrow); // let foo = bar => {};

            this.parseArrowExpression(node, params, true);
            this.state.yieldInPossibleArrowParameters = oldYield;
            return node;
          }

          if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
            var _oldYield = this.state.yieldInPossibleArrowParameters;
            this.state.yieldInPossibleArrowParameters = null;
            this.parseArrowExpression(node, [id]);
            this.state.yieldInPossibleArrowParameters = _oldYield;
            return node;
          }

          return id;
        }

      case types._do:
        {
          this.expectPlugin("doExpressions");

          var _node13 = this.startNode();

          this.next();
          var oldInFunction = this.state.inFunction;
          var oldLabels = this.state.labels;
          this.state.labels = [];
          this.state.inFunction = false;
          _node13.body = this.parseBlock(false);
          this.state.inFunction = oldInFunction;
          this.state.labels = oldLabels;
          return this.finishNode(_node13, "DoExpression");
        }

      case types.regexp:
        {
          var value = this.state.value;
          node = this.parseLiteral(value.value, "RegExpLiteral");
          node.pattern = value.pattern;
          node.flags = value.flags;
          return node;
        }

      case types.num:
        return this.parseLiteral(this.state.value, "NumericLiteral");

      case types.bigint:
        return this.parseLiteral(this.state.value, "BigIntLiteral");

      case types.string:
        return this.parseLiteral(this.state.value, "StringLiteral");

      case types._null:
        node = this.startNode();
        this.next();
        return this.finishNode(node, "NullLiteral");

      case types._true:
      case types._false:
        return this.parseBooleanLiteral();

      case types.parenL:
        return this.parseParenAndDistinguishExpression(canBeArrow);

      case types.bracketL:
        node = this.startNode();
        this.next();
        node.elements = this.parseExprList(types.bracketR, true, refShorthandDefaultPos);
        this.toReferencedList(node.elements);
        return this.finishNode(node, "ArrayExpression");

      case types.braceL:
        return this.parseObj(false, refShorthandDefaultPos);

      case types._function:
        return this.parseFunctionExpression();

      case types.at:
        this.parseDecorators();

      case types._class:
        node = this.startNode();
        this.takeDecorators(node);
        return this.parseClass(node, false);

      case types._new:
        return this.parseNew();

      case types.backQuote:
        return this.parseTemplate(false);

      case types.doubleColon:
        {
          node = this.startNode();
          this.next();
          node.object = null;
          var callee = node.callee = this.parseNoCallExpr();

          if (callee.type === "MemberExpression") {
            return this.finishNode(node, "BindExpression");
          } else {
            throw this.raise(callee.start, "Binding should be performed on object property.");
          }
        }

      default:
        throw this.unexpected();
    }
  };

  _proto.parseBooleanLiteral = function parseBooleanLiteral() {
    var node = this.startNode();
    node.value = this.match(types._true);
    this.next();
    return this.finishNode(node, "BooleanLiteral");
  };

  _proto.parseMaybePrivateName = function parseMaybePrivateName() {
    var isPrivate = this.match(types.hash);

    if (isPrivate) {
      this.expectOnePlugin(["classPrivateProperties", "classPrivateMethods"]);

      var _node14 = this.startNode();

      this.next();
      _node14.id = this.parseIdentifier(true);
      return this.finishNode(_node14, "PrivateName");
    } else {
      return this.parseIdentifier(true);
    }
  };

  _proto.parseFunctionExpression = function parseFunctionExpression() {
    var node = this.startNode();
    var meta = this.parseIdentifier(true);

    if (this.state.inGenerator && this.eat(types.dot)) {
      return this.parseMetaProperty(node, meta, "sent");
    }

    return this.parseFunction(node, false);
  };

  _proto.parseMetaProperty = function parseMetaProperty(node, meta, propertyName) {
    node.meta = meta;

    if (meta.name === "function" && propertyName === "sent") {
      if (this.isContextual(propertyName)) {
        this.expectPlugin("functionSent");
      } else if (!this.hasPlugin("functionSent")) {
        // They didn't actually say `function.sent`, just `function.`, so a simple error would be less confusing.
        this.unexpected();
      }
    }

    node.property = this.parseIdentifier(true);

    if (node.property.name !== propertyName) {
      this.raise(node.property.start, `The only valid meta property for ${meta.name} is ${meta.name}.${propertyName}`);
    }

    return this.finishNode(node, "MetaProperty");
  };

  _proto.parseImportMetaProperty = function parseImportMetaProperty() {
    var node = this.startNode();
    var id = this.parseIdentifier(true);
    this.expect(types.dot);

    if (id.name === "import") {
      if (this.isContextual("meta")) {
        this.expectPlugin("importMeta");
      } else if (!this.hasPlugin("importMeta")) {
        this.raise(id.start, `Dynamic imports require a parameter: import('a.js').then`);
      }
    }

    if (!this.inModule) {
      this.raise(id.start, `import.meta may appear only with 'sourceType: "module"'`);
    }

    return this.parseMetaProperty(node, id, "meta");
  };

  _proto.parseLiteral = function parseLiteral(value, type, startPos, startLoc) {
    startPos = startPos || this.state.start;
    startLoc = startLoc || this.state.startLoc;
    var node = this.startNodeAt(startPos, startLoc);
    this.addExtra(node, "rawValue", value);
    this.addExtra(node, "raw", this.input.slice(startPos, this.state.end));
    node.value = value;
    this.next();
    return this.finishNode(node, type);
  };

  _proto.parseParenExpression = function parseParenExpression() {
    this.expect(types.parenL);
    var val = this.parseExpression();
    this.expect(types.parenR);
    return val;
  };

  _proto.parseParenAndDistinguishExpression = function parseParenAndDistinguishExpression(canBeArrow) {
    var startPos = this.state.start;
    var startLoc = this.state.startLoc;
    var val;
    this.expect(types.parenL);
    var oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    var oldYield = this.state.yieldInPossibleArrowParameters;
    this.state.maybeInArrowParameters = true;
    this.state.yieldInPossibleArrowParameters = null;
    var innerStartPos = this.state.start;
    var innerStartLoc = this.state.startLoc;
    var exprList = [];
    var refShorthandDefaultPos = {
      start: 0
    };
    var refNeedsArrowPos = {
      start: 0
    };
    var first = true;
    var spreadStart;
    var optionalCommaStart;

    while (!this.match(types.parenR)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma, refNeedsArrowPos.start || null);

        if (this.match(types.parenR)) {
          optionalCommaStart = this.state.start;
          break;
        }
      }

      if (this.match(types.ellipsis)) {
        var spreadNodeStartPos = this.state.start;
        var spreadNodeStartLoc = this.state.startLoc;
        spreadStart = this.state.start;
        exprList.push(this.parseParenItem(this.parseRest(), spreadNodeStartPos, spreadNodeStartLoc));

        if (this.match(types.comma) && this.lookahead().type === types.parenR) {
          this.raise(this.state.start, "A trailing comma is not permitted after the rest element");
        }

        break;
      } else {
        exprList.push(this.parseMaybeAssign(false, refShorthandDefaultPos, this.parseParenItem, refNeedsArrowPos));
      }
    }

    var innerEndPos = this.state.start;
    var innerEndLoc = this.state.startLoc;
    this.expect(types.parenR);
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    var arrowNode = this.startNodeAt(startPos, startLoc);

    if (canBeArrow && this.shouldParseArrow() && (arrowNode = this.parseArrow(arrowNode))) {
      for (var _i2 = 0; _i2 < exprList.length; _i2++) {
        var param = exprList[_i2];

        if (param.extra && param.extra.parenthesized) {
          this.unexpected(param.extra.parenStart);
        }
      }

      this.parseArrowExpression(arrowNode, exprList);
      this.state.yieldInPossibleArrowParameters = oldYield;
      return arrowNode;
    }

    this.state.yieldInPossibleArrowParameters = oldYield;

    if (!exprList.length) {
      this.unexpected(this.state.lastTokStart);
    }

    if (optionalCommaStart) this.unexpected(optionalCommaStart);
    if (spreadStart) this.unexpected(spreadStart);

    if (refShorthandDefaultPos.start) {
      this.unexpected(refShorthandDefaultPos.start);
    }

    if (refNeedsArrowPos.start) this.unexpected(refNeedsArrowPos.start);

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.toReferencedList(val.expressions);
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }

    this.addExtra(val, "parenthesized", true);
    this.addExtra(val, "parenStart", startPos);
    return val;
  };

  _proto.shouldParseArrow = function shouldParseArrow() {
    return !this.canInsertSemicolon();
  };

  _proto.parseArrow = function parseArrow(node) {
    if (this.eat(types.arrow)) {
      return node;
    }
  };

  _proto.parseParenItem = function parseParenItem(node, startPos, // eslint-disable-next-line no-unused-vars
  startLoc) {
    return node;
  }; // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.


  _proto.parseNew = function parseNew() {
    var node = this.startNode();
    var meta = this.parseIdentifier(true);

    if (this.eat(types.dot)) {
      var metaProp = this.parseMetaProperty(node, meta, "target");

      if (!this.state.inFunction && !this.state.inClassProperty) {
        var error = "new.target can only be used in functions";

        if (this.hasPlugin("classProperties")) {
          error += " or class properties";
        }

        this.raise(metaProp.start, error);
      }

      return metaProp;
    }

    node.callee = this.parseNoCallExpr();
    if (this.eat(types.questionDot)) node.optional = true;
    this.parseNewArguments(node);
    return this.finishNode(node, "NewExpression");
  };

  _proto.parseNewArguments = function parseNewArguments(node) {
    if (this.eat(types.parenL)) {
      var args = this.parseExprList(types.parenR);
      this.toReferencedList(args); // $FlowFixMe (parseExprList should be all non-null in this case)

      node.arguments = args;
    } else {
      node.arguments = [];
    }
  }; // Parse template expression.


  _proto.parseTemplateElement = function parseTemplateElement(isTagged) {
    var elem = this.startNode();

    if (this.state.value === null) {
      if (!isTagged) {
        // TODO: fix this
        this.raise(this.state.invalidTemplateEscapePosition || 0, "Invalid escape sequence in template");
      } else {
        this.state.invalidTemplateEscapePosition = null;
      }
    }

    elem.value = {
      raw: this.input.slice(this.state.start, this.state.end).replace(/\r\n?/g, "\n"),
      cooked: this.state.value
    };
    this.next();
    elem.tail = this.match(types.backQuote);
    return this.finishNode(elem, "TemplateElement");
  };

  _proto.parseTemplate = function parseTemplate(isTagged) {
    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement(isTagged);
    node.quasis = [curElt];

    while (!curElt.tail) {
      this.expect(types.dollarBraceL);
      node.expressions.push(this.parseExpression());
      this.expect(types.braceR);
      node.quasis.push(curElt = this.parseTemplateElement(isTagged));
    }

    this.next();
    return this.finishNode(node, "TemplateLiteral");
  }; // Parse an object literal or binding pattern.


  _proto.parseObj = function parseObj(isPattern, refShorthandDefaultPos) {
    var decorators = [];
    var propHash = Object.create(null);
    var first = true;
    var node = this.startNode();
    node.properties = [];
    this.next();
    var firstRestLocation = null;

    while (!this.eat(types.braceR)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);
        if (this.eat(types.braceR)) break;
      }

      if (this.match(types.at)) {
        if (this.hasPlugin("decorators2")) {
          this.raise(this.state.start, "Stage 2 decorators disallow object literal property decorators");
        } else {
          // we needn't check if decorators (stage 0) plugin is enabled since it's checked by
          // the call to this.parseDecorator
          while (this.match(types.at)) {
            decorators.push(this.parseDecorator());
          }
        }
      }

      var prop = this.startNode(),
          isGenerator = false,
          _isAsync = false,
          startPos = void 0,
          startLoc = void 0;

      if (decorators.length) {
        prop.decorators = decorators;
        decorators = [];
      }

      if (this.match(types.ellipsis)) {
        this.expectPlugin("objectRestSpread");
        prop = this.parseSpread(isPattern ? {
          start: 0
        } : undefined);

        if (isPattern) {
          this.toAssignable(prop, true, "object pattern");
        }

        node.properties.push(prop);

        if (isPattern) {
          var position = this.state.start;

          if (firstRestLocation !== null) {
            this.unexpected(firstRestLocation, "Cannot have multiple rest elements when destructuring");
          } else if (this.eat(types.braceR)) {
            break;
          } else if (this.match(types.comma) && this.lookahead().type === types.braceR) {
            this.unexpected(position, "A trailing comma is not permitted after the rest element");
          } else {
            firstRestLocation = position;
            continue;
          }
        } else {
          continue;
        }
      }

      prop.method = false;

      if (isPattern || refShorthandDefaultPos) {
        startPos = this.state.start;
        startLoc = this.state.startLoc;
      }

      if (!isPattern) {
        isGenerator = this.eat(types.star);
      }

      if (!isPattern && this.isContextual("async")) {
        if (isGenerator) this.unexpected();
        var asyncId = this.parseIdentifier();

        if (this.match(types.colon) || this.match(types.parenL) || this.match(types.braceR) || this.match(types.eq) || this.match(types.comma)) {
          prop.key = asyncId;
          prop.computed = false;
        } else {
          _isAsync = true;

          if (this.match(types.star)) {
            this.expectPlugin("asyncGenerators");
            this.next();
            isGenerator = true;
          }

          this.parsePropertyName(prop);
        }
      } else {
        this.parsePropertyName(prop);
      }

      this.parseObjPropValue(prop, startPos, startLoc, isGenerator, _isAsync, isPattern, refShorthandDefaultPos);
      this.checkPropClash(prop, propHash);

      if (prop.shorthand) {
        this.addExtra(prop, "shorthand", true);
      }

      node.properties.push(prop);
    }

    if (firstRestLocation !== null) {
      this.unexpected(firstRestLocation, "The rest element has to be the last element when destructuring");
    }

    if (decorators.length) {
      this.raise(this.state.start, "You have trailing decorators with no property");
    }

    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
  };

  _proto.isGetterOrSetterMethod = function isGetterOrSetterMethod(prop, isPattern) {
    return !isPattern && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.match(types.string) || // get "string"() {}
    this.match(types.num) || // get 1() {}
    this.match(types.bracketL) || // get ["string"]() {}
    this.match(types.name) || // get foo() {}
    !!this.state.type.keyword) // get debugger() {}
    ;
  }; // get methods aren't allowed to have any parameters
  // set methods must have exactly 1 parameter


  _proto.checkGetterSetterParamCount = function checkGetterSetterParamCount(method) {
    var paramCount = method.kind === "get" ? 0 : 1;

    if (method.params.length !== paramCount) {
      var start = method.start;

      if (method.kind === "get") {
        this.raise(start, "getter should have no params");
      } else {
        this.raise(start, "setter should have exactly one param");
      }
    }
  };

  _proto.parseObjectMethod = function parseObjectMethod(prop, isGenerator, isAsync, isPattern) {
    if (isAsync || isGenerator || this.match(types.parenL)) {
      if (isPattern) this.unexpected();
      prop.kind = "method";
      prop.method = true;
      return this.parseMethod(prop, isGenerator, isAsync,
      /* isConstructor */
      false, "ObjectMethod");
    }

    if (this.isGetterOrSetterMethod(prop, isPattern)) {
      if (isGenerator || isAsync) this.unexpected();
      prop.kind = prop.key.name;
      this.parsePropertyName(prop);
      this.parseMethod(prop,
      /* isGenerator */
      false,
      /* isAsync */
      false,
      /* isConstructor */
      false, "ObjectMethod");
      this.checkGetterSetterParamCount(prop);
      return prop;
    }
  };

  _proto.parseObjectProperty = function parseObjectProperty(prop, startPos, startLoc, isPattern, refShorthandDefaultPos) {
    prop.shorthand = false;

    if (this.eat(types.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.state.start, this.state.startLoc) : this.parseMaybeAssign(false, refShorthandDefaultPos);
      return this.finishNode(prop, "ObjectProperty");
    }

    if (!prop.computed && prop.key.type === "Identifier") {
      this.checkReservedWord(prop.key.name, prop.key.start, true, true);

      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
      } else if (this.match(types.eq) && refShorthandDefaultPos) {
        if (!refShorthandDefaultPos.start) {
          refShorthandDefaultPos.start = this.state.start;
        }

        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key.__clone());
      } else {
        prop.value = prop.key.__clone();
      }

      prop.shorthand = true;
      return this.finishNode(prop, "ObjectProperty");
    }
  };

  _proto.parseObjPropValue = function parseObjPropValue(prop, startPos, startLoc, isGenerator, isAsync, isPattern, refShorthandDefaultPos) {
    var node = this.parseObjectMethod(prop, isGenerator, isAsync, isPattern) || this.parseObjectProperty(prop, startPos, startLoc, isPattern, refShorthandDefaultPos);
    if (!node) this.unexpected(); // $FlowFixMe

    return node;
  };

  _proto.parsePropertyName = function parsePropertyName(prop) {
    if (this.eat(types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(types.bracketR);
    } else {
      var oldInPropertyName = this.state.inPropertyName;
      this.state.inPropertyName = true; // We check if it's valid for it to be a private name when we push it.

      prop.key = this.match(types.num) || this.match(types.string) ? this.parseExprAtom() : this.parseMaybePrivateName();

      if (prop.key.type !== "PrivateName") {
        // ClassPrivateProperty is never computed, so we don't assign in that case.
        prop.computed = false;
      }

      this.state.inPropertyName = oldInPropertyName;
    }

    return prop.key;
  }; // Initialize empty function node.


  _proto.initFunction = function initFunction(node, isAsync) {
    node.id = null;
    node.generator = false;
    node.async = !!isAsync;
  }; // Parse object or class method.


  _proto.parseMethod = function parseMethod(node, isGenerator, isAsync, isConstructor, type) {
    var oldInFunc = this.state.inFunction;
    var oldInMethod = this.state.inMethod;
    var oldInGenerator = this.state.inGenerator;
    this.state.inFunction = true;
    this.state.inMethod = node.kind || true;
    this.state.inGenerator = isGenerator;
    this.initFunction(node, isAsync);
    node.generator = !!isGenerator;
    var allowModifiers = isConstructor; // For TypeScript parameter properties

    this.parseFunctionParams(node, allowModifiers);
    this.parseFunctionBodyAndFinish(node, type);
    this.state.inFunction = oldInFunc;
    this.state.inMethod = oldInMethod;
    this.state.inGenerator = oldInGenerator;
    return node;
  }; // Parse arrow function expression.
  // If the parameters are provided, they will be converted to an
  // assignable list.


  _proto.parseArrowExpression = function parseArrowExpression(node, params, isAsync) {
    // if we got there, it's no more "yield in possible arrow parameters";
    // it's just "yield in arrow parameters"
    if (this.state.yieldInPossibleArrowParameters) {
      this.raise(this.state.yieldInPossibleArrowParameters.start, "yield is not allowed in the parameters of an arrow function" + " inside a generator");
    }

    var oldInFunc = this.state.inFunction;
    this.state.inFunction = true;
    this.initFunction(node, isAsync);
    if (params) this.setArrowFunctionParameters(node, params);
    var oldInGenerator = this.state.inGenerator;
    var oldMaybeInArrowParameters = this.state.maybeInArrowParameters;
    this.state.inGenerator = false;
    this.state.maybeInArrowParameters = false;
    this.parseFunctionBody(node, true);
    this.state.inGenerator = oldInGenerator;
    this.state.inFunction = oldInFunc;
    this.state.maybeInArrowParameters = oldMaybeInArrowParameters;
    return this.finishNode(node, "ArrowFunctionExpression");
  };

  _proto.setArrowFunctionParameters = function setArrowFunctionParameters(node, params) {
    node.params = this.toAssignableList(params, true, "arrow function parameters");
  };

  _proto.isStrictBody = function isStrictBody(node) {
    var isBlockStatement = node.body.type === "BlockStatement";

    if (isBlockStatement && node.body.directives.length) {
      for (var _i4 = 0, _node$body$directives2 = node.body.directives; _i4 < _node$body$directives2.length; _i4++) {
        var directive = _node$body$directives2[_i4];

        if (directive.value.value === "use strict") {
          return true;
        }
      }
    }

    return false;
  };

  _proto.parseFunctionBodyAndFinish = function parseFunctionBodyAndFinish(node, type, allowExpressionBody) {
    // $FlowIgnore (node is not bodiless if we get here)
    this.parseFunctionBody(node, allowExpressionBody);
    this.finishNode(node, type);
  }; // Parse function body and check parameters.


  _proto.parseFunctionBody = function parseFunctionBody(node, allowExpression) {
    var isExpression = allowExpression && !this.match(types.braceL);
    var oldInParameters = this.state.inParameters;
    var oldInAsync = this.state.inAsync;
    this.state.inParameters = false;
    this.state.inAsync = node.async;

    if (isExpression) {
      node.body = this.parseMaybeAssign();
    } else {
      // Start a new scope with regard to labels and the `inGenerator`
      // flag (restore them to their old value afterwards).
      var oldInGen = this.state.inGenerator;
      var oldInFunc = this.state.inFunction;
      var oldLabels = this.state.labels;
      this.state.inGenerator = node.generator;
      this.state.inFunction = true;
      this.state.labels = [];
      node.body = this.parseBlock(true);
      this.state.inFunction = oldInFunc;
      this.state.inGenerator = oldInGen;
      this.state.labels = oldLabels;
    }

    this.state.inAsync = oldInAsync;
    this.checkFunctionNameAndParams(node, allowExpression);
    this.state.inParameters = oldInParameters;
  };

  _proto.checkFunctionNameAndParams = function checkFunctionNameAndParams(node, isArrowFunction) {
    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    var isStrict = this.isStrictBody(node); // Also check for arrow functions

    var checkLVal = this.state.strict || isStrict || isArrowFunction;
    var oldStrict = this.state.strict;
    if (isStrict) this.state.strict = isStrict;

    if (node.id) {
      this.checkReservedWord(node.id, node.start, true, true);
    }

    if (checkLVal) {
      var nameHash = Object.create(null);

      if (node.id) {
        this.checkLVal(node.id, true, undefined, "function name");
      }

      for (var _i6 = 0, _node$params2 = node.params; _i6 < _node$params2.length; _i6++) {
        var param = _node$params2[_i6];

        if (isStrict && param.type !== "Identifier") {
          this.raise(param.start, "Non-simple parameter in strict mode");
        }

        this.checkLVal(param, true, nameHash, "function parameter list");
      }
    }

    this.state.strict = oldStrict;
  }; // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).


  _proto.parseExprList = function parseExprList(close, allowEmpty, refShorthandDefaultPos) {
    var elts = [];
    var first = true;

    while (!this.eat(close)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);
        if (this.eat(close)) break;
      }

      elts.push(this.parseExprListItem(allowEmpty, refShorthandDefaultPos));
    }

    return elts;
  };

  _proto.parseExprListItem = function parseExprListItem(allowEmpty, refShorthandDefaultPos, refNeedsArrowPos, refTrailingCommaPos) {
    var elt;

    if (allowEmpty && this.match(types.comma)) {
      elt = null;
    } else if (this.match(types.ellipsis)) {
      elt = this.parseSpread(refShorthandDefaultPos);

      if (refTrailingCommaPos && this.match(types.comma)) {
        refTrailingCommaPos.start = this.state.start;
      }
    } else {
      elt = this.parseMaybeAssign(false, refShorthandDefaultPos, this.parseParenItem, refNeedsArrowPos);
    }

    return elt;
  }; // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.


  _proto.parseIdentifier = function parseIdentifier(liberal) {
    var node = this.startNode();
    var name = this.parseIdentifierName(node.start, liberal);
    node.name = name;
    node.loc.identifierName = name;
    return this.finishNode(node, "Identifier");
  };

  _proto.parseIdentifierName = function parseIdentifierName(pos, liberal) {
    if (!liberal) {
      this.checkReservedWord(this.state.value, this.state.start, !!this.state.type.keyword, false);
    }

    var name;

    if (this.match(types.name)) {
      name = this.state.value;
    } else if (this.state.type.keyword) {
      name = this.state.type.keyword;
    } else {
      throw this.unexpected();
    }

    if (!liberal && name === "await" && this.state.inAsync) {
      this.raise(pos, "invalid use of await inside of an async function");
    }

    this.next();
    return name;
  };

  _proto.checkReservedWord = function checkReservedWord(word, startLoc, checkKeywords, isBinding) {
    if (this.state.strict && (reservedWords.strict(word) || isBinding && reservedWords.strictBind(word))) {
      this.raise(startLoc, word + " is a reserved word in strict mode");
    }

    if (this.state.inGenerator && word === "yield") {
      this.raise(startLoc, "yield is a reserved word inside generator functions");
    }

    if (this.isReservedWord(word) || checkKeywords && this.isKeyword(word)) {
      this.raise(startLoc, word + " is a reserved word");
    }
  }; // Parses await expression inside async function.


  _proto.parseAwait = function parseAwait(node) {
    // istanbul ignore next: this condition is checked at the call site so won't be hit here
    if (!this.state.inAsync) {
      this.unexpected();
    }

    if (this.match(types.star)) {
      this.raise(node.start, "await* has been removed from the async functions proposal. Use Promise.all() instead.");
    }

    node.argument = this.parseMaybeUnary();
    return this.finishNode(node, "AwaitExpression");
  }; // Parses yield expression inside generator.


  _proto.parseYield = function parseYield() {
    var node = this.startNode();

    if (this.state.inParameters) {
      this.raise(node.start, "yield is not allowed in generator parameters");
    }

    if (this.state.maybeInArrowParameters && // We only set yieldInPossibleArrowParameters if we haven't already
    // found a possible invalid YieldExpression.
    !this.state.yieldInPossibleArrowParameters) {
      this.state.yieldInPossibleArrowParameters = node;
    }

    this.next();

    if (this.match(types.semi) || this.canInsertSemicolon() || !this.match(types.star) && !this.state.type.startsExpr) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(types.star);
      node.argument = this.parseMaybeAssign();
    }

    return this.finishNode(node, "YieldExpression");
  };

  return ExpressionParser;
}(LValParser);

/* eslint max-len: 0 */
var empty = [];
var loopLabel = {
  kind: "loop"
};
var switchLabel = {
  kind: "switch"
};

var StatementParser =
/*#__PURE__*/
function (_ExpressionParser) {
  _inheritsLoose(StatementParser, _ExpressionParser);

  function StatementParser() {
    return _ExpressionParser.apply(this, arguments) || this;
  }

  var _proto = StatementParser.prototype;

  // ### Statement parsing
  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.
  _proto.parseTopLevel = function parseTopLevel(file, program) {
    program.sourceType = this.options.sourceType;
    this.parseBlockBody(program, true, true, types.eof);
    file.program = this.finishNode(program, "Program");
    file.comments = this.state.comments;
    if (this.options.tokens) file.tokens = this.state.tokens;
    return this.finishNode(file, "File");
  }; // TODO


  _proto.stmtToDirective = function stmtToDirective(stmt) {
    var expr = stmt.expression;
    var directiveLiteral = this.startNodeAt(expr.start, expr.loc.start);
    var directive = this.startNodeAt(stmt.start, stmt.loc.start);
    var raw = this.input.slice(expr.start, expr.end);
    var val = directiveLiteral.value = raw.slice(1, -1); // remove quotes

    this.addExtra(directiveLiteral, "raw", raw);
    this.addExtra(directiveLiteral, "rawValue", val);
    directive.value = this.finishNodeAt(directiveLiteral, "DirectiveLiteral", expr.end, expr.loc.end);
    return this.finishNodeAt(directive, "Directive", stmt.end, stmt.loc.end);
  }; // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.


  _proto.parseStatement = function parseStatement(declaration, topLevel) {
    if (this.match(types.at)) {
      this.parseDecorators(true);
    }

    return this.parseStatementContent(declaration, topLevel);
  };

  _proto.parseStatementContent = function parseStatementContent(declaration, topLevel) {
    var starttype = this.state.type;
    var node = this.startNode(); // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
      case types._break:
      case types._continue:
        // $FlowFixMe
        return this.parseBreakContinueStatement(node, starttype.keyword);

      case types._debugger:
        return this.parseDebuggerStatement(node);

      case types._do:
        return this.parseDoStatement(node);

      case types._for:
        return this.parseForStatement(node);

      case types._function:
        if (this.lookahead().type === types.dot) break;
        if (!declaration) this.unexpected();
        return this.parseFunctionStatement(node);

      case types._class:
        if (!declaration) this.unexpected();
        return this.parseClass(node, true);

      case types._if:
        return this.parseIfStatement(node);

      case types._return:
        return this.parseReturnStatement(node);

      case types._switch:
        return this.parseSwitchStatement(node);

      case types._throw:
        return this.parseThrowStatement(node);

      case types._try:
        return this.parseTryStatement(node);

      case types._let:
      case types._const:
        if (!declaration) this.unexpected();
      // NOTE: falls through to _var

      case types._var:
        return this.parseVarStatement(node, starttype);

      case types._while:
        return this.parseWhileStatement(node);

      case types._with:
        return this.parseWithStatement(node);

      case types.braceL:
        return this.parseBlock();

      case types.semi:
        return this.parseEmptyStatement(node);

      case types._export:
      case types._import:
        {
          if (this.hasPlugin("dynamicImport") && this.lookahead().type === types.parenL || this.hasPlugin("importMeta") && this.lookahead().type === types.dot) {
            break;
          }

          if (!this.options.allowImportExportEverywhere && !topLevel) {
            this.raise(this.state.start, "'import' and 'export' may only appear at the top level");
          }

          this.next();
          var result;

          if (starttype == types._import) {
            result = this.parseImport(node);
          } else {
            result = this.parseExport(node);
          }

          this.assertModuleNodeAllowed(node);
          return result;
        }

      case types.name:
        if (this.state.value === "async") {
          // peek ahead and see if next token is a function
          var state = this.state.clone();
          this.next();

          if (this.match(types._function) && !this.canInsertSemicolon()) {
            this.expect(types._function);
            return this.parseFunction(node, true, false, true);
          } else {
            this.state = state;
          }
        }

    } // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.


    var maybeName = this.state.value;
    var expr = this.parseExpression();

    if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon)) {
      return this.parseLabeledStatement(node, maybeName, expr);
    } else {
      return this.parseExpressionStatement(node, expr);
    }
  };

  _proto.assertModuleNodeAllowed = function assertModuleNodeAllowed(node) {
    if (!this.options.allowImportExportEverywhere && !this.inModule) {
      this.raise(node.start, `'import' and 'export' may appear only with 'sourceType: "module"'`);
    }
  };

  _proto.takeDecorators = function takeDecorators(node) {
    var decorators = this.state.decoratorStack[this.state.decoratorStack.length - 1];

    if (decorators.length) {
      node.decorators = decorators;
      this.resetStartLocationFromNode(node, decorators[0]);
      this.state.decoratorStack[this.state.decoratorStack.length - 1] = [];
    }
  };

  _proto.parseDecorators = function parseDecorators(allowExport) {
    if (this.hasPlugin("decorators2")) {
      allowExport = false;
    }

    var currentContextDecorators = this.state.decoratorStack[this.state.decoratorStack.length - 1];

    while (this.match(types.at)) {
      var decorator = this.parseDecorator();
      currentContextDecorators.push(decorator);
    }

    if (this.match(types._export)) {
      if (allowExport) {
        return;
      } else {
        this.raise(this.state.start, "Using the export keyword between a decorator and a class is not allowed. Please use `export @dec class` instead");
      }
    }

    if (!this.match(types._class)) {
      this.raise(this.state.start, "Leading decorators must be attached to a class declaration");
    }
  };

  _proto.parseDecorator = function parseDecorator() {
    this.expectOnePlugin(["decorators", "decorators2"]);
    var node = this.startNode();
    this.next();

    if (this.hasPlugin("decorators2")) {
      var startPos = this.state.start;
      var startLoc = this.state.startLoc;
      var expr = this.parseIdentifier(false);

      while (this.eat(types.dot)) {
        var _node = this.startNodeAt(startPos, startLoc);

        _node.object = expr;
        _node.property = this.parseIdentifier(true);
        _node.computed = false;
        expr = this.finishNode(_node, "MemberExpression");
      }

      if (this.eat(types.parenL)) {
        var _node2 = this.startNodeAt(startPos, startLoc);

        _node2.callee = expr; // Every time a decorator class expression is evaluated, a new empty array is pushed onto the stack
        // So that the decorators of any nested class expressions will be dealt with separately

        this.state.decoratorStack.push([]);
        _node2.arguments = this.parseCallExpressionArguments(types.parenR, false);
        this.state.decoratorStack.pop();
        expr = this.finishNode(_node2, "CallExpression");
        this.toReferencedList(expr.arguments);
      }

      node.expression = expr;
    } else {
      node.expression = this.parseMaybeAssign();
    }

    return this.finishNode(node, "Decorator");
  };

  _proto.parseBreakContinueStatement = function parseBreakContinueStatement(node, keyword) {
    var isBreak = keyword === "break";
    this.next();

    if (this.isLineTerminator()) {
      node.label = null;
    } else if (!this.match(types.name)) {
      this.unexpected();
    } else {
      node.label = this.parseIdentifier();
      this.semicolon();
    } // Verify that there is an actual destination to break or
    // continue to.


    var i;

    for (i = 0; i < this.state.labels.length; ++i) {
      var lab = this.state.labels[i];

      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
        if (node.label && isBreak) break;
      }
    }

    if (i === this.state.labels.length) {
      this.raise(node.start, "Unsyntactic " + keyword);
    }

    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
  };

  _proto.parseDebuggerStatement = function parseDebuggerStatement(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement");
  };

  _proto.parseDoStatement = function parseDoStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    node.body = this.parseStatement(false);
    this.state.labels.pop();
    this.expect(types._while);
    node.test = this.parseParenExpression();
    this.eat(types.semi);
    return this.finishNode(node, "DoWhileStatement");
  }; // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.


  _proto.parseForStatement = function parseForStatement(node) {
    this.next();
    this.state.labels.push(loopLabel);
    var forAwait = false;

    if (this.state.inAsync && this.isContextual("await")) {
      this.expectPlugin("asyncGenerators");
      forAwait = true;
      this.next();
    }

    this.expect(types.parenL);

    if (this.match(types.semi)) {
      if (forAwait) {
        this.unexpected();
      }

      return this.parseFor(node, null);
    }

    if (this.match(types._var) || this.match(types._let) || this.match(types._const)) {
      var _init = this.startNode();

      var varKind = this.state.type;
      this.next();
      this.parseVar(_init, true, varKind);
      this.finishNode(_init, "VariableDeclaration");

      if (this.match(types._in) || this.isContextual("of")) {
        if (_init.declarations.length === 1 && !_init.declarations[0].init) {
          return this.parseForIn(node, _init, forAwait);
        }
      }

      if (forAwait) {
        this.unexpected();
      }

      return this.parseFor(node, _init);
    }

    var refShorthandDefaultPos = {
      start: 0
    };
    var init = this.parseExpression(true, refShorthandDefaultPos);

    if (this.match(types._in) || this.isContextual("of")) {
      var description = this.isContextual("of") ? "for-of statement" : "for-in statement";
      this.toAssignable(init, undefined, description);
      this.checkLVal(init, undefined, undefined, description);
      return this.parseForIn(node, init, forAwait);
    } else if (refShorthandDefaultPos.start) {
      this.unexpected(refShorthandDefaultPos.start);
    }

    if (forAwait) {
      this.unexpected();
    }

    return this.parseFor(node, init);
  };

  _proto.parseFunctionStatement = function parseFunctionStatement(node) {
    this.next();
    return this.parseFunction(node, true);
  };

  _proto.parseIfStatement = function parseIfStatement(node) {
    this.next();
    node.test = this.parseParenExpression();
    node.consequent = this.parseStatement(false);
    node.alternate = this.eat(types._else) ? this.parseStatement(false) : null;
    return this.finishNode(node, "IfStatement");
  };

  _proto.parseReturnStatement = function parseReturnStatement(node) {
    if (!this.state.inFunction && !this.options.allowReturnOutsideFunction) {
      this.raise(this.state.start, "'return' outside of function");
    }

    this.next(); // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.isLineTerminator()) {
      node.argument = null;
    } else {
      node.argument = this.parseExpression();
      this.semicolon();
    }

    return this.finishNode(node, "ReturnStatement");
  };

  _proto.parseSwitchStatement = function parseSwitchStatement(node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    var cases = node.cases = [];
    this.expect(types.braceL);
    this.state.labels.push(switchLabel); // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    var cur;

    for (var sawDefault; !this.match(types.braceR);) {
      if (this.match(types._case) || this.match(types._default)) {
        var isCase = this.match(types._case);
        if (cur) this.finishNode(cur, "SwitchCase");
        cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();

        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) {
            this.raise(this.state.lastTokStart, "Multiple default clauses");
          }

          sawDefault = true;
          cur.test = null;
        }

        this.expect(types.colon);
      } else {
        if (cur) {
          cur.consequent.push(this.parseStatement(true));
        } else {
          this.unexpected();
        }
      }
    }

    if (cur) this.finishNode(cur, "SwitchCase");
    this.next(); // Closing brace

    this.state.labels.pop();
    return this.finishNode(node, "SwitchStatement");
  };

  _proto.parseThrowStatement = function parseThrowStatement(node) {
    this.next();

    if (lineBreak.test(this.input.slice(this.state.lastTokEnd, this.state.start))) {
      this.raise(this.state.lastTokEnd, "Illegal newline after throw");
    }

    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement");
  };

  _proto.parseTryStatement = function parseTryStatement(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;

    if (this.match(types._catch)) {
      var clause = this.startNode();
      this.next();

      if (this.match(types.parenL)) {
        this.expect(types.parenL);
        clause.param = this.parseBindingAtom();
        var clashes = Object.create(null);
        this.checkLVal(clause.param, true, clashes, "catch clause");
        this.expect(types.parenR);
      } else {
        this.expectPlugin("optionalCatchBinding");
        clause.param = null;
      }

      clause.body = this.parseBlock();
      node.handler = this.finishNode(clause, "CatchClause");
    }

    node.guardedHandlers = empty;
    node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;

    if (!node.handler && !node.finalizer) {
      this.raise(node.start, "Missing catch or finally clause");
    }

    return this.finishNode(node, "TryStatement");
  };

  _proto.parseVarStatement = function parseVarStatement(node, kind) {
    this.next();
    this.parseVar(node, false, kind);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration");
  };

  _proto.parseWhileStatement = function parseWhileStatement(node) {
    this.next();
    node.test = this.parseParenExpression();
    this.state.labels.push(loopLabel);
    node.body = this.parseStatement(false);
    this.state.labels.pop();
    return this.finishNode(node, "WhileStatement");
  };

  _proto.parseWithStatement = function parseWithStatement(node) {
    if (this.state.strict) {
      this.raise(this.state.start, "'with' in strict mode");
    }

    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement(false);
    return this.finishNode(node, "WithStatement");
  };

  _proto.parseEmptyStatement = function parseEmptyStatement(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement");
  };

  _proto.parseLabeledStatement = function parseLabeledStatement(node, maybeName, expr) {
    for (var _i2 = 0, _state$labels2 = this.state.labels; _i2 < _state$labels2.length; _i2++) {
      var label = _state$labels2[_i2];

      if (label.name === maybeName) {
        this.raise(expr.start, `Label '${maybeName}' is already declared`);
      }
    }

    var kind = this.state.type.isLoop ? "loop" : this.match(types._switch) ? "switch" : null;

    for (var i = this.state.labels.length - 1; i >= 0; i--) {
      var _label = this.state.labels[i];

      if (_label.statementStart === node.start) {
        _label.statementStart = this.state.start;
        _label.kind = kind;
      } else {
        break;
      }
    }

    this.state.labels.push({
      name: maybeName,
      kind: kind,
      statementStart: this.state.start
    });
    node.body = this.parseStatement(true);

    if (node.body.type == "ClassDeclaration" || node.body.type == "VariableDeclaration" && node.body.kind !== "var" || node.body.type == "FunctionDeclaration" && (this.state.strict || node.body.generator || node.body.async)) {
      this.raise(node.body.start, "Invalid labeled declaration");
    }

    this.state.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement");
  };

  _proto.parseExpressionStatement = function parseExpressionStatement(node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement");
  }; // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).


  _proto.parseBlock = function parseBlock(allowDirectives) {
    var node = this.startNode();
    this.expect(types.braceL);
    this.parseBlockBody(node, allowDirectives, false, types.braceR);
    return this.finishNode(node, "BlockStatement");
  };

  _proto.isValidDirective = function isValidDirective(stmt) {
    return stmt.type === "ExpressionStatement" && stmt.expression.type === "StringLiteral" && !stmt.expression.extra.parenthesized;
  };

  _proto.parseBlockBody = function parseBlockBody(node, allowDirectives, topLevel, end) {
    var body = node.body = [];
    var directives = node.directives = [];
    this.parseBlockOrModuleBlockBody(body, allowDirectives ? directives : undefined, topLevel, end);
  }; // Undefined directives means that directives are not allowed.


  _proto.parseBlockOrModuleBlockBody = function parseBlockOrModuleBlockBody(body, directives, topLevel, end) {
    var parsedNonDirective = false;
    var oldStrict;
    var octalPosition;

    while (!this.eat(end)) {
      if (!parsedNonDirective && this.state.containsOctal && !octalPosition) {
        octalPosition = this.state.octalPosition;
      }

      var stmt = this.parseStatement(true, topLevel);

      if (directives && !parsedNonDirective && this.isValidDirective(stmt)) {
        var directive = this.stmtToDirective(stmt);
        directives.push(directive);

        if (oldStrict === undefined && directive.value.value === "use strict") {
          oldStrict = this.state.strict;
          this.setStrict(true);

          if (octalPosition) {
            this.raise(octalPosition, "Octal literal in strict mode");
          }
        }

        continue;
      }

      parsedNonDirective = true;
      body.push(stmt);
    }

    if (oldStrict === false) {
      this.setStrict(false);
    }
  }; // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.


  _proto.parseFor = function parseFor(node, init) {
    node.init = init;
    this.expect(types.semi);
    node.test = this.match(types.semi) ? null : this.parseExpression();
    this.expect(types.semi);
    node.update = this.match(types.parenR) ? null : this.parseExpression();
    this.expect(types.parenR);
    node.body = this.parseStatement(false);
    this.state.labels.pop();
    return this.finishNode(node, "ForStatement");
  }; // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.


  _proto.parseForIn = function parseForIn(node, init, forAwait) {
    var type = this.match(types._in) ? "ForInStatement" : "ForOfStatement";

    if (forAwait) {
      this.eatContextual("of");
    } else {
      this.next();
    }

    if (type === "ForOfStatement") {
      node.await = !!forAwait;
    }

    node.left = init;
    node.right = this.parseExpression();
    this.expect(types.parenR);
    node.body = this.parseStatement(false);
    this.state.labels.pop();
    return this.finishNode(node, type);
  }; // Parse a list of variable declarations.


  _proto.parseVar = function parseVar(node, isFor, kind) {
    var declarations = node.declarations = []; // $FlowFixMe

    node.kind = kind.keyword;

    for (;;) {
      var decl = this.startNode();
      this.parseVarHead(decl);

      if (this.eat(types.eq)) {
        decl.init = this.parseMaybeAssign(isFor);
      } else {
        if (kind === types._const && !(this.match(types._in) || this.isContextual("of"))) {
          // `const` with no initializer is allowed in TypeScript. It could be a declaration `const x: number;`.
          if (!this.hasPlugin("typescript")) {
            this.unexpected();
          }
        } else if (decl.id.type !== "Identifier" && !(isFor && (this.match(types._in) || this.isContextual("of")))) {
          this.raise(this.state.lastTokEnd, "Complex binding patterns require an initialization value");
        }

        decl.init = null;
      }

      declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(types.comma)) break;
    }

    return node;
  };

  _proto.parseVarHead = function parseVarHead(decl) {
    decl.id = this.parseBindingAtom();
    this.checkLVal(decl.id, true, undefined, "variable declaration");
  }; // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).


  _proto.parseFunction = function parseFunction(node, isStatement, allowExpressionBody, isAsync, optionalId) {
    var oldInFunc = this.state.inFunction;
    var oldInMethod = this.state.inMethod;
    var oldInGenerator = this.state.inGenerator;
    this.state.inFunction = true;
    this.state.inMethod = false;
    this.initFunction(node, isAsync);

    if (this.match(types.star)) {
      if (node.async) {
        this.expectPlugin("asyncGenerators");
      }

      node.generator = true;
      this.next();
    }

    if (isStatement && !optionalId && !this.match(types.name) && !this.match(types._yield)) {
      this.unexpected();
    } // When parsing function expression, the binding identifier is parsed
    // according to the rules inside the function.
    // e.g. (function* yield() {}) is invalid because "yield" is disallowed in
    // generators.
    // This isn't the case with function declarations: function* yield() {} is
    // valid because yield is parsed as if it was outside the generator.
    // Therefore, this.state.inGenerator is set before or after parsing the
    // function id according to the "isStatement" parameter.


    if (!isStatement) this.state.inGenerator = node.generator;

    if (this.match(types.name) || this.match(types._yield)) {
      node.id = this.parseBindingIdentifier();
    }

    if (isStatement) this.state.inGenerator = node.generator;
    this.parseFunctionParams(node);
    this.parseFunctionBodyAndFinish(node, isStatement ? "FunctionDeclaration" : "FunctionExpression", allowExpressionBody);
    this.state.inFunction = oldInFunc;
    this.state.inMethod = oldInMethod;
    this.state.inGenerator = oldInGenerator;
    return node;
  };

  _proto.parseFunctionParams = function parseFunctionParams(node, allowModifiers) {
    var oldInParameters = this.state.inParameters;
    this.state.inParameters = true;
    this.expect(types.parenL);
    node.params = this.parseBindingList(types.parenR,
    /* allowEmpty */
    false, allowModifiers);
    this.state.inParameters = oldInParameters;
  }; // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).


  _proto.parseClass = function parseClass(node, isStatement, optionalId) {
    this.next();
    this.takeDecorators(node);
    this.parseClassId(node, isStatement, optionalId);
    this.parseClassSuper(node);
    this.parseClassBody(node);
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
  };

  _proto.isClassProperty = function isClassProperty() {
    return this.match(types.eq) || this.match(types.semi) || this.match(types.braceR);
  };

  _proto.isClassMethod = function isClassMethod() {
    return this.match(types.parenL);
  };

  _proto.isNonstaticConstructor = function isNonstaticConstructor(method) {
    return !method.computed && !method.static && (method.key.name === "constructor" || // Identifier
    method.key.value === "constructor") // String literal
    ;
  };

  _proto.parseClassBody = function parseClassBody(node) {
    // class bodies are implicitly strict
    var oldStrict = this.state.strict;
    this.state.strict = true;
    this.state.classLevel++;
    var state = {
      hadConstructor: false
    };
    var decorators = [];
    var classBody = this.startNode();
    classBody.body = [];
    this.expect(types.braceL);

    while (!this.eat(types.braceR)) {
      if (this.eat(types.semi)) {
        if (decorators.length > 0) {
          this.raise(this.state.lastTokEnd, "Decorators must not be followed by a semicolon");
        }

        continue;
      }

      if (this.match(types.at)) {
        decorators.push(this.parseDecorator());
        continue;
      }

      var member = this.startNode(); // steal the decorators if there are any

      if (decorators.length) {
        member.decorators = decorators;
        this.resetStartLocationFromNode(member, decorators[0]);
        decorators = [];
      }

      this.parseClassMember(classBody, member, state);

      if (this.hasPlugin("decorators2") && ["method", "get", "set"].indexOf(member.kind) === -1 && member.decorators && member.decorators.length > 0) {
        this.raise(member.start, "Stage 2 decorators may only be used with a class or a class method");
      }
    }

    if (decorators.length) {
      this.raise(this.state.start, "You have trailing decorators with no method");
    }

    node.body = this.finishNode(classBody, "ClassBody");
    this.state.classLevel--;
    this.state.strict = oldStrict;
  };

  _proto.parseClassMember = function parseClassMember(classBody, member, state) {
    var isStatic = false;

    if (this.match(types.name) && this.state.value === "static") {
      var key = this.parseIdentifier(true); // eats 'static'

      if (this.isClassMethod()) {
        var method = member; // a method named 'static'

        method.kind = "method";
        method.computed = false;
        method.key = key;
        method.static = false;
        this.pushClassMethod(classBody, method, false, false,
        /* isConstructor */
        false);
        return;
      } else if (this.isClassProperty()) {
        var prop = member; // a property named 'static'

        prop.computed = false;
        prop.key = key;
        prop.static = false;
        classBody.body.push(this.parseClassProperty(prop));
        return;
      } // otherwise something static


      isStatic = true;
    }

    this.parseClassMemberWithIsStatic(classBody, member, state, isStatic);
  };

  _proto.parseClassMemberWithIsStatic = function parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
    var publicMethod = member;
    var privateMethod = member;
    var publicProp = member;
    var privateProp = member;
    var method = publicMethod;
    var publicMember = publicMethod;
    member.static = isStatic;

    if (this.eat(types.star)) {
      // a generator
      method.kind = "method";
      this.parseClassPropertyName(method);

      if (method.key.type === "PrivateName") {
        // Private generator method
        this.pushClassPrivateMethod(classBody, privateMethod, true, false);
        return;
      }

      if (this.isNonstaticConstructor(publicMethod)) {
        this.raise(publicMethod.key.start, "Constructor can't be a generator");
      }

      this.pushClassMethod(classBody, publicMethod, true, false,
      /* isConstructor */
      false);
      return;
    }

    var key = this.parseClassPropertyName(member);
    var isPrivate = key.type === "PrivateName"; // Check the key is not a computed expression or string literal.

    var isSimple = key.type === "Identifier";
    this.parsePostMemberNameModifiers(publicMember);

    if (this.isClassMethod()) {
      method.kind = "method";

      if (isPrivate) {
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
        return;
      } // a normal method


      var isConstructor = this.isNonstaticConstructor(publicMethod);

      if (isConstructor) {
        publicMethod.kind = "constructor";

        if (publicMethod.decorators) {
          this.raise(publicMethod.start, "You can't attach decorators to a class constructor");
        } // TypeScript allows multiple overloaded constructor declarations.


        if (state.hadConstructor && !this.hasPlugin("typescript")) {
          this.raise(key.start, "Duplicate constructor in the same class");
        }

        state.hadConstructor = true;
      }

      this.pushClassMethod(classBody, publicMethod, false, false, isConstructor);
    } else if (this.isClassProperty()) {
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else if (isSimple && key.name === "async" && !this.isLineTerminator()) {
      // an async method
      var isGenerator = this.match(types.star);

      if (isGenerator) {
        this.expectPlugin("asyncGenerators");
        this.next();
      }

      method.kind = "method"; // The so-called parsed name would have been "async": get the real name.

      this.parseClassPropertyName(method);

      if (method.key.type === "PrivateName") {
        // private async method
        this.pushClassPrivateMethod(classBody, privateMethod, isGenerator, true);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(publicMethod.key.start, "Constructor can't be an async function");
        }

        this.pushClassMethod(classBody, publicMethod, isGenerator, true,
        /* isConstructor */
        false);
      }
    } else if (isSimple && (key.name === "get" || key.name === "set") && !(this.isLineTerminator() && this.match(types.star))) {
      // `get\n*` is an uninitialized property named 'get' followed by a generator.
      // a getter or setter
      method.kind = key.name; // The so-called parsed name would have been "get/set": get the real name.

      this.parseClassPropertyName(publicMethod);

      if (method.key.type === "PrivateName") {
        // private getter/setter
        this.pushClassPrivateMethod(classBody, privateMethod, false, false);
      } else {
        if (this.isNonstaticConstructor(publicMethod)) {
          this.raise(publicMethod.key.start, "Constructor can't have get/set modifier");
        }

        this.pushClassMethod(classBody, publicMethod, false, false,
        /* isConstructor */
        false);
      }

      this.checkGetterSetterParamCount(publicMethod);
    } else if (this.isLineTerminator()) {
      // an uninitialized class property (due to ASI, since we don't otherwise recognize the next token)
      if (isPrivate) {
        this.pushClassPrivateProperty(classBody, privateProp);
      } else {
        this.pushClassProperty(classBody, publicProp);
      }
    } else {
      this.unexpected();
    }
  };

  _proto.parseClassPropertyName = function parseClassPropertyName(member) {
    var key = this.parsePropertyName(member);

    if (!member.computed && member.static && (key.name === "prototype" || key.value === "prototype")) {
      this.raise(key.start, "Classes may not have static property named prototype");
    }

    if (key.type === "PrivateName" && key.id.name === "constructor") {
      this.raise(key.start, "Classes may not have a private field named '#constructor'");
    }

    return key;
  };

  _proto.pushClassProperty = function pushClassProperty(classBody, prop) {
    // This only affects properties, not methods.
    if (this.isNonstaticConstructor(prop)) {
      this.raise(prop.key.start, "Classes may not have a non-static field named 'constructor'");
    }

    classBody.body.push(this.parseClassProperty(prop));
  };

  _proto.pushClassPrivateProperty = function pushClassPrivateProperty(classBody, prop) {
    this.expectPlugin("classPrivateProperties", prop.key.start);
    classBody.body.push(this.parseClassPrivateProperty(prop));
  };

  _proto.pushClassMethod = function pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor) {
    classBody.body.push(this.parseMethod(method, isGenerator, isAsync, isConstructor, "ClassMethod"));
  };

  _proto.pushClassPrivateMethod = function pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
    this.expectPlugin("classPrivateMethods", method.key.start);
    classBody.body.push(this.parseMethod(method, isGenerator, isAsync,
    /* isConstructor */
    false, "ClassPrivateMethod"));
  }; // Overridden in typescript.js


  _proto.parsePostMemberNameModifiers = function parsePostMemberNameModifiers( // eslint-disable-next-line no-unused-vars
  methodOrProp) {}; // Overridden in typescript.js


  _proto.parseAccessModifier = function parseAccessModifier() {
    return undefined;
  };

  _proto.parseClassPrivateProperty = function parseClassPrivateProperty(node) {
    this.state.inClassProperty = true;
    node.value = this.eat(types.eq) ? this.parseMaybeAssign() : null;
    this.semicolon();
    this.state.inClassProperty = false;
    return this.finishNode(node, "ClassPrivateProperty");
  };

  _proto.parseClassProperty = function parseClassProperty(node) {
    if (!node.typeAnnotation) {
      this.expectPlugin("classProperties");
    }

    this.state.inClassProperty = true;

    if (this.match(types.eq)) {
      this.expectPlugin("classProperties");
      this.next();
      node.value = this.parseMaybeAssign();
    } else {
      node.value = null;
    }

    this.semicolon();
    this.state.inClassProperty = false;
    return this.finishNode(node, "ClassProperty");
  };

  _proto.parseClassId = function parseClassId(node, isStatement, optionalId) {
    if (this.match(types.name)) {
      node.id = this.parseIdentifier();
    } else {
      if (optionalId || !isStatement) {
        node.id = null;
      } else {
        this.unexpected(null, "A class name is required");
      }
    }
  };

  _proto.parseClassSuper = function parseClassSuper(node) {
    node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
  }; // Parses module export declaration.
  // TODO: better type. Node is an N.AnyExport.


  _proto.parseExport = function parseExport(node) {
    // export * from '...'
    if (this.shouldParseExportStar()) {
      this.parseExportStar(node);
      if (node.type === "ExportAllDeclaration") return node;
    } else if (this.isExportDefaultSpecifier()) {
      this.expectPlugin("exportDefaultFrom");
      var specifier = this.startNode();
      specifier.exported = this.parseIdentifier(true);
      var specifiers = [this.finishNode(specifier, "ExportDefaultSpecifier")];
      node.specifiers = specifiers;

      if (this.match(types.comma) && this.lookahead().type === types.star) {
        this.expect(types.comma);

        var _specifier = this.startNode();

        this.expect(types.star);
        this.expectContextual("as");
        _specifier.exported = this.parseIdentifier();
        specifiers.push(this.finishNode(_specifier, "ExportNamespaceSpecifier"));
      } else {
        this.parseExportSpecifiersMaybe(node);
      }

      this.parseExportFrom(node, true);
    } else if (this.eat(types._default)) {
      // export default ...
      var expr = this.startNode();
      var needsSemi = false;

      if (this.eat(types._function)) {
        expr = this.parseFunction(expr, true, false, false, true);
      } else if (this.isContextual("async") && this.lookahead().type === types._function) {
        // async function declaration
        this.eatContextual("async");
        this.eat(types._function);
        expr = this.parseFunction(expr, true, false, true, true);
      } else if (this.match(types._class)) {
        expr = this.parseClass(expr, true, true);
      } else {
        needsSemi = true;
        expr = this.parseMaybeAssign();
      }

      node.declaration = expr;
      if (needsSemi) this.semicolon();
      this.checkExport(node, true, true);
      return this.finishNode(node, "ExportDefaultDeclaration");
    } else if (this.shouldParseExportDeclaration()) {
      if (this.isContextual("async")) {
        var next = this.lookahead(); // export async;

        if (next.type !== types._function) {
          this.unexpected(next.start, `Unexpected token, expected "function"`);
        }
      }

      node.specifiers = [];
      node.source = null;
      node.declaration = this.parseExportDeclaration(node);
    } else {
      // export { x, y as z } [from '...']
      node.declaration = null;
      node.specifiers = this.parseExportSpecifiers();
      this.parseExportFrom(node);
    }

    this.checkExport(node, true);
    return this.finishNode(node, "ExportNamedDeclaration");
  }; // eslint-disable-next-line no-unused-vars


  _proto.parseExportDeclaration = function parseExportDeclaration(node) {
    return this.parseStatement(true);
  };

  _proto.isExportDefaultSpecifier = function isExportDefaultSpecifier() {
    if (this.match(types.name)) {
      return this.state.value !== "async";
    }

    if (!this.match(types._default)) {
      return false;
    }

    var lookahead = this.lookahead();
    return lookahead.type === types.comma || lookahead.type === types.name && lookahead.value === "from";
  };

  _proto.parseExportSpecifiersMaybe = function parseExportSpecifiersMaybe(node) {
    if (this.eat(types.comma)) {
      node.specifiers = node.specifiers.concat(this.parseExportSpecifiers());
    }
  };

  _proto.parseExportFrom = function parseExportFrom(node, expect) {
    if (this.eatContextual("from")) {
      node.source = this.match(types.string) ? this.parseExprAtom() : this.unexpected();
      this.checkExport(node);
    } else {
      if (expect) {
        this.unexpected();
      } else {
        node.source = null;
      }
    }

    this.semicolon();
  };

  _proto.shouldParseExportStar = function shouldParseExportStar() {
    return this.match(types.star);
  };

  _proto.parseExportStar = function parseExportStar(node) {
    this.expect(types.star);

    if (this.isContextual("as")) {
      this.parseExportNamespace(node);
    } else {
      this.parseExportFrom(node, true);
      this.finishNode(node, "ExportAllDeclaration");
    }
  };

  _proto.parseExportNamespace = function parseExportNamespace(node) {
    this.expectPlugin("exportNamespaceFrom");
    var specifier = this.startNodeAt(this.state.lastTokStart, this.state.lastTokStartLoc);
    this.next();
    specifier.exported = this.parseIdentifier(true);
    node.specifiers = [this.finishNode(specifier, "ExportNamespaceSpecifier")];
    this.parseExportSpecifiersMaybe(node);
    this.parseExportFrom(node, true);
  };

  _proto.shouldParseExportDeclaration = function shouldParseExportDeclaration() {
    return this.state.type.keyword === "var" || this.state.type.keyword === "const" || this.state.type.keyword === "let" || this.state.type.keyword === "function" || this.state.type.keyword === "class" || this.isContextual("async") || this.match(types.at) && this.expectPlugin("decorators2");
  };

  _proto.checkExport = function checkExport(node, checkNames, isDefault) {
    if (checkNames) {
      // Check for duplicate exports
      if (isDefault) {
        // Default exports
        this.checkDuplicateExports(node, "default");
      } else if (node.specifiers && node.specifiers.length) {
        // Named exports
        for (var _i4 = 0, _node$specifiers2 = node.specifiers; _i4 < _node$specifiers2.length; _i4++) {
          var specifier = _node$specifiers2[_i4];
          this.checkDuplicateExports(specifier, specifier.exported.name);
        }
      } else if (node.declaration) {
        // Exported declarations
        if (node.declaration.type === "FunctionDeclaration" || node.declaration.type === "ClassDeclaration") {
          this.checkDuplicateExports(node, node.declaration.id.name);
        } else if (node.declaration.type === "VariableDeclaration") {
          for (var _i6 = 0, _node$declaration$dec2 = node.declaration.declarations; _i6 < _node$declaration$dec2.length; _i6++) {
            var declaration = _node$declaration$dec2[_i6];
            this.checkDeclaration(declaration.id);
          }
        }
      }
    }

    var currentContextDecorators = this.state.decoratorStack[this.state.decoratorStack.length - 1];

    if (currentContextDecorators.length) {
      var isClass = node.declaration && (node.declaration.type === "ClassDeclaration" || node.declaration.type === "ClassExpression");

      if (!node.declaration || !isClass) {
        throw this.raise(node.start, "You can only use decorators on an export when exporting a class");
      }

      this.takeDecorators(node.declaration);
    }
  };

  _proto.checkDeclaration = function checkDeclaration(node) {
    if (node.type === "ObjectPattern") {
      for (var _i8 = 0, _node$properties2 = node.properties; _i8 < _node$properties2.length; _i8++) {
        var prop = _node$properties2[_i8];
        this.checkDeclaration(prop);
      }
    } else if (node.type === "ArrayPattern") {
      for (var _i10 = 0, _node$elements2 = node.elements; _i10 < _node$elements2.length; _i10++) {
        var elem = _node$elements2[_i10];

        if (elem) {
          this.checkDeclaration(elem);
        }
      }
    } else if (node.type === "ObjectProperty") {
      this.checkDeclaration(node.value);
    } else if (node.type === "RestElement") {
      this.checkDeclaration(node.argument);
    } else if (node.type === "Identifier") {
      this.checkDuplicateExports(node, node.name);
    }
  };

  _proto.checkDuplicateExports = function checkDuplicateExports(node, name) {
    if (this.state.exportedIdentifiers.indexOf(name) > -1) {
      this.raiseDuplicateExportError(node, name);
    }

    this.state.exportedIdentifiers.push(name);
  };

  _proto.raiseDuplicateExportError = function raiseDuplicateExportError(node, name) {
    throw this.raise(node.start, name === "default" ? "Only one default export allowed per module." : `\`${name}\` has already been exported. Exported identifiers must be unique.`);
  }; // Parses a comma-separated list of module exports.


  _proto.parseExportSpecifiers = function parseExportSpecifiers() {
    var nodes = [];
    var first = true;
    var needsFrom; // export { x, y as z } [from '...']

    this.expect(types.braceL);

    while (!this.eat(types.braceR)) {
      if (first) {
        first = false;
      } else {
        this.expect(types.comma);
        if (this.eat(types.braceR)) break;
      }

      var isDefault = this.match(types._default);
      if (isDefault && !needsFrom) needsFrom = true;
      var node = this.startNode();
      node.local = this.parseIdentifier(isDefault);
      node.exported = this.eatContextual("as") ? this.parseIdentifier(true) : node.local.__clone();
      nodes.push(this.finishNode(node, "ExportSpecifier"));
    } // https://github.com/ember-cli/ember-cli/pull/3739


    if (needsFrom && !this.isContextual("from")) {
      this.unexpected();
    }

    return nodes;
  }; // Parses import declaration.


  _proto.parseImport = function parseImport(node) {
    // import '...'
    if (this.match(types.string)) {
      node.specifiers = [];
      node.source = this.parseExprAtom();
    } else {
      node.specifiers = [];
      this.parseImportSpecifiers(node);
      this.expectContextual("from");
      node.source = this.match(types.string) ? this.parseExprAtom() : this.unexpected();
    }

    this.semicolon();
    return this.finishNode(node, "ImportDeclaration");
  }; // eslint-disable-next-line no-unused-vars


  _proto.shouldParseDefaultImport = function shouldParseDefaultImport(node) {
    return this.match(types.name);
  };

  _proto.parseImportSpecifierLocal = function parseImportSpecifierLocal(node, specifier, type, contextDescription) {
    specifier.local = this.parseIdentifier();
    this.checkLVal(specifier.local, true, undefined, contextDescription);
    node.specifiers.push(this.finishNode(specifier, type));
  }; // Parses a comma-separated list of module imports.


  _proto.parseImportSpecifiers = function parseImportSpecifiers(node) {
    var first = true;

    if (this.shouldParseDefaultImport(node)) {
      // import defaultObj, { x, y as z } from '...'
      this.parseImportSpecifierLocal(node, this.startNode(), "ImportDefaultSpecifier", "default import specifier");
      if (!this.eat(types.comma)) return;
    }

    if (this.match(types.star)) {
      var specifier = this.startNode();
      this.next();
      this.expectContextual("as");
      this.parseImportSpecifierLocal(node, specifier, "ImportNamespaceSpecifier", "import namespace specifier");
      return;
    }

    this.expect(types.braceL);

    while (!this.eat(types.braceR)) {
      if (first) {
        first = false;
      } else {
        // Detect an attempt to deep destructure
        if (this.eat(types.colon)) {
          this.unexpected(null, "ES2015 named imports do not destructure. Use another statement for destructuring after the import.");
        }

        this.expect(types.comma);
        if (this.eat(types.braceR)) break;
      }

      this.parseImportSpecifier(node);
    }
  };

  _proto.parseImportSpecifier = function parseImportSpecifier(node) {
    var specifier = this.startNode();
    specifier.imported = this.parseIdentifier(true);

    if (this.eatContextual("as")) {
      specifier.local = this.parseIdentifier();
    } else {
      this.checkReservedWord(specifier.imported.name, specifier.start, true, true);
      specifier.local = specifier.imported.__clone();
    }

    this.checkLVal(specifier.local, true, undefined, "import specifier");
    node.specifiers.push(this.finishNode(specifier, "ImportSpecifier"));
  };

  return StatementParser;
}(ExpressionParser);

var plugins = {};

var Parser =
/*#__PURE__*/
function (_StatementParser) {
  _inheritsLoose(Parser, _StatementParser);

  function Parser(options, input) {
    var _this;

    options = getOptions(options);
    _this = _StatementParser.call(this, options, input) || this;
    _this.options = options;
    _this.inModule = _this.options.sourceType === "module";
    _this.input = input;
    _this.plugins = pluginsMap(_this.options.plugins);
    _this.filename = options.sourceFilename; // If enabled, skip leading hashbang line.

    if (_this.state.pos === 0 && _this.input[0] === "#" && _this.input[1] === "!") {
      _this.skipLineComment(2);
    }

    return _this;
  }

  var _proto = Parser.prototype;

  _proto.parse = function parse() {
    var file = this.startNode();
    var program = this.startNode();
    this.nextToken();
    return this.parseTopLevel(file, program);
  };

  return Parser;
}(StatementParser);

function pluginsMap(pluginList) {
  var pluginMap = {};

  for (var _i2 = 0; _i2 < pluginList.length; _i2++) {
    var _name = pluginList[_i2];
    pluginMap[_name] = true;
  }

  return pluginMap;
}

function isSimpleProperty(node) {
  return node != null && node.type === "Property" && node.kind === "init" && node.method === false;
}

var estreePlugin = (function (superClass) {
  return (
    /*#__PURE__*/
    function (_superClass) {
      _inheritsLoose(_class, _superClass);

      function _class() {
        return _superClass.apply(this, arguments) || this;
      }

      var _proto = _class.prototype;

      _proto.estreeParseRegExpLiteral = function estreeParseRegExpLiteral(_ref) {
        var pattern = _ref.pattern,
            flags = _ref.flags;
        var regex = null;

        try {
          regex = new RegExp(pattern, flags);
        } catch (e) {// In environments that don't support these flags value will
          // be null as the regex can't be represented natively.
        }

        var node = this.estreeParseLiteral(regex);
        node.regex = {
          pattern,
          flags
        };
        return node;
      };

      _proto.estreeParseLiteral = function estreeParseLiteral(value) {
        return this.parseLiteral(value, "Literal");
      };

      _proto.directiveToStmt = function directiveToStmt(directive) {
        var directiveLiteral = directive.value;
        var stmt = this.startNodeAt(directive.start, directive.loc.start);
        var expression = this.startNodeAt(directiveLiteral.start, directiveLiteral.loc.start);
        expression.value = directiveLiteral.value;
        expression.raw = directiveLiteral.extra.raw;
        stmt.expression = this.finishNodeAt(expression, "Literal", directiveLiteral.end, directiveLiteral.loc.end);
        stmt.directive = directiveLiteral.extra.raw.slice(1, -1);
        return this.finishNodeAt(stmt, "ExpressionStatement", directive.end, directive.loc.end);
      }; // ==================================
      // Overrides
      // ==================================


      _proto.initFunction = function initFunction(node, isAsync) {
        _superClass.prototype.initFunction.call(this, node, isAsync);

        node.expression = false;
      };

      _proto.checkDeclaration = function checkDeclaration(node) {
        if (isSimpleProperty(node)) {
          this.checkDeclaration(node.value);
        } else {
          _superClass.prototype.checkDeclaration.call(this, node);
        }
      };

      _proto.checkGetterSetterParamCount = function checkGetterSetterParamCount(prop) {
        var paramCount = prop.kind === "get" ? 0 : 1; // $FlowFixMe (prop.value present for ObjectMethod, but for ClassMethod should use prop.params?)

        if (prop.value.params.length !== paramCount) {
          var start = prop.start;

          if (prop.kind === "get") {
            this.raise(start, "getter should have no params");
          } else {
            this.raise(start, "setter should have exactly one param");
          }
        }
      };

      _proto.checkLVal = function checkLVal(expr, isBinding, checkClashes, contextDescription) {
        var _this = this;

        switch (expr.type) {
          case "ObjectPattern":
            expr.properties.forEach(function (prop) {
              _this.checkLVal(prop.type === "Property" ? prop.value : prop, isBinding, checkClashes, "object destructuring pattern");
            });
            break;

          default:
            _superClass.prototype.checkLVal.call(this, expr, isBinding, checkClashes, contextDescription);

        }
      };

      _proto.checkPropClash = function checkPropClash(prop, propHash) {
        if (prop.computed || !isSimpleProperty(prop)) return;
        var key = prop.key; // It is either an Identifier or a String/NumericLiteral

        var name = key.type === "Identifier" ? key.name : String(key.value);

        if (name === "__proto__") {
          if (propHash.proto) {
            this.raise(key.start, "Redefinition of __proto__ property");
          }

          propHash.proto = true;
        }
      };

      _proto.isStrictBody = function isStrictBody(node) {
        var isBlockStatement = node.body.type === "BlockStatement";

        if (isBlockStatement && node.body.body.length > 0) {
          for (var _i2 = 0, _node$body$body2 = node.body.body; _i2 < _node$body$body2.length; _i2++) {
            var directive = _node$body$body2[_i2];

            if (directive.type === "ExpressionStatement" && directive.expression.type === "Literal") {
              if (directive.expression.value === "use strict") return true;
            } else {
              // Break for the first non literal expression
              break;
            }
          }
        }

        return false;
      };

      _proto.isValidDirective = function isValidDirective(stmt) {
        return stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && typeof stmt.expression.value === "string" && (!stmt.expression.extra || !stmt.expression.extra.parenthesized);
      };

      _proto.stmtToDirective = function stmtToDirective(stmt) {
        var directive = _superClass.prototype.stmtToDirective.call(this, stmt);

        var value = stmt.expression.value; // Reset value to the actual value as in estree mode we want
        // the stmt to have the real value and not the raw value

        directive.value.value = value;
        return directive;
      };

      _proto.parseBlockBody = function parseBlockBody(node, allowDirectives, topLevel, end) {
        var _this2 = this;

        _superClass.prototype.parseBlockBody.call(this, node, allowDirectives, topLevel, end);

        var directiveStatements = node.directives.map(function (d) {
          return _this2.directiveToStmt(d);
        });
        node.body = directiveStatements.concat(node.body);
        delete node.directives;
      };

      _proto.pushClassMethod = function pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor) {
        this.parseMethod(method, isGenerator, isAsync, isConstructor, "MethodDefinition");

        if (method.typeParameters) {
          // $FlowIgnore
          method.value.typeParameters = method.typeParameters;
          delete method.typeParameters;
        }

        classBody.body.push(method);
      };

      _proto.parseExprAtom = function parseExprAtom(refShorthandDefaultPos) {
        switch (this.state.type) {
          case types.regexp:
            return this.estreeParseRegExpLiteral(this.state.value);

          case types.num:
          case types.string:
            return this.estreeParseLiteral(this.state.value);

          case types._null:
            return this.estreeParseLiteral(null);

          case types._true:
            return this.estreeParseLiteral(true);

          case types._false:
            return this.estreeParseLiteral(false);

          default:
            return _superClass.prototype.parseExprAtom.call(this, refShorthandDefaultPos);
        }
      };

      _proto.parseLiteral = function parseLiteral(value, type, startPos, startLoc) {
        var node = _superClass.prototype.parseLiteral.call(this, value, type, startPos, startLoc);

        node.raw = node.extra.raw;
        delete node.extra;
        return node;
      };

      _proto.parseFunctionBody = function parseFunctionBody(node, allowExpression) {
        _superClass.prototype.parseFunctionBody.call(this, node, allowExpression);

        node.expression = node.body.type !== "BlockStatement";
      };

      _proto.parseMethod = function parseMethod(node, isGenerator, isAsync, isConstructor, type) {
        var funcNode = this.startNode();
        funcNode.kind = node.kind; // provide kind, so super method correctly sets state

        funcNode = _superClass.prototype.parseMethod.call(this, funcNode, isGenerator, isAsync, isConstructor, "FunctionExpression");
        delete funcNode.kind; // $FlowIgnore

        node.value = funcNode;
        return this.finishNode(node, type);
      };

      _proto.parseObjectMethod = function parseObjectMethod(prop, isGenerator, isAsync, isPattern) {
        var node = _superClass.prototype.parseObjectMethod.call(this, prop, isGenerator, isAsync, isPattern);

        if (node) {
          node.type = "Property";
          if (node.kind === "method") node.kind = "init";
          node.shorthand = false;
        }

        return node;
      };

      _proto.parseObjectProperty = function parseObjectProperty(prop, startPos, startLoc, isPattern, refShorthandDefaultPos) {
        var node = _superClass.prototype.parseObjectProperty.call(this, prop, startPos, startLoc, isPattern, refShorthandDefaultPos);

        if (node) {
          node.kind = "init";
          node.type = "Property";
        }

        return node;
      };

      _proto.toAssignable = function toAssignable(node, isBinding, contextDescription) {
        if (isSimpleProperty(node)) {
          this.toAssignable(node.value, isBinding, contextDescription);
          return node;
        }

        return _superClass.prototype.toAssignable.call(this, node, isBinding, contextDescription);
      };

      _proto.toAssignableObjectExpressionProp = function toAssignableObjectExpressionProp(prop, isBinding, isLast) {
        if (prop.kind === "get" || prop.kind === "set") {
          this.raise(prop.key.start, "Object pattern can't contain getter or setter");
        } else if (prop.method) {
          this.raise(prop.key.start, "Object pattern can't contain methods");
        } else {
          _superClass.prototype.toAssignableObjectExpressionProp.call(this, prop, isBinding, isLast);
        }
      };

      return _class;
    }(superClass)
  );
});

/* eslint max-len: 0 */
var primitiveTypes = ["any", "bool", "boolean", "empty", "false", "mixed", "null", "number", "static", "string", "true", "typeof", "void"];

function isEsModuleType(bodyElement) {
  return bodyElement.type === "DeclareExportAllDeclaration" || bodyElement.type === "DeclareExportDeclaration" && (!bodyElement.declaration || bodyElement.declaration.type !== "TypeAlias" && bodyElement.declaration.type !== "InterfaceDeclaration");
}

function hasTypeImportKind(node) {
  return node.importKind === "type" || node.importKind === "typeof";
}

function isMaybeDefaultImport(state) {
  return (state.type === types.name || !!state.type.keyword) && state.value !== "from";
}

var exportSuggestions = {
  const: "declare export var",
  let: "declare export var",
  type: "export type",
  interface: "export interface"
}; // Like Array#filter, but returns a tuple [ acceptedElements, discardedElements ]

function partition(list, test) {
  var list1 = [];
  var list2 = [];

  for (var i = 0; i < list.length; i++) {
    (test(list[i], i, list) ? list1 : list2).push(list[i]);
  }

  return [list1, list2];
}

var flowPlugin = (function (superClass) {
  return (
    /*#__PURE__*/
    function (_superClass) {
      _inheritsLoose(_class, _superClass);

      function _class() {
        return _superClass.apply(this, arguments) || this;
      }

      var _proto = _class.prototype;

      _proto.flowParseTypeInitialiser = function flowParseTypeInitialiser(tok) {
        var oldInType = this.state.inType;
        this.state.inType = true;
        this.expect(tok || types.colon);
        var type = this.flowParseType();
        this.state.inType = oldInType;
        return type;
      };

      _proto.flowParsePredicate = function flowParsePredicate() {
        var node = this.startNode();
        var moduloLoc = this.state.startLoc;
        var moduloPos = this.state.start;
        this.expect(types.modulo);
        var checksLoc = this.state.startLoc;
        this.expectContextual("checks"); // Force '%' and 'checks' to be adjacent

        if (moduloLoc.line !== checksLoc.line || moduloLoc.column !== checksLoc.column - 1) {
          this.raise(moduloPos, "Spaces between ´%´ and ´checks´ are not allowed here.");
        }

        if (this.eat(types.parenL)) {
          node.value = this.parseExpression();
          this.expect(types.parenR);
          return this.finishNode(node, "DeclaredPredicate");
        } else {
          return this.finishNode(node, "InferredPredicate");
        }
      };

      _proto.flowParseTypeAndPredicateInitialiser = function flowParseTypeAndPredicateInitialiser() {
        var oldInType = this.state.inType;
        this.state.inType = true;
        this.expect(types.colon);
        var type = null;
        var predicate = null;

        if (this.match(types.modulo)) {
          this.state.inType = oldInType;
          predicate = this.flowParsePredicate();
        } else {
          type = this.flowParseType();
          this.state.inType = oldInType;

          if (this.match(types.modulo)) {
            predicate = this.flowParsePredicate();
          }
        }

        return [type, predicate];
      };

      _proto.flowParseDeclareClass = function flowParseDeclareClass(node) {
        this.next();
        this.flowParseInterfaceish(node,
        /*isClass*/
        true);
        return this.finishNode(node, "DeclareClass");
      };

      _proto.flowParseDeclareFunction = function flowParseDeclareFunction(node) {
        this.next();
        var id = node.id = this.parseIdentifier();
        var typeNode = this.startNode();
        var typeContainer = this.startNode();

        if (this.isRelational("<")) {
          typeNode.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          typeNode.typeParameters = null;
        }

        this.expect(types.parenL);
        var tmp = this.flowParseFunctionTypeParams();
        typeNode.params = tmp.params;
        typeNode.rest = tmp.rest;
        this.expect(types.parenR);

        var _flowParseTypeAndPred = this.flowParseTypeAndPredicateInitialiser();

        // $FlowFixMe (destructuring not supported yet)
        typeNode.returnType = _flowParseTypeAndPred[0];
        // $FlowFixMe (destructuring not supported yet)
        node.predicate = _flowParseTypeAndPred[1];
        typeContainer.typeAnnotation = this.finishNode(typeNode, "FunctionTypeAnnotation");
        id.typeAnnotation = this.finishNode(typeContainer, "TypeAnnotation");
        this.finishNode(id, id.type);
        this.semicolon();
        return this.finishNode(node, "DeclareFunction");
      };

      _proto.flowParseDeclare = function flowParseDeclare(node, insideModule) {
        if (this.match(types._class)) {
          return this.flowParseDeclareClass(node);
        } else if (this.match(types._function)) {
          return this.flowParseDeclareFunction(node);
        } else if (this.match(types._var)) {
          return this.flowParseDeclareVariable(node);
        } else if (this.isContextual("module")) {
          if (this.lookahead().type === types.dot) {
            return this.flowParseDeclareModuleExports(node);
          } else {
            if (insideModule) {
              this.unexpected(null, "`declare module` cannot be used inside another `declare module`");
            }

            return this.flowParseDeclareModule(node);
          }
        } else if (this.isContextual("type")) {
          return this.flowParseDeclareTypeAlias(node);
        } else if (this.isContextual("opaque")) {
          return this.flowParseDeclareOpaqueType(node);
        } else if (this.isContextual("interface")) {
          return this.flowParseDeclareInterface(node);
        } else if (this.match(types._export)) {
          return this.flowParseDeclareExportDeclaration(node, insideModule);
        } else {
          throw this.unexpected();
        }
      };

      _proto.flowParseDeclareVariable = function flowParseDeclareVariable(node) {
        this.next();
        node.id = this.flowParseTypeAnnotatableIdentifier(
        /*allowPrimitiveOverride*/
        true);
        this.semicolon();
        return this.finishNode(node, "DeclareVariable");
      };

      _proto.flowParseDeclareModule = function flowParseDeclareModule(node) {
        var _this = this;

        this.next();

        if (this.match(types.string)) {
          node.id = this.parseExprAtom();
        } else {
          node.id = this.parseIdentifier();
        }

        var bodyNode = node.body = this.startNode();
        var body = bodyNode.body = [];
        this.expect(types.braceL);

        while (!this.match(types.braceR)) {
          var _bodyNode = this.startNode();

          if (this.match(types._import)) {
            var lookahead = this.lookahead();

            if (lookahead.value !== "type" && lookahead.value !== "typeof") {
              this.unexpected(null, "Imports within a `declare module` body must always be `import type` or `import typeof`");
            }

            this.next();
            this.parseImport(_bodyNode);
          } else {
            this.expectContextual("declare", "Only declares and type imports are allowed inside declare module");
            _bodyNode = this.flowParseDeclare(_bodyNode, true);
          }

          body.push(_bodyNode);
        }

        this.expect(types.braceR);
        this.finishNode(bodyNode, "BlockStatement");
        var kind = null;
        var hasModuleExport = false;
        var errorMessage = "Found both `declare module.exports` and `declare export` in the same module. Modules can only have 1 since they are either an ES module or they are a CommonJS module";
        body.forEach(function (bodyElement) {
          if (isEsModuleType(bodyElement)) {
            if (kind === "CommonJS") {
              _this.unexpected(bodyElement.start, errorMessage);
            }

            kind = "ES";
          } else if (bodyElement.type === "DeclareModuleExports") {
            if (hasModuleExport) {
              _this.unexpected(bodyElement.start, "Duplicate `declare module.exports` statement");
            }

            if (kind === "ES") _this.unexpected(bodyElement.start, errorMessage);
            kind = "CommonJS";
            hasModuleExport = true;
          }
        });
        node.kind = kind || "CommonJS";
        return this.finishNode(node, "DeclareModule");
      };

      _proto.flowParseDeclareExportDeclaration = function flowParseDeclareExportDeclaration(node, insideModule) {
        this.expect(types._export);

        if (this.eat(types._default)) {
          if (this.match(types._function) || this.match(types._class)) {
            // declare export default class ...
            // declare export default function ...
            node.declaration = this.flowParseDeclare(this.startNode());
          } else {
            // declare export default [type];
            node.declaration = this.flowParseType();
            this.semicolon();
          }

          node.default = true;
          return this.finishNode(node, "DeclareExportDeclaration");
        } else {
          if (this.match(types._const) || this.match(types._let) || (this.isContextual("type") || this.isContextual("interface")) && !insideModule) {
            var label = this.state.value;
            var suggestion = exportSuggestions[label];
            this.unexpected(this.state.start, `\`declare export ${label}\` is not supported. Use \`${suggestion}\` instead`);
          }

          if (this.match(types._var) || // declare export var ...
          this.match(types._function) || // declare export function ...
          this.match(types._class) || // declare export class ...
          this.isContextual("opaque") // declare export opaque ..
          ) {
              node.declaration = this.flowParseDeclare(this.startNode());
              node.default = false;
              return this.finishNode(node, "DeclareExportDeclaration");
            } else if (this.match(types.star) || // declare export * from ''
          this.match(types.braceL) || // declare export {} ...
          this.isContextual("interface") || // declare export interface ...
          this.isContextual("type") || // declare export type ...
          this.isContextual("opaque") // declare export opaque type ...
          ) {
              node = this.parseExport(node);

              if (node.type === "ExportNamedDeclaration") {
                // flow does not support the ExportNamedDeclaration
                // $FlowIgnore
                node.type = "ExportDeclaration"; // $FlowFixMe

                node.default = false;
                delete node.exportKind;
              } // $FlowIgnore


              node.type = "Declare" + node.type;
              return node;
            }
        }

        throw this.unexpected();
      };

      _proto.flowParseDeclareModuleExports = function flowParseDeclareModuleExports(node) {
        this.expectContextual("module");
        this.expect(types.dot);
        this.expectContextual("exports");
        node.typeAnnotation = this.flowParseTypeAnnotation();
        this.semicolon();
        return this.finishNode(node, "DeclareModuleExports");
      };

      _proto.flowParseDeclareTypeAlias = function flowParseDeclareTypeAlias(node) {
        this.next();
        this.flowParseTypeAlias(node);
        return this.finishNode(node, "DeclareTypeAlias");
      };

      _proto.flowParseDeclareOpaqueType = function flowParseDeclareOpaqueType(node) {
        this.next();
        this.flowParseOpaqueType(node, true);
        return this.finishNode(node, "DeclareOpaqueType");
      };

      _proto.flowParseDeclareInterface = function flowParseDeclareInterface(node) {
        this.next();
        this.flowParseInterfaceish(node);
        return this.finishNode(node, "DeclareInterface");
      }; // Interfaces


      _proto.flowParseInterfaceish = function flowParseInterfaceish(node, isClass) {
        node.id = this.flowParseRestrictedIdentifier(
        /*liberal*/
        !isClass);

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        }

        node.extends = [];
        node.mixins = [];

        if (this.eat(types._extends)) {
          do {
            node.extends.push(this.flowParseInterfaceExtends());
          } while (!isClass && this.eat(types.comma));
        }

        if (this.isContextual("mixins")) {
          this.next();

          do {
            node.mixins.push(this.flowParseInterfaceExtends());
          } while (this.eat(types.comma));
        }

        node.body = this.flowParseObjectType(true, false, false);
      };

      _proto.flowParseInterfaceExtends = function flowParseInterfaceExtends() {
        var node = this.startNode();
        node.id = this.flowParseQualifiedTypeIdentifier();

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterInstantiation();
        } else {
          node.typeParameters = null;
        }

        return this.finishNode(node, "InterfaceExtends");
      };

      _proto.flowParseInterface = function flowParseInterface(node) {
        this.flowParseInterfaceish(node);
        return this.finishNode(node, "InterfaceDeclaration");
      };

      _proto.checkReservedType = function checkReservedType(word, startLoc) {
        if (primitiveTypes.indexOf(word) > -1) {
          this.raise(startLoc, `Cannot overwrite primitive type ${word}`);
        }
      };

      _proto.flowParseRestrictedIdentifier = function flowParseRestrictedIdentifier(liberal) {
        this.checkReservedType(this.state.value, this.state.start);
        return this.parseIdentifier(liberal);
      }; // Type aliases


      _proto.flowParseTypeAlias = function flowParseTypeAlias(node) {
        node.id = this.flowParseRestrictedIdentifier();

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        }

        node.right = this.flowParseTypeInitialiser(types.eq);
        this.semicolon();
        return this.finishNode(node, "TypeAlias");
      };

      _proto.flowParseOpaqueType = function flowParseOpaqueType(node, declare) {
        this.expectContextual("type");
        node.id = this.flowParseRestrictedIdentifier(
        /*liberal*/
        true);

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        } else {
          node.typeParameters = null;
        } // Parse the supertype


        node.supertype = null;

        if (this.match(types.colon)) {
          node.supertype = this.flowParseTypeInitialiser(types.colon);
        }

        node.impltype = null;

        if (!declare) {
          node.impltype = this.flowParseTypeInitialiser(types.eq);
        }

        this.semicolon();
        return this.finishNode(node, "OpaqueType");
      }; // Type annotations


      _proto.flowParseTypeParameter = function flowParseTypeParameter() {
        var node = this.startNode();
        var variance = this.flowParseVariance();
        var ident = this.flowParseTypeAnnotatableIdentifier();
        node.name = ident.name;
        node.variance = variance;
        node.bound = ident.typeAnnotation;

        if (this.match(types.eq)) {
          this.eat(types.eq);
          node.default = this.flowParseType();
        }

        return this.finishNode(node, "TypeParameter");
      };

      _proto.flowParseTypeParameterDeclaration = function flowParseTypeParameterDeclaration() {
        var oldInType = this.state.inType;
        var node = this.startNode();
        node.params = [];
        this.state.inType = true; // istanbul ignore else: this condition is already checked at all call sites

        if (this.isRelational("<") || this.match(types.jsxTagStart)) {
          this.next();
        } else {
          this.unexpected();
        }

        do {
          node.params.push(this.flowParseTypeParameter());

          if (!this.isRelational(">")) {
            this.expect(types.comma);
          }
        } while (!this.isRelational(">"));

        this.expectRelational(">");
        this.state.inType = oldInType;
        return this.finishNode(node, "TypeParameterDeclaration");
      };

      _proto.flowParseTypeParameterInstantiation = function flowParseTypeParameterInstantiation() {
        var node = this.startNode();
        var oldInType = this.state.inType;
        node.params = [];
        this.state.inType = true;
        this.expectRelational("<");

        while (!this.isRelational(">")) {
          node.params.push(this.flowParseType());

          if (!this.isRelational(">")) {
            this.expect(types.comma);
          }
        }

        this.expectRelational(">");
        this.state.inType = oldInType;
        return this.finishNode(node, "TypeParameterInstantiation");
      };

      _proto.flowParseObjectPropertyKey = function flowParseObjectPropertyKey() {
        return this.match(types.num) || this.match(types.string) ? this.parseExprAtom() : this.parseIdentifier(true);
      };

      _proto.flowParseObjectTypeIndexer = function flowParseObjectTypeIndexer(node, isStatic, variance) {
        node.static = isStatic;
        this.expect(types.bracketL);

        if (this.lookahead().type === types.colon) {
          node.id = this.flowParseObjectPropertyKey();
          node.key = this.flowParseTypeInitialiser();
        } else {
          node.id = null;
          node.key = this.flowParseType();
        }

        this.expect(types.bracketR);
        node.value = this.flowParseTypeInitialiser();
        node.variance = variance;
        return this.finishNode(node, "ObjectTypeIndexer");
      };

      _proto.flowParseObjectTypeMethodish = function flowParseObjectTypeMethodish(node) {
        node.params = [];
        node.rest = null;
        node.typeParameters = null;

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }

        this.expect(types.parenL);

        while (!this.match(types.parenR) && !this.match(types.ellipsis)) {
          node.params.push(this.flowParseFunctionTypeParam());

          if (!this.match(types.parenR)) {
            this.expect(types.comma);
          }
        }

        if (this.eat(types.ellipsis)) {
          node.rest = this.flowParseFunctionTypeParam();
        }

        this.expect(types.parenR);
        node.returnType = this.flowParseTypeInitialiser();
        return this.finishNode(node, "FunctionTypeAnnotation");
      };

      _proto.flowParseObjectTypeCallProperty = function flowParseObjectTypeCallProperty(node, isStatic) {
        var valueNode = this.startNode();
        node.static = isStatic;
        node.value = this.flowParseObjectTypeMethodish(valueNode);
        return this.finishNode(node, "ObjectTypeCallProperty");
      };

      _proto.flowParseObjectType = function flowParseObjectType(allowStatic, allowExact, allowSpread) {
        var oldInType = this.state.inType;
        this.state.inType = true;
        var nodeStart = this.startNode();
        nodeStart.callProperties = [];
        nodeStart.properties = [];
        nodeStart.indexers = [];
        var endDelim;
        var exact;

        if (allowExact && this.match(types.braceBarL)) {
          this.expect(types.braceBarL);
          endDelim = types.braceBarR;
          exact = true;
        } else {
          this.expect(types.braceL);
          endDelim = types.braceR;
          exact = false;
        }

        nodeStart.exact = exact;

        while (!this.match(endDelim)) {
          var isStatic = false;
          var node = this.startNode();

          if (allowStatic && this.isContextual("static") && this.lookahead().type !== types.colon) {
            this.next();
            isStatic = true;
          }

          var variance = this.flowParseVariance();

          if (this.match(types.bracketL)) {
            nodeStart.indexers.push(this.flowParseObjectTypeIndexer(node, isStatic, variance));
          } else if (this.match(types.parenL) || this.isRelational("<")) {
            if (variance) {
              this.unexpected(variance.start);
            }

            nodeStart.callProperties.push(this.flowParseObjectTypeCallProperty(node, isStatic));
          } else {
            var kind = "init";

            if (this.isContextual("get") || this.isContextual("set")) {
              var lookahead = this.lookahead();

              if (lookahead.type === types.name || lookahead.type === types.string || lookahead.type === types.num) {
                kind = this.state.value;
                this.next();
              }
            }

            nodeStart.properties.push(this.flowParseObjectTypeProperty(node, isStatic, variance, kind, allowSpread));
          }

          this.flowObjectTypeSemicolon();
        }

        this.expect(endDelim);
        var out = this.finishNode(nodeStart, "ObjectTypeAnnotation");
        this.state.inType = oldInType;
        return out;
      };

      _proto.flowParseObjectTypeProperty = function flowParseObjectTypeProperty(node, isStatic, variance, kind, allowSpread) {
        if (this.match(types.ellipsis)) {
          if (!allowSpread) {
            this.unexpected(null, "Spread operator cannot appear in class or interface definitions");
          }

          if (variance) {
            this.unexpected(variance.start, "Spread properties cannot have variance");
          }

          this.expect(types.ellipsis);
          node.argument = this.flowParseType();
          return this.finishNode(node, "ObjectTypeSpreadProperty");
        } else {
          node.key = this.flowParseObjectPropertyKey();
          node.static = isStatic;
          node.kind = kind;
          var optional = false;

          if (this.isRelational("<") || this.match(types.parenL)) {
            // This is a method property
            if (variance) {
              this.unexpected(variance.start);
            }

            node.value = this.flowParseObjectTypeMethodish(this.startNodeAt(node.start, node.loc.start));

            if (kind === "get" || kind === "set") {
              this.flowCheckGetterSetterParamCount(node);
            }
          } else {
            if (kind !== "init") this.unexpected();

            if (this.eat(types.question)) {
              optional = true;
            }

            node.value = this.flowParseTypeInitialiser();
            node.variance = variance;
          }

          node.optional = optional;
          return this.finishNode(node, "ObjectTypeProperty");
        }
      }; // This is similar to checkGetterSetterParamCount, but as
      // babylon uses non estree properties we cannot reuse it here


      _proto.flowCheckGetterSetterParamCount = function flowCheckGetterSetterParamCount(property) {
        var paramCount = property.kind === "get" ? 0 : 1;

        if (property.value.params.length !== paramCount) {
          var start = property.start;

          if (property.kind === "get") {
            this.raise(start, "getter should have no params");
          } else {
            this.raise(start, "setter should have exactly one param");
          }
        }
      };

      _proto.flowObjectTypeSemicolon = function flowObjectTypeSemicolon() {
        if (!this.eat(types.semi) && !this.eat(types.comma) && !this.match(types.braceR) && !this.match(types.braceBarR)) {
          this.unexpected();
        }
      };

      _proto.flowParseQualifiedTypeIdentifier = function flowParseQualifiedTypeIdentifier(startPos, startLoc, id) {
        startPos = startPos || this.state.start;
        startLoc = startLoc || this.state.startLoc;
        var node = id || this.parseIdentifier();

        while (this.eat(types.dot)) {
          var node2 = this.startNodeAt(startPos, startLoc);
          node2.qualification = node;
          node2.id = this.parseIdentifier();
          node = this.finishNode(node2, "QualifiedTypeIdentifier");
        }

        return node;
      };

      _proto.flowParseGenericType = function flowParseGenericType(startPos, startLoc, id) {
        var node = this.startNodeAt(startPos, startLoc);
        node.typeParameters = null;
        node.id = this.flowParseQualifiedTypeIdentifier(startPos, startLoc, id);

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterInstantiation();
        }

        return this.finishNode(node, "GenericTypeAnnotation");
      };

      _proto.flowParseTypeofType = function flowParseTypeofType() {
        var node = this.startNode();
        this.expect(types._typeof);
        node.argument = this.flowParsePrimaryType();
        return this.finishNode(node, "TypeofTypeAnnotation");
      };

      _proto.flowParseTupleType = function flowParseTupleType() {
        var node = this.startNode();
        node.types = [];
        this.expect(types.bracketL); // We allow trailing commas

        while (this.state.pos < this.input.length && !this.match(types.bracketR)) {
          node.types.push(this.flowParseType());
          if (this.match(types.bracketR)) break;
          this.expect(types.comma);
        }

        this.expect(types.bracketR);
        return this.finishNode(node, "TupleTypeAnnotation");
      };

      _proto.flowParseFunctionTypeParam = function flowParseFunctionTypeParam() {
        var name = null;
        var optional = false;
        var typeAnnotation = null;
        var node = this.startNode();
        var lh = this.lookahead();

        if (lh.type === types.colon || lh.type === types.question) {
          name = this.parseIdentifier();

          if (this.eat(types.question)) {
            optional = true;
          }

          typeAnnotation = this.flowParseTypeInitialiser();
        } else {
          typeAnnotation = this.flowParseType();
        }

        node.name = name;
        node.optional = optional;
        node.typeAnnotation = typeAnnotation;
        return this.finishNode(node, "FunctionTypeParam");
      };

      _proto.reinterpretTypeAsFunctionTypeParam = function reinterpretTypeAsFunctionTypeParam(type) {
        var node = this.startNodeAt(type.start, type.loc.start);
        node.name = null;
        node.optional = false;
        node.typeAnnotation = type;
        return this.finishNode(node, "FunctionTypeParam");
      };

      _proto.flowParseFunctionTypeParams = function flowParseFunctionTypeParams(params) {
        if (params === void 0) {
          params = [];
        }

        var rest = null;

        while (!this.match(types.parenR) && !this.match(types.ellipsis)) {
          params.push(this.flowParseFunctionTypeParam());

          if (!this.match(types.parenR)) {
            this.expect(types.comma);
          }
        }

        if (this.eat(types.ellipsis)) {
          rest = this.flowParseFunctionTypeParam();
        }

        return {
          params,
          rest
        };
      };

      _proto.flowIdentToTypeAnnotation = function flowIdentToTypeAnnotation(startPos, startLoc, node, id) {
        switch (id.name) {
          case "any":
            return this.finishNode(node, "AnyTypeAnnotation");

          case "void":
            return this.finishNode(node, "VoidTypeAnnotation");

          case "bool":
          case "boolean":
            return this.finishNode(node, "BooleanTypeAnnotation");

          case "mixed":
            return this.finishNode(node, "MixedTypeAnnotation");

          case "empty":
            return this.finishNode(node, "EmptyTypeAnnotation");

          case "number":
            return this.finishNode(node, "NumberTypeAnnotation");

          case "string":
            return this.finishNode(node, "StringTypeAnnotation");

          default:
            return this.flowParseGenericType(startPos, startLoc, id);
        }
      }; // The parsing of types roughly parallels the parsing of expressions, and
      // primary types are kind of like primary expressions...they're the
      // primitives with which other types are constructed.


      _proto.flowParsePrimaryType = function flowParsePrimaryType() {
        var startPos = this.state.start;
        var startLoc = this.state.startLoc;
        var node = this.startNode();
        var tmp;
        var type;
        var isGroupedType = false;
        var oldNoAnonFunctionType = this.state.noAnonFunctionType;

        switch (this.state.type) {
          case types.name:
            return this.flowIdentToTypeAnnotation(startPos, startLoc, node, this.parseIdentifier());

          case types.braceL:
            return this.flowParseObjectType(false, false, true);

          case types.braceBarL:
            return this.flowParseObjectType(false, true, true);

          case types.bracketL:
            return this.flowParseTupleType();

          case types.relational:
            if (this.state.value === "<") {
              node.typeParameters = this.flowParseTypeParameterDeclaration();
              this.expect(types.parenL);
              tmp = this.flowParseFunctionTypeParams();
              node.params = tmp.params;
              node.rest = tmp.rest;
              this.expect(types.parenR);
              this.expect(types.arrow);
              node.returnType = this.flowParseType();
              return this.finishNode(node, "FunctionTypeAnnotation");
            }

            break;

          case types.parenL:
            this.next(); // Check to see if this is actually a grouped type

            if (!this.match(types.parenR) && !this.match(types.ellipsis)) {
              if (this.match(types.name)) {
                var token = this.lookahead().type;
                isGroupedType = token !== types.question && token !== types.colon;
              } else {
                isGroupedType = true;
              }
            }

            if (isGroupedType) {
              this.state.noAnonFunctionType = false;
              type = this.flowParseType();
              this.state.noAnonFunctionType = oldNoAnonFunctionType; // A `,` or a `) =>` means this is an anonymous function type

              if (this.state.noAnonFunctionType || !(this.match(types.comma) || this.match(types.parenR) && this.lookahead().type === types.arrow)) {
                this.expect(types.parenR);
                return type;
              } else {
                // Eat a comma if there is one
                this.eat(types.comma);
              }
            }

            if (type) {
              tmp = this.flowParseFunctionTypeParams([this.reinterpretTypeAsFunctionTypeParam(type)]);
            } else {
              tmp = this.flowParseFunctionTypeParams();
            }

            node.params = tmp.params;
            node.rest = tmp.rest;
            this.expect(types.parenR);
            this.expect(types.arrow);
            node.returnType = this.flowParseType();
            node.typeParameters = null;
            return this.finishNode(node, "FunctionTypeAnnotation");

          case types.string:
            return this.parseLiteral(this.state.value, "StringLiteralTypeAnnotation");

          case types._true:
          case types._false:
            node.value = this.match(types._true);
            this.next();
            return this.finishNode(node, "BooleanLiteralTypeAnnotation");

          case types.plusMin:
            if (this.state.value === "-") {
              this.next();

              if (!this.match(types.num)) {
                this.unexpected(null, `Unexpected token, expected "number"`);
              }

              return this.parseLiteral(-this.state.value, "NumberLiteralTypeAnnotation", node.start, node.loc.start);
            }

            this.unexpected();

          case types.num:
            return this.parseLiteral(this.state.value, "NumberLiteralTypeAnnotation");

          case types._null:
            this.next();
            return this.finishNode(node, "NullLiteralTypeAnnotation");

          case types._this:
            this.next();
            return this.finishNode(node, "ThisTypeAnnotation");

          case types.star:
            this.next();
            return this.finishNode(node, "ExistsTypeAnnotation");

          default:
            if (this.state.type.keyword === "typeof") {
              return this.flowParseTypeofType();
            }

        }

        throw this.unexpected();
      };

      _proto.flowParsePostfixType = function flowParsePostfixType() {
        var startPos = this.state.start,
            startLoc = this.state.startLoc;
        var type = this.flowParsePrimaryType();

        while (!this.canInsertSemicolon() && this.match(types.bracketL)) {
          var node = this.startNodeAt(startPos, startLoc);
          node.elementType = type;
          this.expect(types.bracketL);
          this.expect(types.bracketR);
          type = this.finishNode(node, "ArrayTypeAnnotation");
        }

        return type;
      };

      _proto.flowParsePrefixType = function flowParsePrefixType() {
        var node = this.startNode();

        if (this.eat(types.question)) {
          node.typeAnnotation = this.flowParsePrefixType();
          return this.finishNode(node, "NullableTypeAnnotation");
        } else {
          return this.flowParsePostfixType();
        }
      };

      _proto.flowParseAnonFunctionWithoutParens = function flowParseAnonFunctionWithoutParens() {
        var param = this.flowParsePrefixType();

        if (!this.state.noAnonFunctionType && this.eat(types.arrow)) {
          // TODO: This should be a type error. Passing in a SourceLocation, and it expects a Position.
          var node = this.startNodeAt(param.start, param.loc.start);
          node.params = [this.reinterpretTypeAsFunctionTypeParam(param)];
          node.rest = null;
          node.returnType = this.flowParseType();
          node.typeParameters = null;
          return this.finishNode(node, "FunctionTypeAnnotation");
        }

        return param;
      };

      _proto.flowParseIntersectionType = function flowParseIntersectionType() {
        var node = this.startNode();
        this.eat(types.bitwiseAND);
        var type = this.flowParseAnonFunctionWithoutParens();
        node.types = [type];

        while (this.eat(types.bitwiseAND)) {
          node.types.push(this.flowParseAnonFunctionWithoutParens());
        }

        return node.types.length === 1 ? type : this.finishNode(node, "IntersectionTypeAnnotation");
      };

      _proto.flowParseUnionType = function flowParseUnionType() {
        var node = this.startNode();
        this.eat(types.bitwiseOR);
        var type = this.flowParseIntersectionType();
        node.types = [type];

        while (this.eat(types.bitwiseOR)) {
          node.types.push(this.flowParseIntersectionType());
        }

        return node.types.length === 1 ? type : this.finishNode(node, "UnionTypeAnnotation");
      };

      _proto.flowParseType = function flowParseType() {
        var oldInType = this.state.inType;
        this.state.inType = true;
        var type = this.flowParseUnionType();
        this.state.inType = oldInType; // Ensure that a brace after a function generic type annotation is a
        // statement, except in arrow functions (noAnonFunctionType)

        this.state.exprAllowed = this.state.exprAllowed || this.state.noAnonFunctionType;
        return type;
      };

      _proto.flowParseTypeAnnotation = function flowParseTypeAnnotation() {
        var node = this.startNode();
        node.typeAnnotation = this.flowParseTypeInitialiser();
        return this.finishNode(node, "TypeAnnotation");
      };

      _proto.flowParseTypeAnnotatableIdentifier = function flowParseTypeAnnotatableIdentifier(allowPrimitiveOverride) {
        var ident = allowPrimitiveOverride ? this.parseIdentifier() : this.flowParseRestrictedIdentifier();

        if (this.match(types.colon)) {
          ident.typeAnnotation = this.flowParseTypeAnnotation();
          this.finishNode(ident, ident.type);
        }

        return ident;
      };

      _proto.typeCastToParameter = function typeCastToParameter(node) {
        node.expression.typeAnnotation = node.typeAnnotation;
        return this.finishNodeAt(node.expression, node.expression.type, node.typeAnnotation.end, node.typeAnnotation.loc.end);
      };

      _proto.flowParseVariance = function flowParseVariance() {
        var variance = null;

        if (this.match(types.plusMin)) {
          variance = this.startNode();

          if (this.state.value === "+") {
            variance.kind = "plus";
          } else {
            variance.kind = "minus";
          }

          this.next();
          this.finishNode(variance, "Variance");
        }

        return variance;
      }; // ==================================
      // Overrides
      // ==================================


      _proto.parseFunctionBody = function parseFunctionBody(node, allowExpressionBody) {
        var _this2 = this;

        if (allowExpressionBody) {
          return this.forwardNoArrowParamsConversionAt(node, function () {
            return _superClass.prototype.parseFunctionBody.call(_this2, node, true);
          });
        }

        return _superClass.prototype.parseFunctionBody.call(this, node, false);
      };

      _proto.parseFunctionBodyAndFinish = function parseFunctionBodyAndFinish(node, type, allowExpressionBody) {
        // For arrow functions, `parseArrow` handles the return type itself.
        if (!allowExpressionBody && this.match(types.colon)) {
          var typeNode = this.startNode();

          var _flowParseTypeAndPred2 = this.flowParseTypeAndPredicateInitialiser();

          // $FlowFixMe (destructuring not supported yet)
          typeNode.typeAnnotation = _flowParseTypeAndPred2[0];
          // $FlowFixMe (destructuring not supported yet)
          node.predicate = _flowParseTypeAndPred2[1];
          node.returnType = typeNode.typeAnnotation ? this.finishNode(typeNode, "TypeAnnotation") : null;
        }

        _superClass.prototype.parseFunctionBodyAndFinish.call(this, node, type, allowExpressionBody);
      }; // interfaces


      _proto.parseStatement = function parseStatement(declaration, topLevel) {
        // strict mode handling of `interface` since it's a reserved word
        if (this.state.strict && this.match(types.name) && this.state.value === "interface") {
          var node = this.startNode();
          this.next();
          return this.flowParseInterface(node);
        } else {
          return _superClass.prototype.parseStatement.call(this, declaration, topLevel);
        }
      }; // declares, interfaces and type aliases


      _proto.parseExpressionStatement = function parseExpressionStatement(node, expr) {
        if (expr.type === "Identifier") {
          if (expr.name === "declare") {
            if (this.match(types._class) || this.match(types.name) || this.match(types._function) || this.match(types._var) || this.match(types._export)) {
              return this.flowParseDeclare(node);
            }
          } else if (this.match(types.name)) {
            if (expr.name === "interface") {
              return this.flowParseInterface(node);
            } else if (expr.name === "type") {
              return this.flowParseTypeAlias(node);
            } else if (expr.name === "opaque") {
              return this.flowParseOpaqueType(node, false);
            }
          }
        }

        return _superClass.prototype.parseExpressionStatement.call(this, node, expr);
      }; // export type


      _proto.shouldParseExportDeclaration = function shouldParseExportDeclaration() {
        return this.isContextual("type") || this.isContextual("interface") || this.isContextual("opaque") || _superClass.prototype.shouldParseExportDeclaration.call(this);
      };

      _proto.isExportDefaultSpecifier = function isExportDefaultSpecifier() {
        if (this.match(types.name) && (this.state.value === "type" || this.state.value === "interface" || this.state.value == "opaque")) {
          return false;
        }

        return _superClass.prototype.isExportDefaultSpecifier.call(this);
      };

      _proto.parseConditional = function parseConditional(expr, noIn, startPos, startLoc, refNeedsArrowPos) {
        var _this3 = this;

        if (!this.match(types.question)) return expr; // only do the expensive clone if there is a question mark
        // and if we come from inside parens

        if (refNeedsArrowPos) {
          var _state = this.state.clone();

          try {
            return _superClass.prototype.parseConditional.call(this, expr, noIn, startPos, startLoc);
          } catch (err) {
            if (err instanceof SyntaxError) {
              this.state = _state;
              refNeedsArrowPos.start = err.pos || this.state.start;
              return expr;
            } else {
              // istanbul ignore next: no such error is expected
              throw err;
            }
          }
        }

        this.expect(types.question);
        var state = this.state.clone();
        var originalNoArrowAt = this.state.noArrowAt;
        var node = this.startNodeAt(startPos, startLoc);

        var _tryParseConditionalC = this.tryParseConditionalConsequent(),
            consequent = _tryParseConditionalC.consequent,
            failed = _tryParseConditionalC.failed;

        var _getArrowLikeExpressi = this.getArrowLikeExpressions(consequent),
            valid = _getArrowLikeExpressi[0],
            invalid = _getArrowLikeExpressi[1];

        if (failed || invalid.length > 0) {
          var noArrowAt = originalNoArrowAt.concat();

          if (invalid.length > 0) {
            this.state = state;
            this.state.noArrowAt = noArrowAt;

            for (var i = 0; i < invalid.length; i++) {
              noArrowAt.push(invalid[i].start);
            }

            var _tryParseConditionalC2 = this.tryParseConditionalConsequent();

            consequent = _tryParseConditionalC2.consequent;
            failed = _tryParseConditionalC2.failed;

            var _getArrowLikeExpressi2 = this.getArrowLikeExpressions(consequent);

            valid = _getArrowLikeExpressi2[0];
            invalid = _getArrowLikeExpressi2[1];
          }

          if (failed && valid.length > 1) {
            // if there are two or more possible correct ways of parsing, throw an
            // error.
            // e.g.   Source: a ? (b): c => (d): e => f
            //      Result 1: a ? b : (c => ((d): e => f))
            //      Result 2: a ? ((b): c => d) : (e => f)
            this.raise(state.start, "Ambiguous expression: wrap the arrow functions in parentheses to disambiguate.");
          }

          if (failed && valid.length === 1) {
            this.state = state;
            this.state.noArrowAt = noArrowAt.concat(valid[0].start);

            var _tryParseConditionalC3 = this.tryParseConditionalConsequent();

            consequent = _tryParseConditionalC3.consequent;
            failed = _tryParseConditionalC3.failed;
          }

          this.getArrowLikeExpressions(consequent, true);
        }

        this.state.noArrowAt = originalNoArrowAt;
        this.expect(types.colon);
        node.test = expr;
        node.consequent = consequent;
        node.alternate = this.forwardNoArrowParamsConversionAt(node, function () {
          return _this3.parseMaybeAssign(noIn, undefined, undefined, undefined);
        });
        return this.finishNode(node, "ConditionalExpression");
      };

      _proto.tryParseConditionalConsequent = function tryParseConditionalConsequent() {
        this.state.noArrowParamsConversionAt.push(this.state.start);
        var consequent = this.parseMaybeAssign();
        var failed = !this.match(types.colon);
        this.state.noArrowParamsConversionAt.pop();
        return {
          consequent,
          failed
        };
      }; // Given an expression, walks throught its arrow functions whose body is
      // an expression and throught conditional expressions. It returns every
      // function which has been parsed with a return type but could have been
      // parenthesized expressions.
      // These functions are separated into two arrays: one containing the ones
      // whose parameters can be converted to assignable lists, one containing the
      // others.


      _proto.getArrowLikeExpressions = function getArrowLikeExpressions(node, disallowInvalid) {
        var _this4 = this;

        var stack = [node];
        var arrows = [];

        while (stack.length !== 0) {
          var _node = stack.pop();

          if (_node.type === "ArrowFunctionExpression") {
            if (_node.typeParameters || !_node.returnType) {
              // This is an arrow expression without ambiguity, so check its parameters
              this.toAssignableList( // node.params is Expression[] instead of $ReadOnlyArray<Pattern> because it
              // has not been converted yet.
              _node.params, true, "arrow function parameters"); // Use super's method to force the parameters to be checked

              _superClass.prototype.checkFunctionNameAndParams.call(this, _node, true);
            } else {
              arrows.push(_node);
            }

            stack.push(_node.body);
          } else if (_node.type === "ConditionalExpression") {
            stack.push(_node.consequent);
            stack.push(_node.alternate);
          }
        }

        if (disallowInvalid) {
          for (var i = 0; i < arrows.length; i++) {
            this.toAssignableList(node.params, true, "arrow function parameters");
          }

          return [arrows, []];
        }

        return partition(arrows, function (node) {
          try {
            _this4.toAssignableList(node.params, true, "arrow function parameters");

            return true;
          } catch (err) {
            return false;
          }
        });
      };

      _proto.forwardNoArrowParamsConversionAt = function forwardNoArrowParamsConversionAt(node, parse) {
        var result;

        if (this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          this.state.noArrowParamsConversionAt.push(this.state.start);
          result = parse();
          this.state.noArrowParamsConversionAt.pop();
        } else {
          result = parse();
        }

        return result;
      };

      _proto.parseParenItem = function parseParenItem(node, startPos, startLoc) {
        node = _superClass.prototype.parseParenItem.call(this, node, startPos, startLoc);

        if (this.eat(types.question)) {
          node.optional = true;
        }

        if (this.match(types.colon)) {
          var typeCastNode = this.startNodeAt(startPos, startLoc);
          typeCastNode.expression = node;
          typeCastNode.typeAnnotation = this.flowParseTypeAnnotation();
          return this.finishNode(typeCastNode, "TypeCastExpression");
        }

        return node;
      };

      _proto.assertModuleNodeAllowed = function assertModuleNodeAllowed(node) {
        if (node.type === "ImportDeclaration" && (node.importKind === "type" || node.importKind === "typeof") || node.type === "ExportNamedDeclaration" && node.exportKind === "type" || node.type === "ExportAllDeclaration" && node.exportKind === "type") {
          // Allow Flowtype imports and exports in all conditions because
          // Flow itself does not care about 'sourceType'.
          return;
        }

        _superClass.prototype.assertModuleNodeAllowed.call(this, node);
      };

      _proto.parseExport = function parseExport(node) {
        node = _superClass.prototype.parseExport.call(this, node);

        if (node.type === "ExportNamedDeclaration" || node.type === "ExportAllDeclaration") {
          node.exportKind = node.exportKind || "value";
        }

        return node;
      };

      _proto.parseExportDeclaration = function parseExportDeclaration(node) {
        if (this.isContextual("type")) {
          node.exportKind = "type";
          var declarationNode = this.startNode();
          this.next();

          if (this.match(types.braceL)) {
            // export type { foo, bar };
            node.specifiers = this.parseExportSpecifiers();
            this.parseExportFrom(node);
            return null;
          } else {
            // export type Foo = Bar;
            return this.flowParseTypeAlias(declarationNode);
          }
        } else if (this.isContextual("opaque")) {
          node.exportKind = "type";

          var _declarationNode = this.startNode();

          this.next(); // export opaque type Foo = Bar;

          return this.flowParseOpaqueType(_declarationNode, false);
        } else if (this.isContextual("interface")) {
          node.exportKind = "type";

          var _declarationNode2 = this.startNode();

          this.next();
          return this.flowParseInterface(_declarationNode2);
        } else {
          return _superClass.prototype.parseExportDeclaration.call(this, node);
        }
      };

      _proto.shouldParseExportStar = function shouldParseExportStar() {
        return _superClass.prototype.shouldParseExportStar.call(this) || this.isContextual("type") && this.lookahead().type === types.star;
      };

      _proto.parseExportStar = function parseExportStar(node) {
        if (this.eatContextual("type")) {
          node.exportKind = "type";
        }

        return _superClass.prototype.parseExportStar.call(this, node);
      };

      _proto.parseExportNamespace = function parseExportNamespace(node) {
        if (node.exportKind === "type") {
          this.unexpected();
        }

        return _superClass.prototype.parseExportNamespace.call(this, node);
      };

      _proto.parseClassId = function parseClassId(node, isStatement, optionalId) {
        _superClass.prototype.parseClassId.call(this, node, isStatement, optionalId);

        if (this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }
      }; // don't consider `void` to be a keyword as then it'll use the void token type
      // and set startExpr


      _proto.isKeyword = function isKeyword(name) {
        if (this.state.inType && name === "void") {
          return false;
        } else {
          return _superClass.prototype.isKeyword.call(this, name);
        }
      }; // ensure that inside flow types, we bypass the jsx parser plugin


      _proto.readToken = function readToken(code) {
        if (this.state.inType && (code === 62 || code === 60)) {
          return this.finishOp(types.relational, 1);
        } else {
          return _superClass.prototype.readToken.call(this, code);
        }
      };

      _proto.toAssignable = function toAssignable(node, isBinding, contextDescription) {
        if (node.type === "TypeCastExpression") {
          return _superClass.prototype.toAssignable.call(this, this.typeCastToParameter(node), isBinding, contextDescription);
        } else {
          return _superClass.prototype.toAssignable.call(this, node, isBinding, contextDescription);
        }
      }; // turn type casts that we found in function parameter head into type annotated params


      _proto.toAssignableList = function toAssignableList(exprList, isBinding, contextDescription) {
        for (var i = 0; i < exprList.length; i++) {
          var expr = exprList[i];

          if (expr && expr.type === "TypeCastExpression") {
            exprList[i] = this.typeCastToParameter(expr);
          }
        }

        return _superClass.prototype.toAssignableList.call(this, exprList, isBinding, contextDescription);
      }; // this is a list of nodes, from something like a call expression, we need to filter the
      // type casts that we've found that are illegal in this context


      _proto.toReferencedList = function toReferencedList(exprList) {
        for (var i = 0; i < exprList.length; i++) {
          var expr = exprList[i];

          if (expr && expr._exprListItem && expr.type === "TypeCastExpression") {
            this.raise(expr.start, "Unexpected type cast");
          }
        }

        return exprList;
      }; // parse an item inside a expression list eg. `(NODE, NODE)` where NODE represents
      // the position where this function is called


      _proto.parseExprListItem = function parseExprListItem(allowEmpty, refShorthandDefaultPos, refNeedsArrowPos) {
        var container = this.startNode();

        var node = _superClass.prototype.parseExprListItem.call(this, allowEmpty, refShorthandDefaultPos, refNeedsArrowPos);

        if (this.match(types.colon)) {
          container._exprListItem = true;
          container.expression = node;
          container.typeAnnotation = this.flowParseTypeAnnotation();
          return this.finishNode(container, "TypeCastExpression");
        } else {
          return node;
        }
      };

      _proto.checkLVal = function checkLVal(expr, isBinding, checkClashes, contextDescription) {
        if (expr.type !== "TypeCastExpression") {
          return _superClass.prototype.checkLVal.call(this, expr, isBinding, checkClashes, contextDescription);
        }
      }; // parse class property type annotations


      _proto.parseClassProperty = function parseClassProperty(node) {
        if (this.match(types.colon)) {
          node.typeAnnotation = this.flowParseTypeAnnotation();
        }

        return _superClass.prototype.parseClassProperty.call(this, node);
      }; // determine whether or not we're currently in the position where a class method would appear


      _proto.isClassMethod = function isClassMethod() {
        return this.isRelational("<") || _superClass.prototype.isClassMethod.call(this);
      }; // determine whether or not we're currently in the position where a class property would appear


      _proto.isClassProperty = function isClassProperty() {
        return this.match(types.colon) || _superClass.prototype.isClassProperty.call(this);
      };

      _proto.isNonstaticConstructor = function isNonstaticConstructor(method) {
        return !this.match(types.colon) && _superClass.prototype.isNonstaticConstructor.call(this, method);
      }; // parse type parameters for class methods


      _proto.pushClassMethod = function pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor) {
        if (method.variance) {
          this.unexpected(method.variance.start);
        }

        delete method.variance;

        if (this.isRelational("<")) {
          method.typeParameters = this.flowParseTypeParameterDeclaration();
        }

        _superClass.prototype.pushClassMethod.call(this, classBody, method, isGenerator, isAsync, isConstructor);
      };

      _proto.pushClassPrivateMethod = function pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
        if (method.variance) {
          this.unexpected(method.variance.start);
        }

        delete method.variance;

        if (this.isRelational("<")) {
          method.typeParameters = this.flowParseTypeParameterDeclaration();
        }

        _superClass.prototype.pushClassPrivateMethod.call(this, classBody, method, isGenerator, isAsync);
      }; // parse a the super class type parameters and implements


      _proto.parseClassSuper = function parseClassSuper(node) {
        _superClass.prototype.parseClassSuper.call(this, node);

        if (node.superClass && this.isRelational("<")) {
          node.superTypeParameters = this.flowParseTypeParameterInstantiation();
        }

        if (this.isContextual("implements")) {
          this.next();
          var implemented = node.implements = [];

          do {
            var _node2 = this.startNode();

            _node2.id = this.flowParseRestrictedIdentifier(
            /*liberal*/
            true);

            if (this.isRelational("<")) {
              _node2.typeParameters = this.flowParseTypeParameterInstantiation();
            } else {
              _node2.typeParameters = null;
            }

            implemented.push(this.finishNode(_node2, "ClassImplements"));
          } while (this.eat(types.comma));
        }
      };

      _proto.parsePropertyName = function parsePropertyName(node) {
        var variance = this.flowParseVariance();

        var key = _superClass.prototype.parsePropertyName.call(this, node); // $FlowIgnore ("variance" not defined on TsNamedTypeElementBase)


        node.variance = variance;
        return key;
      }; // parse type parameters for object method shorthand


      _proto.parseObjPropValue = function parseObjPropValue(prop, startPos, startLoc, isGenerator, isAsync, isPattern, refShorthandDefaultPos) {
        if (prop.variance) {
          this.unexpected(prop.variance.start);
        }

        delete prop.variance;
        var typeParameters; // method shorthand

        if (this.isRelational("<")) {
          typeParameters = this.flowParseTypeParameterDeclaration();
          if (!this.match(types.parenL)) this.unexpected();
        }

        _superClass.prototype.parseObjPropValue.call(this, prop, startPos, startLoc, isGenerator, isAsync, isPattern, refShorthandDefaultPos); // add typeParameters if we found them


        if (typeParameters) {
          // $FlowFixMe (trying to set '.typeParameters' on an expression)
          (prop.value || prop).typeParameters = typeParameters;
        }
      };

      _proto.parseAssignableListItemTypes = function parseAssignableListItemTypes(param) {
        if (this.eat(types.question)) {
          if (param.type !== "Identifier") {
            throw this.raise(param.start, "A binding pattern parameter cannot be optional in an implementation signature.");
          }

          param.optional = true;
        }

        if (this.match(types.colon)) {
          param.typeAnnotation = this.flowParseTypeAnnotation();
        }

        this.finishNode(param, param.type);
        return param;
      };

      _proto.parseMaybeDefault = function parseMaybeDefault(startPos, startLoc, left) {
        var node = _superClass.prototype.parseMaybeDefault.call(this, startPos, startLoc, left);

        if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
          this.raise(node.typeAnnotation.start, "Type annotations must come before default assignments, e.g. instead of `age = 25: number` use `age: number = 25`");
        }

        return node;
      };

      _proto.shouldParseDefaultImport = function shouldParseDefaultImport(node) {
        if (!hasTypeImportKind(node)) {
          return _superClass.prototype.shouldParseDefaultImport.call(this, node);
        }

        return isMaybeDefaultImport(this.state);
      };

      _proto.parseImportSpecifierLocal = function parseImportSpecifierLocal(node, specifier, type, contextDescription) {
        specifier.local = hasTypeImportKind(node) ? this.flowParseRestrictedIdentifier(true) : this.parseIdentifier();
        this.checkLVal(specifier.local, true, undefined, contextDescription);
        node.specifiers.push(this.finishNode(specifier, type));
      }; // parse typeof and type imports


      _proto.parseImportSpecifiers = function parseImportSpecifiers(node) {
        node.importKind = "value";
        var kind = null;

        if (this.match(types._typeof)) {
          kind = "typeof";
        } else if (this.isContextual("type")) {
          kind = "type";
        }

        if (kind) {
          var lh = this.lookahead();

          if (isMaybeDefaultImport(lh) || lh.type === types.braceL || lh.type === types.star) {
            this.next();
            node.importKind = kind;
          }
        }

        _superClass.prototype.parseImportSpecifiers.call(this, node);
      }; // parse import-type/typeof shorthand


      _proto.parseImportSpecifier = function parseImportSpecifier(node) {
        var specifier = this.startNode();
        var firstIdentLoc = this.state.start;
        var firstIdent = this.parseIdentifier(true);
        var specifierTypeKind = null;

        if (firstIdent.name === "type") {
          specifierTypeKind = "type";
        } else if (firstIdent.name === "typeof") {
          specifierTypeKind = "typeof";
        }

        var isBinding = false;

        if (this.isContextual("as") && !this.isLookaheadContextual("as")) {
          var as_ident = this.parseIdentifier(true);

          if (specifierTypeKind !== null && !this.match(types.name) && !this.state.type.keyword) {
            // `import {type as ,` or `import {type as }`
            specifier.imported = as_ident;
            specifier.importKind = specifierTypeKind;
            specifier.local = as_ident.__clone();
          } else {
            // `import {type as foo`
            specifier.imported = firstIdent;
            specifier.importKind = null;
            specifier.local = this.parseIdentifier();
          }
        } else if (specifierTypeKind !== null && (this.match(types.name) || this.state.type.keyword)) {
          // `import {type foo`
          specifier.imported = this.parseIdentifier(true);
          specifier.importKind = specifierTypeKind;

          if (this.eatContextual("as")) {
            specifier.local = this.parseIdentifier();
          } else {
            isBinding = true;
            specifier.local = specifier.imported.__clone();
          }
        } else {
          isBinding = true;
          specifier.imported = firstIdent;
          specifier.importKind = null;
          specifier.local = specifier.imported.__clone();
        }

        var nodeIsTypeImport = hasTypeImportKind(node);
        var specifierIsTypeImport = hasTypeImportKind(specifier);

        if (nodeIsTypeImport && specifierIsTypeImport) {
          this.raise(firstIdentLoc, "The `type` and `typeof` keywords on named imports can only be used on regular `import` statements. It cannot be used with `import type` or `import typeof` statements");
        }

        if (nodeIsTypeImport || specifierIsTypeImport) {
          this.checkReservedType(specifier.local.name, specifier.local.start);
        }

        if (isBinding && !nodeIsTypeImport && !specifierIsTypeImport) {
          this.checkReservedWord(specifier.local.name, specifier.start, true, true);
        }

        this.checkLVal(specifier.local, true, undefined, "import specifier");
        node.specifiers.push(this.finishNode(specifier, "ImportSpecifier"));
      }; // parse function type parameters - function foo<T>() {}


      _proto.parseFunctionParams = function parseFunctionParams(node) {
        // $FlowFixMe
        var kind = node.kind;

        if (kind !== "get" && kind !== "set" && this.isRelational("<")) {
          node.typeParameters = this.flowParseTypeParameterDeclaration();
        }

        _superClass.prototype.parseFunctionParams.call(this, node);
      }; // parse flow type annotations on variable declarator heads - let foo: string = bar


      _proto.parseVarHead = function parseVarHead(decl) {
        _superClass.prototype.parseVarHead.call(this, decl);

        if (this.match(types.colon)) {
          decl.id.typeAnnotation = this.flowParseTypeAnnotation();
          this.finishNode(decl.id, decl.id.type);
        }
      }; // parse the return type of an async arrow function - let foo = (async (): number => {});


      _proto.parseAsyncArrowFromCallExpression = function parseAsyncArrowFromCallExpression(node, call) {
        if (this.match(types.colon)) {
          var oldNoAnonFunctionType = this.state.noAnonFunctionType;
          this.state.noAnonFunctionType = true;
          node.returnType = this.flowParseTypeAnnotation();
          this.state.noAnonFunctionType = oldNoAnonFunctionType;
        }

        return _superClass.prototype.parseAsyncArrowFromCallExpression.call(this, node, call);
      }; // todo description


      _proto.shouldParseAsyncArrow = function shouldParseAsyncArrow() {
        return this.match(types.colon) || _superClass.prototype.shouldParseAsyncArrow.call(this);
      }; // We need to support type parameter declarations for arrow functions. This
      // is tricky. There are three situations we need to handle
      //
      // 1. This is either JSX or an arrow function. We'll try JSX first. If that
      //    fails, we'll try an arrow function. If that fails, we'll throw the JSX
      //    error.
      // 2. This is an arrow function. We'll parse the type parameter declaration,
      //    parse the rest, make sure the rest is an arrow function, and go from
      //    there
      // 3. This is neither. Just call the super method


      _proto.parseMaybeAssign = function parseMaybeAssign(noIn, refShorthandDefaultPos, afterLeftParse, refNeedsArrowPos) {
        var _this5 = this;

        var jsxError = null;

        if (types.jsxTagStart && this.match(types.jsxTagStart)) {
          var state = this.state.clone();

          try {
            return _superClass.prototype.parseMaybeAssign.call(this, noIn, refShorthandDefaultPos, afterLeftParse, refNeedsArrowPos);
          } catch (err) {
            if (err instanceof SyntaxError) {
              this.state = state; // Remove `tc.j_expr` and `tc.j_oTag` from context added
              // by parsing `jsxTagStart` to stop the JSX plugin from
              // messing with the tokens

              this.state.context.length -= 2;
              jsxError = err;
            } else {
              // istanbul ignore next: no such error is expected
              throw err;
            }
          }
        }

        if (jsxError != null || this.isRelational("<")) {
          var arrowExpression;
          var typeParameters;

          try {
            typeParameters = this.flowParseTypeParameterDeclaration();
            arrowExpression = this.forwardNoArrowParamsConversionAt(typeParameters, function () {
              return _superClass.prototype.parseMaybeAssign.call(_this5, noIn, refShorthandDefaultPos, afterLeftParse, refNeedsArrowPos);
            });
            arrowExpression.typeParameters = typeParameters;
            this.resetStartLocationFromNode(arrowExpression, typeParameters);
          } catch (err) {
            throw jsxError || err;
          }

          if (arrowExpression.type === "ArrowFunctionExpression") {
            return arrowExpression;
          } else if (jsxError != null) {
            throw jsxError;
          } else {
            this.raise(typeParameters.start, "Expected an arrow function after this type parameter declaration");
          }
        }

        return _superClass.prototype.parseMaybeAssign.call(this, noIn, refShorthandDefaultPos, afterLeftParse, refNeedsArrowPos);
      }; // handle return types for arrow functions


      _proto.parseArrow = function parseArrow(node) {
        if (this.match(types.colon)) {
          var state = this.state.clone();

          try {
            var oldNoAnonFunctionType = this.state.noAnonFunctionType;
            this.state.noAnonFunctionType = true;
            var typeNode = this.startNode();

            var _flowParseTypeAndPred3 = this.flowParseTypeAndPredicateInitialiser();

            // $FlowFixMe (destructuring not supported yet)
            typeNode.typeAnnotation = _flowParseTypeAndPred3[0];
            // $FlowFixMe (destructuring not supported yet)
            node.predicate = _flowParseTypeAndPred3[1];
            this.state.noAnonFunctionType = oldNoAnonFunctionType;
            if (this.canInsertSemicolon()) this.unexpected();
            if (!this.match(types.arrow)) this.unexpected(); // assign after it is clear it is an arrow

            node.returnType = typeNode.typeAnnotation ? this.finishNode(typeNode, "TypeAnnotation") : null;
          } catch (err) {
            if (err instanceof SyntaxError) {
              this.state = state;
            } else {
              // istanbul ignore next: no such error is expected
              throw err;
            }
          }
        }

        return _superClass.prototype.parseArrow.call(this, node);
      };

      _proto.shouldParseArrow = function shouldParseArrow() {
        return this.match(types.colon) || _superClass.prototype.shouldParseArrow.call(this);
      };

      _proto.setArrowFunctionParameters = function setArrowFunctionParameters(node, params) {
        if (this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          node.params = params;
        } else {
          _superClass.prototype.setArrowFunctionParameters.call(this, node, params);
        }
      };

      _proto.checkFunctionNameAndParams = function checkFunctionNameAndParams(node, isArrowFunction) {
        if (isArrowFunction && this.state.noArrowParamsConversionAt.indexOf(node.start) !== -1) {
          return;
        }

        return _superClass.prototype.checkFunctionNameAndParams.call(this, node, isArrowFunction);
      };

      _proto.parseParenAndDistinguishExpression = function parseParenAndDistinguishExpression(canBeArrow) {
        return _superClass.prototype.parseParenAndDistinguishExpression.call(this, canBeArrow && this.state.noArrowAt.indexOf(this.state.start) === -1);
      };

      _proto.parseSubscripts = function parseSubscripts(base, startPos, startLoc, noCalls) {
        if (base.type === "Identifier" && base.name === "async" && this.state.noArrowAt.indexOf(startPos) !== -1) {
          this.next();
          var node = this.startNodeAt(startPos, startLoc);
          node.callee = base;
          node.arguments = this.parseCallExpressionArguments(types.parenR, false);
          base = this.finishNode(node, "CallExpression");
        } else if (base.type === "Identifier" && base.name === "async" && this.isRelational("<")) {
          var state = this.state.clone();
          var error;

          try {
            var _node3 = this.parseAsyncArrowWithTypeParameters(startPos, startLoc);

            if (_node3) return _node3;
          } catch (e) {
            error = e;
          }

          this.state = state;

          try {
            return _superClass.prototype.parseSubscripts.call(this, base, startPos, startLoc, noCalls);
          } catch (e) {
            throw error || e;
          }
        }

        return _superClass.prototype.parseSubscripts.call(this, base, startPos, startLoc, noCalls);
      };

      _proto.parseAsyncArrowWithTypeParameters = function parseAsyncArrowWithTypeParameters(startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);
        this.parseFunctionParams(node);
        if (!this.parseArrow(node)) return;
        return this.parseArrowExpression(node,
        /* params */
        undefined,
        /* isAsync */
        true);
      };

      return _class;
    }(superClass)
  );
});

var entities = {
  quot: "\u0022",
  amp: "&",
  apos: "\u0027",
  lt: "<",
  gt: ">",
  nbsp: "\u00A0",
  iexcl: "\u00A1",
  cent: "\u00A2",
  pound: "\u00A3",
  curren: "\u00A4",
  yen: "\u00A5",
  brvbar: "\u00A6",
  sect: "\u00A7",
  uml: "\u00A8",
  copy: "\u00A9",
  ordf: "\u00AA",
  laquo: "\u00AB",
  not: "\u00AC",
  shy: "\u00AD",
  reg: "\u00AE",
  macr: "\u00AF",
  deg: "\u00B0",
  plusmn: "\u00B1",
  sup2: "\u00B2",
  sup3: "\u00B3",
  acute: "\u00B4",
  micro: "\u00B5",
  para: "\u00B6",
  middot: "\u00B7",
  cedil: "\u00B8",
  sup1: "\u00B9",
  ordm: "\u00BA",
  raquo: "\u00BB",
  frac14: "\u00BC",
  frac12: "\u00BD",
  frac34: "\u00BE",
  iquest: "\u00BF",
  Agrave: "\u00C0",
  Aacute: "\u00C1",
  Acirc: "\u00C2",
  Atilde: "\u00C3",
  Auml: "\u00C4",
  Aring: "\u00C5",
  AElig: "\u00C6",
  Ccedil: "\u00C7",
  Egrave: "\u00C8",
  Eacute: "\u00C9",
  Ecirc: "\u00CA",
  Euml: "\u00CB",
  Igrave: "\u00CC",
  Iacute: "\u00CD",
  Icirc: "\u00CE",
  Iuml: "\u00CF",
  ETH: "\u00D0",
  Ntilde: "\u00D1",
  Ograve: "\u00D2",
  Oacute: "\u00D3",
  Ocirc: "\u00D4",
  Otilde: "\u00D5",
  Ouml: "\u00D6",
  times: "\u00D7",
  Oslash: "\u00D8",
  Ugrave: "\u00D9",
  Uacute: "\u00DA",
  Ucirc: "\u00DB",
  Uuml: "\u00DC",
  Yacute: "\u00DD",
  THORN: "\u00DE",
  szlig: "\u00DF",
  agrave: "\u00E0",
  aacute: "\u00E1",
  acirc: "\u00E2",
  atilde: "\u00E3",
  auml: "\u00E4",
  aring: "\u00E5",
  aelig: "\u00E6",
  ccedil: "\u00E7",
  egrave: "\u00E8",
  eacute: "\u00E9",
  ecirc: "\u00EA",
  euml: "\u00EB",
  igrave: "\u00EC",
  iacute: "\u00ED",
  icirc: "\u00EE",
  iuml: "\u00EF",
  eth: "\u00F0",
  ntilde: "\u00F1",
  ograve: "\u00F2",
  oacute: "\u00F3",
  ocirc: "\u00F4",
  otilde: "\u00F5",
  ouml: "\u00F6",
  divide: "\u00F7",
  oslash: "\u00F8",
  ugrave: "\u00F9",
  uacute: "\u00FA",
  ucirc: "\u00FB",
  uuml: "\u00FC",
  yacute: "\u00FD",
  thorn: "\u00FE",
  yuml: "\u00FF",
  OElig: "\u0152",
  oelig: "\u0153",
  Scaron: "\u0160",
  scaron: "\u0161",
  Yuml: "\u0178",
  fnof: "\u0192",
  circ: "\u02C6",
  tilde: "\u02DC",
  Alpha: "\u0391",
  Beta: "\u0392",
  Gamma: "\u0393",
  Delta: "\u0394",
  Epsilon: "\u0395",
  Zeta: "\u0396",
  Eta: "\u0397",
  Theta: "\u0398",
  Iota: "\u0399",
  Kappa: "\u039A",
  Lambda: "\u039B",
  Mu: "\u039C",
  Nu: "\u039D",
  Xi: "\u039E",
  Omicron: "\u039F",
  Pi: "\u03A0",
  Rho: "\u03A1",
  Sigma: "\u03A3",
  Tau: "\u03A4",
  Upsilon: "\u03A5",
  Phi: "\u03A6",
  Chi: "\u03A7",
  Psi: "\u03A8",
  Omega: "\u03A9",
  alpha: "\u03B1",
  beta: "\u03B2",
  gamma: "\u03B3",
  delta: "\u03B4",
  epsilon: "\u03B5",
  zeta: "\u03B6",
  eta: "\u03B7",
  theta: "\u03B8",
  iota: "\u03B9",
  kappa: "\u03BA",
  lambda: "\u03BB",
  mu: "\u03BC",
  nu: "\u03BD",
  xi: "\u03BE",
  omicron: "\u03BF",
  pi: "\u03C0",
  rho: "\u03C1",
  sigmaf: "\u03C2",
  sigma: "\u03C3",
  tau: "\u03C4",
  upsilon: "\u03C5",
  phi: "\u03C6",
  chi: "\u03C7",
  psi: "\u03C8",
  omega: "\u03C9",
  thetasym: "\u03D1",
  upsih: "\u03D2",
  piv: "\u03D6",
  ensp: "\u2002",
  emsp: "\u2003",
  thinsp: "\u2009",
  zwnj: "\u200C",
  zwj: "\u200D",
  lrm: "\u200E",
  rlm: "\u200F",
  ndash: "\u2013",
  mdash: "\u2014",
  lsquo: "\u2018",
  rsquo: "\u2019",
  sbquo: "\u201A",
  ldquo: "\u201C",
  rdquo: "\u201D",
  bdquo: "\u201E",
  dagger: "\u2020",
  Dagger: "\u2021",
  bull: "\u2022",
  hellip: "\u2026",
  permil: "\u2030",
  prime: "\u2032",
  Prime: "\u2033",
  lsaquo: "\u2039",
  rsaquo: "\u203A",
  oline: "\u203E",
  frasl: "\u2044",
  euro: "\u20AC",
  image: "\u2111",
  weierp: "\u2118",
  real: "\u211C",
  trade: "\u2122",
  alefsym: "\u2135",
  larr: "\u2190",
  uarr: "\u2191",
  rarr: "\u2192",
  darr: "\u2193",
  harr: "\u2194",
  crarr: "\u21B5",
  lArr: "\u21D0",
  uArr: "\u21D1",
  rArr: "\u21D2",
  dArr: "\u21D3",
  hArr: "\u21D4",
  forall: "\u2200",
  part: "\u2202",
  exist: "\u2203",
  empty: "\u2205",
  nabla: "\u2207",
  isin: "\u2208",
  notin: "\u2209",
  ni: "\u220B",
  prod: "\u220F",
  sum: "\u2211",
  minus: "\u2212",
  lowast: "\u2217",
  radic: "\u221A",
  prop: "\u221D",
  infin: "\u221E",
  ang: "\u2220",
  and: "\u2227",
  or: "\u2228",
  cap: "\u2229",
  cup: "\u222A",
  int: "\u222B",
  there4: "\u2234",
  sim: "\u223C",
  cong: "\u2245",
  asymp: "\u2248",
  ne: "\u2260",
  equiv: "\u2261",
  le: "\u2264",
  ge: "\u2265",
  sub: "\u2282",
  sup: "\u2283",
  nsub: "\u2284",
  sube: "\u2286",
  supe: "\u2287",
  oplus: "\u2295",
  otimes: "\u2297",
  perp: "\u22A5",
  sdot: "\u22C5",
  lceil: "\u2308",
  rceil: "\u2309",
  lfloor: "\u230A",
  rfloor: "\u230B",
  lang: "\u2329",
  rang: "\u232A",
  loz: "\u25CA",
  spades: "\u2660",
  clubs: "\u2663",
  hearts: "\u2665",
  diams: "\u2666"
};

var HEX_NUMBER = /^[\da-fA-F]+$/;
var DECIMAL_NUMBER = /^\d+$/;
types$1.j_oTag = new TokContext("<tag", false);
types$1.j_cTag = new TokContext("</tag", false);
types$1.j_expr = new TokContext("<tag>...</tag>", true, true);
types.jsxName = new TokenType("jsxName");
types.jsxText = new TokenType("jsxText", {
  beforeExpr: true
});
types.jsxTagStart = new TokenType("jsxTagStart", {
  startsExpr: true
});
types.jsxTagEnd = new TokenType("jsxTagEnd");

types.jsxTagStart.updateContext = function () {
  this.state.context.push(types$1.j_expr); // treat as beginning of JSX expression

  this.state.context.push(types$1.j_oTag); // start opening tag context

  this.state.exprAllowed = false;
};

types.jsxTagEnd.updateContext = function (prevType) {
  var out = this.state.context.pop();

  if (out === types$1.j_oTag && prevType === types.slash || out === types$1.j_cTag) {
    this.state.context.pop();
    this.state.exprAllowed = this.curContext() === types$1.j_expr;
  } else {
    this.state.exprAllowed = true;
  }
};

function isFragment(object) {
  return object ? object.type === "JSXOpeningFragment" || object.type === "JSXClosingFragment" : false;
} // Transforms JSX element name to string.


function getQualifiedJSXName(object) {
  if (object.type === "JSXIdentifier") {
    return object.name;
  }

  if (object.type === "JSXNamespacedName") {
    return object.namespace.name + ":" + object.name.name;
  }

  if (object.type === "JSXMemberExpression") {
    return getQualifiedJSXName(object.object) + "." + getQualifiedJSXName(object.property);
  } // istanbul ignore next


  throw new Error("Node had unexpected type: " + object.type);
}

var jsxPlugin = (function (superClass) {
  return (
    /*#__PURE__*/
    function (_superClass) {
      _inheritsLoose(_class, _superClass);

      function _class() {
        return _superClass.apply(this, arguments) || this;
      }

      var _proto = _class.prototype;

      // Reads inline JSX contents token.
      _proto.jsxReadToken = function jsxReadToken() {
        var out = "";
        var chunkStart = this.state.pos;

        for (;;) {
          if (this.state.pos >= this.input.length) {
            this.raise(this.state.start, "Unterminated JSX contents");
          }

          var ch = this.input.charCodeAt(this.state.pos);

          switch (ch) {
            case 60:
            case 123:
              if (this.state.pos === this.state.start) {
                if (ch === 60 && this.state.exprAllowed) {
                  ++this.state.pos;
                  return this.finishToken(types.jsxTagStart);
                }

                return this.getTokenFromCode(ch);
              }

              out += this.input.slice(chunkStart, this.state.pos);
              return this.finishToken(types.jsxText, out);

            case 38:
              out += this.input.slice(chunkStart, this.state.pos);
              out += this.jsxReadEntity();
              chunkStart = this.state.pos;
              break;

            default:
              if (isNewLine(ch)) {
                out += this.input.slice(chunkStart, this.state.pos);
                out += this.jsxReadNewLine(true);
                chunkStart = this.state.pos;
              } else {
                ++this.state.pos;
              }

          }
        }
      };

      _proto.jsxReadNewLine = function jsxReadNewLine(normalizeCRLF) {
        var ch = this.input.charCodeAt(this.state.pos);
        var out;
        ++this.state.pos;

        if (ch === 13 && this.input.charCodeAt(this.state.pos) === 10) {
          ++this.state.pos;
          out = normalizeCRLF ? "\n" : "\r\n";
        } else {
          out = String.fromCharCode(ch);
        }

        ++this.state.curLine;
        this.state.lineStart = this.state.pos;
        return out;
      };

      _proto.jsxReadString = function jsxReadString(quote) {
        var out = "";
        var chunkStart = ++this.state.pos;

        for (;;) {
          if (this.state.pos >= this.input.length) {
            this.raise(this.state.start, "Unterminated string constant");
          }

          var ch = this.input.charCodeAt(this.state.pos);
          if (ch === quote) break;

          if (ch === 38) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadEntity();
            chunkStart = this.state.pos;
          } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.state.pos);
            out += this.jsxReadNewLine(false);
            chunkStart = this.state.pos;
          } else {
            ++this.state.pos;
          }
        }

        out += this.input.slice(chunkStart, this.state.pos++);
        return this.finishToken(types.string, out);
      };

      _proto.jsxReadEntity = function jsxReadEntity() {
        var str = "";
        var count = 0;
        var entity;
        var ch = this.input[this.state.pos];
        var startPos = ++this.state.pos;

        while (this.state.pos < this.input.length && count++ < 10) {
          ch = this.input[this.state.pos++];

          if (ch === ";") {
            if (str[0] === "#") {
              if (str[1] === "x") {
                str = str.substr(2);

                if (HEX_NUMBER.test(str)) {
                  entity = String.fromCodePoint(parseInt(str, 16));
                }
              } else {
                str = str.substr(1);

                if (DECIMAL_NUMBER.test(str)) {
                  entity = String.fromCodePoint(parseInt(str, 10));
                }
              }
            } else {
              entity = entities[str];
            }

            break;
          }

          str += ch;
        }

        if (!entity) {
          this.state.pos = startPos;
          return "&";
        }

        return entity;
      }; // Read a JSX identifier (valid tag or attribute name).
      //
      // Optimized version since JSX identifiers can"t contain
      // escape characters and so can be read as single slice.
      // Also assumes that first character was already checked
      // by isIdentifierStart in readToken.


      _proto.jsxReadWord = function jsxReadWord() {
        var ch;
        var start = this.state.pos;

        do {
          ch = this.input.charCodeAt(++this.state.pos);
        } while (isIdentifierChar(ch) || ch === 45);

        return this.finishToken(types.jsxName, this.input.slice(start, this.state.pos));
      }; // Parse next token as JSX identifier


      _proto.jsxParseIdentifier = function jsxParseIdentifier() {
        var node = this.startNode();

        if (this.match(types.jsxName)) {
          node.name = this.state.value;
        } else if (this.state.type.keyword) {
          node.name = this.state.type.keyword;
        } else {
          this.unexpected();
        }

        this.next();
        return this.finishNode(node, "JSXIdentifier");
      }; // Parse namespaced identifier.


      _proto.jsxParseNamespacedName = function jsxParseNamespacedName() {
        var startPos = this.state.start;
        var startLoc = this.state.startLoc;
        var name = this.jsxParseIdentifier();
        if (!this.eat(types.colon)) return name;
        var node = this.startNodeAt(startPos, startLoc);
        node.namespace = name;
        node.name = this.jsxParseIdentifier();
        return this.finishNode(node, "JSXNamespacedName");
      }; // Parses element name in any form - namespaced, member
      // or single identifier.


      _proto.jsxParseElementName = function jsxParseElementName() {
        var startPos = this.state.start;
        var startLoc = this.state.startLoc;
        var node = this.jsxParseNamespacedName();

        while (this.eat(types.dot)) {
          var newNode = this.startNodeAt(startPos, startLoc);
          newNode.object = node;
          newNode.property = this.jsxParseIdentifier();
          node = this.finishNode(newNode, "JSXMemberExpression");
        }

        return node;
      }; // Parses any type of JSX attribute value.


      _proto.jsxParseAttributeValue = function jsxParseAttributeValue() {
        var node;

        switch (this.state.type) {
          case types.braceL:
            node = this.jsxParseExpressionContainer();

            if (node.expression.type === "JSXEmptyExpression") {
              throw this.raise(node.start, "JSX attributes must only be assigned a non-empty expression");
            } else {
              return node;
            }

          case types.jsxTagStart:
          case types.string:
            return this.parseExprAtom();

          default:
            throw this.raise(this.state.start, "JSX value should be either an expression or a quoted JSX text");
        }
      }; // JSXEmptyExpression is unique type since it doesn't actually parse anything,
      // and so it should start at the end of last read token (left brace) and finish
      // at the beginning of the next one (right brace).


      _proto.jsxParseEmptyExpression = function jsxParseEmptyExpression() {
        var node = this.startNodeAt(this.state.lastTokEnd, this.state.lastTokEndLoc);
        return this.finishNodeAt(node, "JSXEmptyExpression", this.state.start, this.state.startLoc);
      }; // Parse JSX spread child


      _proto.jsxParseSpreadChild = function jsxParseSpreadChild() {
        var node = this.startNode();
        this.expect(types.braceL);
        this.expect(types.ellipsis);
        node.expression = this.parseExpression();
        this.expect(types.braceR);
        return this.finishNode(node, "JSXSpreadChild");
      }; // Parses JSX expression enclosed into curly brackets.


      _proto.jsxParseExpressionContainer = function jsxParseExpressionContainer() {
        var node = this.startNode();
        this.next();

        if (this.match(types.braceR)) {
          node.expression = this.jsxParseEmptyExpression();
        } else {
          node.expression = this.parseExpression();
        }

        this.expect(types.braceR);
        return this.finishNode(node, "JSXExpressionContainer");
      }; // Parses following JSX attribute name-value pair.


      _proto.jsxParseAttribute = function jsxParseAttribute() {
        var node = this.startNode();

        if (this.eat(types.braceL)) {
          this.expect(types.ellipsis);
          node.argument = this.parseMaybeAssign();
          this.expect(types.braceR);
          return this.finishNode(node, "JSXSpreadAttribute");
        }

        node.name = this.jsxParseNamespacedName();
        node.value = this.eat(types.eq) ? this.jsxParseAttributeValue() : null;
        return this.finishNode(node, "JSXAttribute");
      }; // Parses JSX opening tag starting after "<".


      _proto.jsxParseOpeningElementAt = function jsxParseOpeningElementAt(startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);

        if (this.match(types.jsxTagEnd)) {
          this.expect(types.jsxTagEnd);
          return this.finishNode(node, "JSXOpeningFragment");
        }

        node.attributes = [];
        node.name = this.jsxParseElementName();

        while (!this.match(types.slash) && !this.match(types.jsxTagEnd)) {
          node.attributes.push(this.jsxParseAttribute());
        }

        node.selfClosing = this.eat(types.slash);
        this.expect(types.jsxTagEnd);
        return this.finishNode(node, "JSXOpeningElement");
      }; // Parses JSX closing tag starting after "</".


      _proto.jsxParseClosingElementAt = function jsxParseClosingElementAt(startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);

        if (this.match(types.jsxTagEnd)) {
          this.expect(types.jsxTagEnd);
          return this.finishNode(node, "JSXClosingFragment");
        }

        node.name = this.jsxParseElementName();
        this.expect(types.jsxTagEnd);
        return this.finishNode(node, "JSXClosingElement");
      }; // Parses entire JSX element, including it"s opening tag
      // (starting after "<"), attributes, contents and closing tag.


      _proto.jsxParseElementAt = function jsxParseElementAt(startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);
        var children = [];
        var openingElement = this.jsxParseOpeningElementAt(startPos, startLoc);
        var closingElement = null;

        if (!openingElement.selfClosing) {
          contents: for (;;) {
            switch (this.state.type) {
              case types.jsxTagStart:
                startPos = this.state.start;
                startLoc = this.state.startLoc;
                this.next();

                if (this.eat(types.slash)) {
                  closingElement = this.jsxParseClosingElementAt(startPos, startLoc);
                  break contents;
                }

                children.push(this.jsxParseElementAt(startPos, startLoc));
                break;

              case types.jsxText:
                children.push(this.parseExprAtom());
                break;

              case types.braceL:
                if (this.lookahead().type === types.ellipsis) {
                  children.push(this.jsxParseSpreadChild());
                } else {
                  children.push(this.jsxParseExpressionContainer());
                }

                break;
              // istanbul ignore next - should never happen

              default:
                throw this.unexpected();
            }
          }

          if (isFragment(openingElement) && !isFragment(closingElement)) {
            this.raise( // $FlowIgnore
            closingElement.start, "Expected corresponding JSX closing tag for <>");
          } else if (!isFragment(openingElement) && isFragment(closingElement)) {
            this.raise( // $FlowIgnore
            closingElement.start, "Expected corresponding JSX closing tag for <" + getQualifiedJSXName(openingElement.name) + ">");
          } else if (!isFragment(openingElement) && !isFragment(closingElement)) {
            if ( // $FlowIgnore
            getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
              this.raise( // $FlowIgnore
              closingElement.start, "Expected corresponding JSX closing tag for <" + getQualifiedJSXName(openingElement.name) + ">");
            }
          }
        }

        if (isFragment(openingElement)) {
          node.openingFragment = openingElement;
          node.closingFragment = closingElement;
        } else {
          node.openingElement = openingElement;
          node.closingElement = closingElement;
        }

        node.children = children;

        if (this.match(types.relational) && this.state.value === "<") {
          this.raise(this.state.start, "Adjacent JSX elements must be wrapped in an enclosing tag");
        }

        return isFragment(openingElement) ? this.finishNode(node, "JSXFragment") : this.finishNode(node, "JSXElement");
      }; // Parses entire JSX element from current position.


      _proto.jsxParseElement = function jsxParseElement() {
        var startPos = this.state.start;
        var startLoc = this.state.startLoc;
        this.next();
        return this.jsxParseElementAt(startPos, startLoc);
      }; // ==================================
      // Overrides
      // ==================================


      _proto.parseExprAtom = function parseExprAtom(refShortHandDefaultPos) {
        if (this.match(types.jsxText)) {
          return this.parseLiteral(this.state.value, "JSXText");
        } else if (this.match(types.jsxTagStart)) {
          return this.jsxParseElement();
        } else {
          return _superClass.prototype.parseExprAtom.call(this, refShortHandDefaultPos);
        }
      };

      _proto.readToken = function readToken(code) {
        if (this.state.inPropertyName) return _superClass.prototype.readToken.call(this, code);
        var context = this.curContext();

        if (context === types$1.j_expr) {
          return this.jsxReadToken();
        }

        if (context === types$1.j_oTag || context === types$1.j_cTag) {
          if (isIdentifierStart(code)) {
            return this.jsxReadWord();
          }

          if (code === 62) {
            ++this.state.pos;
            return this.finishToken(types.jsxTagEnd);
          }

          if ((code === 34 || code === 39) && context === types$1.j_oTag) {
            return this.jsxReadString(code);
          }
        }

        if (code === 60 && this.state.exprAllowed) {
          ++this.state.pos;
          return this.finishToken(types.jsxTagStart);
        }

        return _superClass.prototype.readToken.call(this, code);
      };

      _proto.updateContext = function updateContext(prevType) {
        if (this.match(types.braceL)) {
          var curContext = this.curContext();

          if (curContext === types$1.j_oTag) {
            this.state.context.push(types$1.braceExpression);
          } else if (curContext === types$1.j_expr) {
            this.state.context.push(types$1.templateQuasi);
          } else {
            _superClass.prototype.updateContext.call(this, prevType);
          }

          this.state.exprAllowed = true;
        } else if (this.match(types.slash) && prevType === types.jsxTagStart) {
          this.state.context.length -= 2; // do not consider JSX expr -> JSX open tag -> ... anymore

          this.state.context.push(types$1.j_cTag); // reconsider as closing tag context

          this.state.exprAllowed = false;
        } else {
          return _superClass.prototype.updateContext.call(this, prevType);
        }
      };

      return _class;
    }(superClass)
  );
});

function nonNull(x) {
  if (x == null) {
    // $FlowIgnore
    throw new Error(`Unexpected ${x} value.`);
  }

  return x;
}

function assert(x) {
  if (!x) {
    throw new Error("Assert fail");
  }
}

// Doesn't handle "void" or "null" because those are keywords, not identifiers.
function keywordTypeFromName(value) {
  switch (value) {
    case "any":
      return "TSAnyKeyword";

    case "boolean":
      return "TSBooleanKeyword";

    case "never":
      return "TSNeverKeyword";

    case "number":
      return "TSNumberKeyword";

    case "object":
      return "TSObjectKeyword";

    case "string":
      return "TSStringKeyword";

    case "symbol":
      return "TSSymbolKeyword";

    case "undefined":
      return "TSUndefinedKeyword";

    default:
      return undefined;
  }
}

var typescriptPlugin = (function (superClass) {
  return (
    /*#__PURE__*/
    function (_superClass) {
      _inheritsLoose(_class, _superClass);

      function _class() {
        return _superClass.apply(this, arguments) || this;
      }

      var _proto = _class.prototype;

      _proto.tsIsIdentifier = function tsIsIdentifier() {
        // TODO: actually a bit more complex in TypeScript, but shouldn't matter.
        // See https://github.com/Microsoft/TypeScript/issues/15008
        return this.match(types.name);
      };

      _proto.tsNextTokenCanFollowModifier = function tsNextTokenCanFollowModifier() {
        // Note: TypeScript's implementation is much more complicated because
        // more things are considered modifiers there.
        // This implementation only handles modifiers not handled by babylon itself. And "static".
        // TODO: Would be nice to avoid lookahead. Want a hasLineBreakUpNext() method...
        this.next();
        return !this.hasPrecedingLineBreak() && !this.match(types.parenL) && !this.match(types.colon) && !this.match(types.eq) && !this.match(types.question);
      };
      /** Parses a modifier matching one the given modifier names. */


      _proto.tsParseModifier = function tsParseModifier(allowedModifiers) {
        if (!this.match(types.name)) {
          return undefined;
        }

        var modifier = this.state.value;

        if (allowedModifiers.indexOf(modifier) !== -1 && this.tsTryParse(this.tsNextTokenCanFollowModifier.bind(this))) {
          return modifier;
        }

        return undefined;
      };

      _proto.tsIsListTerminator = function tsIsListTerminator(kind) {
        switch (kind) {
          case "EnumMembers":
          case "TypeMembers":
            return this.match(types.braceR);

          case "HeritageClauseElement":
            return this.match(types.braceL);

          case "TupleElementTypes":
            return this.match(types.bracketR);

          case "TypeParametersOrArguments":
            return this.isRelational(">");
        }

        throw new Error("Unreachable");
      };

      _proto.tsParseList = function tsParseList(kind, parseElement) {
        var result = [];

        while (!this.tsIsListTerminator(kind)) {
          // Skipping "parseListElement" from the TS source since that's just for error handling.
          result.push(parseElement());
        }

        return result;
      };

      _proto.tsParseDelimitedList = function tsParseDelimitedList(kind, parseElement) {
        return nonNull(this.tsParseDelimitedListWorker(kind, parseElement,
        /* expectSuccess */
        true));
      };

      _proto.tsTryParseDelimitedList = function tsTryParseDelimitedList(kind, parseElement) {
        return this.tsParseDelimitedListWorker(kind, parseElement,
        /* expectSuccess */
        false);
      };
      /**
      * If !expectSuccess, returns undefined instead of failing to parse.
      * If expectSuccess, parseElement should always return a defined value.
      */


      _proto.tsParseDelimitedListWorker = function tsParseDelimitedListWorker(kind, parseElement, expectSuccess) {
        var result = [];

        while (true) {
          if (this.tsIsListTerminator(kind)) {
            break;
          }

          var element = parseElement();

          if (element == null) {
            return undefined;
          }

          result.push(element);

          if (this.eat(types.comma)) {
            continue;
          }

          if (this.tsIsListTerminator(kind)) {
            break;
          }

          if (expectSuccess) {
            // This will fail with an error about a missing comma
            this.expect(types.comma);
          }

          return undefined;
        }

        return result;
      };

      _proto.tsParseBracketedList = function tsParseBracketedList(kind, parseElement, bracket, skipFirstToken) {
        if (!skipFirstToken) {
          if (bracket) {
            this.expect(types.bracketL);
          } else {
            this.expectRelational("<");
          }
        }

        var result = this.tsParseDelimitedList(kind, parseElement);

        if (bracket) {
          this.expect(types.bracketR);
        } else {
          this.expectRelational(">");
        }

        return result;
      };

      _proto.tsParseEntityName = function tsParseEntityName(allowReservedWords) {
        var entity = this.parseIdentifier();

        while (this.eat(types.dot)) {
          var node = this.startNodeAtNode(entity);
          node.left = entity;
          node.right = this.parseIdentifier(allowReservedWords);
          entity = this.finishNode(node, "TSQualifiedName");
        }

        return entity;
      };

      _proto.tsParseTypeReference = function tsParseTypeReference() {
        var node = this.startNode();
        node.typeName = this.tsParseEntityName(
        /* allowReservedWords */
        false);

        if (!this.hasPrecedingLineBreak() && this.isRelational("<")) {
          node.typeParameters = this.tsParseTypeArguments();
        }

        return this.finishNode(node, "TSTypeReference");
      };

      _proto.tsParseThisTypePredicate = function tsParseThisTypePredicate(lhs) {
        this.next();
        var node = this.startNode();
        node.parameterName = lhs;
        node.typeAnnotation = this.tsParseTypeAnnotation(
        /* eatColon */
        false);
        return this.finishNode(node, "TSTypePredicate");
      };

      _proto.tsParseThisTypeNode = function tsParseThisTypeNode() {
        var node = this.startNode();
        this.next();
        return this.finishNode(node, "TSThisType");
      };

      _proto.tsParseTypeQuery = function tsParseTypeQuery() {
        var node = this.startNode();
        this.expect(types._typeof);
        node.exprName = this.tsParseEntityName(
        /* allowReservedWords */
        true);
        return this.finishNode(node, "TSTypeQuery");
      };

      _proto.tsParseTypeParameter = function tsParseTypeParameter() {
        var node = this.startNode();
        node.name = this.parseIdentifierName(node.start);

        if (this.eat(types._extends)) {
          node.constraint = this.tsParseType();
        }

        if (this.eat(types.eq)) {
          node.default = this.tsParseType();
        }

        return this.finishNode(node, "TSTypeParameter");
      };

      _proto.tsTryParseTypeParameters = function tsTryParseTypeParameters() {
        if (this.isRelational("<")) {
          return this.tsParseTypeParameters();
        }
      };

      _proto.tsParseTypeParameters = function tsParseTypeParameters() {
        var node = this.startNode();

        if (this.isRelational("<") || this.match(types.jsxTagStart)) {
          this.next();
        } else {
          this.unexpected();
        }

        node.params = this.tsParseBracketedList("TypeParametersOrArguments", this.tsParseTypeParameter.bind(this),
        /* bracket */
        false,
        /* skipFirstToken */
        true);
        return this.finishNode(node, "TSTypeParameterDeclaration");
      }; // Note: In TypeScript implementation we must provide `yieldContext` and `awaitContext`,
      // but here it's always false, because this is only used for types.


      _proto.tsFillSignature = function tsFillSignature(returnToken, signature) {
        // Arrow fns *must* have return token (`=>`). Normal functions can omit it.
        var returnTokenRequired = returnToken === types.arrow;
        signature.typeParameters = this.tsTryParseTypeParameters();
        this.expect(types.parenL);
        signature.parameters = this.tsParseBindingListForSignature();

        if (returnTokenRequired) {
          signature.typeAnnotation = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
        } else if (this.match(returnToken)) {
          signature.typeAnnotation = this.tsParseTypeOrTypePredicateAnnotation(returnToken);
        }
      };

      _proto.tsParseBindingListForSignature = function tsParseBindingListForSignature() {
        var _this = this;

        return this.parseBindingList(types.parenR).map(function (pattern) {
          if (pattern.type !== "Identifier" && pattern.type !== "RestElement") {
            throw _this.unexpected(pattern.start, "Name in a signature must be an Identifier.");
          }

          return pattern;
        });
      };

      _proto.tsParseTypeMemberSemicolon = function tsParseTypeMemberSemicolon() {
        if (!this.eat(types.comma)) {
          this.semicolon();
        }
      };

      _proto.tsParseSignatureMember = function tsParseSignatureMember(kind) {
        var node = this.startNode();

        if (kind === "TSConstructSignatureDeclaration") {
          this.expect(types._new);
        }

        this.tsFillSignature(types.colon, node);
        this.tsParseTypeMemberSemicolon();
        return this.finishNode(node, kind);
      };

      _proto.tsIsUnambiguouslyIndexSignature = function tsIsUnambiguouslyIndexSignature() {
        this.next(); // Skip '{'

        return this.eat(types.name) && this.match(types.colon);
      };

      _proto.tsTryParseIndexSignature = function tsTryParseIndexSignature(node) {
        if (!(this.match(types.bracketL) && this.tsLookAhead(this.tsIsUnambiguouslyIndexSignature.bind(this)))) {
          return undefined;
        }

        this.expect(types.bracketL);
        var id = this.parseIdentifier();
        this.expect(types.colon);
        id.typeAnnotation = this.tsParseTypeAnnotation(
        /* eatColon */
        false);
        this.expect(types.bracketR);
        node.parameters = [id];
        var type = this.tsTryParseTypeAnnotation();
        if (type) node.typeAnnotation = type;
        this.tsParseTypeMemberSemicolon();
        return this.finishNode(node, "TSIndexSignature");
      };

      _proto.tsParsePropertyOrMethodSignature = function tsParsePropertyOrMethodSignature(node, readonly) {
        this.parsePropertyName(node);
        if (this.eat(types.question)) node.optional = true;
        var nodeAny = node;

        if (!readonly && (this.match(types.parenL) || this.isRelational("<"))) {
          var method = nodeAny;
          this.tsFillSignature(types.colon, method);
          this.tsParseTypeMemberSemicolon();
          return this.finishNode(method, "TSMethodSignature");
        } else {
          var property = nodeAny;
          if (readonly) property.readonly = true;
          var type = this.tsTryParseTypeAnnotation();
          if (type) property.typeAnnotation = type;
          this.tsParseTypeMemberSemicolon();
          return this.finishNode(property, "TSPropertySignature");
        }
      };

      _proto.tsParseTypeMember = function tsParseTypeMember() {
        if (this.match(types.parenL) || this.isRelational("<")) {
          return this.tsParseSignatureMember("TSCallSignatureDeclaration");
        }

        if (this.match(types._new) && this.tsLookAhead(this.tsIsStartOfConstructSignature.bind(this))) {
          return this.tsParseSignatureMember("TSConstructSignatureDeclaration");
        } // Instead of fullStart, we create a node here.


        var node = this.startNode();
        var readonly = !!this.tsParseModifier(["readonly"]);
        var idx = this.tsTryParseIndexSignature(node);

        if (idx) {
          if (readonly) node.readonly = true;
          return idx;
        }

        return this.tsParsePropertyOrMethodSignature(node, readonly);
      };

      _proto.tsIsStartOfConstructSignature = function tsIsStartOfConstructSignature() {
        this.next();
        return this.match(types.parenL) || this.isRelational("<");
      };

      _proto.tsParseTypeLiteral = function tsParseTypeLiteral() {
        var node = this.startNode();
        node.members = this.tsParseObjectTypeMembers();
        return this.finishNode(node, "TSTypeLiteral");
      };

      _proto.tsParseObjectTypeMembers = function tsParseObjectTypeMembers() {
        this.expect(types.braceL);
        var members = this.tsParseList("TypeMembers", this.tsParseTypeMember.bind(this));
        this.expect(types.braceR);
        return members;
      };

      _proto.tsIsStartOfMappedType = function tsIsStartOfMappedType() {
        this.next();

        if (this.isContextual("readonly")) {
          this.next();
        }

        if (!this.match(types.bracketL)) {
          return false;
        }

        this.next();

        if (!this.tsIsIdentifier()) {
          return false;
        }

        this.next();
        return this.match(types._in);
      };

      _proto.tsParseMappedTypeParameter = function tsParseMappedTypeParameter() {
        var node = this.startNode();
        node.name = this.parseIdentifierName(node.start);
        this.expect(types._in);
        node.constraint = this.tsParseType();
        return this.finishNode(node, "TSTypeParameter");
      };

      _proto.tsParseMappedType = function tsParseMappedType() {
        var node = this.startNode();
        this.expect(types.braceL);

        if (this.eatContextual("readonly")) {
          node.readonly = true;
        }

        this.expect(types.bracketL);
        node.typeParameter = this.tsParseMappedTypeParameter();
        this.expect(types.bracketR);

        if (this.eat(types.question)) {
          node.optional = true;
        }

        node.typeAnnotation = this.tsTryParseType();
        this.semicolon();
        this.expect(types.braceR);
        return this.finishNode(node, "TSMappedType");
      };

      _proto.tsParseTupleType = function tsParseTupleType() {
        var node = this.startNode();
        node.elementTypes = this.tsParseBracketedList("TupleElementTypes", this.tsParseType.bind(this),
        /* bracket */
        true,
        /* skipFirstToken */
        false);
        return this.finishNode(node, "TSTupleType");
      };

      _proto.tsParseParenthesizedType = function tsParseParenthesizedType() {
        var node = this.startNode();
        this.expect(types.parenL);
        node.typeAnnotation = this.tsParseType();
        this.expect(types.parenR);
        return this.finishNode(node, "TSParenthesizedType");
      };

      _proto.tsParseFunctionOrConstructorType = function tsParseFunctionOrConstructorType(type) {
        var node = this.startNode();

        if (type === "TSConstructorType") {
          this.expect(types._new);
        }

        this.tsFillSignature(types.arrow, node);
        return this.finishNode(node, type);
      };

      _proto.tsParseLiteralTypeNode = function tsParseLiteralTypeNode() {
        var _this2 = this;

        var node = this.startNode();

        node.literal = function () {
          switch (_this2.state.type) {
            case types.num:
              return _this2.parseLiteral(_this2.state.value, "NumericLiteral");

            case types.string:
              return _this2.parseLiteral(_this2.state.value, "StringLiteral");

            case types._true:
            case types._false:
              return _this2.parseBooleanLiteral();

            default:
              throw _this2.unexpected();
          }
        }();

        return this.finishNode(node, "TSLiteralType");
      };

      _proto.tsParseNonArrayType = function tsParseNonArrayType() {
        switch (this.state.type) {
          case types.name:
          case types._void:
          case types._null:
            {
              var type = this.match(types._void) ? "TSVoidKeyword" : this.match(types._null) ? "TSNullKeyword" : keywordTypeFromName(this.state.value);

              if (type !== undefined && this.lookahead().type !== types.dot) {
                var node = this.startNode();
                this.next();
                return this.finishNode(node, type);
              }

              return this.tsParseTypeReference();
            }

          case types.string:
          case types.num:
          case types._true:
          case types._false:
            return this.tsParseLiteralTypeNode();

          case types.plusMin:
            if (this.state.value === "-") {
              var _node = this.startNode();

              this.next();

              if (!this.match(types.num)) {
                throw this.unexpected();
              }

              _node.literal = this.parseLiteral(-this.state.value, "NumericLiteral", _node.start, _node.loc.start);
              return this.finishNode(_node, "TSLiteralType");
            }

            break;

          case types._this:
            {
              var thisKeyword = this.tsParseThisTypeNode();

              if (this.isContextual("is") && !this.hasPrecedingLineBreak()) {
                return this.tsParseThisTypePredicate(thisKeyword);
              } else {
                return thisKeyword;
              }
            }

          case types._typeof:
            return this.tsParseTypeQuery();

          case types.braceL:
            return this.tsLookAhead(this.tsIsStartOfMappedType.bind(this)) ? this.tsParseMappedType() : this.tsParseTypeLiteral();

          case types.bracketL:
            return this.tsParseTupleType();

          case types.parenL:
            return this.tsParseParenthesizedType();
        }

        throw this.unexpected();
      };

      _proto.tsParseArrayTypeOrHigher = function tsParseArrayTypeOrHigher() {
        var type = this.tsParseNonArrayType();

        while (!this.hasPrecedingLineBreak() && this.eat(types.bracketL)) {
          if (this.match(types.bracketR)) {
            var node = this.startNodeAtNode(type);
            node.elementType = type;
            this.expect(types.bracketR);
            type = this.finishNode(node, "TSArrayType");
          } else {
            var _node2 = this.startNodeAtNode(type);

            _node2.objectType = type;
            _node2.indexType = this.tsParseType();
            this.expect(types.bracketR);
            type = this.finishNode(_node2, "TSIndexedAccessType");
          }
        }

        return type;
      };

      _proto.tsParseTypeOperator = function tsParseTypeOperator(operator) {
        var node = this.startNode();
        this.expectContextual(operator);
        node.operator = operator;
        node.typeAnnotation = this.tsParseTypeOperatorOrHigher();
        return this.finishNode(node, "TSTypeOperator");
      };

      _proto.tsParseTypeOperatorOrHigher = function tsParseTypeOperatorOrHigher() {
        if (this.isContextual("keyof")) {
          return this.tsParseTypeOperator("keyof");
        }

        return this.tsParseArrayTypeOrHigher();
      };

      _proto.tsParseUnionOrIntersectionType = function tsParseUnionOrIntersectionType(kind, parseConstituentType, operator) {
        this.eat(operator);
        var type = parseConstituentType();

        if (this.match(operator)) {
          var types$$1 = [type];

          while (this.eat(operator)) {
            types$$1.push(parseConstituentType());
          }

          var node = this.startNodeAtNode(type);
          node.types = types$$1;
          type = this.finishNode(node, kind);
        }

        return type;
      };

      _proto.tsParseIntersectionTypeOrHigher = function tsParseIntersectionTypeOrHigher() {
        return this.tsParseUnionOrIntersectionType("TSIntersectionType", this.tsParseTypeOperatorOrHigher.bind(this), types.bitwiseAND);
      };

      _proto.tsParseUnionTypeOrHigher = function tsParseUnionTypeOrHigher() {
        return this.tsParseUnionOrIntersectionType("TSUnionType", this.tsParseIntersectionTypeOrHigher.bind(this), types.bitwiseOR);
      };

      _proto.tsIsStartOfFunctionType = function tsIsStartOfFunctionType() {
        if (this.isRelational("<")) {
          return true;
        }

        return this.match(types.parenL) && this.tsLookAhead(this.tsIsUnambiguouslyStartOfFunctionType.bind(this));
      };

      _proto.tsSkipParameterStart = function tsSkipParameterStart() {
        if (this.match(types.name) || this.match(types._this)) {
          this.next();
          return true;
        }

        return false;
      };

      _proto.tsIsUnambiguouslyStartOfFunctionType = function tsIsUnambiguouslyStartOfFunctionType() {
        this.next();

        if (this.match(types.parenR) || this.match(types.ellipsis)) {
          // ( )
          // ( ...
          return true;
        }

        if (this.tsSkipParameterStart()) {
          if (this.match(types.colon) || this.match(types.comma) || this.match(types.question) || this.match(types.eq)) {
            // ( xxx :
            // ( xxx ,
            // ( xxx ?
            // ( xxx =
            return true;
          }

          if (this.match(types.parenR)) {
            this.next();

            if (this.match(types.arrow)) {
              // ( xxx ) =>
              return true;
            }
          }
        }

        return false;
      };

      _proto.tsParseTypeOrTypePredicateAnnotation = function tsParseTypeOrTypePredicateAnnotation(returnToken) {
        var t = this.startNode();
        this.expect(returnToken);
        var typePredicateVariable = this.tsIsIdentifier() && this.tsTryParse(this.tsParseTypePredicatePrefix.bind(this));

        if (!typePredicateVariable) {
          return this.tsParseTypeAnnotation(
          /* eatColon */
          false, t);
        }

        var type = this.tsParseTypeAnnotation(
        /* eatColon */
        false);
        var node = this.startNodeAtNode(typePredicateVariable);
        node.parameterName = typePredicateVariable;
        node.typeAnnotation = type;
        t.typeAnnotation = this.finishNode(node, "TSTypePredicate");
        return this.finishNode(t, "TSTypeAnnotation");
      };

      _proto.tsTryParseTypeOrTypePredicateAnnotation = function tsTryParseTypeOrTypePredicateAnnotation() {
        return this.match(types.colon) ? this.tsParseTypeOrTypePredicateAnnotation(types.colon) : undefined;
      };

      _proto.tsTryParseTypeAnnotation = function tsTryParseTypeAnnotation() {
        return this.match(types.colon) ? this.tsParseTypeAnnotation() : undefined;
      };

      _proto.tsTryParseType = function tsTryParseType() {
        return this.eat(types.colon) ? this.tsParseType() : undefined;
      };

      _proto.tsParseTypePredicatePrefix = function tsParseTypePredicatePrefix() {
        var id = this.parseIdentifier();

        if (this.isContextual("is") && !this.hasPrecedingLineBreak()) {
          this.next();
          return id;
        }
      };

      _proto.tsParseTypeAnnotation = function tsParseTypeAnnotation(eatColon, t) {
        if (eatColon === void 0) {
          eatColon = true;
        }

        if (t === void 0) {
          t = this.startNode();
        }

        if (eatColon) this.expect(types.colon);
        t.typeAnnotation = this.tsParseType();
        return this.finishNode(t, "TSTypeAnnotation");
      };

      _proto.tsParseType = function tsParseType() {
        // Need to set `state.inType` so that we don't parse JSX in a type context.
        var oldInType = this.state.inType;
        this.state.inType = true;

        try {
          if (this.tsIsStartOfFunctionType()) {
            return this.tsParseFunctionOrConstructorType("TSFunctionType");
          }

          if (this.match(types._new)) {
            // As in `new () => Date`
            return this.tsParseFunctionOrConstructorType("TSConstructorType");
          }

          return this.tsParseUnionTypeOrHigher();
        } finally {
          this.state.inType = oldInType;
        }
      };

      _proto.tsParseTypeAssertion = function tsParseTypeAssertion() {
        var node = this.startNode();
        node.typeAnnotation = this.tsParseType();
        this.expectRelational(">");
        node.expression = this.parseMaybeUnary();
        return this.finishNode(node, "TSTypeAssertion");
      };

      _proto.tsTryParseTypeArgumentsInExpression = function tsTryParseTypeArgumentsInExpression() {
        var _this3 = this;

        return this.tsTryParseAndCatch(function () {
          var res = _this3.startNode();

          _this3.expectRelational("<");

          var typeArguments = _this3.tsParseDelimitedList("TypeParametersOrArguments", _this3.tsParseType.bind(_this3));

          _this3.expectRelational(">");

          res.params = typeArguments;

          _this3.finishNode(res, "TSTypeParameterInstantiation");

          _this3.expect(types.parenL);

          return res;
        });
      };

      _proto.tsParseHeritageClause = function tsParseHeritageClause() {
        return this.tsParseDelimitedList("HeritageClauseElement", this.tsParseExpressionWithTypeArguments.bind(this));
      };

      _proto.tsParseExpressionWithTypeArguments = function tsParseExpressionWithTypeArguments() {
        var node = this.startNode(); // Note: TS uses parseLeftHandSideExpressionOrHigher,
        // then has grammar errors later if it's not an EntityName.

        node.expression = this.tsParseEntityName(
        /* allowReservedWords */
        false);

        if (this.isRelational("<")) {
          node.typeParameters = this.tsParseTypeArguments();
        }

        return this.finishNode(node, "TSExpressionWithTypeArguments");
      };

      _proto.tsParseInterfaceDeclaration = function tsParseInterfaceDeclaration(node) {
        node.id = this.parseIdentifier();
        node.typeParameters = this.tsTryParseTypeParameters();

        if (this.eat(types._extends)) {
          node.extends = this.tsParseHeritageClause();
        }

        var body = this.startNode();
        body.body = this.tsParseObjectTypeMembers();
        node.body = this.finishNode(body, "TSInterfaceBody");
        return this.finishNode(node, "TSInterfaceDeclaration");
      };

      _proto.tsParseTypeAliasDeclaration = function tsParseTypeAliasDeclaration(node) {
        node.id = this.parseIdentifier();
        node.typeParameters = this.tsTryParseTypeParameters();
        this.expect(types.eq);
        node.typeAnnotation = this.tsParseType();
        this.semicolon();
        return this.finishNode(node, "TSTypeAliasDeclaration");
      };

      _proto.tsParseEnumMember = function tsParseEnumMember() {
        var node = this.startNode(); // Computed property names are grammar errors in an enum, so accept just string literal or identifier.

        node.id = this.match(types.string) ? this.parseLiteral(this.state.value, "StringLiteral") : this.parseIdentifier(
        /* liberal */
        true);

        if (this.eat(types.eq)) {
          node.initializer = this.parseMaybeAssign();
        }

        return this.finishNode(node, "TSEnumMember");
      };

      _proto.tsParseEnumDeclaration = function tsParseEnumDeclaration(node, isConst) {
        if (isConst) node.const = true;
        node.id = this.parseIdentifier();
        this.expect(types.braceL);
        node.members = this.tsParseDelimitedList("EnumMembers", this.tsParseEnumMember.bind(this));
        this.expect(types.braceR);
        return this.finishNode(node, "TSEnumDeclaration");
      };

      _proto.tsParseModuleBlock = function tsParseModuleBlock() {
        var node = this.startNode();
        this.expect(types.braceL); // Inside of a module block is considered "top-level", meaning it can have imports and exports.

        this.parseBlockOrModuleBlockBody(node.body = [],
        /* directives */
        undefined,
        /* topLevel */
        true,
        /* end */
        types.braceR);
        return this.finishNode(node, "TSModuleBlock");
      };

      _proto.tsParseModuleOrNamespaceDeclaration = function tsParseModuleOrNamespaceDeclaration(node) {
        node.id = this.parseIdentifier();

        if (this.eat(types.dot)) {
          var inner = this.startNode();
          this.tsParseModuleOrNamespaceDeclaration(inner);
          node.body = inner;
        } else {
          node.body = this.tsParseModuleBlock();
        }

        return this.finishNode(node, "TSModuleDeclaration");
      };

      _proto.tsParseAmbientExternalModuleDeclaration = function tsParseAmbientExternalModuleDeclaration(node) {
        if (this.isContextual("global")) {
          node.global = true;
          node.id = this.parseIdentifier();
        } else if (this.match(types.string)) {
          node.id = this.parseExprAtom();
        } else {
          this.unexpected();
        }

        if (this.match(types.braceL)) {
          node.body = this.tsParseModuleBlock();
        } else {
          this.semicolon();
        }

        return this.finishNode(node, "TSModuleDeclaration");
      };

      _proto.tsParseImportEqualsDeclaration = function tsParseImportEqualsDeclaration(node, isExport) {
        node.isExport = isExport || false;
        node.id = this.parseIdentifier();
        this.expect(types.eq);
        node.moduleReference = this.tsParseModuleReference();
        this.semicolon();
        return this.finishNode(node, "TSImportEqualsDeclaration");
      };

      _proto.tsIsExternalModuleReference = function tsIsExternalModuleReference() {
        return this.isContextual("require") && this.lookahead().type === types.parenL;
      };

      _proto.tsParseModuleReference = function tsParseModuleReference() {
        return this.tsIsExternalModuleReference() ? this.tsParseExternalModuleReference() : this.tsParseEntityName(
        /* allowReservedWords */
        false);
      };

      _proto.tsParseExternalModuleReference = function tsParseExternalModuleReference() {
        var node = this.startNode();
        this.expectContextual("require");
        this.expect(types.parenL);

        if (!this.match(types.string)) {
          throw this.unexpected();
        }

        node.expression = this.parseLiteral(this.state.value, "StringLiteral");
        this.expect(types.parenR);
        return this.finishNode(node, "TSExternalModuleReference");
      }; // Utilities


      _proto.tsLookAhead = function tsLookAhead(f) {
        var state = this.state.clone();
        var res = f();
        this.state = state;
        return res;
      };

      _proto.tsTryParseAndCatch = function tsTryParseAndCatch(f) {
        var state = this.state.clone();

        try {
          return f();
        } catch (e) {
          if (e instanceof SyntaxError) {
            this.state = state;
            return undefined;
          }

          throw e;
        }
      };

      _proto.tsTryParse = function tsTryParse(f) {
        var state = this.state.clone();
        var result = f();

        if (result !== undefined && result !== false) {
          return result;
        } else {
          this.state = state;
          return undefined;
        }
      };

      _proto.nodeWithSamePosition = function nodeWithSamePosition(original, type) {
        var node = this.startNodeAtNode(original);
        node.type = type;
        node.end = original.end;
        node.loc.end = original.loc.end;

        if (original.leadingComments) {
          node.leadingComments = original.leadingComments;
        }

        if (original.trailingComments) {
          node.trailingComments = original.trailingComments;
        }

        if (original.innerComments) node.innerComments = original.innerComments;
        return node;
      };

      _proto.tsTryParseDeclare = function tsTryParseDeclare(nany) {
        switch (this.state.type) {
          case types._function:
            this.next();
            return this.parseFunction(nany,
            /* isStatement */
            true);

          case types._class:
            return this.parseClass(nany,
            /* isStatement */
            true,
            /* optionalId */
            false);

          case types._const:
            if (this.match(types._const) && this.isLookaheadContextual("enum")) {
              // `const enum = 0;` not allowed because "enum" is a strict mode reserved word.
              this.expect(types._const);
              this.expectContextual("enum");
              return this.tsParseEnumDeclaration(nany,
              /* isConst */
              true);
            }

          // falls through

          case types._var:
          case types._let:
            return this.parseVarStatement(nany, this.state.type);

          case types.name:
            {
              var value = this.state.value;

              if (value === "global") {
                return this.tsParseAmbientExternalModuleDeclaration(nany);
              } else {
                return this.tsParseDeclaration(nany, value,
                /* next */
                true);
              }
            }
        }
      }; // Note: this won't be called unless the keyword is allowed in `shouldParseExportDeclaration`.


      _proto.tsTryParseExportDeclaration = function tsTryParseExportDeclaration() {
        return this.tsParseDeclaration(this.startNode(), this.state.value,
        /* next */
        true);
      };

      _proto.tsParseExpressionStatement = function tsParseExpressionStatement(node, expr) {
        switch (expr.name) {
          case "declare":
            {
              var declaration = this.tsTryParseDeclare(node);

              if (declaration) {
                declaration.declare = true;
                return declaration;
              }

              break;
            }

          case "global":
            // `global { }` (with no `declare`) may appear inside an ambient module declaration.
            // Would like to use tsParseAmbientExternalModuleDeclaration here, but already ran past "global".
            if (this.match(types.braceL)) {
              var mod = node;
              mod.global = true;
              mod.id = expr;
              mod.body = this.tsParseModuleBlock();
              return this.finishNode(mod, "TSModuleDeclaration");
            }

            break;

          default:
            return this.tsParseDeclaration(node, expr.name,
            /* next */
            false);
        }
      }; // Common to tsTryParseDeclare, tsTryParseExportDeclaration, and tsParseExpressionStatement.


      _proto.tsParseDeclaration = function tsParseDeclaration(node, value, next) {
        switch (value) {
          case "abstract":
            if (next || this.match(types._class)) {
              var cls = node;
              cls.abstract = true;
              if (next) this.next();
              return this.parseClass(cls,
              /* isStatement */
              true,
              /* optionalId */
              false);
            }

            break;

          case "enum":
            if (next || this.match(types.name)) {
              if (next) this.next();
              return this.tsParseEnumDeclaration(node,
              /* isConst */
              false);
            }

            break;

          case "interface":
            if (next || this.match(types.name)) {
              if (next) this.next();
              return this.tsParseInterfaceDeclaration(node);
            }

            break;

          case "module":
            if (next) this.next();

            if (this.match(types.string)) {
              return this.tsParseAmbientExternalModuleDeclaration(node);
            } else if (next || this.match(types.name)) {
              return this.tsParseModuleOrNamespaceDeclaration(node);
            }

            break;

          case "namespace":
            if (next || this.match(types.name)) {
              if (next) this.next();
              return this.tsParseModuleOrNamespaceDeclaration(node);
            }

            break;

          case "type":
            if (next || this.match(types.name)) {
              if (next) this.next();
              return this.tsParseTypeAliasDeclaration(node);
            }

            break;
        }
      };

      _proto.tsTryParseGenericAsyncArrowFunction = function tsTryParseGenericAsyncArrowFunction(startPos, startLoc) {
        var _this4 = this;

        var res = this.tsTryParseAndCatch(function () {
          var node = _this4.startNodeAt(startPos, startLoc);

          node.typeParameters = _this4.tsParseTypeParameters(); // Don't use overloaded parseFunctionParams which would look for "<" again.

          _superClass.prototype.parseFunctionParams.call(_this4, node);

          node.returnType = _this4.tsTryParseTypeOrTypePredicateAnnotation();

          _this4.expect(types.arrow);

          return node;
        });

        if (!res) {
          return undefined;
        }

        res.id = null;
        res.generator = false;
        res.expression = true; // May be set again by parseFunctionBody.

        res.async = true;
        this.parseFunctionBody(res, true);
        return this.finishNode(res, "ArrowFunctionExpression");
      };

      _proto.tsParseTypeArguments = function tsParseTypeArguments() {
        var node = this.startNode();
        this.expectRelational("<");
        node.params = this.tsParseDelimitedList("TypeParametersOrArguments", this.tsParseType.bind(this));
        this.expectRelational(">");
        return this.finishNode(node, "TSTypeParameterInstantiation");
      };

      _proto.tsIsDeclarationStart = function tsIsDeclarationStart() {
        if (this.match(types.name)) {
          switch (this.state.value) {
            case "abstract":
            case "declare":
            case "enum":
            case "interface":
            case "module":
            case "namespace":
            case "type":
              return true;
          }
        }

        return false;
      }; // ======================================================
      // OVERRIDES
      // ======================================================


      _proto.isExportDefaultSpecifier = function isExportDefaultSpecifier() {
        if (this.tsIsDeclarationStart()) return false;
        return _superClass.prototype.isExportDefaultSpecifier.call(this);
      };

      _proto.parseAssignableListItem = function parseAssignableListItem(allowModifiers, decorators) {
        var accessibility;
        var readonly = false;

        if (allowModifiers) {
          accessibility = this.parseAccessModifier();
          readonly = !!this.tsParseModifier(["readonly"]);
        }

        var left = this.parseMaybeDefault();
        this.parseAssignableListItemTypes(left);
        var elt = this.parseMaybeDefault(left.start, left.loc.start, left);

        if (accessibility || readonly) {
          var pp = this.startNodeAtNode(elt);

          if (decorators.length) {
            pp.decorators = decorators;
          }

          if (accessibility) pp.accessibility = accessibility;
          if (readonly) pp.readonly = readonly;

          if (elt.type !== "Identifier" && elt.type !== "AssignmentPattern") {
            throw this.raise(pp.start, "A parameter property may not be declared using a binding pattern.");
          }

          pp.parameter = elt;
          return this.finishNode(pp, "TSParameterProperty");
        } else {
          if (decorators.length) {
            left.decorators = decorators;
          }

          return elt;
        }
      };

      _proto.parseFunctionBodyAndFinish = function parseFunctionBodyAndFinish(node, type, allowExpressionBody) {
        // For arrow functions, `parseArrow` handles the return type itself.
        if (!allowExpressionBody && this.match(types.colon)) {
          node.returnType = this.tsParseTypeOrTypePredicateAnnotation(types.colon);
        }

        var bodilessType = type === "FunctionDeclaration" ? "TSDeclareFunction" : type === "ClassMethod" ? "TSDeclareMethod" : undefined;

        if (bodilessType && !this.match(types.braceL) && this.isLineTerminator()) {
          this.finishNode(node, bodilessType);
          return;
        }

        _superClass.prototype.parseFunctionBodyAndFinish.call(this, node, type, allowExpressionBody);
      };

      _proto.parseSubscript = function parseSubscript(base, startPos, startLoc, noCalls, state) {
        if (this.eat(types.bang)) {
          var nonNullExpression = this.startNodeAt(startPos, startLoc);
          nonNullExpression.expression = base;
          return this.finishNode(nonNullExpression, "TSNonNullExpression");
        }

        if (!noCalls && this.isRelational("<")) {
          if (this.atPossibleAsync(base)) {
            // Almost certainly this is a generic async function `async <T>() => ...
            // But it might be a call with a type argument `async<T>();`
            var asyncArrowFn = this.tsTryParseGenericAsyncArrowFunction(startPos, startLoc);

            if (asyncArrowFn) {
              return asyncArrowFn;
            }
          }

          var node = this.startNodeAt(startPos, startLoc);
          node.callee = base; // May be passing type arguments. But may just be the `<` operator.

          var typeArguments = this.tsTryParseTypeArgumentsInExpression(); // Also eats the "("

          if (typeArguments) {
            // possibleAsync always false here, because we would have handled it above.
            // $FlowIgnore (won't be any undefined arguments)
            node.arguments = this.parseCallExpressionArguments(types.parenR,
            /* possibleAsync */
            false);
            node.typeParameters = typeArguments;
            return this.finishCallExpression(node);
          }
        }

        return _superClass.prototype.parseSubscript.call(this, base, startPos, startLoc, noCalls, state);
      };

      _proto.parseNewArguments = function parseNewArguments(node) {
        var _this5 = this;

        if (this.isRelational("<")) {
          // tsTryParseAndCatch is expensive, so avoid if not necessary.
          // 99% certain this is `new C<T>();`. But may be `new C < T;`, which is also legal.
          var typeParameters = this.tsTryParseAndCatch(function () {
            var args = _this5.tsParseTypeArguments();

            if (!_this5.match(types.parenL)) _this5.unexpected();
            return args;
          });

          if (typeParameters) {
            node.typeParameters = typeParameters;
          }
        }

        _superClass.prototype.parseNewArguments.call(this, node);
      };

      _proto.parseExprOp = function parseExprOp(left, leftStartPos, leftStartLoc, minPrec, noIn) {
        if (nonNull(types._in.binop) > minPrec && !this.hasPrecedingLineBreak() && this.eatContextual("as")) {
          var node = this.startNodeAt(leftStartPos, leftStartLoc);
          node.expression = left;
          node.typeAnnotation = this.tsParseType();
          this.finishNode(node, "TSAsExpression");
          return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn);
        }

        return _superClass.prototype.parseExprOp.call(this, left, leftStartPos, leftStartLoc, minPrec, noIn);
      };

      _proto.checkReservedWord = function checkReservedWord(word, startLoc, checkKeywords, // eslint-disable-next-line no-unused-vars
      isBinding) {} // Don't bother checking for TypeScript code.
      // Strict mode words may be allowed as in `declare namespace N { const static: number; }`.
      // And we have a type checker anyway, so don't bother having the parser do it.

      /*
      Don't bother doing this check in TypeScript code because:
      1. We may have a nested export statement with the same name:
        export const x = 0;
        export namespace N {
          export const x = 1;
        }
      2. We have a type checker to warn us about this sort of thing.
      */
      ;

      _proto.checkDuplicateExports = function checkDuplicateExports() {};

      _proto.parseImport = function parseImport(node) {
        if (this.match(types.name) && this.lookahead().type === types.eq) {
          return this.tsParseImportEqualsDeclaration(node);
        }

        return _superClass.prototype.parseImport.call(this, node);
      };

      _proto.parseExport = function parseExport(node) {
        if (this.match(types._import)) {
          // `export import A = B;`
          this.expect(types._import);
          return this.tsParseImportEqualsDeclaration(node,
          /* isExport */
          true);
        } else if (this.eat(types.eq)) {
          // `export = x;`
          var assign = node;
          assign.expression = this.parseExpression();
          this.semicolon();
          return this.finishNode(assign, "TSExportAssignment");
        } else if (this.eatContextual("as")) {
          // `export as namespace A;`
          var decl = node; // See `parseNamespaceExportDeclaration` in TypeScript's own parser

          this.expectContextual("namespace");
          decl.id = this.parseIdentifier();
          this.semicolon();
          return this.finishNode(decl, "TSNamespaceExportDeclaration");
        } else {
          return _superClass.prototype.parseExport.call(this, node);
        }
      };

      _proto.parseStatementContent = function parseStatementContent(declaration, topLevel) {
        if (this.state.type === types._const) {
          var ahead = this.lookahead();

          if (ahead.type === types.name && ahead.value === "enum") {
            var node = this.startNode();
            this.expect(types._const);
            this.expectContextual("enum");
            return this.tsParseEnumDeclaration(node,
            /* isConst */
            true);
          }
        }

        return _superClass.prototype.parseStatementContent.call(this, declaration, topLevel);
      };

      _proto.parseAccessModifier = function parseAccessModifier() {
        return this.tsParseModifier(["public", "protected", "private"]);
      };

      _proto.parseClassMember = function parseClassMember(classBody, member, state) {
        var accessibility = this.parseAccessModifier();
        if (accessibility) member.accessibility = accessibility;

        _superClass.prototype.parseClassMember.call(this, classBody, member, state);
      };

      _proto.parseClassMemberWithIsStatic = function parseClassMemberWithIsStatic(classBody, member, state, isStatic) {
        var methodOrProp = member;
        var prop = member;
        var propOrIdx = member;
        var abstract = false,
            readonly = false;
        var mod = this.tsParseModifier(["abstract", "readonly"]);

        switch (mod) {
          case "readonly":
            readonly = true;
            abstract = !!this.tsParseModifier(["abstract"]);
            break;

          case "abstract":
            abstract = true;
            readonly = !!this.tsParseModifier(["readonly"]);
            break;
        }

        if (abstract) methodOrProp.abstract = true;
        if (readonly) propOrIdx.readonly = true;

        if (!abstract && !isStatic && !methodOrProp.accessibility) {
          var idx = this.tsTryParseIndexSignature(member);

          if (idx) {
            classBody.body.push(idx);
            return;
          }
        }

        if (readonly) {
          // Must be a property (if not an index signature).
          methodOrProp.static = isStatic;
          this.parseClassPropertyName(prop);
          this.parsePostMemberNameModifiers(methodOrProp);
          this.pushClassProperty(classBody, prop);
          return;
        }

        _superClass.prototype.parseClassMemberWithIsStatic.call(this, classBody, member, state, isStatic);
      };

      _proto.parsePostMemberNameModifiers = function parsePostMemberNameModifiers(methodOrProp) {
        var optional = this.eat(types.question);
        if (optional) methodOrProp.optional = true;
      }; // Note: The reason we do this in `parseExpressionStatement` and not `parseStatement`
      // is that e.g. `type()` is valid JS, so we must try parsing that first.
      // If it's really a type, we will parse `type` as the statement, and can correct it here
      // by parsing the rest.


      _proto.parseExpressionStatement = function parseExpressionStatement(node, expr) {
        var decl = expr.type === "Identifier" ? this.tsParseExpressionStatement(node, expr) : undefined;
        return decl || _superClass.prototype.parseExpressionStatement.call(this, node, expr);
      }; // export type
      // Should be true for anything parsed by `tsTryParseExportDeclaration`.


      _proto.shouldParseExportDeclaration = function shouldParseExportDeclaration() {
        if (this.tsIsDeclarationStart()) return true;
        return _superClass.prototype.shouldParseExportDeclaration.call(this);
      }; // An apparent conditional expression could actually be an optional parameter in an arrow function.


      _proto.parseConditional = function parseConditional(expr, noIn, startPos, startLoc, refNeedsArrowPos) {
        // only do the expensive clone if there is a question mark
        // and if we come from inside parens
        if (!refNeedsArrowPos || !this.match(types.question)) {
          return _superClass.prototype.parseConditional.call(this, expr, noIn, startPos, startLoc, refNeedsArrowPos);
        }

        var state = this.state.clone();

        try {
          return _superClass.prototype.parseConditional.call(this, expr, noIn, startPos, startLoc);
        } catch (err) {
          if (!(err instanceof SyntaxError)) {
            // istanbul ignore next: no such error is expected
            throw err;
          }

          this.state = state;
          refNeedsArrowPos.start = err.pos || this.state.start;
          return expr;
        }
      }; // Note: These "type casts" are *not* valid TS expressions.
      // But we parse them here and change them when completing the arrow function.


      _proto.parseParenItem = function parseParenItem(node, startPos, startLoc) {
        node = _superClass.prototype.parseParenItem.call(this, node, startPos, startLoc);

        if (this.eat(types.question)) {
          node.optional = true;
        }

        if (this.match(types.colon)) {
          var typeCastNode = this.startNodeAt(startPos, startLoc);
          typeCastNode.expression = node;
          typeCastNode.typeAnnotation = this.tsParseTypeAnnotation();
          return this.finishNode(typeCastNode, "TSTypeCastExpression");
        }

        return node;
      };

      _proto.parseExportDeclaration = function parseExportDeclaration(node) {
        // "export declare" is equivalent to just "export".
        var isDeclare = this.eatContextual("declare");
        var declaration;

        if (this.match(types.name)) {
          declaration = this.tsTryParseExportDeclaration();
        }

        if (!declaration) {
          declaration = _superClass.prototype.parseExportDeclaration.call(this, node);
        }

        if (declaration && isDeclare) {
          declaration.declare = true;
        }

        return declaration;
      };

      _proto.parseClassId = function parseClassId(node, isStatement, optionalId) {
        var _superClass$prototype;

        if ((!isStatement || optionalId) && this.isContextual("implements")) {
          return;
        }

        (_superClass$prototype = _superClass.prototype.parseClassId).call.apply(_superClass$prototype, [this].concat(Array.prototype.slice.call(arguments)));

        var typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters) node.typeParameters = typeParameters;
      };

      _proto.parseClassProperty = function parseClassProperty(node) {
        var type = this.tsTryParseTypeAnnotation();
        if (type) node.typeAnnotation = type;
        return _superClass.prototype.parseClassProperty.call(this, node);
      };

      _proto.pushClassMethod = function pushClassMethod(classBody, method, isGenerator, isAsync, isConstructor) {
        var typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters) method.typeParameters = typeParameters;

        _superClass.prototype.pushClassMethod.call(this, classBody, method, isGenerator, isAsync, isConstructor);
      };

      _proto.pushClassPrivateMethod = function pushClassPrivateMethod(classBody, method, isGenerator, isAsync) {
        var typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters) method.typeParameters = typeParameters;

        _superClass.prototype.pushClassPrivateMethod.call(this, classBody, method, isGenerator, isAsync);
      };

      _proto.parseClassSuper = function parseClassSuper(node) {
        _superClass.prototype.parseClassSuper.call(this, node);

        if (node.superClass && this.isRelational("<")) {
          node.superTypeParameters = this.tsParseTypeArguments();
        }

        if (this.eatContextual("implements")) {
          node.implements = this.tsParseHeritageClause();
        }
      };

      _proto.parseObjPropValue = function parseObjPropValue(prop) {
        var _superClass$prototype2;

        if (this.isRelational("<")) {
          throw new Error("TODO");
        }

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (_superClass$prototype2 = _superClass.prototype.parseObjPropValue).call.apply(_superClass$prototype2, [this, prop].concat(args));
      };

      _proto.parseFunctionParams = function parseFunctionParams(node, allowModifiers) {
        var typeParameters = this.tsTryParseTypeParameters();
        if (typeParameters) node.typeParameters = typeParameters;

        _superClass.prototype.parseFunctionParams.call(this, node, allowModifiers);
      }; // `let x: number;`


      _proto.parseVarHead = function parseVarHead(decl) {
        _superClass.prototype.parseVarHead.call(this, decl);

        var type = this.tsTryParseTypeAnnotation();

        if (type) {
          decl.id.typeAnnotation = type;
          this.finishNode(decl.id, decl.id.type); // set end position to end of type
        }
      }; // parse the return type of an async arrow function - let foo = (async (): number => {});


      _proto.parseAsyncArrowFromCallExpression = function parseAsyncArrowFromCallExpression(node, call) {
        if (this.match(types.colon)) {
          node.returnType = this.tsParseTypeAnnotation();
        }

        return _superClass.prototype.parseAsyncArrowFromCallExpression.call(this, node, call);
      };

      _proto.parseMaybeAssign = function parseMaybeAssign() {
        // Note: When the JSX plugin is on, type assertions (`<T> x`) aren't valid syntax.
        var jsxError;

        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        if (this.match(types.jsxTagStart)) {
          var context = this.curContext();
          assert(context === types$1.j_oTag); // Only time j_oTag is pushed is right after j_expr.

          assert(this.state.context[this.state.context.length - 2] === types$1.j_expr); // Prefer to parse JSX if possible. But may be an arrow fn.

          var _state = this.state.clone();

          try {
            var _superClass$prototype3;

            return (_superClass$prototype3 = _superClass.prototype.parseMaybeAssign).call.apply(_superClass$prototype3, [this].concat(args));
          } catch (err) {
            if (!(err instanceof SyntaxError)) {
              // istanbul ignore next: no such error is expected
              throw err;
            }

            this.state = _state; // Pop the context added by the jsxTagStart.

            assert(this.curContext() === types$1.j_oTag);
            this.state.context.pop();
            assert(this.curContext() === types$1.j_expr);
            this.state.context.pop();
            jsxError = err;
          }
        }

        if (jsxError === undefined && !this.isRelational("<")) {
          var _superClass$prototype4;

          return (_superClass$prototype4 = _superClass.prototype.parseMaybeAssign).call.apply(_superClass$prototype4, [this].concat(args));
        } // Either way, we're looking at a '<': tt.jsxTagStart or relational.


        var arrowExpression;
        var typeParameters;
        var state = this.state.clone();

        try {
          var _superClass$prototype5;

          // This is similar to TypeScript's `tryParseParenthesizedArrowFunctionExpression`.
          typeParameters = this.tsParseTypeParameters();
          arrowExpression = (_superClass$prototype5 = _superClass.prototype.parseMaybeAssign).call.apply(_superClass$prototype5, [this].concat(args));

          if (arrowExpression.type !== "ArrowFunctionExpression") {
            this.unexpected(); // Go to the catch block (needs a SyntaxError).
          }
        } catch (err) {
          var _superClass$prototype6;

          if (!(err instanceof SyntaxError)) {
            // istanbul ignore next: no such error is expected
            throw err;
          }

          if (jsxError) {
            throw jsxError;
          } // Try parsing a type cast instead of an arrow function.
          // This will never happen outside of JSX.
          // (Because in JSX the '<' should be a jsxTagStart and not a relational.


          assert(!this.hasPlugin("jsx")); // Parsing an arrow function failed, so try a type cast.

          this.state = state; // This will start with a type assertion (via parseMaybeUnary).
          // But don't directly call `this.tsParseTypeAssertion` because we want to handle any binary after it.

          return (_superClass$prototype6 = _superClass.prototype.parseMaybeAssign).call.apply(_superClass$prototype6, [this].concat(args));
        } // Correct TypeScript code should have at least 1 type parameter, but don't crash on bad code.


        if (typeParameters && typeParameters.params.length !== 0) {
          this.resetStartLocationFromNode(arrowExpression, typeParameters.params[0]);
        }

        arrowExpression.typeParameters = typeParameters;
        return arrowExpression;
      }; // Handle type assertions


      _proto.parseMaybeUnary = function parseMaybeUnary(refShorthandDefaultPos) {
        if (!this.hasPlugin("jsx") && this.eatRelational("<")) {
          return this.tsParseTypeAssertion();
        } else {
          return _superClass.prototype.parseMaybeUnary.call(this, refShorthandDefaultPos);
        }
      };

      _proto.parseArrow = function parseArrow(node) {
        if (this.match(types.colon)) {
          // This is different from how the TS parser does it.
          // TS uses lookahead. Babylon parses it as a parenthesized expression and converts.
          var state = this.state.clone();

          try {
            var returnType = this.tsParseTypeOrTypePredicateAnnotation(types.colon);
            if (this.canInsertSemicolon()) this.unexpected();
            if (!this.match(types.arrow)) this.unexpected();
            node.returnType = returnType;
          } catch (err) {
            if (err instanceof SyntaxError) {
              this.state = state;
            } else {
              // istanbul ignore next: no such error is expected
              throw err;
            }
          }
        }

        return _superClass.prototype.parseArrow.call(this, node);
      }; // Allow type annotations inside of a parameter list.


      _proto.parseAssignableListItemTypes = function parseAssignableListItemTypes(param) {
        if (this.eat(types.question)) {
          if (param.type !== "Identifier") {
            throw this.raise(param.start, "A binding pattern parameter cannot be optional in an implementation signature.");
          }

          param.optional = true;
        }

        var type = this.tsTryParseTypeAnnotation();
        if (type) param.typeAnnotation = type;
        return this.finishNode(param, param.type);
      };

      _proto.toAssignable = function toAssignable(node, isBinding, contextDescription) {
        switch (node.type) {
          case "TSTypeCastExpression":
            return _superClass.prototype.toAssignable.call(this, this.typeCastToParameter(node), isBinding, contextDescription);

          case "TSParameterProperty":
            return _superClass.prototype.toAssignable.call(this, node, isBinding, contextDescription);

          default:
            return _superClass.prototype.toAssignable.call(this, node, isBinding, contextDescription);
        }
      };

      _proto.checkLVal = function checkLVal(expr, isBinding, checkClashes, contextDescription) {
        switch (expr.type) {
          case "TSTypeCastExpression":
            // Allow "typecasts" to appear on the left of assignment expressions,
            // because it may be in an arrow function.
            // e.g. `const f = (foo: number = 0) => foo;`
            return;

          case "TSParameterProperty":
            this.checkLVal(expr.parameter, isBinding, checkClashes, "parameter property");
            return;

          default:
            _superClass.prototype.checkLVal.call(this, expr, isBinding, checkClashes, contextDescription);

            return;
        }
      };

      _proto.parseBindingAtom = function parseBindingAtom() {
        switch (this.state.type) {
          case types._this:
            // "this" may be the name of a parameter, so allow it.
            return this.parseIdentifier(
            /* liberal */
            true);

          default:
            return _superClass.prototype.parseBindingAtom.call(this);
        }
      }; // === === === === === === === === === === === === === === === ===
      // Note: All below methods are duplicates of something in flow.js.
      // Not sure what the best way to combine these is.
      // === === === === === === === === === === === === === === === ===


      _proto.isClassMethod = function isClassMethod() {
        return this.isRelational("<") || _superClass.prototype.isClassMethod.call(this);
      };

      _proto.isClassProperty = function isClassProperty() {
        return this.match(types.colon) || _superClass.prototype.isClassProperty.call(this);
      };

      _proto.parseMaybeDefault = function parseMaybeDefault() {
        var _superClass$prototype7;

        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var node = (_superClass$prototype7 = _superClass.prototype.parseMaybeDefault).call.apply(_superClass$prototype7, [this].concat(args));

        if (node.type === "AssignmentPattern" && node.typeAnnotation && node.right.start < node.typeAnnotation.start) {
          this.raise(node.typeAnnotation.start, "Type annotations must come before default assignments, " + "e.g. instead of `age = 25: number` use `age: number = 25`");
        }

        return node;
      }; // ensure that inside types, we bypass the jsx parser plugin


      _proto.readToken = function readToken(code) {
        if (this.state.inType && (code === 62 || code === 60)) {
          return this.finishOp(types.relational, 1);
        } else {
          return _superClass.prototype.readToken.call(this, code);
        }
      };

      _proto.toAssignableList = function toAssignableList(exprList, isBinding, contextDescription) {
        for (var i = 0; i < exprList.length; i++) {
          var expr = exprList[i];

          if (expr && expr.type === "TSTypeCastExpression") {
            exprList[i] = this.typeCastToParameter(expr);
          }
        }

        return _superClass.prototype.toAssignableList.call(this, exprList, isBinding, contextDescription);
      };

      _proto.typeCastToParameter = function typeCastToParameter(node) {
        node.expression.typeAnnotation = node.typeAnnotation;
        return this.finishNodeAt(node.expression, node.expression.type, node.typeAnnotation.end, node.typeAnnotation.loc.end);
      };

      _proto.toReferencedList = function toReferencedList(exprList) {
        for (var i = 0; i < exprList.length; i++) {
          var expr = exprList[i];

          if (expr && expr._exprListItem && expr.type === "TsTypeCastExpression") {
            this.raise(expr.start, "Did not expect a type annotation here.");
          }
        }

        return exprList;
      };

      _proto.shouldParseArrow = function shouldParseArrow() {
        return this.match(types.colon) || _superClass.prototype.shouldParseArrow.call(this);
      };

      _proto.shouldParseAsyncArrow = function shouldParseAsyncArrow() {
        return this.match(types.colon) || _superClass.prototype.shouldParseAsyncArrow.call(this);
      };

      return _class;
    }(superClass)
  );
});

plugins.estree = estreePlugin;
plugins.flow = flowPlugin;
plugins.jsx = jsxPlugin;
plugins.typescript = typescriptPlugin;
function parse(input, options) {
  if (options && options.sourceType === "unambiguous") {
    options = Object.assign({}, options);

    try {
      options.sourceType = "module";
      var ast = getParser(options, input).parse(); // Rather than try to parse as a script first, we opt to parse as a module and convert back
      // to a script where possible to avoid having to do a full re-parse of the input content.

      if (!hasModuleSyntax(ast)) ast.program.sourceType = "script";
      return ast;
    } catch (moduleError) {
      try {
        options.sourceType = "script";
        return getParser(options, input).parse();
      } catch (scriptError) {}

      throw moduleError;
    }
  } else {
    return getParser(options, input).parse();
  }
}
function parseExpression(input, options) {
  var parser = getParser(options, input);

  if (parser.options.strictMode) {
    parser.state.strict = true;
  }

  return parser.getExpression();
}
function getParser(options, input) {
  var cls = options && options.plugins ? getParserClass(options.plugins) : Parser;
  return new cls(options, input);
}

var parserClassCache = {};
/** Get a Parser class with plugins applied. */

function getParserClass(pluginsFromOptions) {
  if (pluginsFromOptions.indexOf("decorators") >= 0 && pluginsFromOptions.indexOf("decorators2") >= 0) {
    throw new Error("Cannot use decorators and decorators2 plugin together");
  } // Filter out just the plugins that have an actual mixin associated with them.


  var pluginList = pluginsFromOptions.filter(function (p) {
    return p === "estree" || p === "flow" || p === "jsx" || p === "typescript";
  });

  if (pluginList.indexOf("flow") >= 0) {
    // ensure flow plugin loads last
    pluginList = pluginList.filter(function (plugin) {
      return plugin !== "flow";
    });
    pluginList.push("flow");
  }

  if (pluginList.indexOf("flow") >= 0 && pluginList.indexOf("typescript") >= 0) {
    throw new Error("Cannot combine flow and typescript plugins.");
  }

  if (pluginList.indexOf("typescript") >= 0) {
    // ensure typescript plugin loads last
    pluginList = pluginList.filter(function (plugin) {
      return plugin !== "typescript";
    });
    pluginList.push("typescript");
  }

  if (pluginList.indexOf("estree") >= 0) {
    // ensure estree plugin loads first
    pluginList = pluginList.filter(function (plugin) {
      return plugin !== "estree";
    });
    pluginList.unshift("estree");
  }

  var key = pluginList.join("/");
  var cls = parserClassCache[key];

  if (!cls) {
    cls = Parser;

    for (var _i2 = 0, _pluginList2 = pluginList; _i2 < _pluginList2.length; _i2++) {
      var plugin = _pluginList2[_i2];
      cls = plugins[plugin](cls);
    }

    parserClassCache[key] = cls;
  }

  return cls;
}

function hasModuleSyntax(ast) {
  return ast.program.body.some(function (child) {
    return child.type === "ImportDeclaration" && (!child.importKind || child.importKind === "value") || child.type === "ExportNamedDeclaration" && (!child.exportKind || child.exportKind === "value") || child.type === "ExportAllDeclaration" && (!child.exportKind || child.exportKind === "value") || child.type === "ExportDefaultDeclaration";
  });
}

exports.parse = parse;
exports.parseExpression = parseExpression;
exports.tokTypes = types;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var punctuation_ranges = [
    // http://www.unicode.org/charts/PDF/U3000.pdf CJK Symbols and Punctuation
    [0x3000, 0x303f],
    // http://www.unicode.org/charts/PDF/UAC00.pdf Hangul Syllables
    [0xac00, 0xd7af],
    // http://www.unicode.org/charts/PDF/UFE10.pdf Vertical Forms
    [0xfe10, 0xfe1f],
    // http://www.unicode.org/charts/PDF/UFE30.pdf CJK Compatibility Forms
    // http://www.unicode.org/charts/PDF/UFE50.pdf Small Form Variants
    [0xfe30, 0xfe6f],
    // http://www.unicode.org/charts/PDF/UFF00.pdf Halfwidth and Fullwidth Forms
    [0xff00, 0xff60],
    [0xffe0, 0xffef],
];
var character_ranges = [
    // http://www.unicode.org/charts/PDF/U1100.pdf Hangul Jamo
    [0x1100, 0x11ff],
    // http://www.unicode.org/charts/PDF/U2E80.pdf CJK Radicals Supplement
    // http://www.unicode.org/charts/PDF/U2F00.pdf Kangxi Radicals
    [0x2e80, 0x2fdf],
    // http://www.unicode.org/charts/PDF/U3040.pdf Hiragana
    // http://www.unicode.org/charts/PDF/U30A0.pdf Katakana
    // http://www.unicode.org/charts/PDF/U3100.pdf Bopomofo
    // http://www.unicode.org/charts/PDF/U3130.pdf Hangul Compatibility Jamo
    [0x3040, 0x318f],
    // http://www.unicode.org/charts/PDF/U3200.pdf Enclosed CJK Letters and Months
    // http://www.unicode.org/charts/PDF/U3300.pdf CJK Compatibility
    // http://www.unicode.org/charts/PDF/U3400.pdf CJK Unified Ideographs Extension A
    [0x3200, 0x4dbf],
    // http://www.unicode.org/charts/PDF/U4E00.pdf CJK Unified Ideographs (Han)
    [0x4e00, 0x9fff],
    // http://www.unicode.org/charts/PDF/UA960.pdf Hangul Jamo Extended-A
    [0xa960, 0xa97f],
    // http://www.unicode.org/charts/PDF/UF900.pdf CJK Compatibility Ideographs
    [0xf900, 0xfaff],
];
function get_regex() {
    return create_regex(character_ranges.concat(punctuation_ranges));
}
// istanbul ignore next
// tslint:disable-next-line:no-namespace
(function (get_regex) {
    function punctuations() {
        return create_regex(punctuation_ranges);
    }
    get_regex.punctuations = punctuations;
    function characters() {
        return create_regex(character_ranges);
    }
    get_regex.characters = characters;
})(get_regex || (get_regex = {}));
function create_regex(ranges) {
    return new RegExp("[" + ranges.map(get_bracket_content).reduce(function (a, b) { return a + b; }) + "]", 'g');
}
function get_bracket_content(range) {
    return get_escaped_unicode(range[0]) + "-" + get_escaped_unicode(range[1]);
}
function get_escaped_unicode(num) {
    return "\\u" + num.toString(16);
}
module.exports = get_regex;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = function () {
	// https://mathiasbynens.be/notes/es-unicode-property-escapes#emoji
	return (/\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74)\uDB40\uDC7F|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC68(?:\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]\uFE0F|(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]))|\uD83D\uDC69\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2695\u2696\u2708]|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83D\uDC69\u200D[\u2695\u2696\u2708])\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D\uDC68(?:\u200D(?:(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|\uD83D[\uDC66\uDC67])|\uD83C[\uDFFB-\uDFFF])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92])|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF6\uD83C\uDDE6|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDD1-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC69\uDC6E\uDC70-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD18-\uDD1C\uDD1E\uDD1F\uDD26\uDD30-\uDD39\uDD3D\uDD3E\uDDD1-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])?|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDEEB\uDEEC\uDEF4-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u2660\u2663\u2665\u2666\u2668\u267B\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEF8]|\uD83E[\uDD10-\uDD3A\uDD3C-\uDD3E\uDD40-\uDD45\uDD47-\uDD4C\uDD50-\uDD6B\uDD80-\uDD97\uDDC0\uDDD0-\uDDE6])\uFE0F/g
	);
};


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;

module.exports = function (str) {
	if (typeof str !== 'string') {
		throw new TypeError('Expected a string');
	}

	return str.replace(matchOperatorsRe, '\\$&');
};


/***/ }),
/* 12 */
/***/ (function(module, exports) {

/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    function isExpression(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'ArrayExpression':
            case 'AssignmentExpression':
            case 'BinaryExpression':
            case 'CallExpression':
            case 'ConditionalExpression':
            case 'FunctionExpression':
            case 'Identifier':
            case 'Literal':
            case 'LogicalExpression':
            case 'MemberExpression':
            case 'NewExpression':
            case 'ObjectExpression':
            case 'SequenceExpression':
            case 'ThisExpression':
            case 'UnaryExpression':
            case 'UpdateExpression':
                return true;
        }
        return false;
    }

    function isIterationStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'DoWhileStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'WhileStatement':
                return true;
        }
        return false;
    }

    function isStatement(node) {
        if (node == null) { return false; }
        switch (node.type) {
            case 'BlockStatement':
            case 'BreakStatement':
            case 'ContinueStatement':
            case 'DebuggerStatement':
            case 'DoWhileStatement':
            case 'EmptyStatement':
            case 'ExpressionStatement':
            case 'ForInStatement':
            case 'ForStatement':
            case 'IfStatement':
            case 'LabeledStatement':
            case 'ReturnStatement':
            case 'SwitchStatement':
            case 'ThrowStatement':
            case 'TryStatement':
            case 'VariableDeclaration':
            case 'WhileStatement':
            case 'WithStatement':
                return true;
        }
        return false;
    }

    function isSourceElement(node) {
      return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
    }

    function trailingStatement(node) {
        switch (node.type) {
        case 'IfStatement':
            if (node.alternate != null) {
                return node.alternate;
            }
            return node.consequent;

        case 'LabeledStatement':
        case 'ForStatement':
        case 'ForInStatement':
        case 'WhileStatement':
        case 'WithStatement':
            return node.body;
        }
        return null;
    }

    function isProblematicIfStatement(node) {
        var current;

        if (node.type !== 'IfStatement') {
            return false;
        }
        if (node.alternate == null) {
            return false;
        }
        current = node.consequent;
        do {
            if (current.type === 'IfStatement') {
                if (current.alternate == null)  {
                    return true;
                }
            }
            current = trailingStatement(current);
        } while (current);

        return false;
    }

    module.exports = {
        isExpression: isExpression,
        isStatement: isStatement,
        isIterationStatement: isIterationStatement,
        isSourceElement: isSourceElement,
        isProblematicIfStatement: isProblematicIfStatement,

        trailingStatement: trailingStatement
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var code = __webpack_require__(2);

    function isStrictModeReservedWordES6(id) {
        switch (id) {
        case 'implements':
        case 'interface':
        case 'package':
        case 'private':
        case 'protected':
        case 'public':
        case 'static':
        case 'let':
            return true;
        default:
            return false;
        }
    }

    function isKeywordES5(id, strict) {
        // yield should not be treated as keyword under non-strict mode.
        if (!strict && id === 'yield') {
            return false;
        }
        return isKeywordES6(id, strict);
    }

    function isKeywordES6(id, strict) {
        if (strict && isStrictModeReservedWordES6(id)) {
            return true;
        }

        switch (id.length) {
        case 2:
            return (id === 'if') || (id === 'in') || (id === 'do');
        case 3:
            return (id === 'var') || (id === 'for') || (id === 'new') || (id === 'try');
        case 4:
            return (id === 'this') || (id === 'else') || (id === 'case') ||
                (id === 'void') || (id === 'with') || (id === 'enum');
        case 5:
            return (id === 'while') || (id === 'break') || (id === 'catch') ||
                (id === 'throw') || (id === 'const') || (id === 'yield') ||
                (id === 'class') || (id === 'super');
        case 6:
            return (id === 'return') || (id === 'typeof') || (id === 'delete') ||
                (id === 'switch') || (id === 'export') || (id === 'import');
        case 7:
            return (id === 'default') || (id === 'finally') || (id === 'extends');
        case 8:
            return (id === 'function') || (id === 'continue') || (id === 'debugger');
        case 10:
            return (id === 'instanceof');
        default:
            return false;
        }
    }

    function isReservedWordES5(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
    }

    function isReservedWordES6(id, strict) {
        return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
    }

    function isRestrictedWord(id) {
        return id === 'eval' || id === 'arguments';
    }

    function isIdentifierNameES5(id) {
        var i, iz, ch;

        if (id.length === 0) { return false; }

        ch = id.charCodeAt(0);
        if (!code.isIdentifierStartES5(ch)) {
            return false;
        }

        for (i = 1, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (!code.isIdentifierPartES5(ch)) {
                return false;
            }
        }
        return true;
    }

    function decodeUtf16(lead, trail) {
        return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
    }

    function isIdentifierNameES6(id) {
        var i, iz, ch, lowCh, check;

        if (id.length === 0) { return false; }

        check = code.isIdentifierStartES6;
        for (i = 0, iz = id.length; i < iz; ++i) {
            ch = id.charCodeAt(i);
            if (0xD800 <= ch && ch <= 0xDBFF) {
                ++i;
                if (i >= iz) { return false; }
                lowCh = id.charCodeAt(i);
                if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                    return false;
                }
                ch = decodeUtf16(ch, lowCh);
            }
            if (!check(ch)) {
                return false;
            }
            check = code.isIdentifierPartES6;
        }
        return true;
    }

    function isIdentifierES5(id, strict) {
        return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
    }

    function isIdentifierES6(id, strict) {
        return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
    }

    module.exports = {
        isKeywordES5: isKeywordES5,
        isKeywordES6: isKeywordES6,
        isReservedWordES5: isReservedWordES5,
        isReservedWordES6: isReservedWordES6,
        isRestrictedWord: isRestrictedWord,
        isIdentifierNameES5: isIdentifierNameES5,
        isIdentifierNameES6: isIdentifierNameES6,
        isIdentifierES5: isIdentifierES5,
        isIdentifierES6: isIdentifierES6
    };
}());
/* vim: set sw=4 ts=4 et tw=80 : */


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

/*
  Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/


(function () {
    'use strict';

    exports.ast = __webpack_require__(12);
    exports.code = __webpack_require__(2);
    exports.keyword = __webpack_require__(13);
}());
/* vim: set sw=4 ts=4 et tw=80 : */


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/* eslint-disable yoda */
module.exports = x => {
	if (Number.isNaN(x)) {
		return false;
	}

	// code points are derived from:
	// http://www.unix.org/Public/UNIDATA/EastAsianWidth.txt
	if (
		x >= 0x1100 && (
			x <= 0x115f ||  // Hangul Jamo
			x === 0x2329 || // LEFT-POINTING ANGLE BRACKET
			x === 0x232a || // RIGHT-POINTING ANGLE BRACKET
			// CJK Radicals Supplement .. Enclosed CJK Letters and Months
			(0x2e80 <= x && x <= 0x3247 && x !== 0x303f) ||
			// Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
			(0x3250 <= x && x <= 0x4dbf) ||
			// CJK Unified Ideographs .. Yi Radicals
			(0x4e00 <= x && x <= 0xa4c6) ||
			// Hangul Jamo Extended-A
			(0xa960 <= x && x <= 0xa97c) ||
			// Hangul Syllables
			(0xac00 <= x && x <= 0xd7a3) ||
			// CJK Compatibility Ideographs
			(0xf900 <= x && x <= 0xfaff) ||
			// Vertical Forms
			(0xfe10 <= x && x <= 0xfe19) ||
			// CJK Compatibility Forms .. Small Form Variants
			(0xfe30 <= x && x <= 0xfe6b) ||
			// Halfwidth and Fullwidth Forms
			(0xff01 <= x && x <= 0xff60) ||
			(0xffe0 <= x && x <= 0xffe6) ||
			// Kana Supplement
			(0x1b000 <= x && x <= 0x1b001) ||
			// Enclosed Ideographic Supplement
			(0x1f200 <= x && x <= 0x1f251) ||
			// CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
			(0x20000 <= x && x <= 0x3fffd)
		)
	) {
		return true;
	}

	return false;
};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const stripAnsi = __webpack_require__(17);
const isFullwidthCodePoint = __webpack_require__(15);

module.exports = str => {
	if (typeof str !== 'string' || str.length === 0) {
		return 0;
	}

	str = stripAnsi(str);

	let width = 0;

	for (let i = 0; i < str.length; i++) {
		const code = str.codePointAt(i);

		// Ignore control characters
		if (code <= 0x1F || (code >= 0x7F && code <= 0x9F)) {
			continue;
		}

		// Ignore combining characters
		if (code >= 0x300 && code <= 0x36F) {
			continue;
		}

		// Surrogates
		if (code > 0xFFFF) {
			i++;
		}

		width += isFullwidthCodePoint(code) ? 2 : 1;
	}

	return width;
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

const ansiRegex = __webpack_require__(18);

module.exports = input => typeof input === 'string' ? input.replace(ansiRegex(), '') : input;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = () => {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[a-zA-Z\\d]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
	].join('|');

	return new RegExp(pattern, 'g');
};


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
exports.get_data = function () { return ({ "Pc": [[95, 95], [8255, 8256], [8276, 8276], [65075, 65076], [65101, 65103], [65343, 65343]], "Pe": [[41, 41], [93, 93], [125, 125], [3899, 3899], [3901, 3901], [5788, 5788], [8262, 8262], [8318, 8318], [8334, 8334], [8969, 8969], [8971, 8971], [9002, 9002], [10089, 10089], [10091, 10091], [10093, 10093], [10095, 10095], [10097, 10097], [10099, 10099], [10101, 10101], [10182, 10182], [10215, 10215], [10217, 10217], [10219, 10219], [10221, 10221], [10223, 10223], [10628, 10628], [10630, 10630], [10632, 10632], [10634, 10634], [10636, 10636], [10638, 10638], [10640, 10640], [10642, 10642], [10644, 10644], [10646, 10646], [10648, 10648], [10713, 10713], [10715, 10715], [10749, 10749], [11811, 11811], [11813, 11813], [11815, 11815], [11817, 11817], [12297, 12297], [12299, 12299], [12301, 12301], [12303, 12303], [12305, 12305], [12309, 12309], [12311, 12311], [12313, 12313], [12315, 12315], [12318, 12319], [64830, 64830], [65048, 65048], [65078, 65078], [65080, 65080], [65082, 65082], [65084, 65084], [65086, 65086], [65088, 65088], [65090, 65090], [65092, 65092], [65096, 65096], [65114, 65114], [65116, 65116], [65118, 65118], [65289, 65289], [65341, 65341], [65373, 65373], [65376, 65376], [65379, 65379]], "Ps": [[40, 40], [91, 91], [123, 123], [3898, 3898], [3900, 3900], [5787, 5787], [8218, 8218], [8222, 8222], [8261, 8261], [8317, 8317], [8333, 8333], [8968, 8968], [8970, 8970], [9001, 9001], [10088, 10088], [10090, 10090], [10092, 10092], [10094, 10094], [10096, 10096], [10098, 10098], [10100, 10100], [10181, 10181], [10214, 10214], [10216, 10216], [10218, 10218], [10220, 10220], [10222, 10222], [10627, 10627], [10629, 10629], [10631, 10631], [10633, 10633], [10635, 10635], [10637, 10637], [10639, 10639], [10641, 10641], [10643, 10643], [10645, 10645], [10647, 10647], [10712, 10712], [10714, 10714], [10748, 10748], [11810, 11810], [11812, 11812], [11814, 11814], [11816, 11816], [11842, 11842], [12296, 12296], [12298, 12298], [12300, 12300], [12302, 12302], [12304, 12304], [12308, 12308], [12310, 12310], [12312, 12312], [12314, 12314], [12317, 12317], [64831, 64831], [65047, 65047], [65077, 65077], [65079, 65079], [65081, 65081], [65083, 65083], [65085, 65085], [65087, 65087], [65089, 65089], [65091, 65091], [65095, 65095], [65113, 65113], [65115, 65115], [65117, 65117], [65288, 65288], [65339, 65339], [65371, 65371], [65375, 65375], [65378, 65378]], "Lm": [[688, 705], [710, 721], [736, 740], [748, 748], [750, 750], [884, 884], [890, 890], [1369, 1369], [1600, 1600], [1765, 1766], [2036, 2037], [2042, 2042], [2074, 2074], [2084, 2084], [2088, 2088], [2417, 2417], [3654, 3654], [3782, 3782], [4348, 4348], [6103, 6103], [6211, 6211], [6823, 6823], [7288, 7293], [7468, 7530], [7544, 7544], [7579, 7615], [8305, 8305], [8319, 8319], [8336, 8348], [11388, 11389], [11631, 11631], [11823, 11823], [12293, 12293], [12337, 12341], [12347, 12347], [12445, 12446], [12540, 12542], [40981, 40981], [42232, 42237], [42508, 42508], [42623, 42623], [42652, 42653], [42775, 42783], [42864, 42864], [42888, 42888], [43000, 43001], [43471, 43471], [43494, 43494], [43632, 43632], [43741, 43741], [43763, 43764], [43868, 43871], [65392, 65392], [65438, 65439]], "Mc": [[2307, 2307], [2363, 2363], [2366, 2368], [2377, 2380], [2382, 2383], [2434, 2435], [2494, 2496], [2503, 2504], [2507, 2508], [2519, 2519], [2563, 2563], [2622, 2624], [2691, 2691], [2750, 2752], [2761, 2761], [2763, 2764], [2818, 2819], [2878, 2878], [2880, 2880], [2887, 2888], [2891, 2892], [2903, 2903], [3006, 3007], [3009, 3010], [3014, 3016], [3018, 3020], [3031, 3031], [3073, 3075], [3137, 3140], [3202, 3203], [3262, 3262], [3264, 3268], [3271, 3272], [3274, 3275], [3285, 3286], [3330, 3331], [3390, 3392], [3398, 3400], [3402, 3404], [3415, 3415], [3458, 3459], [3535, 3537], [3544, 3551], [3570, 3571], [3902, 3903], [3967, 3967], [4139, 4140], [4145, 4145], [4152, 4152], [4155, 4156], [4182, 4183], [4194, 4196], [4199, 4205], [4227, 4228], [4231, 4236], [4239, 4239], [4250, 4252], [6070, 6070], [6078, 6085], [6087, 6088], [6435, 6438], [6441, 6443], [6448, 6449], [6451, 6456], [6681, 6682], [6741, 6741], [6743, 6743], [6753, 6753], [6755, 6756], [6765, 6770], [6916, 6916], [6965, 6965], [6971, 6971], [6973, 6977], [6979, 6980], [7042, 7042], [7073, 7073], [7078, 7079], [7082, 7082], [7143, 7143], [7146, 7148], [7150, 7150], [7154, 7155], [7204, 7211], [7220, 7221], [7393, 7393], [7410, 7411], [7415, 7415], [12334, 12335], [43043, 43044], [43047, 43047], [43136, 43137], [43188, 43203], [43346, 43347], [43395, 43395], [43444, 43445], [43450, 43451], [43453, 43456], [43567, 43568], [43571, 43572], [43597, 43597], [43643, 43643], [43645, 43645], [43755, 43755], [43758, 43759], [43765, 43765], [44003, 44004], [44006, 44007], [44009, 44010], [44012, 44012]], "Zp": [[8233, 8233]], "Sc": [[36, 36], [162, 165], [1423, 1423], [1547, 1547], [2546, 2547], [2555, 2555], [2801, 2801], [3065, 3065], [3647, 3647], [6107, 6107], [8352, 8383], [43064, 43064], [65020, 65020], [65129, 65129], [65284, 65284], [65504, 65505], [65509, 65510]], "Me": [[1160, 1161], [6846, 6846], [8413, 8416], [8418, 8420], [42608, 42610]], "Sk": [[94, 94], [96, 96], [168, 168], [175, 175], [180, 180], [184, 184], [706, 709], [722, 735], [741, 747], [749, 749], [751, 767], [885, 885], [900, 901], [8125, 8125], [8127, 8129], [8141, 8143], [8157, 8159], [8173, 8175], [8189, 8190], [12443, 12444], [42752, 42774], [42784, 42785], [42889, 42890], [43867, 43867], [64434, 64449], [65342, 65342], [65344, 65344], [65507, 65507]], "Cs": [[55296, 55296], [56191, 56192], [56319, 56320], [57343, 57343]], "Nl": [[5870, 5872], [8544, 8578], [8581, 8584], [12295, 12295], [12321, 12329], [12344, 12346], [42726, 42735]], "So": [[166, 166], [169, 169], [174, 174], [176, 176], [1154, 1154], [1421, 1422], [1550, 1551], [1758, 1758], [1769, 1769], [1789, 1790], [2038, 2038], [2554, 2554], [2928, 2928], [3059, 3064], [3066, 3066], [3199, 3199], [3407, 3407], [3449, 3449], [3841, 3843], [3859, 3859], [3861, 3863], [3866, 3871], [3892, 3892], [3894, 3894], [3896, 3896], [4030, 4037], [4039, 4044], [4046, 4047], [4053, 4056], [4254, 4255], [5008, 5017], [6464, 6464], [6622, 6655], [7009, 7018], [7028, 7036], [8448, 8449], [8451, 8454], [8456, 8457], [8468, 8468], [8470, 8471], [8478, 8483], [8485, 8485], [8487, 8487], [8489, 8489], [8494, 8494], [8506, 8507], [8522, 8522], [8524, 8525], [8527, 8527], [8586, 8587], [8597, 8601], [8604, 8607], [8609, 8610], [8612, 8613], [8615, 8621], [8623, 8653], [8656, 8657], [8659, 8659], [8661, 8691], [8960, 8967], [8972, 8991], [8994, 9000], [9003, 9083], [9085, 9114], [9140, 9179], [9186, 9254], [9280, 9290], [9372, 9449], [9472, 9654], [9656, 9664], [9666, 9719], [9728, 9838], [9840, 10087], [10132, 10175], [10240, 10495], [11008, 11055], [11077, 11078], [11085, 11123], [11126, 11157], [11160, 11193], [11197, 11208], [11210, 11218], [11244, 11247], [11493, 11498], [11904, 11929], [11931, 12019], [12032, 12245], [12272, 12283], [12292, 12292], [12306, 12307], [12320, 12320], [12342, 12343], [12350, 12351], [12688, 12689], [12694, 12703], [12736, 12771], [12800, 12830], [12842, 12871], [12880, 12880], [12896, 12927], [12938, 12976], [12992, 13054], [13056, 13311], [19904, 19967], [42128, 42182], [43048, 43051], [43062, 43063], [43065, 43065], [43639, 43641], [65021, 65021], [65508, 65508], [65512, 65512], [65517, 65518], [65532, 65533]], "Lt": [[453, 453], [456, 456], [459, 459], [498, 498], [8072, 8079], [8088, 8095], [8104, 8111], [8124, 8124], [8140, 8140], [8188, 8188]], "Zl": [[8232, 8232]], "Lo": [[170, 170], [186, 186], [443, 443], [448, 451], [660, 660], [1488, 1514], [1520, 1522], [1568, 1599], [1601, 1610], [1646, 1647], [1649, 1747], [1749, 1749], [1774, 1775], [1786, 1788], [1791, 1791], [1808, 1808], [1810, 1839], [1869, 1957], [1969, 1969], [1994, 2026], [2048, 2069], [2112, 2136], [2144, 2154], [2208, 2228], [2230, 2237], [2308, 2361], [2365, 2365], [2384, 2384], [2392, 2401], [2418, 2432], [2437, 2444], [2447, 2448], [2451, 2472], [2474, 2480], [2482, 2482], [2486, 2489], [2493, 2493], [2510, 2510], [2524, 2525], [2527, 2529], [2544, 2545], [2556, 2556], [2565, 2570], [2575, 2576], [2579, 2600], [2602, 2608], [2610, 2611], [2613, 2614], [2616, 2617], [2649, 2652], [2654, 2654], [2674, 2676], [2693, 2701], [2703, 2705], [2707, 2728], [2730, 2736], [2738, 2739], [2741, 2745], [2749, 2749], [2768, 2768], [2784, 2785], [2809, 2809], [2821, 2828], [2831, 2832], [2835, 2856], [2858, 2864], [2866, 2867], [2869, 2873], [2877, 2877], [2908, 2909], [2911, 2913], [2929, 2929], [2947, 2947], [2949, 2954], [2958, 2960], [2962, 2965], [2969, 2970], [2972, 2972], [2974, 2975], [2979, 2980], [2984, 2986], [2990, 3001], [3024, 3024], [3077, 3084], [3086, 3088], [3090, 3112], [3114, 3129], [3133, 3133], [3160, 3162], [3168, 3169], [3200, 3200], [3205, 3212], [3214, 3216], [3218, 3240], [3242, 3251], [3253, 3257], [3261, 3261], [3294, 3294], [3296, 3297], [3313, 3314], [3333, 3340], [3342, 3344], [3346, 3386], [3389, 3389], [3406, 3406], [3412, 3414], [3423, 3425], [3450, 3455], [3461, 3478], [3482, 3505], [3507, 3515], [3517, 3517], [3520, 3526], [3585, 3632], [3634, 3635], [3648, 3653], [3713, 3714], [3716, 3716], [3719, 3720], [3722, 3722], [3725, 3725], [3732, 3735], [3737, 3743], [3745, 3747], [3749, 3749], [3751, 3751], [3754, 3755], [3757, 3760], [3762, 3763], [3773, 3773], [3776, 3780], [3804, 3807], [3840, 3840], [3904, 3911], [3913, 3948], [3976, 3980], [4096, 4138], [4159, 4159], [4176, 4181], [4186, 4189], [4193, 4193], [4197, 4198], [4206, 4208], [4213, 4225], [4238, 4238], [4304, 4346], [4349, 4680], [4682, 4685], [4688, 4694], [4696, 4696], [4698, 4701], [4704, 4744], [4746, 4749], [4752, 4784], [4786, 4789], [4792, 4798], [4800, 4800], [4802, 4805], [4808, 4822], [4824, 4880], [4882, 4885], [4888, 4954], [4992, 5007], [5121, 5740], [5743, 5759], [5761, 5786], [5792, 5866], [5873, 5880], [5888, 5900], [5902, 5905], [5920, 5937], [5952, 5969], [5984, 5996], [5998, 6000], [6016, 6067], [6108, 6108], [6176, 6210], [6212, 6263], [6272, 6276], [6279, 6312], [6314, 6314], [6320, 6389], [6400, 6430], [6480, 6509], [6512, 6516], [6528, 6571], [6576, 6601], [6656, 6678], [6688, 6740], [6917, 6963], [6981, 6987], [7043, 7072], [7086, 7087], [7098, 7141], [7168, 7203], [7245, 7247], [7258, 7287], [7401, 7404], [7406, 7409], [7413, 7414], [8501, 8504], [11568, 11623], [11648, 11670], [11680, 11686], [11688, 11694], [11696, 11702], [11704, 11710], [11712, 11718], [11720, 11726], [11728, 11734], [11736, 11742], [12294, 12294], [12348, 12348], [12353, 12438], [12447, 12447], [12449, 12538], [12543, 12543], [12549, 12590], [12593, 12686], [12704, 12730], [12784, 12799], [13312, 13312], [19893, 19893], [19968, 19968], [40938, 40938], [40960, 40980], [40982, 42124], [42192, 42231], [42240, 42507], [42512, 42527], [42538, 42539], [42606, 42606], [42656, 42725], [42895, 42895], [42999, 42999], [43003, 43009], [43011, 43013], [43015, 43018], [43020, 43042], [43072, 43123], [43138, 43187], [43250, 43255], [43259, 43259], [43261, 43261], [43274, 43301], [43312, 43334], [43360, 43388], [43396, 43442], [43488, 43492], [43495, 43503], [43514, 43518], [43520, 43560], [43584, 43586], [43588, 43595], [43616, 43631], [43633, 43638], [43642, 43642], [43646, 43695], [43697, 43697], [43701, 43702], [43705, 43709], [43712, 43712], [43714, 43714], [43739, 43740], [43744, 43754], [43762, 43762], [43777, 43782], [43785, 43790], [43793, 43798], [43808, 43814], [43816, 43822], [43968, 44002], [44032, 44032], [55203, 55203], [55216, 55238], [55243, 55291], [63744, 64109], [64112, 64217], [64285, 64285], [64287, 64296], [64298, 64310], [64312, 64316], [64318, 64318], [64320, 64321], [64323, 64324], [64326, 64433], [64467, 64829], [64848, 64911], [64914, 64967], [65008, 65019], [65136, 65140], [65142, 65276], [65382, 65391], [65393, 65437], [65440, 65470], [65474, 65479], [65482, 65487], [65490, 65495], [65498, 65500]], "Mn": [[768, 879], [1155, 1159], [1425, 1469], [1471, 1471], [1473, 1474], [1476, 1477], [1479, 1479], [1552, 1562], [1611, 1631], [1648, 1648], [1750, 1756], [1759, 1764], [1767, 1768], [1770, 1773], [1809, 1809], [1840, 1866], [1958, 1968], [2027, 2035], [2070, 2073], [2075, 2083], [2085, 2087], [2089, 2093], [2137, 2139], [2260, 2273], [2275, 2306], [2362, 2362], [2364, 2364], [2369, 2376], [2381, 2381], [2385, 2391], [2402, 2403], [2433, 2433], [2492, 2492], [2497, 2500], [2509, 2509], [2530, 2531], [2561, 2562], [2620, 2620], [2625, 2626], [2631, 2632], [2635, 2637], [2641, 2641], [2672, 2673], [2677, 2677], [2689, 2690], [2748, 2748], [2753, 2757], [2759, 2760], [2765, 2765], [2786, 2787], [2810, 2815], [2817, 2817], [2876, 2876], [2879, 2879], [2881, 2884], [2893, 2893], [2902, 2902], [2914, 2915], [2946, 2946], [3008, 3008], [3021, 3021], [3072, 3072], [3134, 3136], [3142, 3144], [3146, 3149], [3157, 3158], [3170, 3171], [3201, 3201], [3260, 3260], [3263, 3263], [3270, 3270], [3276, 3277], [3298, 3299], [3328, 3329], [3387, 3388], [3393, 3396], [3405, 3405], [3426, 3427], [3530, 3530], [3538, 3540], [3542, 3542], [3633, 3633], [3636, 3642], [3655, 3662], [3761, 3761], [3764, 3769], [3771, 3772], [3784, 3789], [3864, 3865], [3893, 3893], [3895, 3895], [3897, 3897], [3953, 3966], [3968, 3972], [3974, 3975], [3981, 3991], [3993, 4028], [4038, 4038], [4141, 4144], [4146, 4151], [4153, 4154], [4157, 4158], [4184, 4185], [4190, 4192], [4209, 4212], [4226, 4226], [4229, 4230], [4237, 4237], [4253, 4253], [4957, 4959], [5906, 5908], [5938, 5940], [5970, 5971], [6002, 6003], [6068, 6069], [6071, 6077], [6086, 6086], [6089, 6099], [6109, 6109], [6155, 6157], [6277, 6278], [6313, 6313], [6432, 6434], [6439, 6440], [6450, 6450], [6457, 6459], [6679, 6680], [6683, 6683], [6742, 6742], [6744, 6750], [6752, 6752], [6754, 6754], [6757, 6764], [6771, 6780], [6783, 6783], [6832, 6845], [6912, 6915], [6964, 6964], [6966, 6970], [6972, 6972], [6978, 6978], [7019, 7027], [7040, 7041], [7074, 7077], [7080, 7081], [7083, 7085], [7142, 7142], [7144, 7145], [7149, 7149], [7151, 7153], [7212, 7219], [7222, 7223], [7376, 7378], [7380, 7392], [7394, 7400], [7405, 7405], [7412, 7412], [7416, 7417], [7616, 7673], [7675, 7679], [8400, 8412], [8417, 8417], [8421, 8432], [11503, 11505], [11647, 11647], [11744, 11775], [12330, 12333], [12441, 12442], [42607, 42607], [42612, 42621], [42654, 42655], [42736, 42737], [43010, 43010], [43014, 43014], [43019, 43019], [43045, 43046], [43204, 43205], [43232, 43249], [43302, 43309], [43335, 43345], [43392, 43394], [43443, 43443], [43446, 43449], [43452, 43452], [43493, 43493], [43561, 43566], [43569, 43570], [43573, 43574], [43587, 43587], [43596, 43596], [43644, 43644], [43696, 43696], [43698, 43700], [43703, 43704], [43710, 43711], [43713, 43713], [43756, 43757], [43766, 43766], [44005, 44005], [44008, 44008], [44013, 44013], [64286, 64286], [65024, 65039], [65056, 65071]], "Po": [[33, 35], [37, 39], [42, 42], [44, 44], [46, 47], [58, 59], [63, 64], [92, 92], [161, 161], [167, 167], [182, 183], [191, 191], [894, 894], [903, 903], [1370, 1375], [1417, 1417], [1472, 1472], [1475, 1475], [1478, 1478], [1523, 1524], [1545, 1546], [1548, 1549], [1563, 1563], [1566, 1567], [1642, 1645], [1748, 1748], [1792, 1805], [2039, 2041], [2096, 2110], [2142, 2142], [2404, 2405], [2416, 2416], [2557, 2557], [2800, 2800], [3572, 3572], [3663, 3663], [3674, 3675], [3844, 3858], [3860, 3860], [3973, 3973], [4048, 4052], [4057, 4058], [4170, 4175], [4347, 4347], [4960, 4968], [5741, 5742], [5867, 5869], [5941, 5942], [6100, 6102], [6104, 6106], [6144, 6149], [6151, 6154], [6468, 6469], [6686, 6687], [6816, 6822], [6824, 6829], [7002, 7008], [7164, 7167], [7227, 7231], [7294, 7295], [7360, 7367], [7379, 7379], [8214, 8215], [8224, 8231], [8240, 8248], [8251, 8254], [8257, 8259], [8263, 8273], [8275, 8275], [8277, 8286], [11513, 11516], [11518, 11519], [11632, 11632], [11776, 11777], [11782, 11784], [11787, 11787], [11790, 11798], [11800, 11801], [11803, 11803], [11806, 11807], [11818, 11822], [11824, 11833], [11836, 11839], [11841, 11841], [11843, 11849], [12289, 12291], [12349, 12349], [12539, 12539], [42238, 42239], [42509, 42511], [42611, 42611], [42622, 42622], [42738, 42743], [43124, 43127], [43214, 43215], [43256, 43258], [43260, 43260], [43310, 43311], [43359, 43359], [43457, 43469], [43486, 43487], [43612, 43615], [43742, 43743], [43760, 43761], [44011, 44011], [65040, 65046], [65049, 65049], [65072, 65072], [65093, 65094], [65097, 65100], [65104, 65106], [65108, 65111], [65119, 65121], [65128, 65128], [65130, 65131], [65281, 65283], [65285, 65287], [65290, 65290], [65292, 65292], [65294, 65295], [65306, 65307], [65311, 65312], [65340, 65340], [65377, 65377], [65380, 65381]], "Co": [[57344, 57344], [63743, 63743]], "Sm": [[43, 43], [60, 62], [124, 124], [126, 126], [172, 172], [177, 177], [215, 215], [247, 247], [1014, 1014], [1542, 1544], [8260, 8260], [8274, 8274], [8314, 8316], [8330, 8332], [8472, 8472], [8512, 8516], [8523, 8523], [8592, 8596], [8602, 8603], [8608, 8608], [8611, 8611], [8614, 8614], [8622, 8622], [8654, 8655], [8658, 8658], [8660, 8660], [8692, 8959], [8992, 8993], [9084, 9084], [9115, 9139], [9180, 9185], [9655, 9655], [9665, 9665], [9720, 9727], [9839, 9839], [10176, 10180], [10183, 10213], [10224, 10239], [10496, 10626], [10649, 10711], [10716, 10747], [10750, 11007], [11056, 11076], [11079, 11084], [64297, 64297], [65122, 65122], [65124, 65126], [65291, 65291], [65308, 65310], [65372, 65372], [65374, 65374], [65506, 65506], [65513, 65516]], "Pf": [[187, 187], [8217, 8217], [8221, 8221], [8250, 8250], [11779, 11779], [11781, 11781], [11786, 11786], [11789, 11789], [11805, 11805], [11809, 11809]], "Cc": [[0, 31], [127, 159]], "Pi": [[171, 171], [8216, 8216], [8219, 8220], [8223, 8223], [8249, 8249], [11778, 11778], [11780, 11780], [11785, 11785], [11788, 11788], [11804, 11804], [11808, 11808]], "Lu": [[65, 90], [192, 214], [216, 222], [256, 256], [258, 258], [260, 260], [262, 262], [264, 264], [266, 266], [268, 268], [270, 270], [272, 272], [274, 274], [276, 276], [278, 278], [280, 280], [282, 282], [284, 284], [286, 286], [288, 288], [290, 290], [292, 292], [294, 294], [296, 296], [298, 298], [300, 300], [302, 302], [304, 304], [306, 306], [308, 308], [310, 310], [313, 313], [315, 315], [317, 317], [319, 319], [321, 321], [323, 323], [325, 325], [327, 327], [330, 330], [332, 332], [334, 334], [336, 336], [338, 338], [340, 340], [342, 342], [344, 344], [346, 346], [348, 348], [350, 350], [352, 352], [354, 354], [356, 356], [358, 358], [360, 360], [362, 362], [364, 364], [366, 366], [368, 368], [370, 370], [372, 372], [374, 374], [376, 377], [379, 379], [381, 381], [385, 386], [388, 388], [390, 391], [393, 395], [398, 401], [403, 404], [406, 408], [412, 413], [415, 416], [418, 418], [420, 420], [422, 423], [425, 425], [428, 428], [430, 431], [433, 435], [437, 437], [439, 440], [444, 444], [452, 452], [455, 455], [458, 458], [461, 461], [463, 463], [465, 465], [467, 467], [469, 469], [471, 471], [473, 473], [475, 475], [478, 478], [480, 480], [482, 482], [484, 484], [486, 486], [488, 488], [490, 490], [492, 492], [494, 494], [497, 497], [500, 500], [502, 504], [506, 506], [508, 508], [510, 510], [512, 512], [514, 514], [516, 516], [518, 518], [520, 520], [522, 522], [524, 524], [526, 526], [528, 528], [530, 530], [532, 532], [534, 534], [536, 536], [538, 538], [540, 540], [542, 542], [544, 544], [546, 546], [548, 548], [550, 550], [552, 552], [554, 554], [556, 556], [558, 558], [560, 560], [562, 562], [570, 571], [573, 574], [577, 577], [579, 582], [584, 584], [586, 586], [588, 588], [590, 590], [880, 880], [882, 882], [886, 886], [895, 895], [902, 902], [904, 906], [908, 908], [910, 911], [913, 929], [931, 939], [975, 975], [978, 980], [984, 984], [986, 986], [988, 988], [990, 990], [992, 992], [994, 994], [996, 996], [998, 998], [1000, 1000], [1002, 1002], [1004, 1004], [1006, 1006], [1012, 1012], [1015, 1015], [1017, 1018], [1021, 1071], [1120, 1120], [1122, 1122], [1124, 1124], [1126, 1126], [1128, 1128], [1130, 1130], [1132, 1132], [1134, 1134], [1136, 1136], [1138, 1138], [1140, 1140], [1142, 1142], [1144, 1144], [1146, 1146], [1148, 1148], [1150, 1150], [1152, 1152], [1162, 1162], [1164, 1164], [1166, 1166], [1168, 1168], [1170, 1170], [1172, 1172], [1174, 1174], [1176, 1176], [1178, 1178], [1180, 1180], [1182, 1182], [1184, 1184], [1186, 1186], [1188, 1188], [1190, 1190], [1192, 1192], [1194, 1194], [1196, 1196], [1198, 1198], [1200, 1200], [1202, 1202], [1204, 1204], [1206, 1206], [1208, 1208], [1210, 1210], [1212, 1212], [1214, 1214], [1216, 1217], [1219, 1219], [1221, 1221], [1223, 1223], [1225, 1225], [1227, 1227], [1229, 1229], [1232, 1232], [1234, 1234], [1236, 1236], [1238, 1238], [1240, 1240], [1242, 1242], [1244, 1244], [1246, 1246], [1248, 1248], [1250, 1250], [1252, 1252], [1254, 1254], [1256, 1256], [1258, 1258], [1260, 1260], [1262, 1262], [1264, 1264], [1266, 1266], [1268, 1268], [1270, 1270], [1272, 1272], [1274, 1274], [1276, 1276], [1278, 1278], [1280, 1280], [1282, 1282], [1284, 1284], [1286, 1286], [1288, 1288], [1290, 1290], [1292, 1292], [1294, 1294], [1296, 1296], [1298, 1298], [1300, 1300], [1302, 1302], [1304, 1304], [1306, 1306], [1308, 1308], [1310, 1310], [1312, 1312], [1314, 1314], [1316, 1316], [1318, 1318], [1320, 1320], [1322, 1322], [1324, 1324], [1326, 1326], [1329, 1366], [4256, 4293], [4295, 4295], [4301, 4301], [5024, 5109], [7680, 7680], [7682, 7682], [7684, 7684], [7686, 7686], [7688, 7688], [7690, 7690], [7692, 7692], [7694, 7694], [7696, 7696], [7698, 7698], [7700, 7700], [7702, 7702], [7704, 7704], [7706, 7706], [7708, 7708], [7710, 7710], [7712, 7712], [7714, 7714], [7716, 7716], [7718, 7718], [7720, 7720], [7722, 7722], [7724, 7724], [7726, 7726], [7728, 7728], [7730, 7730], [7732, 7732], [7734, 7734], [7736, 7736], [7738, 7738], [7740, 7740], [7742, 7742], [7744, 7744], [7746, 7746], [7748, 7748], [7750, 7750], [7752, 7752], [7754, 7754], [7756, 7756], [7758, 7758], [7760, 7760], [7762, 7762], [7764, 7764], [7766, 7766], [7768, 7768], [7770, 7770], [7772, 7772], [7774, 7774], [7776, 7776], [7778, 7778], [7780, 7780], [7782, 7782], [7784, 7784], [7786, 7786], [7788, 7788], [7790, 7790], [7792, 7792], [7794, 7794], [7796, 7796], [7798, 7798], [7800, 7800], [7802, 7802], [7804, 7804], [7806, 7806], [7808, 7808], [7810, 7810], [7812, 7812], [7814, 7814], [7816, 7816], [7818, 7818], [7820, 7820], [7822, 7822], [7824, 7824], [7826, 7826], [7828, 7828], [7838, 7838], [7840, 7840], [7842, 7842], [7844, 7844], [7846, 7846], [7848, 7848], [7850, 7850], [7852, 7852], [7854, 7854], [7856, 7856], [7858, 7858], [7860, 7860], [7862, 7862], [7864, 7864], [7866, 7866], [7868, 7868], [7870, 7870], [7872, 7872], [7874, 7874], [7876, 7876], [7878, 7878], [7880, 7880], [7882, 7882], [7884, 7884], [7886, 7886], [7888, 7888], [7890, 7890], [7892, 7892], [7894, 7894], [7896, 7896], [7898, 7898], [7900, 7900], [7902, 7902], [7904, 7904], [7906, 7906], [7908, 7908], [7910, 7910], [7912, 7912], [7914, 7914], [7916, 7916], [7918, 7918], [7920, 7920], [7922, 7922], [7924, 7924], [7926, 7926], [7928, 7928], [7930, 7930], [7932, 7932], [7934, 7934], [7944, 7951], [7960, 7965], [7976, 7983], [7992, 7999], [8008, 8013], [8025, 8025], [8027, 8027], [8029, 8029], [8031, 8031], [8040, 8047], [8120, 8123], [8136, 8139], [8152, 8155], [8168, 8172], [8184, 8187], [8450, 8450], [8455, 8455], [8459, 8461], [8464, 8466], [8469, 8469], [8473, 8477], [8484, 8484], [8486, 8486], [8488, 8488], [8490, 8493], [8496, 8499], [8510, 8511], [8517, 8517], [8579, 8579], [11264, 11310], [11360, 11360], [11362, 11364], [11367, 11367], [11369, 11369], [11371, 11371], [11373, 11376], [11378, 11378], [11381, 11381], [11390, 11392], [11394, 11394], [11396, 11396], [11398, 11398], [11400, 11400], [11402, 11402], [11404, 11404], [11406, 11406], [11408, 11408], [11410, 11410], [11412, 11412], [11414, 11414], [11416, 11416], [11418, 11418], [11420, 11420], [11422, 11422], [11424, 11424], [11426, 11426], [11428, 11428], [11430, 11430], [11432, 11432], [11434, 11434], [11436, 11436], [11438, 11438], [11440, 11440], [11442, 11442], [11444, 11444], [11446, 11446], [11448, 11448], [11450, 11450], [11452, 11452], [11454, 11454], [11456, 11456], [11458, 11458], [11460, 11460], [11462, 11462], [11464, 11464], [11466, 11466], [11468, 11468], [11470, 11470], [11472, 11472], [11474, 11474], [11476, 11476], [11478, 11478], [11480, 11480], [11482, 11482], [11484, 11484], [11486, 11486], [11488, 11488], [11490, 11490], [11499, 11499], [11501, 11501], [11506, 11506], [42560, 42560], [42562, 42562], [42564, 42564], [42566, 42566], [42568, 42568], [42570, 42570], [42572, 42572], [42574, 42574], [42576, 42576], [42578, 42578], [42580, 42580], [42582, 42582], [42584, 42584], [42586, 42586], [42588, 42588], [42590, 42590], [42592, 42592], [42594, 42594], [42596, 42596], [42598, 42598], [42600, 42600], [42602, 42602], [42604, 42604], [42624, 42624], [42626, 42626], [42628, 42628], [42630, 42630], [42632, 42632], [42634, 42634], [42636, 42636], [42638, 42638], [42640, 42640], [42642, 42642], [42644, 42644], [42646, 42646], [42648, 42648], [42650, 42650], [42786, 42786], [42788, 42788], [42790, 42790], [42792, 42792], [42794, 42794], [42796, 42796], [42798, 42798], [42802, 42802], [42804, 42804], [42806, 42806], [42808, 42808], [42810, 42810], [42812, 42812], [42814, 42814], [42816, 42816], [42818, 42818], [42820, 42820], [42822, 42822], [42824, 42824], [42826, 42826], [42828, 42828], [42830, 42830], [42832, 42832], [42834, 42834], [42836, 42836], [42838, 42838], [42840, 42840], [42842, 42842], [42844, 42844], [42846, 42846], [42848, 42848], [42850, 42850], [42852, 42852], [42854, 42854], [42856, 42856], [42858, 42858], [42860, 42860], [42862, 42862], [42873, 42873], [42875, 42875], [42877, 42878], [42880, 42880], [42882, 42882], [42884, 42884], [42886, 42886], [42891, 42891], [42893, 42893], [42896, 42896], [42898, 42898], [42902, 42902], [42904, 42904], [42906, 42906], [42908, 42908], [42910, 42910], [42912, 42912], [42914, 42914], [42916, 42916], [42918, 42918], [42920, 42920], [42922, 42926], [42928, 42932], [42934, 42934], [65313, 65338]], "Pd": [[45, 45], [1418, 1418], [1470, 1470], [5120, 5120], [6150, 6150], [8208, 8213], [11799, 11799], [11802, 11802], [11834, 11835], [11840, 11840], [12316, 12316], [12336, 12336], [12448, 12448], [65073, 65074], [65112, 65112], [65123, 65123], [65293, 65293]], "Cf": [[173, 173], [1536, 1541], [1564, 1564], [1757, 1757], [1807, 1807], [2274, 2274], [6158, 6158], [8203, 8207], [8234, 8238], [8288, 8292], [8294, 8303], [65279, 65279], [65529, 65531]], "Nd": [[48, 57], [1632, 1641], [1776, 1785], [1984, 1993], [2406, 2415], [2534, 2543], [2662, 2671], [2790, 2799], [2918, 2927], [3046, 3055], [3174, 3183], [3302, 3311], [3430, 3439], [3558, 3567], [3664, 3673], [3792, 3801], [3872, 3881], [4160, 4169], [4240, 4249], [6112, 6121], [6160, 6169], [6470, 6479], [6608, 6617], [6784, 6793], [6800, 6809], [6992, 7001], [7088, 7097], [7232, 7241], [7248, 7257], [42528, 42537], [43216, 43225], [43264, 43273], [43472, 43481], [43504, 43513], [43600, 43609], [44016, 44025], [65296, 65305]], "Ll": [[97, 122], [181, 181], [223, 246], [248, 255], [257, 257], [259, 259], [261, 261], [263, 263], [265, 265], [267, 267], [269, 269], [271, 271], [273, 273], [275, 275], [277, 277], [279, 279], [281, 281], [283, 283], [285, 285], [287, 287], [289, 289], [291, 291], [293, 293], [295, 295], [297, 297], [299, 299], [301, 301], [303, 303], [305, 305], [307, 307], [309, 309], [311, 312], [314, 314], [316, 316], [318, 318], [320, 320], [322, 322], [324, 324], [326, 326], [328, 329], [331, 331], [333, 333], [335, 335], [337, 337], [339, 339], [341, 341], [343, 343], [345, 345], [347, 347], [349, 349], [351, 351], [353, 353], [355, 355], [357, 357], [359, 359], [361, 361], [363, 363], [365, 365], [367, 367], [369, 369], [371, 371], [373, 373], [375, 375], [378, 378], [380, 380], [382, 384], [387, 387], [389, 389], [392, 392], [396, 397], [402, 402], [405, 405], [409, 411], [414, 414], [417, 417], [419, 419], [421, 421], [424, 424], [426, 427], [429, 429], [432, 432], [436, 436], [438, 438], [441, 442], [445, 447], [454, 454], [457, 457], [460, 460], [462, 462], [464, 464], [466, 466], [468, 468], [470, 470], [472, 472], [474, 474], [476, 477], [479, 479], [481, 481], [483, 483], [485, 485], [487, 487], [489, 489], [491, 491], [493, 493], [495, 496], [499, 499], [501, 501], [505, 505], [507, 507], [509, 509], [511, 511], [513, 513], [515, 515], [517, 517], [519, 519], [521, 521], [523, 523], [525, 525], [527, 527], [529, 529], [531, 531], [533, 533], [535, 535], [537, 537], [539, 539], [541, 541], [543, 543], [545, 545], [547, 547], [549, 549], [551, 551], [553, 553], [555, 555], [557, 557], [559, 559], [561, 561], [563, 569], [572, 572], [575, 576], [578, 578], [583, 583], [585, 585], [587, 587], [589, 589], [591, 659], [661, 687], [881, 881], [883, 883], [887, 887], [891, 893], [912, 912], [940, 974], [976, 977], [981, 983], [985, 985], [987, 987], [989, 989], [991, 991], [993, 993], [995, 995], [997, 997], [999, 999], [1001, 1001], [1003, 1003], [1005, 1005], [1007, 1011], [1013, 1013], [1016, 1016], [1019, 1020], [1072, 1119], [1121, 1121], [1123, 1123], [1125, 1125], [1127, 1127], [1129, 1129], [1131, 1131], [1133, 1133], [1135, 1135], [1137, 1137], [1139, 1139], [1141, 1141], [1143, 1143], [1145, 1145], [1147, 1147], [1149, 1149], [1151, 1151], [1153, 1153], [1163, 1163], [1165, 1165], [1167, 1167], [1169, 1169], [1171, 1171], [1173, 1173], [1175, 1175], [1177, 1177], [1179, 1179], [1181, 1181], [1183, 1183], [1185, 1185], [1187, 1187], [1189, 1189], [1191, 1191], [1193, 1193], [1195, 1195], [1197, 1197], [1199, 1199], [1201, 1201], [1203, 1203], [1205, 1205], [1207, 1207], [1209, 1209], [1211, 1211], [1213, 1213], [1215, 1215], [1218, 1218], [1220, 1220], [1222, 1222], [1224, 1224], [1226, 1226], [1228, 1228], [1230, 1231], [1233, 1233], [1235, 1235], [1237, 1237], [1239, 1239], [1241, 1241], [1243, 1243], [1245, 1245], [1247, 1247], [1249, 1249], [1251, 1251], [1253, 1253], [1255, 1255], [1257, 1257], [1259, 1259], [1261, 1261], [1263, 1263], [1265, 1265], [1267, 1267], [1269, 1269], [1271, 1271], [1273, 1273], [1275, 1275], [1277, 1277], [1279, 1279], [1281, 1281], [1283, 1283], [1285, 1285], [1287, 1287], [1289, 1289], [1291, 1291], [1293, 1293], [1295, 1295], [1297, 1297], [1299, 1299], [1301, 1301], [1303, 1303], [1305, 1305], [1307, 1307], [1309, 1309], [1311, 1311], [1313, 1313], [1315, 1315], [1317, 1317], [1319, 1319], [1321, 1321], [1323, 1323], [1325, 1325], [1327, 1327], [1377, 1415], [5112, 5117], [7296, 7304], [7424, 7467], [7531, 7543], [7545, 7578], [7681, 7681], [7683, 7683], [7685, 7685], [7687, 7687], [7689, 7689], [7691, 7691], [7693, 7693], [7695, 7695], [7697, 7697], [7699, 7699], [7701, 7701], [7703, 7703], [7705, 7705], [7707, 7707], [7709, 7709], [7711, 7711], [7713, 7713], [7715, 7715], [7717, 7717], [7719, 7719], [7721, 7721], [7723, 7723], [7725, 7725], [7727, 7727], [7729, 7729], [7731, 7731], [7733, 7733], [7735, 7735], [7737, 7737], [7739, 7739], [7741, 7741], [7743, 7743], [7745, 7745], [7747, 7747], [7749, 7749], [7751, 7751], [7753, 7753], [7755, 7755], [7757, 7757], [7759, 7759], [7761, 7761], [7763, 7763], [7765, 7765], [7767, 7767], [7769, 7769], [7771, 7771], [7773, 7773], [7775, 7775], [7777, 7777], [7779, 7779], [7781, 7781], [7783, 7783], [7785, 7785], [7787, 7787], [7789, 7789], [7791, 7791], [7793, 7793], [7795, 7795], [7797, 7797], [7799, 7799], [7801, 7801], [7803, 7803], [7805, 7805], [7807, 7807], [7809, 7809], [7811, 7811], [7813, 7813], [7815, 7815], [7817, 7817], [7819, 7819], [7821, 7821], [7823, 7823], [7825, 7825], [7827, 7827], [7829, 7837], [7839, 7839], [7841, 7841], [7843, 7843], [7845, 7845], [7847, 7847], [7849, 7849], [7851, 7851], [7853, 7853], [7855, 7855], [7857, 7857], [7859, 7859], [7861, 7861], [7863, 7863], [7865, 7865], [7867, 7867], [7869, 7869], [7871, 7871], [7873, 7873], [7875, 7875], [7877, 7877], [7879, 7879], [7881, 7881], [7883, 7883], [7885, 7885], [7887, 7887], [7889, 7889], [7891, 7891], [7893, 7893], [7895, 7895], [7897, 7897], [7899, 7899], [7901, 7901], [7903, 7903], [7905, 7905], [7907, 7907], [7909, 7909], [7911, 7911], [7913, 7913], [7915, 7915], [7917, 7917], [7919, 7919], [7921, 7921], [7923, 7923], [7925, 7925], [7927, 7927], [7929, 7929], [7931, 7931], [7933, 7933], [7935, 7943], [7952, 7957], [7968, 7975], [7984, 7991], [8000, 8005], [8016, 8023], [8032, 8039], [8048, 8061], [8064, 8071], [8080, 8087], [8096, 8103], [8112, 8116], [8118, 8119], [8126, 8126], [8130, 8132], [8134, 8135], [8144, 8147], [8150, 8151], [8160, 8167], [8178, 8180], [8182, 8183], [8458, 8458], [8462, 8463], [8467, 8467], [8495, 8495], [8500, 8500], [8505, 8505], [8508, 8509], [8518, 8521], [8526, 8526], [8580, 8580], [11312, 11358], [11361, 11361], [11365, 11366], [11368, 11368], [11370, 11370], [11372, 11372], [11377, 11377], [11379, 11380], [11382, 11387], [11393, 11393], [11395, 11395], [11397, 11397], [11399, 11399], [11401, 11401], [11403, 11403], [11405, 11405], [11407, 11407], [11409, 11409], [11411, 11411], [11413, 11413], [11415, 11415], [11417, 11417], [11419, 11419], [11421, 11421], [11423, 11423], [11425, 11425], [11427, 11427], [11429, 11429], [11431, 11431], [11433, 11433], [11435, 11435], [11437, 11437], [11439, 11439], [11441, 11441], [11443, 11443], [11445, 11445], [11447, 11447], [11449, 11449], [11451, 11451], [11453, 11453], [11455, 11455], [11457, 11457], [11459, 11459], [11461, 11461], [11463, 11463], [11465, 11465], [11467, 11467], [11469, 11469], [11471, 11471], [11473, 11473], [11475, 11475], [11477, 11477], [11479, 11479], [11481, 11481], [11483, 11483], [11485, 11485], [11487, 11487], [11489, 11489], [11491, 11492], [11500, 11500], [11502, 11502], [11507, 11507], [11520, 11557], [11559, 11559], [11565, 11565], [42561, 42561], [42563, 42563], [42565, 42565], [42567, 42567], [42569, 42569], [42571, 42571], [42573, 42573], [42575, 42575], [42577, 42577], [42579, 42579], [42581, 42581], [42583, 42583], [42585, 42585], [42587, 42587], [42589, 42589], [42591, 42591], [42593, 42593], [42595, 42595], [42597, 42597], [42599, 42599], [42601, 42601], [42603, 42603], [42605, 42605], [42625, 42625], [42627, 42627], [42629, 42629], [42631, 42631], [42633, 42633], [42635, 42635], [42637, 42637], [42639, 42639], [42641, 42641], [42643, 42643], [42645, 42645], [42647, 42647], [42649, 42649], [42651, 42651], [42787, 42787], [42789, 42789], [42791, 42791], [42793, 42793], [42795, 42795], [42797, 42797], [42799, 42801], [42803, 42803], [42805, 42805], [42807, 42807], [42809, 42809], [42811, 42811], [42813, 42813], [42815, 42815], [42817, 42817], [42819, 42819], [42821, 42821], [42823, 42823], [42825, 42825], [42827, 42827], [42829, 42829], [42831, 42831], [42833, 42833], [42835, 42835], [42837, 42837], [42839, 42839], [42841, 42841], [42843, 42843], [42845, 42845], [42847, 42847], [42849, 42849], [42851, 42851], [42853, 42853], [42855, 42855], [42857, 42857], [42859, 42859], [42861, 42861], [42863, 42863], [42865, 42872], [42874, 42874], [42876, 42876], [42879, 42879], [42881, 42881], [42883, 42883], [42885, 42885], [42887, 42887], [42892, 42892], [42894, 42894], [42897, 42897], [42899, 42901], [42903, 42903], [42905, 42905], [42907, 42907], [42909, 42909], [42911, 42911], [42913, 42913], [42915, 42915], [42917, 42917], [42919, 42919], [42921, 42921], [42933, 42933], [42935, 42935], [43002, 43002], [43824, 43866], [43872, 43877], [43888, 43967], [64256, 64262], [64275, 64279], [65345, 65370]], "No": [[178, 179], [185, 185], [188, 190], [2548, 2553], [2930, 2935], [3056, 3058], [3192, 3198], [3416, 3422], [3440, 3448], [3882, 3891], [4969, 4988], [6128, 6137], [6618, 6618], [8304, 8304], [8308, 8313], [8320, 8329], [8528, 8543], [8585, 8585], [9312, 9371], [9450, 9471], [10102, 10131], [11517, 11517], [12690, 12693], [12832, 12841], [12872, 12879], [12881, 12895], [12928, 12937], [12977, 12991], [43056, 43061]], "Zs": [[32, 32], [160, 160], [5760, 5760], [8192, 8202], [8239, 8239], [8287, 8287], [12288, 12288]] }); };


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

var data_generated_1 = __webpack_require__(19);
var utils_1 = __webpack_require__(21);
module.exports = function (categories, flag) {
    var data = data_generated_1.get_data();
    var ranges = categories.reduce(function (current, category) { return current.concat(data[category]); }, []);
    return utils_1.build_regex(utils_1.normalize_ranges(ranges), flag);
};


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

exports.__esModule = true;
function normalize_ranges(ranges) {
    return ranges
        .sort(function (_a, _b) {
        var start1 = _a[0];
        var start2 = _b[0];
        return start1 - start2;
    })
        .reduce(function (current, tuple, index) {
        if (index === 0) {
            return [tuple];
        }
        var _a = current[current.length - 1], last_start = _a[0], last_end = _a[1];
        var start = tuple[0], end = tuple[1];
        return last_end + 1 === start
            ? current.slice(0, -1).concat([[last_start, end]]) : current.concat([tuple]);
    }, []);
}
exports.normalize_ranges = normalize_ranges;
function build_regex(ranges, flag) {
    var pattern = ranges
        .map(function (_a) {
        var start = _a[0], end = _a[1];
        return start === end
            ? "\\u" + get_hex(start)
            : "\\u" + get_hex(start) + "-\\u" + get_hex(end);
    })
        .join('');
    return new RegExp("[" + pattern + "]", flag);
}
exports.build_regex = build_regex;
function get_hex(char_code) {
    var hex = char_code.toString(16);
    while (hex.length < 4) {
        hex = "0" + hex;
    }
    return hex;
}


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function createError(message, loc) {
  // Construct an error similar to the ones thrown by Babylon.
  const error = new SyntaxError(
    message + " (" + loc.start.line + ":" + loc.start.column + ")"
  );
  error.loc = loc;
  return error;
}

module.exports = createError;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function flattenDoc(doc) {
  if (doc.type === "concat") {
    const res = [];

    for (let i = 0; i < doc.parts.length; ++i) {
      const doc2 = doc.parts[i];
      if (typeof doc2 !== "string" && doc2.type === "concat") {
        [].push.apply(res, flattenDoc(doc2).parts);
      } else {
        const flattened = flattenDoc(doc2);
        if (flattened !== "") {
          res.push(flattened);
        }
      }
    }

    return Object.assign({}, doc, { parts: res });
  } else if (doc.type === "if-break") {
    return Object.assign({}, doc, {
      breakContents:
        doc.breakContents != null ? flattenDoc(doc.breakContents) : null,
      flatContents:
        doc.flatContents != null ? flattenDoc(doc.flatContents) : null
    });
  } else if (doc.type === "group") {
    return Object.assign({}, doc, {
      contents: flattenDoc(doc.contents),
      expandedStates: doc.expandedStates
        ? doc.expandedStates.map(flattenDoc)
        : doc.expandedStates
    });
  } else if (doc.contents) {
    return Object.assign({}, doc, { contents: flattenDoc(doc.contents) });
  }
  return doc;
}

function printDoc(doc) {
  if (typeof doc === "string") {
    return JSON.stringify(doc);
  }

  if (doc.type === "line") {
    if (doc.literalline) {
      return "literalline";
    }
    if (doc.hard) {
      return "hardline";
    }
    if (doc.soft) {
      return "softline";
    }
    return "line";
  }

  if (doc.type === "break-parent") {
    return "breakParent";
  }

  if (doc.type === "concat") {
    return "[" + doc.parts.map(printDoc).join(", ") + "]";
  }

  if (doc.type === "indent") {
    return "indent(" + printDoc(doc.contents) + ")";
  }

  if (doc.type === "align") {
    return doc.n === -Infinity
      ? "dedentToRoot(" + printDoc(doc.contents) + ")"
      : doc.n < 0
        ? "dedent(" + printDoc(doc.contents) + ")"
        : doc.n.type === "root"
          ? "markAsRoot(" + printDoc(doc.contents) + ")"
          : "align(" +
            JSON.stringify(doc.n) +
            ", " +
            printDoc(doc.contents) +
            ")";
  }

  if (doc.type === "if-break") {
    return (
      "ifBreak(" +
      printDoc(doc.breakContents) +
      (doc.flatContents ? ", " + printDoc(doc.flatContents) : "") +
      ")"
    );
  }

  if (doc.type === "group") {
    if (doc.expandedStates) {
      return (
        "conditionalGroup(" +
        "[" +
        doc.expandedStates.map(printDoc).join(",") +
        "])"
      );
    }

    return (
      (doc.break ? "wrappedGroup" : "group") +
      "(" +
      printDoc(doc.contents) +
      ")"
    );
  }

  if (doc.type === "fill") {
    return "fill" + "(" + doc.parts.map(printDoc).join(", ") + ")";
  }

  if (doc.type === "line-suffix") {
    return "lineSuffix(" + printDoc(doc.contents) + ")";
  }

  if (doc.type === "line-suffix-boundary") {
    return "lineSuffixBoundary";
  }

  throw new Error("Unknown doc type " + doc.type);
}

module.exports = {
  printDocToDebug: function(doc) {
    return printDoc(flattenDoc(doc));
  }
};


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const util = __webpack_require__(0);
const docBuilders = __webpack_require__(3);
const concat = docBuilders.concat;
const fill = docBuilders.fill;
const cursor = docBuilders.cursor;

const MODE_BREAK = 1;
const MODE_FLAT = 2;

function rootIndent() {
  return { value: "", length: 0, queue: [] };
}

function makeIndent(ind, options) {
  return generateInd(ind, { type: "indent" }, options);
}

function makeAlign(ind, n, options) {
  return n === -Infinity
    ? ind.root || rootIndent()
    : n < 0
      ? generateInd(ind, { type: "dedent" }, options)
      : !n
        ? ind
        : n.type === "root"
          ? Object.assign({}, ind, { root: ind })
          : typeof n === "string"
            ? generateInd(ind, { type: "stringAlign", n }, options)
            : generateInd(ind, { type: "numberAlign", n }, options);
}

function generateInd(ind, newPart, options) {
  const queue =
    newPart.type === "dedent"
      ? ind.queue.slice(0, -1)
      : ind.queue.concat(newPart);

  let value = "";
  let length = 0;
  let lastTabs = 0;
  let lastSpaces = 0;

  for (const part of queue) {
    switch (part.type) {
      case "indent":
        flush();
        if (options.useTabs) {
          addTabs(1);
        } else {
          addSpaces(options.tabWidth);
        }
        break;
      case "stringAlign":
        flush();
        value += part.n;
        length += part.n.length;
        break;
      case "numberAlign":
        lastTabs += 1;
        lastSpaces += part.n;
        break;
      /* istanbul ignore next */
      default:
        throw new Error(`Unexpected type '${part.type}'`);
    }
  }

  flushSpaces();

  return Object.assign({}, ind, { value, length, queue });

  function addTabs(count) {
    value += "\t".repeat(count);
    length += options.tabWidth * count;
  }

  function addSpaces(count) {
    value += " ".repeat(count);
    length += count;
  }

  function flush() {
    if (options.useTabs) {
      flushTabs();
    } else {
      flushSpaces();
    }
  }

  function flushTabs() {
    if (lastTabs > 0) {
      addTabs(lastTabs);
    }
    resetLast();
  }

  function flushSpaces() {
    if (lastSpaces > 0) {
      addSpaces(lastSpaces);
    }
    resetLast();
  }

  function resetLast() {
    lastTabs = 0;
    lastSpaces = 0;
  }
}

function fits(next, restCommands, width, options, mustBeFlat) {
  let restIdx = restCommands.length;
  const cmds = [next];
  while (width >= 0) {
    if (cmds.length === 0) {
      if (restIdx === 0) {
        return true;
      }
      cmds.push(restCommands[restIdx - 1]);

      restIdx--;

      continue;
    }

    const x = cmds.pop();
    const ind = x[0];
    const mode = x[1];
    const doc = x[2];

    if (typeof doc === "string") {
      width -= util.getStringWidth(doc);
    } else {
      switch (doc.type) {
        case "concat":
          for (let i = doc.parts.length - 1; i >= 0; i--) {
            cmds.push([ind, mode, doc.parts[i]]);
          }

          break;
        case "indent":
          cmds.push([makeIndent(ind, options), mode, doc.contents]);

          break;
        case "align":
          cmds.push([makeAlign(ind, doc.n, options), mode, doc.contents]);

          break;
        case "group":
          if (mustBeFlat && doc.break) {
            return false;
          }
          cmds.push([ind, doc.break ? MODE_BREAK : mode, doc.contents]);

          break;
        case "fill":
          for (let i = doc.parts.length - 1; i >= 0; i--) {
            cmds.push([ind, mode, doc.parts[i]]);
          }

          break;
        case "if-break":
          if (mode === MODE_BREAK) {
            if (doc.breakContents) {
              cmds.push([ind, mode, doc.breakContents]);
            }
          }
          if (mode === MODE_FLAT) {
            if (doc.flatContents) {
              cmds.push([ind, mode, doc.flatContents]);
            }
          }

          break;
        case "line":
          switch (mode) {
            // fallthrough
            case MODE_FLAT:
              if (!doc.hard) {
                if (!doc.soft) {
                  width -= 1;
                }

                break;
              }
              return true;

            case MODE_BREAK:
              return true;
          }
          break;
      }
    }
  }
  return false;
}

function printDocToString(doc, options) {
  const width = options.printWidth;
  const newLine = options.newLine || "\n";
  let pos = 0;
  // cmds is basically a stack. We've turned a recursive call into a
  // while loop which is much faster. The while loop below adds new
  // cmds to the array instead of recursively calling `print`.
  const cmds = [[rootIndent(), MODE_BREAK, doc]];
  const out = [];
  let shouldRemeasure = false;
  let lineSuffix = [];

  while (cmds.length !== 0) {
    const x = cmds.pop();
    const ind = x[0];
    const mode = x[1];
    const doc = x[2];

    if (typeof doc === "string") {
      out.push(doc);

      pos += util.getStringWidth(doc);
    } else {
      switch (doc.type) {
        case "cursor":
          out.push(cursor.placeholder);

          break;
        case "concat":
          for (let i = doc.parts.length - 1; i >= 0; i--) {
            cmds.push([ind, mode, doc.parts[i]]);
          }

          break;
        case "indent":
          cmds.push([makeIndent(ind, options), mode, doc.contents]);

          break;
        case "align":
          cmds.push([makeAlign(ind, doc.n, options), mode, doc.contents]);

          break;
        case "group":
          switch (mode) {
            case MODE_FLAT:
              if (!shouldRemeasure) {
                cmds.push([
                  ind,
                  doc.break ? MODE_BREAK : MODE_FLAT,
                  doc.contents
                ]);

                break;
              }
            // fallthrough

            case MODE_BREAK: {
              shouldRemeasure = false;

              const next = [ind, MODE_FLAT, doc.contents];
              const rem = width - pos;

              if (!doc.break && fits(next, cmds, rem, options)) {
                cmds.push(next);
              } else {
                // Expanded states are a rare case where a document
                // can manually provide multiple representations of
                // itself. It provides an array of documents
                // going from the least expanded (most flattened)
                // representation first to the most expanded. If a
                // group has these, we need to manually go through
                // these states and find the first one that fits.
                if (doc.expandedStates) {
                  const mostExpanded =
                    doc.expandedStates[doc.expandedStates.length - 1];

                  if (doc.break) {
                    cmds.push([ind, MODE_BREAK, mostExpanded]);

                    break;
                  } else {
                    for (let i = 1; i < doc.expandedStates.length + 1; i++) {
                      if (i >= doc.expandedStates.length) {
                        cmds.push([ind, MODE_BREAK, mostExpanded]);

                        break;
                      } else {
                        const state = doc.expandedStates[i];
                        const cmd = [ind, MODE_FLAT, state];

                        if (fits(cmd, cmds, rem, options)) {
                          cmds.push(cmd);

                          break;
                        }
                      }
                    }
                  }
                } else {
                  cmds.push([ind, MODE_BREAK, doc.contents]);
                }
              }

              break;
            }
          }
          break;
        // Fills each line with as much code as possible before moving to a new
        // line with the same indentation.
        //
        // Expects doc.parts to be an array of alternating content and
        // whitespace. The whitespace contains the linebreaks.
        //
        // For example:
        //   ["I", line, "love", line, "monkeys"]
        // or
        //   [{ type: group, ... }, softline, { type: group, ... }]
        //
        // It uses this parts structure to handle three main layout cases:
        // * The first two content items fit on the same line without
        //   breaking
        //   -> output the first content item and the whitespace "flat".
        // * Only the first content item fits on the line without breaking
        //   -> output the first content item "flat" and the whitespace with
        //   "break".
        // * Neither content item fits on the line without breaking
        //   -> output the first content item and the whitespace with "break".
        case "fill": {
          const rem = width - pos;

          const parts = doc.parts;
          if (parts.length === 0) {
            break;
          }

          const content = parts[0];
          const contentFlatCmd = [ind, MODE_FLAT, content];
          const contentBreakCmd = [ind, MODE_BREAK, content];
          const contentFits = fits(contentFlatCmd, [], rem, options, true);

          if (parts.length === 1) {
            if (contentFits) {
              cmds.push(contentFlatCmd);
            } else {
              cmds.push(contentBreakCmd);
            }
            break;
          }

          const whitespace = parts[1];
          const whitespaceFlatCmd = [ind, MODE_FLAT, whitespace];
          const whitespaceBreakCmd = [ind, MODE_BREAK, whitespace];

          if (parts.length === 2) {
            if (contentFits) {
              cmds.push(whitespaceFlatCmd);
              cmds.push(contentFlatCmd);
            } else {
              cmds.push(whitespaceBreakCmd);
              cmds.push(contentBreakCmd);
            }
            break;
          }

          // At this point we've handled the first pair (context, separator)
          // and will create a new fill doc for the rest of the content.
          // Ideally we wouldn't mutate the array here but coping all the
          // elements to a new array would make this algorithm quadratic,
          // which is unusable for large arrays (e.g. large texts in JSX).
          parts.splice(0, 2);
          const remainingCmd = [ind, mode, fill(parts)];

          const secondContent = parts[0];

          const firstAndSecondContentFlatCmd = [
            ind,
            MODE_FLAT,
            concat([content, whitespace, secondContent])
          ];
          const firstAndSecondContentFits = fits(
            firstAndSecondContentFlatCmd,
            [],
            rem,
            options,
            true
          );

          if (firstAndSecondContentFits) {
            cmds.push(remainingCmd);
            cmds.push(whitespaceFlatCmd);
            cmds.push(contentFlatCmd);
          } else if (contentFits) {
            cmds.push(remainingCmd);
            cmds.push(whitespaceBreakCmd);
            cmds.push(contentFlatCmd);
          } else {
            cmds.push(remainingCmd);
            cmds.push(whitespaceBreakCmd);
            cmds.push(contentBreakCmd);
          }
          break;
        }
        case "if-break":
          if (mode === MODE_BREAK) {
            if (doc.breakContents) {
              cmds.push([ind, mode, doc.breakContents]);
            }
          }
          if (mode === MODE_FLAT) {
            if (doc.flatContents) {
              cmds.push([ind, mode, doc.flatContents]);
            }
          }

          break;
        case "line-suffix":
          lineSuffix.push([ind, mode, doc.contents]);
          break;
        case "line-suffix-boundary":
          if (lineSuffix.length > 0) {
            cmds.push([ind, mode, { type: "line", hard: true }]);
          }
          break;
        case "line":
          switch (mode) {
            case MODE_FLAT:
              if (!doc.hard) {
                if (!doc.soft) {
                  out.push(" ");

                  pos += 1;
                }

                break;
              } else {
                // This line was forced into the output even if we
                // were in flattened mode, so we need to tell the next
                // group that no matter what, it needs to remeasure
                // because the previous measurement didn't accurately
                // capture the entire expression (this is necessary
                // for nested groups)
                shouldRemeasure = true;
              }
            // fallthrough

            case MODE_BREAK:
              if (lineSuffix.length) {
                cmds.push([ind, mode, doc]);
                [].push.apply(cmds, lineSuffix.reverse());
                lineSuffix = [];
                break;
              }

              if (doc.literal) {
                if (ind.root) {
                  out.push(newLine, ind.root.value);
                  pos = ind.root.length;
                } else {
                  out.push(newLine);
                  pos = 0;
                }
              } else {
                if (out.length > 0) {
                  // Trim whitespace at the end of line
                  while (
                    out.length > 0 &&
                    out[out.length - 1].match(/^[^\S\n]*$/)
                  ) {
                    out.pop();
                  }

                  if (
                    out.length &&
                    (options.parser !== "markdown" ||
                      // preserve markdown's `break` node (two trailing spaces)
                      !/\S {2}$/.test(out[out.length - 1]))
                  ) {
                    out[out.length - 1] = out[out.length - 1].replace(
                      /[^\S\n]*$/,
                      ""
                    );
                  }
                }

                out.push(newLine + ind.value);
                pos = ind.length;
              }
              break;
          }
          break;
        default:
      }
    }
  }

  const cursorPlaceholderIndex = out.indexOf(cursor.placeholder);
  if (cursorPlaceholderIndex !== -1) {
    const beforeCursor = out.slice(0, cursorPlaceholderIndex).join("");
    const afterCursor = out.slice(cursorPlaceholderIndex + 1).join("");

    return {
      formatted: beforeCursor + afterCursor,
      cursor: beforeCursor.length
    };
  }

  return { formatted: out.join("") };
}

module.exports = { printDocToString };


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function traverseDoc(doc, onEnter, onExit, shouldTraverseConditionalGroups) {
  function traverseDocRec(doc) {
    let shouldRecurse = true;
    if (onEnter) {
      if (onEnter(doc) === false) {
        shouldRecurse = false;
      }
    }

    if (shouldRecurse) {
      if (doc.type === "concat" || doc.type === "fill") {
        for (let i = 0; i < doc.parts.length; i++) {
          traverseDocRec(doc.parts[i]);
        }
      } else if (doc.type === "if-break") {
        if (doc.breakContents) {
          traverseDocRec(doc.breakContents);
        }
        if (doc.flatContents) {
          traverseDocRec(doc.flatContents);
        }
      } else if (doc.type === "group" && doc.expandedStates) {
        if (shouldTraverseConditionalGroups) {
          doc.expandedStates.forEach(traverseDocRec);
        } else {
          traverseDocRec(doc.contents);
        }
      } else if (doc.contents) {
        traverseDocRec(doc.contents);
      }
    }

    if (onExit) {
      onExit(doc);
    }
  }

  traverseDocRec(doc);
}

function mapDoc(doc, func) {
  doc = func(doc);

  if (doc.type === "concat" || doc.type === "fill") {
    return Object.assign({}, doc, {
      parts: doc.parts.map(d => mapDoc(d, func))
    });
  } else if (doc.type === "if-break") {
    return Object.assign({}, doc, {
      breakContents: doc.breakContents && mapDoc(doc.breakContents, func),
      flatContents: doc.flatContents && mapDoc(doc.flatContents, func)
    });
  } else if (doc.contents) {
    return Object.assign({}, doc, { contents: mapDoc(doc.contents, func) });
  }
  return doc;
}

function findInDoc(doc, fn, defaultValue) {
  let result = defaultValue;
  let hasStopped = false;
  traverseDoc(doc, doc => {
    const maybeResult = fn(doc);
    if (maybeResult !== undefined) {
      hasStopped = true;
      result = maybeResult;
    }
    if (hasStopped) {
      return false;
    }
  });
  return result;
}

function isEmpty(n) {
  return typeof n === "string" && n.length === 0;
}

function isLineNext(doc) {
  return findInDoc(
    doc,
    doc => {
      if (typeof doc === "string") {
        return false;
      }
      if (doc.type === "line") {
        return true;
      }
    },
    false
  );
}

function willBreak(doc) {
  return findInDoc(
    doc,
    doc => {
      if (doc.type === "group" && doc.break) {
        return true;
      }
      if (doc.type === "line" && doc.hard) {
        return true;
      }
      if (doc.type === "break-parent") {
        return true;
      }
    },
    false
  );
}

function breakParentGroup(groupStack) {
  if (groupStack.length > 0) {
    const parentGroup = groupStack[groupStack.length - 1];
    // Breaks are not propagated through conditional groups because
    // the user is expected to manually handle what breaks.
    if (!parentGroup.expandedStates) {
      parentGroup.break = true;
    }
  }
  return null;
}

function propagateBreaks(doc) {
  const alreadyVisited = new Map();
  const groupStack = [];
  traverseDoc(
    doc,
    doc => {
      if (doc.type === "break-parent") {
        breakParentGroup(groupStack);
      }
      if (doc.type === "group") {
        groupStack.push(doc);
        if (alreadyVisited.has(doc)) {
          return false;
        }
        alreadyVisited.set(doc, true);
      }
    },
    doc => {
      if (doc.type === "group") {
        const group = groupStack.pop();
        if (group.break) {
          breakParentGroup(groupStack);
        }
      }
    },
    /* shouldTraverseConditionalGroups */ true
  );
}

function removeLines(doc) {
  // Force this doc into flat mode by statically converting all
  // lines into spaces (or soft lines into nothing). Hard lines
  // should still output because there's too great of a chance
  // of breaking existing assumptions otherwise.
  return mapDoc(doc, d => {
    if (d.type === "line" && !d.hard) {
      return d.soft ? "" : " ";
    } else if (d.type === "if-break") {
      return d.flatContents || "";
    }
    return d;
  });
}

function stripTrailingHardline(doc) {
  // HACK remove ending hardline, original PR: #1984
  if (
    doc.type === "concat" &&
    doc.parts.length === 2 &&
    doc.parts[1].type === "concat" &&
    doc.parts[1].parts.length === 2 &&
    doc.parts[1].parts[0].hard &&
    doc.parts[1].parts[1].type === "break-parent"
  ) {
    return doc.parts[0];
  }
  return doc;
}

function rawText(node) {
  return node.extra ? node.extra.raw : node.raw;
}

module.exports = {
  isEmpty,
  willBreak,
  isLineNext,
  traverseDoc,
  mapDoc,
  propagateBreaks,
  removeLines,
  stripTrailingHardline,
  rawText
};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function clean(ast, newObj, parent) {
  // We remove extra `;` and add them when needed
  if (ast.type === "EmptyStatement") {
    return null;
  }

  // We move text around, including whitespaces and add {" "}
  if (ast.type === "JSXText") {
    return null;
  }
  if (
    ast.type === "JSXExpressionContainer" &&
    ast.expression.type === "Literal" &&
    ast.expression.value === " "
  ) {
    return null;
  }

  // (TypeScript) Ignore `static` in `constructor(static p) {}`
  // and `export` in `constructor(export p) {}`
  if (
    ast.type === "TSParameterProperty" &&
    ast.accessibility === null &&
    !ast.readonly
  ) {
    return {
      type: "Identifier",
      name: ast.parameter.name,
      typeAnnotation: newObj.parameter.typeAnnotation,
      decorators: newObj.decorators
    };
  }

  // (TypeScript) ignore empty `specifiers` array
  if (
    ast.type === "TSNamespaceExportDeclaration" &&
    ast.specifiers &&
    ast.specifiers.length === 0
  ) {
    delete newObj.specifiers;
  }

  // (TypeScript) bypass TSParenthesizedType
  if (
    ast.type === "TSParenthesizedType" &&
    ast.typeAnnotation.type === "TSTypeAnnotation"
  ) {
    return newObj.typeAnnotation.typeAnnotation;
  }

  // We convert <div></div> to <div />
  if (ast.type === "JSXOpeningElement") {
    delete newObj.selfClosing;
  }
  if (ast.type === "JSXElement") {
    delete newObj.closingElement;
  }

  // We change {'key': value} into {key: value}
  if (
    (ast.type === "Property" ||
      ast.type === "MethodDefinition" ||
      ast.type === "ClassProperty" ||
      ast.type === "TSPropertySignature" ||
      ast.type === "ObjectTypeProperty") &&
    typeof ast.key === "object" &&
    ast.key &&
    (ast.key.type === "Literal" || ast.key.type === "Identifier")
  ) {
    delete newObj.key;
  }

  // Remove raw and cooked values from TemplateElement when it's CSS
  // styled-jsx
  if (
    ast.type === "JSXElement" &&
    ast.openingElement.name.name === "style" &&
    ast.openingElement.attributes.some(attr => attr.name.name === "jsx")
  ) {
    const templateLiterals = newObj.children
      .filter(
        child =>
          child.type === "JSXExpressionContainer" &&
          child.expression.type === "TemplateLiteral"
      )
      .map(container => container.expression);

    const quasis = templateLiterals.reduce(
      (quasis, templateLiteral) => quasis.concat(templateLiteral.quasis),
      []
    );

    quasis.forEach(q => delete q.value);
  }

  // CSS template literals in css prop
  if (
    ast.type === "JSXAttribute" &&
    ast.name.name === "css" &&
    ast.value.type === "JSXExpressionContainer" &&
    ast.value.expression.type === "TemplateLiteral"
  ) {
    newObj.value.expression.quasis.forEach(q => delete q.value);
  }

  // styled-components, graphql, markdown
  if (
    ast.type === "TaggedTemplateExpression" &&
    (ast.tag.type === "MemberExpression" ||
      (ast.tag.type === "Identifier" &&
        (ast.tag.name === "gql" ||
          ast.tag.name === "graphql" ||
          ast.tag.name === "css" ||
          ast.tag.name === "md" ||
          ast.tag.name === "markdown")) ||
      ast.tag.type === "CallExpression")
  ) {
    newObj.quasi.quasis.forEach(quasi => delete quasi.value);
  }
  if (
    ast.type === "TemplateLiteral" &&
    parent.type === "CallExpression" &&
    parent.callee.name === "graphql"
  ) {
    newObj.quasis.forEach(quasi => delete quasi.value);
  }
}

module.exports = clean;


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const util = __webpack_require__(0);
const doc = __webpack_require__(1);
const docUtils = doc.utils;
const docBuilders = doc.builders;
const indent = docBuilders.indent;
const join = docBuilders.join;
const hardline = docBuilders.hardline;
const softline = docBuilders.softline;
const literalline = docBuilders.literalline;
const concat = docBuilders.concat;
const dedentToRoot = docBuilders.dedentToRoot;

function embed(path, print, textToDoc /*, options */) {
  const node = path.getValue();
  const parent = path.getParentNode();
  const parentParent = path.getParentNode(1);

  switch (node.type) {
    case "TemplateLiteral": {
      const isCss = [isStyledJsx, isStyledComponents, isCssProp].some(isIt =>
        isIt(path)
      );

      if (isCss) {
        // Get full template literal with expressions replaced by placeholders
        const rawQuasis = node.quasis.map(q => q.value.raw);
        const text = rawQuasis.join("@prettier-placeholder");
        const doc = textToDoc(text, { parser: "css" });
        return transformCssDoc(doc, path, print);
      }

      /*
       * react-relay and graphql-tag
       * graphql`...`
       * graphql.experimental`...`
       * gql`...`
       *
       * This intentionally excludes Relay Classic tags, as Prettier does not
       * support Relay Classic formatting.
       */
      if (
        parent &&
        ((parent.type === "TaggedTemplateExpression" &&
          ((parent.tag.type === "MemberExpression" &&
            parent.tag.object.name === "graphql" &&
            parent.tag.property.name === "experimental") ||
            (parent.tag.type === "Identifier" &&
              (parent.tag.name === "gql" || parent.tag.name === "graphql")))) ||
          (parent.type === "CallExpression" &&
            parent.callee.type === "Identifier" &&
            parent.callee.name === "graphql"))
      ) {
        const expressionDocs = node.expressions
          ? path.map(print, "expressions")
          : [];

        const numQuasis = node.quasis.length;

        if (numQuasis === 1 && node.quasis[0].value.raw.trim() === "") {
          return "``";
        }

        const parts = [];

        for (let i = 0; i < numQuasis; i++) {
          const templateElement = node.quasis[i];
          const isFirst = i === 0;
          const isLast = i === numQuasis - 1;
          const text = templateElement.value.raw;
          const lines = text.split("\n");
          const numLines = lines.length;
          const expressionDoc = expressionDocs[i];

          const startsWithBlankLine =
            numLines > 2 && lines[0].trim() === "" && lines[1].trim() === "";
          const endsWithBlankLine =
            numLines > 2 &&
            lines[numLines - 1].trim() === "" &&
            lines[numLines - 2].trim() === "";

          const commentsAndWhitespaceOnly = lines.every(line =>
            /^\s*(?:#[^\r\n]*)?$/.test(line)
          );

          // Bail out if an interpolation occurs within a comment.
          if (!isLast && /#[^\r\n]*$/.test(lines[numLines - 1])) {
            return null;
          }

          let doc = null;

          if (commentsAndWhitespaceOnly) {
            doc = printGraphqlComments(lines);
          } else {
            try {
              doc = docUtils.stripTrailingHardline(
                textToDoc(text, { parser: "graphql" })
              );
            } catch (_error) {
              // Bail if any part fails to parse.
              return null;
            }
          }

          if (doc) {
            if (!isFirst && startsWithBlankLine) {
              parts.push("");
            }
            parts.push(doc);
            if (!isLast && endsWithBlankLine) {
              parts.push("");
            }
          } else if (!isFirst && !isLast && startsWithBlankLine) {
            parts.push("");
          }

          if (expressionDoc) {
            parts.push(concat(["${", expressionDoc, "}"]));
          }
        }

        return concat([
          "`",
          indent(concat([hardline, join(hardline, parts)])),
          hardline,
          "`"
        ]);
      }

      break;
    }

    case "TemplateElement": {
      /**
       * md`...`
       * markdown`...`
       */
      if (
        parentParent &&
        (parentParent.type === "TaggedTemplateExpression" &&
          parent.quasis.length === 1 &&
          (parentParent.tag.type === "Identifier" &&
            (parentParent.tag.name === "md" ||
              parentParent.tag.name === "markdown")))
      ) {
        const text = parent.quasis[0].value.cooked;
        const indentation = getIndentation(text);
        const hasIndent = indentation !== "";
        return concat([
          hasIndent
            ? indent(
                concat([
                  softline,
                  printMarkdown(
                    text.replace(new RegExp(`^${indentation}`, "gm"), "")
                  )
                ])
              )
            : concat([literalline, dedentToRoot(printMarkdown(text))]),
          softline
        ]);
      }

      break;
    }
  }

  function printMarkdown(text) {
    const doc = textToDoc(text, { parser: "markdown", __inJsTemplate: true });
    return docUtils.stripTrailingHardline(escapeBackticks(doc));
  }
}

function getIndentation(str) {
  const firstMatchedIndent = str.match(/^([^\S\n]*)\S/m);
  return firstMatchedIndent === null ? "" : firstMatchedIndent[1];
}

function escapeBackticks(doc) {
  return util.mapDoc(doc, currentDoc => {
    if (!currentDoc.parts) {
      return currentDoc;
    }

    const parts = [];

    currentDoc.parts.forEach(part => {
      if (typeof part === "string") {
        parts.push(part.replace(/`/g, "\\`"));
      } else {
        parts.push(part);
      }
    });

    return Object.assign({}, currentDoc, { parts });
  });
}

function transformCssDoc(quasisDoc, path, print) {
  const parentNode = path.getValue();

  const isEmpty =
    parentNode.quasis.length === 1 && !parentNode.quasis[0].value.raw.trim();
  if (isEmpty) {
    return "``";
  }

  const expressionDocs = parentNode.expressions
    ? path.map(print, "expressions")
    : [];
  const newDoc = replacePlaceholders(quasisDoc, expressionDocs);
  /* istanbul ignore if */
  if (!newDoc) {
    throw new Error("Couldn't insert all the expressions");
  }
  return concat([
    "`",
    indent(concat([hardline, docUtils.stripTrailingHardline(newDoc)])),
    softline,
    "`"
  ]);
}

// Search all the placeholders in the quasisDoc tree
// and replace them with the expression docs one by one
// returns a new doc with all the placeholders replaced,
// or null if it couldn't replace any expression
function replacePlaceholders(quasisDoc, expressionDocs) {
  if (!expressionDocs || !expressionDocs.length) {
    return quasisDoc;
  }

  const expressions = expressionDocs.slice();
  const newDoc = docUtils.mapDoc(quasisDoc, doc => {
    if (!doc || !doc.parts || !doc.parts.length) {
      return doc;
    }
    let parts = doc.parts;
    const atIndex = parts.indexOf("@");
    const placeholderIndex = atIndex + 1;
    if (
      atIndex > -1 &&
      typeof parts[placeholderIndex] === "string" &&
      parts[placeholderIndex].startsWith("prettier-placeholder")
    ) {
      // If placeholder is split, join it
      const at = parts[atIndex];
      const placeholder = parts[placeholderIndex];
      const rest = parts.slice(placeholderIndex + 1);
      parts = parts
        .slice(0, atIndex)
        .concat([at + placeholder])
        .concat(rest);
    }
    const atPlaceholderIndex = parts.findIndex(
      part =>
        typeof part === "string" && part.startsWith("@prettier-placeholder")
    );
    if (atPlaceholderIndex > -1) {
      const placeholder = parts[atPlaceholderIndex];
      const rest = parts.slice(atPlaceholderIndex + 1);

      // When the expression has a suffix appended, like:
      // animation: linear ${time}s ease-out;
      const suffix = placeholder.slice("@prettier-placeholder".length);

      const expression = expressions.shift();
      parts = parts
        .slice(0, atPlaceholderIndex)
        .concat(["${", expression, "}" + suffix])
        .concat(rest);
    }
    return Object.assign({}, doc, {
      parts: parts
    });
  });

  return expressions.length === 0 ? newDoc : null;
}

function printGraphqlComments(lines) {
  const parts = [];
  let seenComment = false;

  lines.map(textLine => textLine.trim()).forEach((textLine, i, array) => {
    // Lines are either whitespace only, or a comment (with poential whitespace
    // around it). Drop whitespace-only lines.
    if (textLine === "") {
      return;
    }

    if (array[i - 1] === "" && seenComment) {
      // If a non-first comment is preceded by a blank (whitespace only) line,
      // add in a blank line.
      parts.push(concat([hardline, textLine]));
    } else {
      parts.push(textLine);
    }

    seenComment = true;
  });

  // If `lines` was whitespace only, return `null`.
  return parts.length === 0 ? null : join(hardline, parts);
}

/**
 * Template literal in this context:
 * <style jsx>{`div{color:red}`}</style>
 */
function isStyledJsx(path) {
  const node = path.getValue();
  const parent = path.getParentNode();
  const parentParent = path.getParentNode(1);
  return (
    parentParent &&
    node.quasis &&
    parent.type === "JSXExpressionContainer" &&
    parentParent.type === "JSXElement" &&
    parentParent.openingElement.name.name === "style" &&
    parentParent.openingElement.attributes.some(
      attribute => attribute.name.name === "jsx"
    )
  );
}

/**
 * styled-components template literals
 */
function isStyledComponents(path) {
  const parent = path.getParentNode();

  if (!parent || parent.type !== "TaggedTemplateExpression") {
    return false;
  }

  const tag = parent.tag;

  switch (tag.type) {
    case "MemberExpression":
      return (
        // styled.foo``
        isStyledIdentifier(tag.object) ||
        // Component.extend``
        (/^[A-Z]/.test(tag.object.name) && tag.property.name === "extend")
      );

    case "CallExpression":
      return (
        // styled(Component)``
        isStyledIdentifier(tag.callee) ||
        (tag.callee.type === "MemberExpression" &&
          // styled.foo.attr({})``
          ((tag.callee.object.type === "MemberExpression" &&
            isStyledIdentifier(tag.callee.object.object)) ||
            // styled(Component).attr({})``
            (tag.callee.object.type === "CallExpression" &&
              isStyledIdentifier(tag.callee.object.callee))))
      );

    case "Identifier":
      // css``
      return tag.name === "css";

    default:
      return false;
  }
}

/**
 * JSX element with CSS prop
 */
function isCssProp(path) {
  const parent = path.getParentNode();
  const parentParent = path.getParentNode(1);
  return (
    parentParent &&
    parent.type === "JSXExpressionContainer" &&
    parentParent.type === "JSXAttribute" &&
    parentParent.name.type === "JSXIdentifier" &&
    parentParent.name.name === "css"
  );
}

function isStyledIdentifier(node) {
  return node.type === "Identifier" && node.name === "styled";
}

module.exports = embed;


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const printer = __webpack_require__(7);
const options = __webpack_require__(5);

// Based on:
// https://github.com/github/linguist/blob/master/lib/linguist/languages.yml

const languages = [
  {
    name: "JavaScript",
    since: "0.0.0",
    parsers: ["js"],
    group: "JavaScript",
    tmScope: "source.js",
    aceMode: "javascript",
    codemirrorMode: "javascript",
    codemirrorMimeType: "text/javascript",
    aliases: ["js", "node"],
    extensions: [
      ".js"
    ],
    filenames: ["Jakefile"],
    linguistLanguageId: 183,
    vscodeLanguageIds: ["javascript"]
  }
];

const parse = __webpack_require__(6);
const babylon = {
  parse,
  astFormat: "js"
};
const parsers = {
  babylon
};

const printers = {
  js: printer
};

module.exports = {
  languages,
  options,
  parsers,
  printers
};


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


const assert = __webpack_require__(4);
const docBuilders = __webpack_require__(1).builders;
const concat = docBuilders.concat;
const hardline = docBuilders.hardline;
const breakParent = docBuilders.breakParent;
const indent = docBuilders.indent;
const lineSuffix = docBuilders.lineSuffix;
const join = docBuilders.join;
const cursor = docBuilders.cursor;
const util = __webpack_require__(0);
const childNodesCacheKey = Symbol("child-nodes");
const locStart = util.locStart;
const locEnd = util.locEnd;
const getNextNonSpaceNonCommentCharacter =
  util.getNextNonSpaceNonCommentCharacter;
const getNextNonSpaceNonCommentCharacterIndex =
  util.getNextNonSpaceNonCommentCharacterIndex;

function getSortedChildNodes(node, text, options, resultArray) {
  if (!node) {
    return;
  }
  const printer = options.printer;

  if (resultArray) {
    if (node && printer.canAttachComment && printer.canAttachComment(node)) {
      // This reverse insertion sort almost always takes constant
      // time because we almost always (maybe always?) append the
      // nodes in order anyway.
      let i;
      for (i = resultArray.length - 1; i >= 0; --i) {
        if (
          locStart(resultArray[i]) <= locStart(node) &&
          locEnd(resultArray[i]) <= locEnd(node)
        ) {
          break;
        }
      }
      resultArray.splice(i + 1, 0, node);
      return;
    }
  } else if (node[childNodesCacheKey]) {
    return node[childNodesCacheKey];
  }

  let childNodes;

  if (printer.getCommentChildNodes) {
    childNodes = printer.getCommentChildNodes(node);
  } else if (node && typeof node === "object") {
    childNodes = Object.keys(node)
      .filter(
        n =>
          n !== "enclosingNode" &&
          n !== "precedingNode" &&
          n !== "followingNode"
      )
      .map(n => node[n]);
  }

  if (!childNodes) {
    return;
  }

  if (!resultArray) {
    Object.defineProperty(node, childNodesCacheKey, {
      value: (resultArray = []),
      enumerable: false
    });
  }

  childNodes.forEach(childNode => {
    getSortedChildNodes(childNode, text, options, resultArray);
  });

  return resultArray;
}

// As efficiently as possible, decorate the comment object with
// .precedingNode, .enclosingNode, and/or .followingNode properties, at
// least one of which is guaranteed to be defined.
function decorateComment(node, comment, text, options) {
  const childNodes = getSortedChildNodes(node, text, options);
  let precedingNode;
  let followingNode;
  // Time to dust off the old binary search robes and wizard hat.
  let left = 0;
  let right = childNodes.length;
  while (left < right) {
    const middle = (left + right) >> 1;
    const child = childNodes[middle];

    if (
      locStart(child) - locStart(comment) <= 0 &&
      locEnd(comment) - locEnd(child) <= 0
    ) {
      // The comment is completely contained by this child node.
      comment.enclosingNode = child;

      decorateComment(child, comment, text, options);
      return; // Abandon the binary search at this level.
    }

    if (locEnd(child) - locStart(comment) <= 0) {
      // This child node falls completely before the comment.
      // Because we will never consider this node or any nodes
      // before it again, this node must be the closest preceding
      // node we have encountered so far.
      precedingNode = child;
      left = middle + 1;
      continue;
    }

    if (locEnd(comment) - locStart(child) <= 0) {
      // This child node falls completely after the comment.
      // Because we will never consider this node or any nodes after
      // it again, this node must be the closest following node we
      // have encountered so far.
      followingNode = child;
      right = middle;
      continue;
    }

    /* istanbul ignore next */
    throw new Error("Comment location overlaps with node location");
  }

  // We don't want comments inside of different expressions inside of the same
  // template literal to move to another expression.
  if (
    comment.enclosingNode &&
    comment.enclosingNode.type === "TemplateLiteral"
  ) {
    const quasis = comment.enclosingNode.quasis;
    const commentIndex = findExpressionIndexForComment(quasis, comment);

    if (
      precedingNode &&
      findExpressionIndexForComment(quasis, precedingNode) !== commentIndex
    ) {
      precedingNode = null;
    }
    if (
      followingNode &&
      findExpressionIndexForComment(quasis, followingNode) !== commentIndex
    ) {
      followingNode = null;
    }
  }

  if (precedingNode) {
    comment.precedingNode = precedingNode;
  }

  if (followingNode) {
    comment.followingNode = followingNode;
  }
}

function attach(comments, ast, text, options) {
  if (!Array.isArray(comments)) {
    return;
  }

  const tiesToBreak = [];

  comments.forEach((comment, i) => {
    if (options.parser === "json" && locStart(comment) - locStart(ast) <= 0) {
      addLeadingComment(ast, comment);
      return;
    }

    decorateComment(ast, comment, text, options);

    const precedingNode = comment.precedingNode;
    const enclosingNode = comment.enclosingNode;
    const followingNode = comment.followingNode;

    const isLastComment = comments.length - 1 === i;

    if (util.hasNewline(text, locStart(comment), { backwards: true })) {
      // If a comment exists on its own line, prefer a leading comment.
      // We also need to check if it's the first line of the file.
      if (
        handleLastFunctionArgComments(
          text,
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleMemberExpressionComments(enclosingNode, followingNode, comment) ||
        handleIfStatementComments(
          text,
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleTryStatementComments(enclosingNode, followingNode, comment) ||
        handleClassComments(
          enclosingNode,
          precedingNode,
          followingNode,
          comment
        ) ||
        handleImportSpecifierComments(enclosingNode, comment) ||
        handleForComments(enclosingNode, precedingNode, comment) ||
        handleUnionTypeComments(
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
        handleImportDeclarationComments(
          text,
          enclosingNode,
          precedingNode,
          comment
        ) ||
        handleAssignmentPatternComments(enclosingNode, comment) ||
        handleMethodNameComments(text, enclosingNode, precedingNode, comment)
      ) {
        // We're good
      } else if (followingNode) {
        // Always a leading comment.
        addLeadingComment(followingNode, comment);
      } else if (precedingNode) {
        addTrailingComment(precedingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        // There are no nodes, let's attach it to the root of the ast
        /* istanbul ignore next */
        addDanglingComment(ast, comment);
      }
    } else if (util.hasNewline(text, locEnd(comment))) {
      if (
        handleLastFunctionArgComments(
          text,
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleConditionalExpressionComments(
          enclosingNode,
          precedingNode,
          followingNode,
          comment,
          text
        ) ||
        handleImportSpecifierComments(enclosingNode, comment) ||
        handleIfStatementComments(
          text,
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleClassComments(
          enclosingNode,
          precedingNode,
          followingNode,
          comment
        ) ||
        handleLabeledStatementComments(enclosingNode, comment) ||
        handleCallExpressionComments(precedingNode, enclosingNode, comment) ||
        handlePropertyComments(enclosingNode, comment) ||
        handleExportNamedDeclarationComments(enclosingNode, comment) ||
        handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
        handleTypeAliasComments(enclosingNode, followingNode, comment) ||
        handleVariableDeclaratorComments(enclosingNode, followingNode, comment)
      ) {
        // We're good
      } else if (precedingNode) {
        // There is content before this comment on the same line, but
        // none after it, so prefer a trailing comment of the previous node.
        addTrailingComment(precedingNode, comment);
      } else if (followingNode) {
        addLeadingComment(followingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        // There are no nodes, let's attach it to the root of the ast
        /* istanbul ignore next */
        addDanglingComment(ast, comment);
      }
    } else {
      if (
        handleIfStatementComments(
          text,
          precedingNode,
          enclosingNode,
          followingNode,
          comment
        ) ||
        handleObjectPropertyAssignment(enclosingNode, precedingNode, comment) ||
        handleCommentInEmptyParens(text, enclosingNode, comment) ||
        handleMethodNameComments(text, enclosingNode, precedingNode, comment) ||
        handleOnlyComments(enclosingNode, ast, comment, isLastComment) ||
        handleCommentAfterArrowParams(text, enclosingNode, comment) ||
        handleFunctionNameComments(text, enclosingNode, precedingNode, comment)
      ) {
        // We're good
      } else if (precedingNode && followingNode) {
        // Otherwise, text exists both before and after the comment on
        // the same line. If there is both a preceding and following
        // node, use a tie-breaking algorithm to determine if it should
        // be attached to the next or previous node. In the last case,
        // simply attach the right node;
        const tieCount = tiesToBreak.length;
        if (tieCount > 0) {
          const lastTie = tiesToBreak[tieCount - 1];
          if (lastTie.followingNode !== comment.followingNode) {
            breakTies(tiesToBreak, text);
          }
        }
        tiesToBreak.push(comment);
      } else if (precedingNode) {
        addTrailingComment(precedingNode, comment);
      } else if (followingNode) {
        addLeadingComment(followingNode, comment);
      } else if (enclosingNode) {
        addDanglingComment(enclosingNode, comment);
      } else {
        // There are no nodes, let's attach it to the root of the ast
        /* istanbul ignore next */
        addDanglingComment(ast, comment);
      }
    }
  });

  breakTies(tiesToBreak, text);

  comments.forEach(comment => {
    // These node references were useful for breaking ties, but we
    // don't need them anymore, and they create cycles in the AST that
    // may lead to infinite recursion if we don't delete them here.
    delete comment.precedingNode;
    delete comment.enclosingNode;
    delete comment.followingNode;
  });
}

function breakTies(tiesToBreak, text) {
  const tieCount = tiesToBreak.length;
  if (tieCount === 0) {
    return;
  }

  const precedingNode = tiesToBreak[0].precedingNode;
  const followingNode = tiesToBreak[0].followingNode;
  let gapEndPos = locStart(followingNode);

  // Iterate backwards through tiesToBreak, examining the gaps
  // between the tied comments. In order to qualify as leading, a
  // comment must be separated from followingNode by an unbroken series of
  // gaps (or other comments). Gaps should only contain whitespace or open
  // parentheses.
  let indexOfFirstLeadingComment;
  for (
    indexOfFirstLeadingComment = tieCount;
    indexOfFirstLeadingComment > 0;
    --indexOfFirstLeadingComment
  ) {
    const comment = tiesToBreak[indexOfFirstLeadingComment - 1];
    assert.strictEqual(comment.precedingNode, precedingNode);
    assert.strictEqual(comment.followingNode, followingNode);

    const gap = text.slice(locEnd(comment), gapEndPos).trim();
    if (gap === "" || /^\(+$/.test(gap)) {
      gapEndPos = locStart(comment);
    } else {
      // The gap string contained something other than whitespace or open
      // parentheses.
      break;
    }
  }

  tiesToBreak.forEach((comment, i) => {
    if (i < indexOfFirstLeadingComment) {
      addTrailingComment(precedingNode, comment);
    } else {
      addLeadingComment(followingNode, comment);
    }
  });

  tiesToBreak.length = 0;
}

function addCommentHelper(node, comment) {
  const comments = node.comments || (node.comments = []);
  comments.push(comment);
  comment.printed = false;

  // For some reason, TypeScript parses `// x` inside of JSXText as a comment
  // We already "print" it via the raw text, we don't need to re-print it as a
  // comment
  if (node.type === "JSXText") {
    comment.printed = true;
  }
}

function addLeadingComment(node, comment) {
  comment.leading = true;
  comment.trailing = false;
  addCommentHelper(node, comment);
}

function addDanglingComment(node, comment) {
  comment.leading = false;
  comment.trailing = false;
  addCommentHelper(node, comment);
}

function addTrailingComment(node, comment) {
  comment.leading = false;
  comment.trailing = true;
  addCommentHelper(node, comment);
}

function addBlockStatementFirstComment(node, comment) {
  const body = node.body.filter(n => n.type !== "EmptyStatement");
  if (body.length === 0) {
    addDanglingComment(node, comment);
  } else {
    addLeadingComment(body[0], comment);
  }
}

function addBlockOrNotComment(node, comment) {
  if (node.type === "BlockStatement") {
    addBlockStatementFirstComment(node, comment);
  } else {
    addLeadingComment(node, comment);
  }
}

// There are often comments before the else clause of if statements like
//
//   if (1) { ... }
//   // comment
//   else { ... }
//
// They are being attached as leading comments of the BlockExpression which
// is not well printed. What we want is to instead move the comment inside
// of the block and make it leadingComment of the first element of the block
// or dangling comment of the block if there is nothing inside
//
//   if (1) { ... }
//   else {
//     // comment
//     ...
//   }
function handleIfStatementComments(
  text,
  precedingNode,
  enclosingNode,
  followingNode,
  comment
) {
  if (
    !enclosingNode ||
    enclosingNode.type !== "IfStatement" ||
    !followingNode
  ) {
    return false;
  }

  // We unfortunately have no way using the AST or location of nodes to know
  // if the comment is positioned before the condition parenthesis:
  //   if (a /* comment */) {}
  // The only workaround I found is to look at the next character to see if
  // it is a ).
  const nextCharacter = getNextNonSpaceNonCommentCharacter(text, comment);
  if (nextCharacter === ")") {
    addTrailingComment(precedingNode, comment);
    return true;
  }

  if (followingNode.type === "BlockStatement") {
    addBlockStatementFirstComment(followingNode, comment);
    return true;
  }

  if (followingNode.type === "IfStatement") {
    addBlockOrNotComment(followingNode.consequent, comment);
    return true;
  }

  // For comments positioned after the condition parenthesis in an if statement
  // before the consequent with or without brackets on, such as
  // if (a) /* comment */ {} or if (a) /* comment */ true,
  // we look at the next character to see if it is a { or if the following node
  // is the consequent for the if statement
  if (nextCharacter === "{" || enclosingNode.consequent === followingNode) {
    addLeadingComment(followingNode, comment);
    return true;
  }

  return false;
}

// Same as IfStatement but for TryStatement
function handleTryStatementComments(enclosingNode, followingNode, comment) {
  if (
    !enclosingNode ||
    enclosingNode.type !== "TryStatement" ||
    !followingNode
  ) {
    return false;
  }

  if (followingNode.type === "BlockStatement") {
    addBlockStatementFirstComment(followingNode, comment);
    return true;
  }

  if (followingNode.type === "TryStatement") {
    addBlockOrNotComment(followingNode.finalizer, comment);
    return true;
  }

  if (followingNode.type === "CatchClause") {
    addBlockOrNotComment(followingNode.body, comment);
    return true;
  }

  return false;
}

function handleMemberExpressionComments(enclosingNode, followingNode, comment) {
  if (
    enclosingNode &&
    enclosingNode.type === "MemberExpression" &&
    followingNode &&
    followingNode.type === "Identifier"
  ) {
    addLeadingComment(enclosingNode, comment);
    return true;
  }

  return false;
}

function handleConditionalExpressionComments(
  enclosingNode,
  precedingNode,
  followingNode,
  comment,
  text
) {
  const isSameLineAsPrecedingNode =
    precedingNode &&
    !util.hasNewlineInRange(text, locEnd(precedingNode), locStart(comment));

  if (
    (!precedingNode || !isSameLineAsPrecedingNode) &&
    enclosingNode &&
    enclosingNode.type === "ConditionalExpression" &&
    followingNode
  ) {
    addLeadingComment(followingNode, comment);
    return true;
  }
  return false;
}

function handleObjectPropertyAssignment(enclosingNode, precedingNode, comment) {
  if (
    enclosingNode &&
    (enclosingNode.type === "ObjectProperty" ||
      enclosingNode.type === "Property") &&
    enclosingNode.shorthand &&
    enclosingNode.key === precedingNode &&
    enclosingNode.value.type === "AssignmentPattern"
  ) {
    addTrailingComment(enclosingNode.value.left, comment);
    return true;
  }
  return false;
}

function handleClassComments(
  enclosingNode,
  precedingNode,
  followingNode,
  comment
) {
  if (
    enclosingNode &&
    (enclosingNode.type === "ClassDeclaration" ||
      enclosingNode.type === "ClassExpression") &&
    (enclosingNode.decorators && enclosingNode.decorators.length > 0) &&
    !(followingNode && followingNode.type === "Decorator")
  ) {
    if (!enclosingNode.decorators || enclosingNode.decorators.length === 0) {
      addLeadingComment(enclosingNode, comment);
    } else {
      addTrailingComment(
        enclosingNode.decorators[enclosingNode.decorators.length - 1],
        comment
      );
    }
    return true;
  }
  return false;
}

function handleMethodNameComments(text, enclosingNode, precedingNode, comment) {
  // This is only needed for estree parsers (flow, typescript) to attach
  // after a method name:
  // obj = { fn /*comment*/() {} };
  if (
    enclosingNode &&
    precedingNode &&
    (enclosingNode.type === "Property" ||
      enclosingNode.type === "MethodDefinition") &&
    precedingNode.type === "Identifier" &&
    enclosingNode.key === precedingNode &&
    // special Property case: { key: /*comment*/(value) };
    // comment should be attached to value instead of key
    getNextNonSpaceNonCommentCharacter(text, precedingNode) !== ":"
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }

  // Print comments between decorators and class methods as a trailing comment
  // on the decorator node instead of the method node
  if (
    precedingNode &&
    enclosingNode &&
    precedingNode.type === "Decorator" &&
    (enclosingNode.type === "ClassMethod" ||
      enclosingNode.type === "ClassProperty" ||
      enclosingNode.type === "TSAbstractClassProperty" ||
      enclosingNode.type === "TSAbstractMethodDefinition" ||
      enclosingNode.type === "MethodDefinition")
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }

  return false;
}

function handleFunctionNameComments(
  text,
  enclosingNode,
  precedingNode,
  comment
) {
  if (getNextNonSpaceNonCommentCharacter(text, comment) !== "(") {
    return false;
  }

  if (
    precedingNode &&
    enclosingNode &&
    (enclosingNode.type === "FunctionDeclaration" ||
      enclosingNode.type === "FunctionExpression" ||
      enclosingNode.type === "ClassMethod" ||
      enclosingNode.type === "MethodDefinition" ||
      enclosingNode.type === "ObjectMethod")
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }
  return false;
}

function handleCommentAfterArrowParams(text, enclosingNode, comment) {
  if (!(enclosingNode && enclosingNode.type === "ArrowFunctionExpression")) {
    return false;
  }

  const index = getNextNonSpaceNonCommentCharacterIndex(text, comment);
  if (text.substr(index, 2) === "=>") {
    addDanglingComment(enclosingNode, comment);
    return true;
  }

  return false;
}

function handleCommentInEmptyParens(text, enclosingNode, comment) {
  if (getNextNonSpaceNonCommentCharacter(text, comment) !== ")") {
    return false;
  }

  // Only add dangling comments to fix the case when no params are present,
  // i.e. a function without any argument.
  if (
    enclosingNode &&
    (((enclosingNode.type === "FunctionDeclaration" ||
      enclosingNode.type === "FunctionExpression" ||
      (enclosingNode.type === "ArrowFunctionExpression" &&
        (enclosingNode.body.type !== "CallExpression" ||
          enclosingNode.body.arguments.length === 0)) ||
      enclosingNode.type === "ClassMethod" ||
      enclosingNode.type === "ObjectMethod") &&
      enclosingNode.params.length === 0) ||
      (enclosingNode.type === "CallExpression" &&
        enclosingNode.arguments.length === 0))
  ) {
    addDanglingComment(enclosingNode, comment);
    return true;
  }
  if (
    enclosingNode &&
    (enclosingNode.type === "MethodDefinition" &&
      enclosingNode.value.params.length === 0)
  ) {
    addDanglingComment(enclosingNode.value, comment);
    return true;
  }
  return false;
}

function handleLastFunctionArgComments(
  text,
  precedingNode,
  enclosingNode,
  followingNode,
  comment
) {
  // Type definitions functions
  if (
    precedingNode &&
    precedingNode.type === "FunctionTypeParam" &&
    enclosingNode &&
    enclosingNode.type === "FunctionTypeAnnotation" &&
    followingNode &&
    followingNode.type !== "FunctionTypeParam"
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }

  // Real functions
  if (
    precedingNode &&
    (precedingNode.type === "Identifier" ||
      precedingNode.type === "AssignmentPattern") &&
    enclosingNode &&
    (enclosingNode.type === "ArrowFunctionExpression" ||
      enclosingNode.type === "FunctionExpression" ||
      enclosingNode.type === "FunctionDeclaration" ||
      enclosingNode.type === "ObjectMethod" ||
      enclosingNode.type === "ClassMethod") &&
    getNextNonSpaceNonCommentCharacter(text, comment) === ")"
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }
  return false;
}

function handleImportSpecifierComments(enclosingNode, comment) {
  if (enclosingNode && enclosingNode.type === "ImportSpecifier") {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleLabeledStatementComments(enclosingNode, comment) {
  if (enclosingNode && enclosingNode.type === "LabeledStatement") {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleCallExpressionComments(precedingNode, enclosingNode, comment) {
  if (
    enclosingNode &&
    enclosingNode.type === "CallExpression" &&
    precedingNode &&
    enclosingNode.callee === precedingNode &&
    enclosingNode.arguments.length > 0
  ) {
    addLeadingComment(enclosingNode.arguments[0], comment);
    return true;
  }
  return false;
}

function handleUnionTypeComments(
  precedingNode,
  enclosingNode,
  followingNode,
  comment
) {
  if (
    enclosingNode &&
    (enclosingNode.type === "UnionTypeAnnotation" ||
      enclosingNode.type === "TSUnionType")
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }
  return false;
}

function handlePropertyComments(enclosingNode, comment) {
  if (
    enclosingNode &&
    (enclosingNode.type === "Property" ||
      enclosingNode.type === "ObjectProperty")
  ) {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleExportNamedDeclarationComments(enclosingNode, comment) {
  if (enclosingNode && enclosingNode.type === "ExportNamedDeclaration") {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleOnlyComments(enclosingNode, ast, comment, isLastComment) {
  // With Flow the enclosingNode is undefined so use the AST instead.
  if (ast && ast.body && ast.body.length === 0) {
    if (isLastComment) {
      addDanglingComment(ast, comment);
    } else {
      addLeadingComment(ast, comment);
    }
    return true;
  } else if (
    enclosingNode &&
    enclosingNode.type === "Program" &&
    enclosingNode.body.length === 0 &&
    enclosingNode.directives &&
    enclosingNode.directives.length === 0
  ) {
    if (isLastComment) {
      addDanglingComment(enclosingNode, comment);
    } else {
      addLeadingComment(enclosingNode, comment);
    }
    return true;
  }
  return false;
}

function handleForComments(enclosingNode, precedingNode, comment) {
  if (
    enclosingNode &&
    (enclosingNode.type === "ForInStatement" ||
      enclosingNode.type === "ForOfStatement")
  ) {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleImportDeclarationComments(
  text,
  enclosingNode,
  precedingNode,
  comment
) {
  if (
    precedingNode &&
    enclosingNode &&
    enclosingNode.type === "ImportDeclaration" &&
    util.hasNewline(text, util.locEnd(comment))
  ) {
    addTrailingComment(precedingNode, comment);
    return true;
  }
  return false;
}

function handleAssignmentPatternComments(enclosingNode, comment) {
  if (enclosingNode && enclosingNode.type === "AssignmentPattern") {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleTypeAliasComments(enclosingNode, followingNode, comment) {
  if (enclosingNode && enclosingNode.type === "TypeAlias") {
    addLeadingComment(enclosingNode, comment);
    return true;
  }
  return false;
}

function handleVariableDeclaratorComments(
  enclosingNode,
  followingNode,
  comment
) {
  if (
    enclosingNode &&
    enclosingNode.type === "VariableDeclarator" &&
    followingNode &&
    (followingNode.type === "ObjectExpression" ||
      followingNode.type === "ArrayExpression")
  ) {
    addLeadingComment(followingNode, comment);
    return true;
  }
  return false;
}

function printComment(commentPath, options) {
  const comment = commentPath.getValue();
  comment.printed = true;
  return options.printer.printComment(commentPath, options);
}

function findExpressionIndexForComment(quasis, comment) {
  const startPos = locStart(comment) - 1;

  for (let i = 1; i < quasis.length; ++i) {
    if (startPos < getQuasiRange(quasis[i]).start) {
      return i - 1;
    }
  }

  // We haven't found it, it probably means that some of the locations are off.
  // Let's just return the first one.
  /* istanbul ignore next */
  return 0;
}

function getQuasiRange(expr) {
  if (expr.start !== undefined) {
    // Babylon
    return { start: expr.start, end: expr.end };
  }
  // Flow
  return { start: expr.range[0], end: expr.range[1] };
}

function printLeadingComment(commentPath, print, options) {
  const comment = commentPath.getValue();
  const contents = printComment(commentPath, options);
  if (!contents) {
    return "";
  }
  const isBlock = util.isBlockComment(comment);

  // Leading block comments should see if they need to stay on the
  // same line or not.
  if (isBlock) {
    return concat([
      contents,
      util.hasNewline(options.originalText, locEnd(comment)) ? hardline : " "
    ]);
  }

  return concat([contents, hardline]);
}

function printTrailingComment(commentPath, print, options) {
  const comment = commentPath.getValue();
  const contents = printComment(commentPath, options);
  if (!contents) {
    return "";
  }
  const isBlock = util.isBlockComment(comment);

  // We don't want the line to break
  // when the parentParentNode is a ClassDeclaration/-Expression
  // And the parentNode is in the superClass property
  const parentNode = commentPath.getNode(1);
  const parentParentNode = commentPath.getNode(2);
  const isParentSuperClass =
    parentParentNode &&
    (parentParentNode.type === "ClassDeclaration" ||
      parentParentNode.type === "ClassExpression") &&
    parentParentNode.superClass === parentNode;

  if (
    util.hasNewline(options.originalText, locStart(comment), {
      backwards: true
    })
  ) {
    // This allows comments at the end of nested structures:
    // {
    //   x: 1,
    //   y: 2
    //   // A comment
    // }
    // Those kinds of comments are almost always leading comments, but
    // here it doesn't go "outside" the block and turns it into a
    // trailing comment for `2`. We can simulate the above by checking
    // if this a comment on its own line; normal trailing comments are
    // always at the end of another expression.

    const isLineBeforeEmpty = util.isPreviousLineEmpty(
      options.originalText,
      comment
    );

    return lineSuffix(
      concat([hardline, isLineBeforeEmpty ? hardline : "", contents])
    );
  } else if (isBlock || isParentSuperClass) {
    // Trailing block comments never need a newline
    return concat([" ", contents]);
  }

  return concat([lineSuffix(" " + contents), !isBlock ? breakParent : ""]);
}

function printDanglingComments(path, options, sameIndent, filter) {
  const parts = [];
  const node = path.getValue();

  if (!node || !node.comments) {
    return "";
  }

  path.each(commentPath => {
    const comment = commentPath.getValue();
    if (
      comment &&
      !comment.leading &&
      !comment.trailing &&
      (!filter || filter(comment))
    ) {
      parts.push(printComment(commentPath, options));
    }
  }, "comments");

  if (parts.length === 0) {
    return "";
  }

  if (sameIndent) {
    return join(hardline, parts);
  }
  return indent(concat([hardline, join(hardline, parts)]));
}

function prependCursorPlaceholder(path, options, printed) {
  if (path.getNode() === options.cursorNode && path.getValue()) {
    return concat([cursor, printed]);
  }
  return printed;
}

function printComments(path, print, options, needsSemi) {
  const value = path.getValue();
  const printed = print(path);
  const comments = value && value.comments;

  if (!comments || comments.length === 0) {
    return prependCursorPlaceholder(path, options, printed);
  }

  const leadingParts = [];
  const trailingParts = [needsSemi ? ";" : "", printed];

  path.each(commentPath => {
    const comment = commentPath.getValue();
    const leading = comment.leading;
    const trailing = comment.trailing;

    if (leading) {
      const contents = printLeadingComment(commentPath, print, options);
      if (!contents) {
        return;
      }
      leadingParts.push(contents);

      const text = options.originalText;
      if (util.hasNewline(text, util.skipNewline(text, util.locEnd(comment)))) {
        leadingParts.push(hardline);
      }
    } else if (trailing) {
      trailingParts.push(printTrailingComment(commentPath, print, options));
    }
  }, "comments");

  return prependCursorPlaceholder(
    path,
    options,
    concat(leadingParts.concat(trailingParts))
  );
}

module.exports = {
  attach,
  printComments,
  printDanglingComments,
  getSortedChildNodes
};


/***/ })
/******/ ])));