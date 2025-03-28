import ms from "milsymbol"
import React from "react"

const VERSION = 100

const SymbolSetChoices = {
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

const AffiliationChoices = {
  0: "Pending",
  1: "Unknown",
  3: "Friend",
  4: "Neutral",
  6: "Hostile"
}

const StatusChoices = {
  0: "Present",
  1: "Planned / Anticipated / Suspect",
  2: "Present / Fully capable",
  3: "Present / Damaged",
  4: "Present / Destroyed",
  5: "Present / Full to capacity"
}

const HqChoices = {
  0: "Not Applicable",
  1: "Feint / Dummy",
  2: "Headquarters",
  3: "Feint / Dummy Headquarters",
  4: "Task Force",
  5: "Feint / Dummy Task Force",
  6: "Task Force Headquarters",
  7: "Feint / Dummy Task Force Headquarters"
}

const EchilonChoices = {
  10: {
    "00": "Unspecified",
    11: "Team / Crew",
    12: "Squad",
    13: "Section",
    14: "Platoon / Detachment",
    15: "Company / Battery / Troop",
    16: "Battalion / Squadron",
    17: "Regiment / Group",
    18: "Brigade",
    21: "Division",
    22: "Corps / MEF",
    23: "Army",
    24: "Army Group / Front",
    25: "Region / Theater",
    26: "Command"
  },
  15: {
    "00": "Unspecified",
    31: "Wheeled limited cross country",
    32: "Wheeled cross country",
    33: "Tracked",
    34: "Wheeled and tracked combination",
    35: "Towed",
    36: "Railway",
    37: "Pack animals",
    41: "Over snow (prime mover)",
    42: "Sled",
    51: "Barge",
    52: "Amphibious"
  },
  27: {
    "00": "Unspecified",
    71: "Leader"
  },
  30: {
    "00": "Unspecified",
    61: "Short towed array",
    62: "Long towed array"
  },
  35: {
    "00": "Unspecified",
    61: "Short towed array",
    62: "Long towed array"
  }
}

export const getChoices = (field, values) => {
  switch (field) {
    case "symbolSet":
      return SymbolSetChoices
    case "affiliation":
      return AffiliationChoices
    case "status":
      return StatusChoices
    case "hq":
      return HqChoices
    case "echelon":
      const symbolSet = getCodeFieldValue(getSymbolCode(values), "symbolSet")
      if (Object.keys(EchilonChoices).includes(symbolSet)) {
        return EchilonChoices[symbolSet]
      }
      return {}
    default:
      return {}
  }
}

export const getSymbolCode = values => {
  const symbolSet = values?.symbolSet || "00"
  const affiliation = values?.affiliation || "0"
  const status = values?.status || "0"
  const hq = values?.hq || "0"
  const echelon = values?.echelon || "00"
  return `${VERSION}${affiliation}${symbolSet}${status}${hq}${echelon}0000000000`
}

const getCodeFieldValue = (code, field) => {
  switch (field) {
    case "symbolSet":
      return code.substring(4, 6)
    case "affiliation":
      return code.substring(3, 4)
    case "status":
      return code.substring(6, 7)
    case "hq":
      return code.substring(7, 8)
    case "echelon":
      return code.substring(8, 10)
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
