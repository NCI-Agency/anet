import {
  gqlEntityFieldsMap,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import LocationsMapWidget from "components/aggregations/LocationsMapWidget"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import React, { useEffect } from "react"
import { connect } from "react-redux"

const GQL_GET_LOCATION_LIST = gql`
  query ($locationQuery: LocationSearchQueryInput) {
    locationList(query: $locationQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
    }
  }
`

interface LocationMapProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  mapId: string
  width?: number | string
  height?: number | string
  marginBottom?: number | string
}

const LocationMap = ({
  pageDispatchers,
  queryParams,
  setTotalCount,
  mapId = "locations",
  width,
  height,
  marginBottom
}: LocationMapProps) => {
  const locationQuery = { ...queryParams, pageSize: 0 }
  const { loading, error, data } = API.useApiQuery(GQL_GET_LOCATION_LIST, {
    locationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const totalCount = done ? null : data?.locationList?.totalCount
  useEffect(() => {
    setTotalCount?.(totalCount)
  }, [setTotalCount, totalCount])

  if (done) {
    return result
  }

  const locations = data ? data.locationList.list : []
  return (
    <LocationsMapWidget
      values={locations}
      widgetId={mapId}
      width={width}
      height={height}
      marginBottom={marginBottom}
      whenUnspecified={<em>No locations found</em>}
    />
  )
}

export default connect(null, mapPageDispatchersToProps)(LocationMap)
