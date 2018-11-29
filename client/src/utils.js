import React from 'react'
import * as changeCase from 'change-case'
import parseAddressList from 'email-addresses'
import pluralize from 'pluralize'
import decodeQuery from 'querystring/decode'
import encodeQuery from 'querystring/encode'

import Settings from 'Settings'

const WILDCARD = '*'

export default {
	...changeCase,
	pluralize,
	resourceize: function(string) {
		return pluralize(changeCase.camel(string))
	},

	handleEmailValidation: function(value, props) {
		if(!props.validate) return
		const domainNames = Settings.domainNames.map(d => d.toLowerCase())

		let wildcardDomains = this.getWildcardDomains(domainNames, WILDCARD)
		try {
			const error = !this.validateEmail(value, domainNames, wildcardDomains)
			if(error)
				return this.emailErrorMessage(domainNames)
		}
		catch (e) {
			return { isValid: false, message: (<div>{e.message}</div>) }
		}
	},

	validateEmail: function(emailValue, domainNames, wildcardDomains) {
		let email = emailValue.split('@')
		if (email.length < 2 || email[1].length === 0) {
			throw new Error('Please provide a valid email address')
		}
		let from =  email[0].trim()
		let domain = email[1].toLowerCase()
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
				return domain[0] !== '.' && domain.endsWith(wildcard.substr(1))
			})
		}
		return isValid
	},

	getWildcardDomains: function(domainList, token) {
		let wildcardDomains = domainList.filter(domain => {
			return domain[0] === token
		})
		return wildcardDomains
	},

	emailErrorMessage: function(validDomainNames) {
		const supportEmail = Settings.SUPPORT_EMAIL_ADDR
		const emailMessage = supportEmail ? ` at ${supportEmail}`: ''
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
			return { isValid: false, message: (<div>Please provide one or more valid email addresses</div>) }
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
			return ''
		}
		return '?' + encodeQuery(queryParams)
	},

	treatFunctionsAsEqual: function(value1, value2) {
		if (typeof value1 === 'function' && typeof value2 === 'function') {
			return true
		}
	},

	getReference: function(obj) {
		return (obj && obj.uuid) ? {uuid: obj.uuid} : {}
	},
}

Object.forEach = function(source, func) {
	return Object.keys(source).forEach(key => {
		func(key, source[key])
	})
}

Object.map = function(source, func) {
	return Object.keys(source).map(key => {
		let value = source[key]
		return func(key, value)
	})
}

Object.get = function(source, keypath) {
	const keys = keypath.split('.')
	while (keys[0]) {
		let key = keys.shift()
		source = source[key]
		if (typeof source === 'undefined' || source === null)
			return source
	}
	return source
}

Object.without = function(source, ...keys) {
	let copy = Object.assign({}, source)
	let i = keys.length
	while (i--) {
		let key = keys[i]
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
