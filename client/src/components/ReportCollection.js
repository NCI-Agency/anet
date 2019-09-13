import ButtonToggleGroup from "components/ButtonToggleGroup"
import ReportCalendar from "components/ReportCalendar"
import ReportMap from "components/ReportMap"
import ReportSummary from "components/ReportSummary"
import ReportTable from "components/ReportTable"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button } from "react-bootstrap"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"
export const FORMAT_MAP = "map"

const ReportCollection = props => {
  const {
    paginationKey,
    viewFormats,
    reportsFilter,
    queryParams,
    setTotalCount,
    mapId,
    width,
    height,
    marginBottom
  } = props
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1 || reportsFilter

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
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_TABLE && (
            <ReportTable
              showAuthors
              paginationKey={paginationKey}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_SUMMARY && (
            <ReportSummary
              paginationKey={paginationKey}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
            />
          )}
          {viewFormat === FORMAT_MAP && (
            <ReportMap
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

ReportCollection.propTypes = {
  paginationKey: PropTypes.string,
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
  viewFormats: [FORMAT_SUMMARY, FORMAT_TABLE, FORMAT_CALENDAR, FORMAT_MAP]
}

export default ReportCollection
