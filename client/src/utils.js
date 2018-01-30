import React from 'react'
import * as changeCase from 'change-case'
import pluralize from 'pluralize'

import Settings from 'Settings'

const WILDCARD = '*'

export default {
	...changeCase,
	pluralize,
	resourceize: function(string) {
		return pluralize(changeCase.camel(string))
	},
	createUrlParams: function (obj) {
		let str = ''
		Object.forEach(obj, (key, val) => {
			if (str !== '') {
				str += '&'
			}
			str += key + '=' + encodeURIComponent(val)
		})
		return str
	},

	handleEmailValidation: function(value, shouldValidate) {
		const domainNames = Settings.domainNames.map(d => d.toLowerCase())
		if (!shouldValidate || domainNames.length === 0) {
			return { isValid: null, message: 'No custom validator is set' }
		}

		let wildcardDomains = this.getWildcardDomains(domainNames, WILDCARD)
		try {
			let isValid = this.validateEmail(value, domainNames, wildcardDomains)
			return { isValid: isValid, message: this.emailErrorMessage(domainNames) }
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
		const items = validDomainNames.map(name => [
			<li>{name}</li>
		])
		return (
			<div>
				<p>{errorMessage}</p>
				<ul>{items}</ul>
			</div>
		)
	}
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
