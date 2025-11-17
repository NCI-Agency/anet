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
import {
  ATTENDEE_TYPE_ADVISOR,
  ATTENDEE_TYPE_INTERLOCUTOR
} from "components/ReportCalendar"
import pluralize from "pluralize"
import React, { useState } from "react"
import { Button } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_MAP = "map"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"

interface EventCollectionProps {
  pageDispatchers?: PageDispatchersPropType
  paginationKey?: string
  pagination?: any
  setPagination?: (pageKey: string, pageNum: number) => void
  viewFormats?: string[]
  queryParams?: any
  setTotalCount?: (n: number) => void
  mapId?: string
  width?: number | string
  height?: number | string
  marginBottom?: number | string
  showEventSeries?: boolean
}

const EventCollection = ({
  pageDispatchers,
  paginationKey,
  pagination,
  setPagination,
  viewFormats = [FORMAT_TABLE, FORMAT_CALENDAR, FORMAT_MAP],
  queryParams,
  setTotalCount,
  mapId,
  width,
  height,
  marginBottom,
  showEventSeries
}: EventCollectionProps) => {
  const [viewFormat, setViewFormat] = useState(viewFormats[0])
  const showHeader = viewFormats.length > 1
  const [calendarAttendeeType, setCalendarAttendeeType] = useState(
    Settings.calendarOptions.attendeesType
  )
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
                {viewFormat === FORMAT_CALENDAR && (
                  <ButtonToggleGroup
                    value={calendarAttendeeType}
                    onChange={setCalendarAttendeeType}
                    className="float-end"
                  >
                    <Button
                      value={ATTENDEE_TYPE_ADVISOR}
                      variant="outline-secondary"
                    >
                      {pluralize(Settings.fields.advisor.person.name)}
                    </Button>
                    <Button
                      value={ATTENDEE_TYPE_INTERLOCUTOR}
                      variant="outline-secondary"
                    >
                      {pluralize(Settings.fields.interlocutor.person.name)}
                    </Button>
                  </ButtonToggleGroup>
                )}
              </>
            )}
          </header>
        )}

        <div>
          {viewFormat === FORMAT_TABLE && (
            <EventTable
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey || null}
              pagination={paginationKey ? pagination : null}
              setPagination={paginationKey ? setPagination : null}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
              showEventSeries={showEventSeries}
            />
          )}
          {viewFormat === FORMAT_SUMMARY && (
            <EventSummary
              pageDispatchers={pageDispatchers}
              paginationKey={paginationKey || null}
              pagination={paginationKey ? pagination : null}
              setPagination={paginationKey ? setPagination : null}
              queryParams={queryParams}
              setTotalCount={setTotalCount}
              showEventSeries={showEventSeries}
            />
          )}
          {viewFormat === FORMAT_CALENDAR && (
            <EventCalendar
              pageDispatchers={pageDispatchers}
              queryParams={pagination ? queryParams : null}
              setTotalCount={setTotalCount}
              attendeeType={calendarAttendeeType}
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

export default connect(mapStateToProps, mapDispatchToProps)(EventCollection)
