import ms from "milsymbol"
import React from "react"
import { App6Choices } from "./App6"

const VERSION = 10

export const getChoices = (field: string, values: any) => {
  const symbolSet = getCodeFieldValue(getSymbolCode(values), "app6symbolSet")
  const app6entity = getCodeFieldValue(getSymbolCode(values), "app6entity")
  switch (field) {
    case "app6entity":
      const entityOptions = App6Choices[field][symbolSet] || {}
      return Object.fromEntries(
        Object.entries(entityOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "app6entityType":
      const entityTypeOptions =
        App6Choices.app6entity[symbolSet]?.[app6entity]?.options || {}
      return Object.fromEntries(
        Object.entries(entityTypeOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "app6entitySubtype":
      const app6entityType = getCodeFieldValue(
        getSymbolCode(values),
        "app6entityType"
      )
      const entitySubtypeOptions =
        App6Choices.app6entity[symbolSet]?.[app6entity]?.options?.[
          app6entityType
        ]?.options || {}
      return Object.fromEntries(
        Object.entries(entitySubtypeOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "app6amplifier":
      return App6Choices[field][symbolSet] || {}
    case "app6sectorOneModifier":
      return App6Choices[field][symbolSet] || {}
    case "app6sectorTwoModifier":
      return App6Choices[field][symbolSet] || {}
    default:
      return App6Choices[field] || {}
  }
}

export const getApp6Values = (code: string) => {
  return {
    app6context: code.substring(2, 3),
    app6standardIdentity: code.substring(3, 4),
    app6symbolSet: code.substring(4, 6),
    status: code.substring(6, 7),
    app6hq: code.substring(7, 8),
    app6amplifier: code.substring(8, 10),
    app6entity: code.substring(10, 12),
    app6entityType: code.substring(12, 14),
    app6entitySubtype: code.substring(14, 16),
    app6sectorOneModifier: code.substring(16, 18),
    app6sectorTwoModifier: code.substring(18, 20)
  }
}

export const getSymbolCode = (values: any) => {
  const context = values?.app6context || "0"
  const standardIdentity = values?.app6standardIdentity || "0"
  const symbolSet = values?.app6symbolSet || "00"
  // const status = values?.status || "0"
  const status = "0"
  const hq = values?.app6hq || "0"
  const amplifier = values?.app6amplifier || "00"
  const entity = values?.app6entity || "00"
  const entityType = values?.app6entityType || "00"
  const entitySubtype = values?.app6entitySubtype || "00"
  const sectorOneModifier = values?.app6sectorOneModifier || "00"
  const sectorTwoModifier = values?.app6sectorTwoModifier || "00"
  const fieldValues = [
    VERSION,
    context,
    standardIdentity,
    symbolSet,
    status,
    hq,
    amplifier,
    entity,
    entityType,
    entitySubtype,
    sectorOneModifier,
    sectorTwoModifier
  ]
  return fieldValues.join("")
}

const getCodeFieldValue = (code: string, field: string) => {
  switch (field) {
    case "app6context":
      return code.substring(2, 3)
    case "app6standardIdentity":
      return code.substring(3, 4)
    case "app6symbolSet":
      return code.substring(4, 6)
    case "status":
      return code.substring(6, 7)
    case "app6hq":
      return code.substring(7, 8)
    case "app6amplifier":
      return code.substring(8, 10)
    case "app6entity":
      return code.substring(10, 12)
    case "app6entityType":
      return code.substring(12, 14)
    case "app6entitySubtype":
      return code.substring(14, 16)
    case "app6sectorOneModifier":
      return code.substring(16, 18)
    case "app6sectorTwoModifier":
      return code.substring(18, 20)
    default:
      return ""
  }
}

interface App6SymbolProps {
  code?: string
  values?: any
  size?: number
}

const App6Symbol = ({ code, values, size = 30 }: App6SymbolProps) => {
  if (!code) {
    code = getSymbolCode(values)
  }
  const svgString = new ms.Symbol(code, { size }).asSVG()
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
  return (
    <img
      src={dataUrl}
      alt="APP6 Symbol"
      style={{ maxWidth: size, maxHeight: "100%" }}
    />
  )
}

export default React.memo(App6Symbol)
