import fs from 'fs'
import { reduce, filter, get, every, flattenDeep, takeWhile, takeRightWhile, isEqual, flow, join } from 'lodash/fp'
import { options } from './utils'

const FILE_NAME = 'i18n.json'
const IS_SAVE_TO_FILE = !process.argv.includes('--dry')

const FUNCTION_NAME = '__'
const hasThaiChar = (text) => /[\u0E00-\u0E7F]/.test(text)
const isHTML = (text) => /<([^>]+)>/.test(text)
const findHTMLContent = (text, str) => text.search(new RegExp(str))
const getHTMLContent = (text) => get('2', text.match(/<([\w]+)[^>]*>(.*?)<\/\1>/))

const getJSON = (list, obj) => {
  const result = reduce((obj, value) => ({
    ...obj,
    [value]: {
      en: value
    }
  }), obj, list)
  return JSON.stringify(result, null, 4)
}

const saveToFile = (list) => {
  let obj = {}
  try {
    obj = JSON.parse(fs.readFileSync(FILE_NAME))
  } catch (err) {}
  fs.writeFileSync(FILE_NAME, getJSON(list, obj))
}

export default function transformer(file, api) {
  let list = []

  const j = api.jscodeshift

  const getSpaceRight = flow(
    takeRightWhile(isEqual(' ')),
    join('')
  )
  const getSpaceLeft = flow(
    takeWhile(isEqual(' ')),
    join('')
  )
  const noI18n = (path) => !(path.parent && path.parent.callee && path.parent.callee.name === FUNCTION_NAME)
  const addI18n = (path, add) => {
    const node = path.node || path
    const source = j(node).toSource()
    const args = [
      node.type === 'JSXText' ? j.literal(node.value) : node
    ].concat(source.startsWith('`') ? [
      j.literal(
        source.substring(1, source.length - 1)
      )
    ] : [])

    list.push((args[1] || args[0]).value || source)

    add(j.callExpression(j.identifier(FUNCTION_NAME), args))
  }


  const root = j(file.source)
  root
    .find(j.Literal)
    .filter((path) => path.node.type === 'Literal')
    .filter((path) => typeof path.node.value === 'string')
    .filter(({ parent }) => parent.node.type !== 'ImportDeclaration')
    .filter(noI18n)
    .forEach((path) => {
      if (hasThaiChar(path.node.value)) {

        addI18n(
          path,
          (node) => j(path).replaceWith(node)
        )

        if (
          path.parent &&
          path.parent.node.key &&
          path.parent.node.key.type === 'CallExpression'
        ) {
          path.parent.node.key = path.parent.node.key.arguments[0]
        }
      }
    })

  root
    .find(j.TemplateLiteral)
    .filter(noI18n)
    .forEach((path) => {
      if (path.node.quasis.some((node) => hasThaiChar(node.value.raw))) {
        if (
          path.node.expressions.every((node) => j.Identifier.check(node)) &&
          !isHTML(j(path).toSource())
        ) {
          addI18n(
            path,
            (node) => j(path).replaceWith(node)
          )
          return
        }

        path.node.quasis
          .forEach((node, index) => {
            let value = node.value.raw.trim()

            if (!value) return
            if (!hasThaiChar(value)) return

            let spaceRight = getSpaceRight(node.value.raw)
            let spaceLeft = getSpaceLeft(node.value.raw)


            if (isHTML(value)) {
              const str = getHTMLContent(value) || ''
              const index = findHTMLContent(value, str)
              spaceLeft = spaceLeft + value.substring(0, index)
              spaceRight = value.substring(index + str.length, value.length) + spaceRight
              value = str
            }

            if (value) {
              addI18n(
                j.literal(value),
                (node) => path
                .get('expressions', index)
                .insertBefore(node)
              )
            }
            
            if (spaceLeft) {
              path.get('quasis', index).insertBefore(
                j.templateElement({ raw: spaceLeft, cooked: spaceLeft }, false)
              )
            }

            if (spaceRight) {
              path.get('quasis', index).insertAfter(
                j.templateElement({ raw: spaceRight, cooked: spaceRight }, false)
              )
            }

            node.value.raw = ''
          })
      }
    })

  root
    .find(j.JSXText)
    .filter(noI18n)
    .forEach((path) => {
      if (hasThaiChar(path.node.value)) {
        // const elem = j(path).closest(j.JSXElement).paths()[0]
        // if (
        //   flow(
        //     get('children'),
        //     filter(['type', 'JSXExpressionContainer']),
        //     flattenDeep,
        //     every((node) => !j.Expression.check(node))
        //   )(elem)
        // ) {

        //   const children = elem.node.children
        //   elem.node.children = [

        // addI18n(
        //   j.templateLiteral(
        //     (children[0].type !== 'JSXText' ? [j.templateElement({ raw: '', cooked: '' }, false)] : [])
        //     .concat(
        //       children
        //       .filter(({ type }) => type === 'JSXText')
        //       .map(({ value }) => j.templateElement({ raw: value, cooked: value }, false))
        //     ),
        //     flattenDeep([
        //         children
        //         .filter(({ type }) => type === 'JSXExpressionContainer')
        //         .map(({ expression }) => expression)
        //       ])
        //   ),
        //   (node) => j.jsxExpressionContainer(node)
        // )
        //   ]

        //   return
        // }

        const spaceRight = getSpaceRight(path.node.value)
        const spaceLeft = getSpaceLeft(path.node.value)
        path.node.value = path.node.value.trim()

        if (spaceLeft) {
          j(path).insertBefore(
            j.jsxText(spaceLeft)
          )
        }

        if (spaceRight) {
          j(path).insertAfter(
            j.jsxText(spaceRight)
          )
        }

        addI18n(
          path,
          (node) => j(path).replaceWith(node)
        )

        j(path).replaceWith(
          j.jsxExpressionContainer(path.node)
        )

      }
    })

  if (IS_SAVE_TO_FILE) {
    saveToFile(list)
  }

  return root.toSource(options)
}