import got from 'got'

const API = {
	_fetch(pathName, params, accept) {
		// TODO implement
	},

	_send(url, data, params) {
		// TODO implement
	},

	_queryCommon(query, variables, variableDef, output, isMutation, params) {
		variables = variables || {}
		variableDef = variableDef || ''
		const queryType = isMutation ? 'mutation' : 'query'
		query = queryType + ' ' + variableDef + ' { ' + query + ' }'
		output = output || ''
		return API._send('/graphql', {query, variables, output}, params)
	},

	mutation(query, variables, variableDef, params) {
		return API._queryCommon(query, variables, variableDef, undefined, true, params).then(json => json.data)
	},

	query(query, variables, variableDef, params) {
		return API._queryCommon(query, variables, variableDef, undefined, undefined, params).then(json => json.data)
	},

	queryExport(query, variables, variableDef, output) {
		return API._queryCommon(query, variables, variableDef, output).then(response => response.blob())
	},

	_getAuthParams: function() {
		// TODO implement
		return {
			user: "arthur",
			pass: ""
		}
	},

	addAuthParams: function(url) {
		// TODO implement
	},

	_getAuthHeader: function() {
		// TODO implement
	}
}

export default API
