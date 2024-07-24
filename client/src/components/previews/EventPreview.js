import API from "api"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { Event } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"

const EventPreview = ({ className, uuid }) => {
  const { data, error } = API.useApiQuery(Event.getEventQuery, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const event = new Event(data.event)

  const eventTitle = event.name || `#${event.uuid}`
  return (
    <div className={`report-preview preview-content-scroll ${className || ""}`}>
      <h4 className="ellipsized-text">Event {eventTitle}</h4>
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.event.type}
          extraColForValue
          value={Event.humanNameOfType(event.type)}
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.event.startDate}
          extraColForValue
          value={moment(event.engagementDate).format(
            Event.getEventDateFormat()
          )}
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.event.endDate}
          extraColForValue
          value={moment(event.engagementDate).format(
            Event.getEventDateFormat()
          )}
        />

        <PreviewField
          extraColForValue
          label={Settings.fields.event.hostOrg.label}
          value={<LinkTo modelType="Organization" model={event.hostOrg} />}
        />

        <PreviewField
          extraColForValue
          label={Settings.fields.event.adminOrg.label}
          value={<LinkTo modelType="Organization" model={event.adminOrg} />}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.event.location}
          extraColForValue
          value={
            event.location && (
              <LinkTo modelType="Location" model={event.location} />
            )
          }
        />
      </div>
    </div>
  )
}

EventPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default EventPreview
