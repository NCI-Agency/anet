import React from 'react'

import ReportCollection from 'components/ReportCollection'
import searchFilters from 'components/SearchFilters'

export const SEARCH_CONFIG = {
	reports : {
		listName : 'reports: reportList',
		dataKey: 'reports',
		sortBy: 'ENGAGEMENT_DATE',
		sortOrder: 'DESC',
		variableType: 'ReportSearchQueryInput',
		fields : ReportCollection.GQL_REPORT_FIELDS
	},
	people : {
		listName : 'people: personList',
		dataKey: 'people',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PersonSearchQueryInput',
		fields: 'uuid, name, rank, emailAddress, role , position { uuid, name, code, location { uuid, name }, organization { uuid, shortName} }'
	},
	positions : {
		listName: 'positions: positionList',
		dataKey: 'positions',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'PositionSearchQueryInput',
		fields: 'uuid , name, code, type, status, location { uuid, name }, organization { uuid, shortName}, person { uuid, name, rank }'
	},
	tasks : {
		listName: 'tasks: taskList',
		dataKey: 'tasks',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'TaskSearchQueryInput',
		fields: 'uuid, shortName, longName'
	},
	locations : {
		listName: 'locations: locationList',
		dataKey: 'locations',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'LocationSearchQueryInput',
		fields: 'uuid, name, lat, lng'
	},
	organizations : {
		listName: 'organizations: organizationList',
		dataKey: 'organizations',
		sortBy: 'NAME',
		sortOrder: 'ASC',
		variableType: 'OrganizationSearchQueryInput',
		fields: 'uuid, shortName, longName, identificationCode, type'
	}
}

export function deserializeQueryParams(objType, queryParams, callbackFunction) {
	var text = queryParams.text || ""
	var usedFilters = []
	var promises = []
	if (objType) {
		const EXTRA_FILTERS = searchFilters.extraFilters()
		const extraFilterDefs = EXTRA_FILTERS[objType] || []
		extraFilterDefs.map(filterKey => {
			if (queryParams.hasOwnProperty(filterKey)) {
				usedFilters.push({key: filterKey, value: queryParams[filterKey]})
			}
			return null
		})
		const ALL_FILTERS = searchFilters.searchFilters()
		const filterDefs = ALL_FILTERS[objType].filters
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
	}
	Promise.all(promises).then(dataList => {
		dataList.forEach( (filterData, index) => {
			// update filters
			usedFilters.push(filterData)
		})
		callbackFunction(objType, usedFilters, text)
	})
}

export function searchFormToQuery(searchFormQuery) {
	let query = {text: searchFormQuery.text}
	if (searchFormQuery.filters) {
		searchFormQuery.filters.forEach(filter => {
			if (filter.value) {
				if (filter.value.toQuery) {
					const toQuery = typeof filter.value.toQuery === 'function'
						? filter.value.toQuery()
						: filter.value.toQuery
					Object.assign(query, toQuery)
				} else {
					query[filter.key] = filter.value
				}
			}
		})
	}
	return query
}
