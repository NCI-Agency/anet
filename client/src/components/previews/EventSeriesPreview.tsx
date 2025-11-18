import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { PreviewTitle } from "components/previews/PreviewTitle"
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
      <PreviewTitle
        title={`Event Series ${eventSeriesTitle}`}
        status={eventSeries.status}
      />
      <div className="preview-section">
        <div className="text-center">
          <EntityAvatarDisplay
            avatar={eventSeries.entityAvatar}
            defaultAvatar={EventSeries.relatedObjectType}
          />
        </div>

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.eventSeries.ownerOrg}
          value={
            <LinkTo modelType="Organization" model={eventSeries.ownerOrg} />
          }
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.eventSeries.hostOrg}
          value={
            <LinkTo modelType="Organization" model={eventSeries.hostOrg} />
          }
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.eventSeries.adminOrg}
          value={
            <LinkTo modelType="Organization" model={eventSeries.adminOrg} />
          }
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.eventSeries.status}
          value={EventSeries.humanNameOfStatus(eventSeries.status)}
        />
      </div>
    </div>
  )
}

export default EventSeriesPreview
