import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { EventSeries } from "models"
import React from "react"
import Settings from "settings"

interface EventSeriesPreviewProps {
  className?: string
  uuid?: string
}

const EventSeriesPreview = ({ className, uuid }: EventSeriesPreviewProps) => {
  const { data, error } = API.useApiQuery(EventSeries.getEventSeriesQuery, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const eventSeries = new EventSeries(data.eventSeries)

  const eventSeriesTitle = eventSeries.name || `#${eventSeries.uuid}`
  return (
    <div className={`report-preview preview-content-scroll ${className || ""}`}>
      <h4 className="ellipsized-text">Event Series {eventSeriesTitle}</h4>
      <div className="preview-section">
        <PreviewField
          extraColForValue
          label={Settings.fields.eventSeries.hostOrg.label}
          value={
            <LinkTo modelType="Organization" model={eventSeries.hostOrg} />
          }
        />
        <PreviewField
          extraColForValue
          label={Settings.fields.eventSeries.adminOrg.label}
          value={
            <LinkTo modelType="Organization" model={eventSeries.adminOrg} />
          }
        />
      </div>
    </div>
  )
}

export default EventSeriesPreview
