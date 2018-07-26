import React from 'react'

import searchFilters from 'components/SearchFilters'

export function deserializeQueryParams(objType, queryParams, callbackFunction) {
	const ALL_FILTERS = searchFilters.searchFilters()
	const filterDefs = ALL_FILTERS[objType].filters
	var text = queryParams.text || ""
	var usedFilters = []
	var promises = []
	Object.keys(filterDefs).map(filterKey => {
		const fd = filterDefs[filterKey]
		const inst = new fd.component(fd.props || {})
		const deser = inst.deserialize(queryParams, filterKey)
		if (deser && deser.then instanceof Function) {
			// deserialize returns a Promise
			promises.push(deser)
		}
		else if (deser) {
			// deserialize returns filter data
			usedFilters.push(deser)
		}
		return null
	})
	Promise.all(promises).then(dataList => {
		dataList.forEach( (filterData, index) => {
			// update filters
			usedFilters.push(filterData)
		})
		callbackFunction(objType, usedFilters, text)
	})
}
