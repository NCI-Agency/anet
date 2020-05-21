import "@fullcalendar/core/main.css"
import dayGridPlugin from "@fullcalendar/daygrid"
import "@fullcalendar/daygrid/main.css"
import FullCalendar from "@fullcalendar/react"
import BarChart from "components/BarChart"
import LikertScale from "components/graphs/LikertScale"
import Pie from "components/graphs/Pie"
import _uniqueId from "lodash/uniqueId"
import PropTypes from "prop-types"
import React, { useRef } from "react"

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
  vertical: PropTypes.bool
}

export const PieWidget = ({
  values,
  legend,
  showLegend,
  ...otherWidgetProps
}) => {
  return (
    <>
      <Pie
        width={70}
        height={70}
        data={values}
        label={Object.values(values).reduce((acc, cur) => acc + cur, 0)}
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
        <PieWidget {...pieValues} {...otherWidgetProps} />
      </div>
      <div
        style={{
          flexGrow: "1"
        }}
      >
        <LikertScale {...likertScaleValues} {...otherWidgetProps} />
      </div>
    </div>
  )
}
LikertScaleAndPieWidget.propTypes = aggregationWidgetPropTypes

export const ReportsByTaskWidget = ({ values, ...otherWidgetProps }) => {
  return (
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
}
ReportsByTaskWidget.propTypes = aggregationWidgetPropTypes

export const CalendarWidget = ({
  values,
  fieldConfig,
  fieldName,
  ...otherWidgetProps
}) => {
  const calendarComponentRef = useRef(null)
  const events = Object.entries(values).map(([key, value]) => {
    return {
      title: `${value} events`,
      start: key,
      end: key
    }
  })

  return (
    <FullCalendar
      plugins={[dayGridPlugin]}
      header={{
        left: "prev,next",
        center: "title",
        right: ""
      }}
      defaultView="dayGridMonth"
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
CalendarWidget.propTypes = aggregationWidgetPropTypes

export const DefaultAggWidget = ({ values, ...otherWidgetProps }) => (
  <div>{`[${values}]`}</div>
)
DefaultAggWidget.propTypes = aggregationWidgetPropTypes
