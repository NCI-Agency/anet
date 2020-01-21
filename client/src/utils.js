import { Icon } from "@blueprintjs/core"
import { IconSvgPaths16, IconSvgPaths20 } from "@blueprintjs/icons"
import { Settings } from "api"
import * as changeCase from "change-case"
import parseAddressList from "email-addresses"
import _isEmpty from "lodash/isEmpty"
import pluralize from "pluralize"
import decodeQuery from "querystring/decode"
import encodeQuery from "querystring/encode"
import React from "react"

const WILDCARD = "*"
const domainNames = Settings.domainNames.map(d => d.toLowerCase())
const wildcardDomains = domainNames.filter(domain => domain[0] === WILDCARD)

// Support null input like change-case v3 did…
const wrappedChangeCase = {}
Object.keys(changeCase)
  .filter(c => c.endsWith("Case"))
  .forEach(c => {
    wrappedChangeCase[c] = (input, options) =>
      !input ? "" : changeCase[c](input, options)
  })

export default {
  ...wrappedChangeCase,
  pluralize,
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
    const email = emailValue.split("@")
    if (email.length < 2 || email[1].length === 0) {
      throw new Error("Please provide a valid email address")
    }
    const from = email[0].trim()
    const domain = email[1].toLowerCase()
    return (
      this.validateWithWhitelist(from, domain, domainNames) ||
      this.validateWithWildcard(domain, wildcardDomains)
    )
  },

  validateWithWhitelist: function(from, domain, whitelist) {
    return from.length > 0 && whitelist.includes(domain)
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
    if (source === undefined || source === null) return source
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
Promise.prototype.log = function() {
  return this.then(function(data) {
    console.log(data)
    return data
  })
}

export const renderBlueprintIconAsSvg = (iconName, iconSize: Icon.SIZE_STANDARD) => {
  // choose which pixel grid is most appropriate for given icon size
  const pixelGridSize =
    iconSize >= Icon.SIZE_LARGE ? Icon.SIZE_LARGE : Icon.SIZE_STANDARD
  const viewBox = `0 0 ${pixelGridSize} ${pixelGridSize}`
  const svgPathsRecord =
    pixelGridSize === Icon.SIZE_STANDARD ? IconSvgPaths16 : IconSvgPaths20
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
