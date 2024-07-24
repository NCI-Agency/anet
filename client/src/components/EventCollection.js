import { setPagination } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import EventCalendar from "components/EventCalendar"
import EventMap from "components/EventMap"
import EventSummary from "components/EventSummary"
import EventTable from "components/EventTable"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_MAP = "map"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"

const EventCollection = ({
  pageDispatchers,
  paginationKey,
  pagination,
  setPagination,
  viewFormats,
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom
}) => {
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
                  {viewFormats.includes(FORMAT_SUMMARY) && (
                    <Button value={FORMAT_SUMMARY} variant="outline-secondary">
                      Summary
                    </Button>
                  )}
                  {viewFormats.includes(FORMAT_CALENDAR) && (
                    <Button value={FORMAT_CALENDAR} variant="outline-secondary">
                      Calendar
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
          </header>
        )}

        <div>
          {viewFormat === FORMAT_TABLE && (
            <EventTable
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey}
              pagination={pagination}
              setPagination={setPagination}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_SUMMARY && (
            <EventSummary
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey}
              pagination={pagination}
              setPagination={setPagination}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_CALENDAR && (
            <EventCalendar
              pageDispatchers={pageDispatchers}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_MAP && (
            <EventMap
              pageDispatchers={pageDispatchers}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
              mapId={mapId}
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

EventCollection.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  paginationKey: PropTypes.string,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  viewFormats: PropTypes.arrayOf(PropTypes.string),
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  mapId: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

EventCollection.defaultProps = {
  viewFormats: [FORMAT_TABLE, FORMAT_SUMMARY, FORMAT_CALENDAR, FORMAT_MAP]
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

export default connect(mapStateToProps, mapDispatchToProps)(EventCollection)
