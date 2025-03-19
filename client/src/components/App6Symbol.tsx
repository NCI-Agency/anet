import ms from "milsymbol"
import React from "react"

interface App6SymbolProps {
  context?: string
  standardIdentity?: string
  symbolSet?: string
  hq?: string
  amplifier?: string
  version?: string
  status?: string
  size?: number
}

const App6Symbol = ({
  context,
  standardIdentity,
  symbolSet,
  hq,
  amplifier,
  version = "10",
  status = "0",
  size = 30
}: App6SymbolProps) => {
  context ||= "0"
  standardIdentity ||= "1"
  symbolSet ||= "00"
  hq ||= "0"
  amplifier ||= "00"

  const symbolCode = `${version}${context}${standardIdentity}${symbolSet}${status}${hq}${amplifier}`
  const symbol = new ms.Symbol(symbolCode, { size })
  const svgString = symbol.asSVG()
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
