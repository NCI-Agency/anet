import { setPagination } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import LocationMap from "components/LocationMap"
import LocationTable from "components/LocationTable"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"

interface LocationCollectionProps {
  pageDispatchers?: PageDispatchersPropType
  paginationKey?: string
  pagination?: any
  setPagination?: (...args: unknown[]) => unknown
  viewFormats?: string[]
  locationsFilter?: React.ReactNode
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
  mapId?: string
  width?: number | string
  height?: number | string
  marginBottom?: number | string
}

const LocationCollection = ({
  pageDispatchers,
  paginationKey,
  pagination,
  setPagination,
  viewFormats = [FORMAT_TABLE, FORMAT_MAP],
  locationsFilter,
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom
}: LocationCollectionProps) => {
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1 || locationsFilter

  return (
    <div className="location-collection">
      <div>
        {showHeader && (
          <header>
            {viewFormats.length > 1 && (
              <>
                <ButtonToggleGroup
                  value={viewFormat}
                  onChange={setViewFormat}
                  className="d-print-none"
                >
                  {viewFormats.includes(FORMAT_TABLE) && (
                    <Button value={FORMAT_TABLE} variant="outline-secondary">
                      Table
                    </Button>
                  )}
                  {viewFormats.includes(FORMAT_MAP) && (
                    <Button value={FORMAT_MAP} variant="outline-secondary">
                      Map
                    </Button>
                  )}
                </ButtonToggleGroup>
              </>
            )}
            {locationsFilter && (
              <div className="locations-filter">Filter: {locationsFilter}</div>
            )}
          </header>
        )}

        <div>
          {viewFormat === FORMAT_TABLE && (
            <LocationTable
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey || null}
              pagination={paginationKey ? pagination : null}
              setPagination={paginationKey ? setPagination : null}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_MAP && (
            <LocationMap
              pageDispatchers={pageDispatchers}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
              mapId={mapId || "locations"}
              width={width}
              height={height}
              marginBottom={marginBottom}
            />
          )}
        </div>
      </div>
    </div>
  )
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const pageDispatchers = mapPageDispatchersToProps(dispatch, ownProps)
  return {
    setPagination: (pageKey: string, pageNum: number) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(mapStateToProps, mapDispatchToProps)(LocationCollection)
