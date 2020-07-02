import "@fullcalendar/core/main.css"
import dayGridPlugin from "@fullcalendar/daygrid"
import "@fullcalendar/daygrid/main.css"
import FullCalendar from "@fullcalendar/react"
import BarChart from "components/BarChart"
import LikertScale from "components/graphs/LikertScale"
import Pie from "components/graphs/Pie"
import Leaflet from "components/Leaflet"
import _escape from "lodash/escape"
import _isEmpty from "lodash/isEmpty"
import _uniqueId from "lodash/uniqueId"
import { Location } from "models"
import { AssessmentPeriodPropType, PeriodPropType } from "periodUtils"
import PropTypes from "prop-types"
import React, { useMemo, useRef, useState } from "react"
import { Button, Collapse, Table } from "react-bootstrap"
import utils from "utils"

const DATE_FORMAT = "YYYY-MM-DD"

const aggregationWidgetPropTypes = {
  values: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.array,
        PropTypes.object
      ])
    )
  ]),
  fieldConfig: PropTypes.object,
  fieldName: PropTypes.string,
  vertical: PropTypes.bool,
  period: PropTypes.oneOfType([AssessmentPeriodPropType, PeriodPropType]),
  whenUnspecified: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

export const PieWidget = ({
  values,
  entitiesCount,
  legend,
  showLegend = true,
  ...otherWidgetProps
}) => {
  return (
    <>
      <Pie
        width={70}
        height={70}
        data={values}
        label={entitiesCount}
        segmentFill={entity => legend[entity.data.key]?.color}
        segmentLabel={d => d.data.value}
      />
      {showLegend && (
        <>
          <br />
          {Object.map(legend, (key, choice) => (
            <React.Fragment key={key}>
              <span style={{ backgroundColor: choice.color }}>
                {choice.label}{" "}
              </span>
            </React.Fragment>
          ))}
        </>
      )}
    </>
  )
}
PieWidget.propTypes = {
  entitiesCount: PropTypes.number,
  legend: PropTypes.object,
  showLegend: PropTypes.bool,
  ...aggregationWidgetPropTypes
}

export const LikertScaleAndPieWidget = ({ values, ...otherWidgetProps }) => {
  const { likertScaleValues, pieValues } = values
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap"
      }}
    >
      <div
        style={{
          flexGrow: "0"
        }}
      >
        <PieWidget {...pieValues} {...otherWidgetProps} showLegend={false} />
      </div>
      {!_isEmpty(likertScaleValues) && (
        <div
          style={{
            flexGrow: "1"
          }}
        >
          <LikertScale
            {...likertScaleValues}
            {...otherWidgetProps}
            whenUnspecified=""
          />
        </div>
      )}
    </div>
  )
}
LikertScaleAndPieWidget.propTypes = aggregationWidgetPropTypes

export const ReportsByTaskWidget = ({ values, ...otherWidgetProps }) => (
  <div className="non-scrollable">
    <BarChart
      chartId={_uniqueId("ReportsByTaskWidget")}
      data={values}
      xProp="task.uuid"
      yProp="reportsCount"
      xLabel="task.shortName"
      tooltip={d => `
      <h4>${d.task.shortName}</h4>
      <p>${d.reportsCount}</p>
    `}
    />
  </div>
)
ReportsByTaskWidget.propTypes = aggregationWidgetPropTypes

export const CalendarWidget = ({
  values,
  fieldConfig,
  fieldName,
  period,
  whenUnspecified,
  hasPrevNext = false,
  ...otherWidgetProps
}) => {
  const calendarComponentRef = useRef(null)
  const events = Object.entries(Object.without(values, null)).map(
    ([key, value]) => {
      return {
        title: `${value} events`,
        start: key,
        end: key
      }
    }
  )
  if (_isEmpty(events)) {
    return whenUnspecified
  }
  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      header={{
        left: hasPrevNext ? "prev,next" : "",
        center: "title",
        right: ""
      }}
      defaultView="dayGridMonth"
      defaultDate={period.start.format(DATE_FORMAT)}
      allDayDefault
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        omitZeroMinute: false,
        hour12: false
      }}
      slotLabelFormat={{
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
        omitZeroMinute: false,
        hour12: false
      }}
      height="auto" // assume a natural height, no scrollbars will be used
      aspectRatio={3} // ratio of width-to-height
      ref={calendarComponentRef}
      events={events}
      eventOverlap
      eventLimit
    />
  )
}
CalendarWidget.propTypes = {
  hasPrevNext: PropTypes.bool,
  ...aggregationWidgetPropTypes
}

export const DefaultAggWidget = ({
  values,
  whenUnspecified,
  ...otherWidgetProps
}) => {
  const [showValues, setShowValues] = useState(false)
  const filteredValues = values.filter(value => !utils.isNullOrUndefined(value))
  if (_isEmpty(filteredValues)) {
    return whenUnspecified
  }
  return (
    <div>
      <Button
        className="toggle-section-button"
        style={{ marginBottom: "1rem" }}
        onClick={toggleShowValues}
        id="toggleShowValues"
      >
        {showValues ? "Hide" : "Show"} {filteredValues.length} values
      </Button>
      <Collapse in={showValues}>
        <Table>
          <tbody>
            {filteredValues.map(val => {
              const keyValue = _uniqueId("value_")
              return (
                <tr key={keyValue}>
                  <td>{val}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Collapse>
    </div>
  )
  function toggleShowValues() {
    setShowValues(!showValues)
  }
}
DefaultAggWidget.propTypes = aggregationWidgetPropTypes

export const ReportsMapWidget = ({
  values,
  mapId,
  width,
  height,
  whenUnspecified,
  ...otherWidgetProps
}) => {
  const markers = useMemo(() => {
    if (!values.length) {
      return []
    }
    const markerArray = []
    values.forEach(report => {
      if (Location.hasCoordinates(report.location)) {
        let label = _escape(report.intent || "<undefined>") // escape HTML in intent!
        label += `<br/>@ <b>${_escape(report.location.name)}</b>` // escape HTML in locationName!
        markerArray.push({
          id: report.uuid,
          lat: report.location.lat,
          lng: report.location.lng,
          name: label
        })
      }
    })
    return markerArray
  }, [values])
  if (_isEmpty(markers)) {
    return whenUnspecified
  }
  return (
    <div className="non-scrollable">
      <Leaflet
        markers={markers}
        width={width}
        height={height}
        mapId={mapId}
        marginBottom={0}
      />
    </div>
  )
}
ReportsMapWidget.propTypes = {
  ...aggregationWidgetPropTypes,
  mapId: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number
}
ReportsMapWidget.defaultProps = {
  values: []
}
