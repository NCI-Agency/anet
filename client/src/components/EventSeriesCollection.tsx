import { setPagination } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import EventSeriesTable from "components/EventSeriesTable"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

export const FORMAT_TABLE = "table"

interface EventSeriesCollectionProps {
  pageDispatchers?: PageDispatchersPropType
  paginationKey?: string
  pagination: any
  setPagination: (...args: unknown[]) => unknown
  viewFormats?: string[]
  queryParams?: any
  setTotalCount?: (...args: unknown[]) => unknown
}

const EventSeriesCollection = ({
  pageDispatchers,
  paginationKey,
  pagination,
  setPagination,
  viewFormats = [FORMAT_TABLE],
  queryParams,
  setTotalCount
}: EventSeriesCollectionProps) => {
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1
  return (
    <div className="event-collection">
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
                </ButtonToggleGroup>
              </>
            )}
          </header>
        )}

        <div>
          {viewFormat === FORMAT_TABLE && (
            <EventSeriesTable
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey}
              pagination={pagination}
              setPagination={setPagination}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
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
    setPagination: (pageKey, pageNum) =>
      dispatch(setPagination(pageKey, pageNum)),
    ...pageDispatchers
  }
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(EventSeriesCollection)
