import { IconSize } from "@blueprintjs/core"
import { IconSvgPaths16, IconSvgPaths20 } from "@blueprintjs/icons"
import * as changeCase from "change-case"
import * as d3 from "d3"
import parseAddressList from "email-addresses"
import _isEmpty from "lodash/isEmpty"
import pluralize from "pluralize"
import decodeQuery from "querystring/decode"
import encodeQuery from "querystring/encode"
import React, { useCallback, useEffect } from "react"
import absentIcon from "resources/icons/absent.svg"
import binaryIcon from "resources/icons/binary.svg"
import pdfIcon from "resources/icons/pdf.svg"
import textIcon from "resources/icons/text.svg"
import videoIcon from "resources/icons/video.svg"
import Settings from "settings"
import { titleCase } from "title-case"

const WILDCARD = "*"
const domainNames = Settings.domainNames.map(d => d.toLowerCase())
const wildcardDomains = domainNames.filter(domain => domain[0] === WILDCARD)

// Support null input like change-case v3 did…
const wrappedChangeCase = {
  titleCase
}
Object.keys(changeCase)
  .filter(c => c.endsWith("Case"))
  .forEach(c => {
    wrappedChangeCase[c] = (input, options) =>
      !input ? "" : changeCase[c](input, options)
  })

const isNullOrUndefined = value => {
  return value === null || value === undefined
}

const fnRequiredWhen = (boolPropName, props, propName, componentName) => {
  if (props[boolPropName] && typeof props[propName] !== "function") {
    return new Error(
      `Prop "${componentName}.${propName}" is a required function if "${boolPropName}" is true`
    )
  }
}

const fnRequiredWhenNot = (
  relatedPropName,
  relatedPropValue,
  props,
  propName,
  componentName
) => {
  if (
    props[relatedPropName] !== relatedPropValue &&
    typeof props[propName] !== "object"
  ) {
    return new Error(
      `Prop "${componentName}.${propName}" is a required object if "${relatedPropName}" is NOT ${relatedPropValue}`
    )
  }
}

const ellipsize = (value, maxLength) =>
  value?.length > maxLength
    ? value.substring(0, maxLength - 1) + "\u2026"
    : value

