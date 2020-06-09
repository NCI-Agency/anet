import { setPagination } from "actions"
import { ASSESSMENT_PERIOD_FACTORIES } from "components/assessments/AssessmentResultsContainer"
import ButtonToggleGroup from "components/ButtonToggleGroup"
import { ASSESSMENTS_RECURRENCE_TYPE } from "components/Model"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps
} from "components/Page"
import ReportCalendar from "components/ReportCalendar"
import ReportMap from "components/ReportMap"
import ReportStatistics from "components/ReportStatistics"
import ReportSummary from "components/ReportSummary"
import ReportTable from "components/ReportTable"
import moment from "moment"
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
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1 || reportsFilter
  const statisticsRecurrence = [ASSESSMENTS_RECURRENCE_TYPE.MONTHLY]
  const now = moment()

  return (
    <div className="report-collection">
      <div>
        {showHeader && (
          <header>
            {viewFormats.length > 1 && (
              <ButtonToggleGroup
                value={viewFormat}
                onChange={setViewFormat}
                className="hide-for-print"
              >
                {viewFormats.includes(FORMAT_TABLE) && (
                  <Button value={FORMAT_TABLE}>Table</Button>
                )}
                {viewFormats.includes(FORMAT_SUMMARY) && (
                  <Button value={FORMAT_SUMMARY}>Summary</Button>
                )}
                {viewFormats.includes(FORMAT_CALENDAR) && (
                  <Button value={FORMAT_CALENDAR}>Calendar</Button>
                )}
                {viewFormats.includes(FORMAT_MAP) && (
                  <Button value={FORMAT_MAP}>Map</Button>
                )}
                {viewFormats.includes(FORMAT_STATISTICS) && (
                  <Button value={FORMAT_STATISTICS}>Statistics</Button>
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
              showAuthors
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
          {viewFormat === FORMAT_STATISTICS && statisticsRecurrence.length && (
            <>
              {statisticsRecurrence.map(recurrence => (
                <ReportStatistics
                  key={`report-statistics-${recurrence}`}
                  pageDispatchers={pageDispatchers}
                  queryParams={queryParams}
                  setTotalCount={setTotalCount}
                  periodsConfig={{
                    recurrence: recurrence,
                    periods: [
                      {
                        // Second Most recent completed period
                        ...ASSESSMENT_PERIOD_FACTORIES[recurrence](now, 2)
                      },
                      {
                        // Most recent completed period
                        ...ASSESSMENT_PERIOD_FACTORIES[recurrence](now, 1)
                      },
                      {
                        // Ongoing period
                        ...ASSESSMENT_PERIOD_FACTORIES[recurrence](now, 0)
                      }
                    ]
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
    FORMAT_STATISTICS,
    FORMAT_SUMMARY,
    FORMAT_TABLE,
    FORMAT_CALENDAR,
    FORMAT_MAP
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
