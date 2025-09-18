import * as changeCase from "change-case"
import * as d3 from "d3"
import parseAddressList from "email-addresses"
import _isDate from "lodash/isDate"
import _isEmpty from "lodash/isEmpty"
import _isMatchWith from "lodash/isMatchWith"
import moment from "moment/moment"
import pluralize from "pluralize"
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
const activeDomainNames = Settings.activeDomainNames.map(d => d.toLowerCase())
const wildcardActiveDomains = activeDomainNames.filter(
  domain => domain[0] === WILDCARD
)

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

const ellipsizeOnWords = (value, maxLength) => {
  if (!value) {
    return value
  }

  const spaceChar = " "
  value = value.replace(/\s+/g, spaceChar).trim()

  if (value.length <= maxLength) {
    return value
  }

  let trimmedStr = value.substring(0, maxLength)
  const lastSpace = trimmedStr.lastIndexOf(spaceChar)
  if (lastSpace !== -1) {
    trimmedStr = trimmedStr.substring(0, lastSpace)
  }

  return trimmedStr + "\u2026"
}

const isMatchWithCustomizer = (objValue, srcValue, key, object, source) => {
  if (objValue == null || srcValue == null) {
    return objValue === srcValue
  }

  if (Object.keys(object).length !== Object.keys(source).length) {
    return false
  }

  if (typeof objValue === "object" && typeof srcValue === "object") {
    if (Object.keys(objValue).length !== Object.keys(srcValue).length) {
      return false
    }
  }

  if (Array.isArray(objValue) && Array.isArray(srcValue)) {
    if (objValue.length !== srcValue.length) {
      return false
    }
  }
}

