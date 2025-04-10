import ms from "milsymbol"
import React, { useEffect, useRef } from "react"
import { App6Choices } from "components/App6"

const VERSION = 10

export const getChoices = (field: string, values: any) => {
  const symbolSet = getCodeFieldValue(getSymbolCode(values), "app6symbolSet")
  const app6entity = getCodeFieldValue(getSymbolCode(values), "app6entity")
  const app6entityType = getCodeFieldValue(
    getSymbolCode(values),
    "app6entityType"
  )

  const toEntries = options =>
    Object.fromEntries(
      Object.entries(options).map(([key, value]) => [key, value.label])
    )

  const choiceHandlers = {
    app6entity: () => toEntries(App6Choices[field][symbolSet] || {}),
    app6entityType: () =>
      toEntries(App6Choices.app6entity[symbolSet]?.[app6entity]?.options || {}),
    app6entitySubtype: () => {
      return toEntries(
        App6Choices.app6entity[symbolSet]?.[app6entity]?.options?.[
          app6entityType
        ]?.options || {}
      )
    },
    app6amplifier: () => App6Choices[field][symbolSet] || {},
    app6sectorOneModifier: () => App6Choices[field][symbolSet] || {},
    app6sectorTwoModifier: () => App6Choices[field][symbolSet] || {}
  }

  return (choiceHandlers[field] || (() => App6Choices[field] || {}))()
}

export const getLabel = (values: any[], field: string) => {
  const choices = getChoices(field, values)
  const value = values[field]
  return choices[value] || ""
}

export const getFieldsList = () => {
  return [
    "app6context",
    "app6standardIdentity",
    "app6symbolSet",
    "app6hq",
    "app6amplifier",
    "app6entity",
    "app6entityType",
    "app6entitySubtype",
    "app6sectorOneModifier",
    "app6sectorTwoModifier"
  ]
}

const getSymbolCode = (values: any[]) => {
  const context = values?.app6context || "0"
  const standardIdentity = values?.app6standardIdentity || "0"
  const symbolSet = values?.app6symbolSet || "00"
  // we should always set the status to 0 for now
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
  values?: any
  size?: number
  maxHeight?: number
}

const App6Symbol = ({ values, size = 30, maxHeight }: App6SymbolProps) => {
  const code = getSymbolCode(values)
  const symbol = new ms.Symbol(code, { size }).asDOM()
  symbol.setAttribute("width", `${size}px`)
  if (maxHeight) {
    symbol.setAttribute("height", `${maxHeight}px`)
  }
  const svg = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (svg.current) {
      if (svg.current.firstChild) {
        svg.current.replaceChild(symbol, svg.current.firstChild)
      } else {
        svg.current.appendChild(symbol)
      }
    }
  }, [symbol])
  return <div ref={svg} style={{ maxWidth: size, maxHeight }} />
}

export default React.memo(App6Symbol)
