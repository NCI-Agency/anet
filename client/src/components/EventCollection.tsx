import ButtonToggleGroup from "components/ButtonToggleGroup"
import EventCalendar from "components/EventCalendar"
import EventMap from "components/EventMap"
import EventSummary from "components/EventSummary"
import EventTable from "components/EventTable"
import React, { useState } from "react"
import { Button } from "react-bootstrap"

export const FORMAT_CALENDAR = "calendar"
export const FORMAT_MAP = "map"
export const FORMAT_SUMMARY = "summary"
export const FORMAT_TABLE = "table"

interface EventCollectionProps {
  viewFormats?: string[]
  queryParams?: any
  mapId?: string
  width?: number | string
  height?: number | string
  marginBottom?: number | string
  showEventSeries?: boolean
}

const EventCollection = ({
  viewFormats = [FORMAT_TABLE, FORMAT_SUMMARY, FORMAT_CALENDAR, FORMAT_MAP],
  queryParams,
  mapId,
  width,
  height,
  marginBottom,
  showEventSeries
}: EventCollectionProps) => {
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
              queryParams={queryParams}
              showEventSeries={showEventSeries}
            />
          )}
          {viewFormat === FORMAT_SUMMARY && (
            <EventSummary
              queryParams={queryParams}
              showEventSeries={showEventSeries}
            />
          )}
          {viewFormat === FORMAT_CALENDAR && (
            <EventCalendar queryParams={queryParams} />
          )}
          {viewFormat === FORMAT_MAP && (
            <EventMap
              queryParams={queryParams}
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

export default EventCollection
