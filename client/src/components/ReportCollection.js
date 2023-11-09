import { setPagination } from "actions"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType
} from "components/Page"
import ReportCalendar from "components/ReportCalendar"
import ReportMap from "components/ReportMap"
import ReportStatistics from "components/ReportStatistics"
import ReportSummary from "components/ReportSummary"
import ReportTable from "components/ReportTable"
import { RECURRENCE_TYPE, useResponsiveNumberOfPeriods } from "periodUtils"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"
export const FORMAT_STATISTICS = "statistics"

const ReportCollection = ({
  pageDispatchers,
  paginationKey,
  pagination,
  setPagination,
  viewFormats,
  reportsFilter,
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom
}) => {
  const [numberOfPeriods, setNumberOfPeriods] = useState(3)
  const contRef = useResponsiveNumberOfPeriods(setNumberOfPeriods)
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1 || reportsFilter
  const statisticsRecurrence = [RECURRENCE_TYPE.MONTHLY]
  const idSuffix = mapId || paginationKey || "reports"
  return (
    <div className="report-collection" ref={contRef}>
      <div>
        {showHeader && (
          <header>
            {viewFormats.length > 1 && (
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
                {viewFormats.includes(FORMAT_STATISTICS) && (
                  <Button value={FORMAT_STATISTICS} variant="outline-secondary">
                    Statistics
                  </Button>
                )}
              </ButtonToggleGroup>
            )}

            {reportsFilter && (
              <div className="reports-filter">Filter: {reportsFilter}</div>
            )}
          </header>
        )}

        <div>
          {viewFormat === FORMAT_CALENDAR && (
            <ReportCalendar
              pageDispatchers={pageDispatchers}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_TABLE && (
            <ReportTable
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey}
              pagination={pagination}
              setPagination={setPagination}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_SUMMARY && (
            <ReportSummary
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey}
              pagination={pagination}
              setPagination={setPagination}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_MAP && (
            <ReportMap
              pageDispatchers={pageDispatchers}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
              mapId={mapId}
              width={width}
              height={height}
              marginBottom={marginBottom}
            />
          )}
          {viewFormat === FORMAT_STATISTICS && (
            <>
              {statisticsRecurrence.map(recurrence => (
                <ReportStatistics
                  key={`report-statistics-${recurrence}`}
                  idSuffix={idSuffix}
                  pageDispatchers={pageDispatchers}
                  queryParams={queryParams}
                  setTotalCount={setTotalCount}
                  periodsDetails={{
                    recurrence,
                    numberOfPeriods
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

ReportCollection.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  paginationKey: PropTypes.string,
  pagination: PropTypes.object.isRequired,
  setPagination: PropTypes.func.isRequired,
  viewFormats: PropTypes.arrayOf(PropTypes.string),
  reportsFilter: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  queryParams: PropTypes.object,
  setTotalCount: PropTypes.func,
  mapId: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  marginBottom: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
}

ReportCollection.defaultProps = {
  viewFormats: [
    FORMAT_SUMMARY,
    FORMAT_TABLE,
    FORMAT_CALENDAR,
    FORMAT_MAP,
    FORMAT_STATISTICS
  ]
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

export default connect(mapStateToProps, mapDispatchToProps)(ReportCollection)
