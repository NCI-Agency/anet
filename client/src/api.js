import querystring from 'querystring'

const query = querystring.parse(window.location.search.slice(1))

const API = {
	fetch(pathName, params) {
		params = params || {}
		params.credentials = 'same-origin'

		params.headers = params.headers || {}
		params.headers.Accept = 'application/json'

		if (process.env.NODE_ENV === 'development' && query.user && query.pass) {
			params.headers.Authorization = 'Basic ' + new Buffer(`${query.user}:${query.pass}`).toString('base64')
		}

		let promise = window.fetch(pathName, params)
					.then(response => {
						let isOk = response.ok

						if (API.inProgress === promise) {
							API.inProgress = null
						}

						if (response.headers.get('content-type') === 'application/json') {
							let respBody = response.json()
							if (!isOk) {
								return respBody.then(r => {
									r.status = response.status
									r.statusText = response.statusText
									if (!r.message) { r.message = r.error || 'You do not have permissions to perform this action' }
									return Promise.reject(r)
								})
							}
							return respBody
						}

						if (!isOk) {
							if (response.status === 500) {
								response.message = 'An Error occured! Please contact the administrator and let them know what you were doing to get this error'
							}
							response = Promise.reject(response)
						}

						return response
					})

		API.inProgress = promise
		return promise
	},

	send(url, data, params) {
		params = params || {}
		params.disableSubmits = typeof params.disableSubmits === 'undefined' ? true : params.disableSubmits
		params.method = params.method || 'POST'
		params.body = JSON.stringify(data)

		params.headers = params.headers || {}
		params.headers['Content-Type'] = 'application/json'

		let promise = API.fetch(url, params)
		let buttons = document.querySelectorAll('[type=submit]')
		let toggleButtons =  function(onOff) {
			for (let button of buttons) {
				button.disabled = !onOff
			}
		}

		if (params.disableSubmits) {
			toggleButtons(false)

			promise.then(response => {
				toggleButtons(true)
				return response
			}, response => {
				toggleButtons(true)
				return response
			})
		}

		return promise
	},

	_queryCommon(query, variables, variableDef, output) {
		variables = variables || {}
		variableDef = variableDef || ''
		query = 'query ' + variableDef + ' { ' + query + ' }'
		output = output || ''
		return API.send('/graphql', {query, variables, output})
	},

	query(query, variables, variableDef) {
		return API._queryCommon(query, variables, variableDef).then(json => json.data)
	},

	queryExport(query, variables, variableDef, output) {
		return API._queryCommon(query, variables, variableDef, output).then(response => response.blob())
	},
}

export default API
