import ms from "milsymbol"
import React from "react"

const VERSION = 10

export const SymbolSetChoices = [
  { code: "01", label: "Air" },
  { code: "02", label: "Air missile" },
  { code: "05", label: "Space" },
  { code: "06", label: "Space Missile" },
  { code: "10", label: "Land unit" },
  { code: "11", label: "Land civilian unit / Organization" },
  { code: "15", label: "Land equipment" },
  { code: "20", label: "Land installations" },
  { code: "25", label: "Control measure" },
  { code: "27", label: "Dismounted individual" },
  { code: "30", label: "Sea surface" },
  { code: "35", label: "Sea subsurface" },
  { code: "36", label: "Mine warfare" },
  { code: "40", label: "Activity / Event" },
  { code: "50", label: "Signals Intelligence - Space" },
  { code: "51", label: "Signals Intelligence - Air" },
  { code: "52", label: "Signals Intelligence - Land" },
  { code: "53", label: "Signals Intelligence - Surface" },
  { code: "54", label: "Signals Intelligence - Subsurface" },
  { code: "60", label: "Cyberspace" }
]

interface App6SymbolProps {
  code?: string
  symbolSet?: string
  size?: number
}

const App6Symbol = ({ code, symbolSet, size = 30 }: App6SymbolProps) => {
  const symbolCode = `${VERSION}03${symbolSet}00000000000000`
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
