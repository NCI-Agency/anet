import searchFilters from "components/SearchFilters"

export const deserializeQueryParams = (
  objType,
  queryParams,
  callbackFunction
) => {
  // From query params to search filters
  const text = queryParams.text || ""
  const usedFilters = []
  const promises = []
  if (objType) {
    const EXTRA_FILTERS = searchFilters.extraFilters()
    const extraFilterDefs = EXTRA_FILTERS[objType] || []
    extraFilterDefs.map(filterKey => {
      if (Object.prototype.hasOwnProperty.call(queryParams, filterKey)) {
        usedFilters.push({ key: filterKey, value: queryParams[filterKey] })
      }
      return null
    })
    const ALL_FILTERS = searchFilters.searchFilters()
    const filterDefs = ALL_FILTERS[objType].filters
    Object.keys(filterDefs).map(filterKey => {
      const filterDef = filterDefs[filterKey]
      const deser = filterDef.deserializer(
        filterDef.props,
        queryParams,
        filterKey
      )
      if (deser && deser.then instanceof Function) {
        // deserialize returns a Promise
        promises.push(deser)
      } else if (deser) {
        // deserialize returns filter data
        usedFilters.push(deser)
      }
      return null
    })
  }
  Promise.all(promises).then(dataList => {
    dataList.forEach((filterData, index) => {
      // update filters
      usedFilters.push(filterData)
    })
    callbackFunction(objType, usedFilters, text)
  })
}

export const deserializeSearchFilter = (queryKey, query, key) => {
  // general deserialization from query to a search filter
  if (query[queryKey]) {
    const toQueryValue = { [queryKey]: query[queryKey] }
    return {
      key: key,
      value: {
        value: query[queryKey],
        toQuery: toQueryValue
      }
    }
  }
  return null
}
