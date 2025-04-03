import ms from "milsymbol"
import React from "react"
import { App6Choices } from "./App6"

const VERSION = 10

export const getChoices = (field: string, values: any) => {
  const symbolSet = getCodeFieldValue(getSymbolCode(values), "app6symbolSet")
  const iconEntity = getCodeFieldValue(getSymbolCode(values), "iconEntity")
  switch (field) {
    case "app6context":
      return App6Choices.context || {}
    case "app6standardIdentity":
      return App6Choices.standardIdentity || {}
    case "app6symbolSet":
      return App6Choices.symbolSet || {}
    case "status":
      return App6Choices.status || {}
    case "app6hq":
      return App6Choices.hq || {}
    case "app6amplifier":
      return App6Choices.amplifier[symbolSet] || {}
    case "iconEntity":
      const entityOptions = App6Choices.iconEntity[symbolSet] || {}
      return Object.fromEntries(
        Object.entries(entityOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "iconEntityType":
      const entityTypeOptions =
        App6Choices.iconEntity[symbolSet]?.[iconEntity]?.options || {}
      return Object.fromEntries(
        Object.entries(entityTypeOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "iconEntitySubtype":
      const iconEntityType = getCodeFieldValue(
        getSymbolCode(values),
        "iconEntityType"
      )
      const entitySubtypeOptions =
        App6Choices.iconEntity[symbolSet]?.[iconEntity]?.options?.[
          iconEntityType
        ]?.options || {}
      return Object.fromEntries(
        Object.entries(entitySubtypeOptions).map(([key, value]) => {
          return [key, value.label]
        })
      )
    case "firstModifier":
      return App6Choices.firstModifier[symbolSet] || {}
    case "secondModifier":
      return App6Choices.secondModifier[symbolSet] || {}
    default:
      return {}
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
    iconEntity: code.substring(10, 12),
    iconEntityType: code.substring(12, 14),
    iconEntitySubtype: code.substring(14, 16),
    firstModifier: code.substring(16, 18),
    secondModifier: code.substring(18, 20)
  }
}

export const getSymbolCode = (values: any) => {
  const context = values?.app6context || "0"
  const standardIdentity = values?.app6standardIdentity || "0"
  const symbolSet = values?.app6symbolSet || "00"
  const status = values?.status || "0"
  const hq = values?.app6hq || "0"
  const amplifier = values?.app6amplifier || "00"
  const iconEntity = values?.iconEntity || "00"
  const iconEntityType = values?.iconEntityType || "00"
  const iconEntitySubtype = values?.iconEntitySubtype || "00"
  const firstModifier = values?.firstModifier || "00"
  const secondModifier = values?.secondModifier || "00"
  const fieldValues = [
    VERSION,
    context,
    standardIdentity,
    symbolSet,
    status,
    hq,
    amplifier,
    iconEntity,
    iconEntityType,
    iconEntitySubtype,
    firstModifier,
    secondModifier
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
    case "iconEntity":
      return code.substring(10, 12)
    case "iconEntityType":
      return code.substring(12, 14)
    case "iconEntitySubtype":
      return code.substring(14, 16)
    case "firstModifier":
      return code.substring(16, 18)
    case "secondModifier":
      return code.substring(18, 20)
    default:
      return ""
  }
}

interface App6SymbolProps {
  code?: string
  size?: number
}

const App6Symbol = ({ code, size = 30 }: App6SymbolProps) => {
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
