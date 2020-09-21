import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"

export const DateHeader = ({ viewDate, setViewDate, dateScale, format }) => {
  return (
    <header
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "10px auto"
      }}
    >
      <h2>{viewDate.format(format)}</h2>
      <div>
        <Button
          onClick={() => setViewDate(date => moment(date).add(-1, dateScale))}
        >
          Prev
        </Button>
        <Button onClick={() => setViewDate(moment())}>Today</Button>
        <Button
          onClick={() => setViewDate(date => moment(date).add(1, dateScale))}
        >
          Next
        </Button>
      </div>
    </header>
  )
}

DateHeader.propTypes = {
  viewDate: PropTypes.object,
  setViewDate: PropTypes.func,
  dateScale: PropTypes.string,
  format: PropTypes.string
}

export const YearHeader = ({ viewState, setViewState }) => {
  return (
    <DateHeader
      viewDate={viewState}
      setViewDate={setViewState}
      dateScale="years"
      format="YYYY"
    />
  )
}

YearHeader.propTypes = {
  viewState: PropTypes.object,
  setViewState: PropTypes.func
}

export const MonthHeader = ({ viewState, setViewState }) => {
  return (
    <DateHeader
      viewDate={viewState}
      setViewDate={setViewState}
      dateScale="months"
      format="MMMM-YYYY"
    />
  )
}

MonthHeader.propTypes = {
  viewState: PropTypes.object,
  setViewState: PropTypes.func
}

// FIXME: fix when geolayout ready
export const GeoHeader = ({
  viewState: viewLocation,
  setViewState: setViewLocation
}) => {
  console.log(setViewLocation)

  return (
    <header>
      <h2>{viewLocation}</h2>
    </header>
  )
}

GeoHeader.propTypes = {
  viewState: PropTypes.object,
  setViewState: PropTypes.func
}
