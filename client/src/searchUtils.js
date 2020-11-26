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