export default {
  ...wrappedChangeCase,
  pluralize,
  isNullOrUndefined,
  fnRequiredWhen,
  fnRequiredWhenNot,
  ellipsize,
  resourceize: function(string) {
    return pluralize(wrappedChangeCase.camelCase(string))
  },

  handleEmailValidation: function(value, shouldValidate) {
    if (!shouldValidate) {
      return { isValid: true, message: null }
    }
    try {
      const isValid = this.validateEmail(value, domainNames, wildcardDomains)
      const message = isValid ? null : this.emailErrorMessage(domainNames)
      return { isValid, message }
    } catch (e) {
      return { isValid: false, message: <div>{e.message}</div> }
    }
  },

  validateEmail: function(emailValue, domainNames, wildcardDomains) {
    if (!emailValue) {
      return true
    }
    const email = emailValue.split("@")
    if (email.length < 2 || email[1].length === 0) {
      throw new Error("Please provide a valid email address")
    }
    const from = email[0].trim()
    const domain = email[1].toLowerCase()
    return (
      this.validateAgainstAllowedDomains(from, domain, domainNames) ||
      this.validateWithWildcard(domain, wildcardDomains)
    )
  },

  validateAgainstAllowedDomains: function(from, domain, allowedDomains) {
    return from.length > 0 && allowedDomains.includes(domain)
  },

  validateWithWildcard: function(domain, wildcardDomains) {
    let isValid = false
    if (domain) {
      isValid = wildcardDomains.some(wildcard => {
        return domain[0] !== "." && domain.endsWith(wildcard.substr(1))
      })
    }
    return isValid
  },

  emailErrorMessage: function(validDomainNames) {
    const supportEmail = Settings.SUPPORT_EMAIL_ADDR
    const emailMessage = supportEmail ? ` at ${supportEmail}` : ""
    const errorMessage = `Only the following email domain names are allowed. If your email domain name is not in the list, please contact the support team${emailMessage}.`
    const items = validDomainNames.map((name, index) => [
      <li key={index}>{name}</li>
    ])
    return (
      <div>
        <p>{errorMessage}</p>
        <ul>{items}</ul>
      </div>
    )
  },

  parseEmailAddresses: function(addressees) {
    const addrs = parseAddressList(addressees)
    if (!addrs) {
      return {
        isValid: false,
        message: <div>Please provide one or more valid email addresses</div>
      }
    }
    const toAddresses = addrs.addresses.map(a => a.address)
    for (let i = 0; i < toAddresses.length; i++) {
      const r = this.handleEmailValidation(toAddresses[i], true)
      if (r.isValid === false) {
        return r
      }
    }
    return { isValid: true, to: toAddresses }
  },

  createMailtoLink: function(emailAddress) {
    return (
      <a href={`mailto:${encodeURIComponent(emailAddress)}`}>{emailAddress}</a>
    )
  },

  parseQueryString: function(queryString) {
    if (!queryString) {
      return {}
    }
    return decodeQuery(queryString.slice(1)) || {}
  },

  formatQueryString: function(queryParams) {
    if (!queryParams) {
      return ""
    }
    return "?" + encodeQuery(queryParams)
  },

  formatBoolean: function(b, emptyForNullOrUndefined) {
    if (emptyForNullOrUndefined && b == null) {
      return ""
    }
    return b ? "Yes" : "No"
  },

  treatFunctionsAsEqual: function(value1, value2) {
    if (typeof value1 === "function" && typeof value2 === "function") {
      return true
    }
  },

  getReference: function(obj) {
    return obj && obj.uuid ? { uuid: obj.uuid } : {}
  },

  isEmptyHtml: function(html) {
    let text
    if (document && typeof document.createElement === "function") {
      const tmpDiv = document.createElement("div")
      tmpDiv.innerHTML = html
      text = tmpDiv.textContent || tmpDiv.innerText || ""
    } else {
      text = html // no document context, what else can we do?
    }
    return _isEmpty(text)
  },

  isNumeric: function(value) {
    return typeof value === "number" && !isNaN(value)
  },

  pushHash: function(hash) {
    const { history, location } = window
    hash = hash ? (hash.indexOf("#") === 0 ? hash : "#" + hash) : ""
    if (history.replaceState) {
      const loc = window.location
      history.replaceState(
        null,
        null,
        hash ? loc.pathname + loc.search + hash : loc.pathname + loc.search // remove hash
      )
    } else {
      location.hash = hash
    }
  },

  parseJsonSafe: function(jsonString, throwError) {
    // TODO: Improve error handling so that consuming widgets can display an error w/o crashing
    let result
    try {
      result = JSON.parse(jsonString || "{}")
    } catch (error) {
      if (throwError) {
        throw error
      } else {
        console.error(`unable to parse JSON: ${jsonString}`)
      }
    }
    return typeof result === "object" ? result || {} : {}
  },

  parseSensitiveFields: function(customSensitiveInformation) {
    const sensitiveInformationObjects = customSensitiveInformation.map(
      sensitiveInfo => this.parseJsonSafe(sensitiveInfo.customFieldValue)
    )
    const allSensitiveFields = sensitiveInformationObjects.reduce(
      (accum, key) => {
        accum = { ...accum, ...key }
        return accum
      },
      {}
    )
    return allSensitiveFields
  },

  arrayOfNumbers: function(arr) {
    return (
      arr &&
      arr.filter(n => !isNaN(parseFloat(n)) && isFinite(n)).map(n => Number(n))
    )
  },

  preventNegativeAndLongDigits: function(valueStr, maxLen) {
    let safeVal
    const dangerVal = Number(valueStr)
    if (!isNaN(dangerVal) && dangerVal < 0) {
      safeVal = "0"
    } else {
      const nonDigitsRemoved = valueStr.replace(/\D/g, "")
      safeVal =
        maxLen <= 0 ? nonDigitsRemoved : nonDigitsRemoved.slice(0, maxLen)
    }
    return safeVal
  },

  getMaxTextFieldLength: function(field) {
    return field?.maxLength || Settings.maxTextFieldLength
  },

  pluralizeWord: function(count, word) {
    return count > 1 ? pluralize.plural(word) : word
  },

  /**
   * Used to determine whether the text should be black or white
   * depending on the specified background color.
   * @param {string} color Hexadecimal color code or color name
   * @returns Text color
   */
  getContrastYIQ: function(color) {
    // pick a default
    const defaultColor = "white"
    if (!color) {
      return defaultColor
    }

    let c = d3.color(color)
    if (
      !c &&
      (color.length === 3 || color.length === 6) &&
      color.slice(0, 1) !== "#"
    ) {
      // Might be hexcode without leading "#", prepend it and try again
      c = d3.color(`#${color}`)
    }

    if (!c) {
      return defaultColor
    }

    const yiq = (c.r * 299 + c.g * 587 + c.b * 114) / 1000
    return yiq >= 128 ? "black" : "white"
  },

  readNestedObjectWithStringPath: function(obj, path) {
    return path.split(".").reduce((value, el) => value[el], obj)
  },

  humanReadableFileSize: function(number) {
    if (number < 1024) {
      return `${number} bytes`
    } else if (number >= 1024 && number < 1048576) {
      return `${(number / 1024).toFixed(1)} KB`
    } else if (number >= 1048576) {
      return `${(number / 1048576).toFixed(1)} MB`
    }
  },

  getAttachmentIconDetails: function(attachment, small) {
    let backgroundSize = small ? "50px" : "200px"
    let backgroundImage = binaryIcon
    const contentMissing = attachment.contentLength < 0
    if (contentMissing) {
      backgroundImage = absentIcon
    } else if (attachment.mimeType === "application/pdf") {
      backgroundImage = pdfIcon
    } else if (attachment.mimeType.startsWith("text/")) {
      backgroundImage = textIcon
    } else if (attachment.mimeType.startsWith("video/")) {
      backgroundImage = videoIcon
    } else if (attachment.mimeType.startsWith("image/")) {
      backgroundSize = "cover"
      backgroundImage = `/api/attachment/view/${attachment.uuid}`
    }
    return { backgroundSize, backgroundImage, contentMissing }
  },

  stripExtension: function(fileName) {
    const index = fileName.lastIndexOf(".")
    return index === -1 ? fileName : fileName.substring(0, index)
  },

  getAscendantObjectsAsMap: function(ascendantObjects) {
    return (
      ascendantObjects?.reduce((acc, val) => {
        acc[val.uuid] = val
        return acc
      }, {}) || {}
    )
  },

  getAscendantObjectsAsList: function(leaf, ascendantObjects, parentField) {
    const parentMap = Array.isArray(ascendantObjects)
      ? this.getAscendantObjectsAsMap(ascendantObjects)
      : ascendantObjects
    let uuid = leaf?.uuid
    const trail = []
    while (uuid) {
      const node = parentMap[uuid]
      if (!node) {
        break
      }
      trail.unshift(node)
      uuid = node[parentField]?.uuid
    }
    return trail
  },

  determineApp6field: function(ascendantOrgs, app6field, defaultValue) {
    for (const ascendantOrg of ascendantOrgs) {
      if (ascendantOrg?.[app6field]) {
        return ascendantOrg[app6field]
      }
    }
    return defaultValue
  },

  getButtonsFromChoices: function(choices) {
    return Object.entries(choices).map(([value, label]) => ({
      value,
      label
    }))
  }
}