export default {
  ...wrappedChangeCase,
  pluralize,
  isNullOrUndefined,
  fnRequiredWhen,
  fnRequiredWhenNot,
  ellipsize,
  ellipsizeOnWords,
  resourceize: function (string) {
    return pluralize(wrappedChangeCase.camelCase(string))
  },
  _handleEmailValidation: function (
    value,
    validDomains,
    validWildcardDomains,
    shouldValidate
  ) {
    if (!shouldValidate) {
      return { isValid: true, message: null }
    }
    try {
      const isValid = this.validateEmail(
        value,
        validDomains,
        validWildcardDomains
      )
      const message = isValid ? null : this.emailErrorMessage(validDomains)
      return { isValid, message }
    } catch (e) {
      return { isValid: false, message: <div>{e.message}</div> }
    }
  },

  handleEmailValidation: function (value, shouldValidate) {
    return this._handleEmailValidation(
      value,
      domainNames,
      wildcardDomains,
      shouldValidate
    )
  },

  handleDialogEmailValidation: function (value, shouldValidate) {
    return this._handleEmailValidation(
      value,
      activeDomainNames,
      wildcardActiveDomains,
      shouldValidate
    )
  },

  validateEmail: function (emailValue, domainNames, wildcardDomains) {
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

  validateAgainstAllowedDomains: function (from, domain, allowedDomains) {
    return from.length > 0 && allowedDomains.includes(domain)
  },

  validateWithWildcard: function (domain, wildcardDomains) {
    let isValid = false
    if (domain) {
      isValid = wildcardDomains.some(wildcard => {
        return domain[0] !== "." && domain.endsWith(wildcard.substr(1))
      })
    }
    return isValid
  },

  emailErrorMessage: function (validDomainNames) {
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

  parseEmailAddresses: function (addressees) {
    const addrs = parseAddressList(addressees)
    if (!addrs) {
      return {
        isValid: false,
        message: <div>Please provide one or more valid email addresses</div>
      }
    }
    const toAddresses = addrs.addresses.map(a => a.address)
    for (let i = 0; i < toAddresses.length; i++) {
      const r = this.handleDialogEmailValidation(toAddresses[i], true)
      if (r.isValid === false) {
        return r
      }
    }
    return { isValid: true, to: toAddresses }
  },

  createMailtoLink: function (emailAddress) {
    return (
      <a href={`mailto:${encodeURIComponent(emailAddress)}`}>{emailAddress}</a>
    )
  },

  parseQueryString: function (queryString) {
    if (!queryString) {
      return new URLSearchParams()
    }
    return new URLSearchParams(queryString.slice(1))
  },

  formatQueryString: function (queryParams) {
    if (!queryParams) {
      return ""
    }
    return `?${new URLSearchParams(queryParams).toString()}`
  },

  formatBoolean: function (b, emptyForNullOrUndefined) {
    if (emptyForNullOrUndefined && b == null) {
      return ""
    }
    return b ? "Yes" : "No"
  },

  treatFunctionsAsEqual: function (value1, value2) {
    if (typeof value1 === "function" && typeof value2 === "function") {
      return true
    }
  },

  getReference: function (obj) {
    return obj && obj.uuid ? { uuid: obj.uuid } : {}
  },

  isEmptyHtml: function (html) {
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

  isNumeric: function (value) {
    return typeof value === "number" && !isNaN(value)
  },

  isDeeplyEqual: function (value1, value2) {
    return _isMatchWith(value1, value2, isMatchWithCustomizer)
  },

  isEmptyValue: function (value) {
    return _isDate(value) ? false : _isEmpty(value)
  },

  pushHash: function (hash) {
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

  parseJsonSafe: function (jsonString, throwError) {
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

  parseSensitiveFields: function (customSensitiveInformation) {
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

  arrayOfNumbers: function (arr) {
    return (
      arr &&
      arr.filter(n => !isNaN(parseFloat(n)) && isFinite(n)).map(n => Number(n))
    )
  },

  preventNegativeAndLongDigits: function (valueStr, maxLen) {
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

  getMaxTextFieldLength: function (
    field,
    defaultLength = Settings.maxTextFieldLength
  ) {
    return field?.maxLength || defaultLength
  },

  pluralizeWord: function (count, word) {
    return count > 1 ? pluralize.plural(word) : word
  },

  /**
   * Used to determine whether the text should be black or white
   * depending on the specified background color.
   * @param {string} color Hexadecimal color code or color name
   * @param {string} defaultColor Optional default color, defaults to "white" if not specified
   * @returns Text color
   */
  getContrastYIQ: function (color, defaultColor: string = "white") {
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

  readNestedObjectWithStringPath: function (obj, path) {
    return path.split(".").reduce((value, el) => value[el], obj)
  },

  humanReadableFileSize: function (number) {
    if (number < 1024) {
      return `${number} bytes`
    } else if (number >= 1024 && number < 1048576) {
      return `${(number / 1024).toFixed(1)} KB`
    } else if (number >= 1048576) {
      return `${(number / 1048576).toFixed(1)} MB`
    }
  },

  getAttachmentIconDetails: function (attachment, small) {
    const iconSize = small ? "50px" : "200px"
    let iconImage = binaryIcon
    const contentMissing =
      attachment.contentLength < 0 ||
      isNullOrUndefined(attachment.contentLength)
    if (contentMissing) {
      iconImage = absentIcon
    } else if (attachment.mimeType === "application/pdf") {
      iconImage = pdfIcon
    } else if (attachment.mimeType.startsWith("text/")) {
      iconImage = textIcon
    } else if (attachment.mimeType.startsWith("video/")) {
      iconImage = videoIcon
    } else if (attachment.mimeType.startsWith("image/")) {
      iconImage = `/api/attachment/view/${attachment.uuid}`
    }
    return { iconSize, iconImage, contentMissing }
  },

  stripExtension: function (fileName) {
    const index = fileName.lastIndexOf(".")
    return index === -1 ? fileName : fileName.substring(0, index)
  },

  getAscendantObjectsAsMap: function (ascendantObjects) {
    return (
      ascendantObjects?.reduce((acc, val) => {
        acc[val.uuid] = val
        return acc
      }, {}) || {}
    )
  },

  getAscendantObjectsAsList: function (
    leaf,
    ascendantObjects = [],
    parentField
  ) {
    const parentMap = Array.isArray(ascendantObjects)
      ? this.getAscendantObjectsAsMap(ascendantObjects)
      : ascendantObjects
    let uuid = leaf?.uuid
    const trail = []
    const seenUuids = []
    while (uuid) {
      if (seenUuids.includes(uuid)) {
        // Loop detected! Break the loop and log an error…
        parentMap[uuid][parentField] = null
        const msg = `Loop detected for ${uuid}!`
        console.error(msg)
        window.onerror(msg, window.location?.toString(), 0, 0)
        break
      }
      seenUuids.push(uuid)
      const node = parentMap[uuid]
      if (!node) {
        break
      }
      trail.unshift(node)
      uuid = node[parentField]?.uuid
    }
    return trail
  },

  determineApp6field: function (ascendantOrgs, app6field, defaultValue) {
    for (const ascendantOrg of ascendantOrgs) {
      if (ascendantOrg?.[app6field]) {
        return ascendantOrg[app6field]
      }
    }
    return defaultValue
  },

  findPositionAtDate: function (person, date) {
    if (!date) {
      return person.position
    }
    const when = moment(date).valueOf()
    return (person.previousPositions ?? []).find(p => {
      return p.startTime <= when && (!p.endTime || p.endTime > when)
    })?.position
  },

  getButtonsFromChoices: function (choices) {
    return Object.entries(choices).map(([value, label]) => ({
      value,
      label
    }))
  },

  getColorForChoice: function (choice) {
    return Settings.confidentialityLabel.choices[choice]?.color
  },

  getPolicyAndClassificationForChoice: function (choice) {
    let label
    const props = Settings.confidentialityLabel.choices[choice]
    if (props) {
      label = props.policy
      if (props.classification) {
        label = `${label} ${props.classification}`
      }
    }
    return label
  },

  getReleasableToForChoice: function (choice) {
    const props = Settings.confidentialityLabel.choices[choice]
    if (props?.releasableTo) {
      return `Releasable to ${props.releasableTo.join(", ")}`
    }
    return undefined
  },

  getConfidentialityLabelForChoice: function (choice) {
    let label
    const policyAndClassification =
      this.getPolicyAndClassificationForChoice(choice)
    if (policyAndClassification) {
      label = policyAndClassification
      const releasableTo = this.getReleasableToForChoice(choice)
      if (releasableTo) {
        label = `${label} ${releasableTo}`
      }
    }
    return label
  },

  getConfidentialityLabelChoices: function () {
    return Object.entries(Settings.confidentialityLabel.choices).map(
      ([choice, props]) => ({
        value: choice,
        label: this.getConfidentialityLabelForChoice(choice),
        color: props?.color
      })
    )
  }
}

Object.forEach = function (source, func) {
  return Object.keys(source).forEach(key => {
    func(key, source[key])
  })
}

Object.map = function (source, func) {
  return Object.keys(source).map(key => {
    const value = source[key]
    return func(key, value)
  })
}

Object.get = function (source, keypath) {
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

Object.without = function (source, ...keys) {
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
  return this.then(function (data) {
    console.log(data)
    return data
  })
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
