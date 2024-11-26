import { forward, toPoint } from "mgrs"
import utils from "utils"

export function parseCoordinate(latLng, validate = "") {
  const value = parseFloat(latLng)
  if (!utils.isNumeric(value)) {
    return null
  }

  // Added extra validation here to not convert invalid lat-lng to MGRS
  // mgrs library doesn't validate so we do here
  if (validate === "lat" && Math.abs(value) > 90) {
    return null
  }
  if (validate === "lng" && Math.abs(value) > 180) {
    return null
  }
  /*
   * We use 5 decimal point (~110cm) precision because MGRS has
   * a minimum of 1 meter precision.
   * Please see;
   * https://stackoverflow.com/a/16743805/1209097
   * https://en.wikipedia.org/wiki/Military_Grid_Reference_System
   */
  const precision = 5
  /*
   * for the purpose of rounding below please see:
   * https://stackoverflow.com/questions/1458633/how-to-deal-with-floating-point-number-precision-in-javascript
   * https://floating-point-gui.de/
   */
  const safeRoundedValue = Math.round(value * 10 ** precision * 10) / 10
  /*
   * Also, coordinates are truncated instead of rounding when changing
   * precision level in order to aviod inconsistencies during (MGRS <--> Lat/Lon) conversion.
   */
  return Math.trunc(safeRoundedValue) / 10 ** precision
}

export function convertLatLngToMGRS(lat, lng) {
  const parsedLat = parseCoordinate(lat, "lat")
  const parsedLng = parseCoordinate(lng, "lng")

  let mgrs = ""
  try {
    if (utils.isNumeric(parsedLat) && utils.isNumeric(parsedLng)) {
      mgrs = forward([parsedLng, parsedLat])
    }
  } catch (e) {
    mgrs = ""
  }
  return mgrs
}

export function convertMGRSToLatLng(mgrs) {
  let latLng
  try {
    // mgrs library accepts an input with even number of character as valid input, no matter how long the input is
    // example: normal mgrs value= 36SVK8138315670, add even number of characters (36SVK8138315670FF or 36SVK8138315670QQQQ) => still valid for mgrs library
    // Add our own validation to invalidate the examples above and make sure we allow max 10 digits at the end of an mgrs value.
    // https://gis.stackexchange.com/a/304034
    if (mgrs.match(/^\d{1,2}[^IO]{3}(\d{10}|\d{8}|\d{6}|\d{4}|\d{2})$/im)) {
      // toPoint returns an array of [lon, lat]
      latLng = mgrs ? toPoint(mgrs) : ["", ""]
    } else {
      throw new Error("Bad MGRS value")
    }
  } catch (e) {
    latLng = ["", ""]
  }
  return [parseCoordinate(latLng[1]), parseCoordinate(latLng[0])]
}