Object.forEach = function(source, func) {
  return Object.keys(source).forEach(key => {
    func(key, source[key])
  })
}

Object.map = function(source, func) {
  return Object.keys(source).map(key => {
    const value = source[key]
    return func(key, value)
  })
}

Object.get = function(source, keypath) {
  const keys = keypath.split(".")
  while (keys[0]) {
    const key = keys.shift()
    source = source[key]
    if (isNullOrUndefined(source)) {
      return source
    }
  }
  return source
}

Object.without = function(source, ...keys) {
  const copy = Object.assign({}, source)
  let i = keys.length
  while (i--) {
    const key = keys[i]
    copy[key] = undefined
    delete copy[key]
  }
  return copy
}

// eslint-disable-next-line
Promise.prototype.log = function () {
  return this.then(function(data) {
    console.log(data)
    return data
  })
}

export const renderBlueprintIconAsSvg = (
  iconName,
  iconSize = IconSize.STANDARD
) => {
  // choose which pixel grid is most appropriate for given icon size
  const pixelGridSize =
    iconSize >= IconSize.LARGE ? IconSize.LARGE : IconSize.STANDARD
  const viewBox = `0 0 ${pixelGridSize} ${pixelGridSize}`
  const svgPathsRecord =
    pixelGridSize === IconSize.STANDARD ? IconSvgPaths16 : IconSvgPaths20
  const pathStrings = svgPathsRecord[iconName]
  const paths =
    pathStrings === null
      ? ""
      : pathStrings.map((d, i) => `<path d="${d}" fillRule="evenodd" />`)
  return {
    viewBox,
    html: `<g>
        <desc>{iconName}</desc>
        <rect fill="transparent" width="${pixelGridSize}" height="${pixelGridSize}"/>
        ${paths.join("")}
      </g>` // we use a rect to simulate pointer-events: bounding-box
  }
}

export const useOutsideClick = (ref, cb) => {
  const nodeExists = ref && ref.current

  const callback = useCallback(
    event => {
      if (nodeExists && !ref.current.contains(event.target)) {
        cb(event)
      }
    },
    // arrow functions will retrigger this every call, but we can introduce bugs if we omit
    [ref, nodeExists, cb]
  )

  useEffect(() => {
    if (nodeExists) {
      document.addEventListener("click", callback)
      document.addEventListener("ontouchstart", callback)
      return () => {
        document.removeEventListener("click", callback)
        document.removeEventListener("ontouchstart", callback)
      }
    }
  }, [nodeExists, callback])
}
