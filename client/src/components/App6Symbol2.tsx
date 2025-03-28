import ms from "milsymbol"
import React from "react"

const VERSION = 10

export const SymbolSetChoices = {
  "01": "Air",
  "02": "Air missile",
  "05": "Space",
  "06": "Space Missile",
  10: "Land unit",
  11: "Land civilian unit / Organization",
  15: "Land equipment",
  20: "Land installations",
  25: "Control measure",
  27: "Dismounted individual",
  30: "Sea surface",
  35: "Sea subsurface",
  36: "Mine warfare",
  40: "Activity / Event",
  50: "Signals Intelligence - Space",
  51: "Signals Intelligence - Air",
  52: "Signals Intelligence - Land",
  53: "Signals Intelligence - Surface",
  54: "Signals Intelligence - Subsurface",
  60: "Cyberspace"
}

export const AffiliationChoices = {
  "00": "Pending",
  "01": "Unknown",
  "03": "Friend",
  "04": "Neutral",
  "06": "Hostile"
}

interface App6SymbolProps {
  code?: string
  symbolSet?: string
  affiliation?: string
  size?: number
}

const App6Symbol = ({
  code,
  symbolSet,
  affiliation,
  size = 30
}: App6SymbolProps) => {
  let symbolCode = code
  if (!code) {
    symbolCode = `${VERSION}${affiliation}${symbolSet}00000000000000`
  }
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
