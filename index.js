'use strict'
const path = require('path')
const fs = require('fs/promises')
const { promise: glob } = require('glob-promise')
const { camelCase } = require('camel-case')
const { parse } = require('svg-parser')

const srcDir = path.join(__dirname, 'src')
const outDir = path.join(__dirname, 'out')
const globPattern = path.join(srcDir, '*.svg')
const filenamePattern = path.join(srcDir, '(.*)\.svg').replace(/\\/g, '\\/')

const main = async () => {
  const files = await glob(globPattern)

  files.map(async (filename) => {
    const matches = filename.match(new RegExp(filenamePattern))
    const iconName = camelCase(matches[2]).replaceAll('_', '')
    const file = await fs.readFile(filename, 'utf-8')
    const svgTree = parse(file)

    const fileBody =
      `export const ${iconName} = ${toString(iconName, svgTree.children[0])}` 

    await fs.writeFile(path.join(outDir, `${iconName}.js`), fileBody)
  })
}

const toString = (name, data) => (
  '{\n' +
  `  name: '${name}',\n` +
  `  width: ${data.properties.width},\n` +
  `  height: ${data.properties.height},\n` +
  `  children: [\n` +
  data.children.map(toStingChild(2)).join('') +
  `  ],\n` +
  '}\n'
)

const toStingChild = (depth = 1) => ((element) => {
  const indent = i(depth)
  const __indent = i(depth + 1)
  const ____indent = i(depth + 2)
  return (
    `${indent}{\n` +
    `${__indent}tag: '${element.tagName}',\n` +
    `${__indent}attrs: {\n` +
    Object.keys(element.properties).map((key) => (
      `${____indent}${key}: '${element.properties[key]}',\n`
    )).join('') +
    (element.children.length
      ? `${__indent}children: [\n${element.children.map(toStingChild(depth + 2)).join('')}],\n`
      : ''
    ) +
    `${__indent}},\n` +
    `${indent}},\n`
  )
})

const i = (depth = 1) => Array.from({ length: depth * 2 }).map(() => ' ').join('')

main()