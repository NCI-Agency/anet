import API from "api"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { Event } from "models"
import moment from "moment"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"

interface EventPreviewProps {
  className?: string
  uuid?: string
}

const EventPreview = ({ className, uuid }: EventPreviewProps) => {
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
          value={moment(event.startDate).format(Event.getEventDateFormat())}
        />
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.event.endDate}
          extraColForValue
          value={moment(event.endDate).format(Event.getEventDateFormat())}
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
        {event?.organizations?.length > 0 && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.event.organizations}
            value={
              <ListGroup>
                {event.organizations.map(org => (
                  <ListGroupItem key={org.uuid}>
                    <LinkTo modelType="Organization" model={org} />
                  </ListGroupItem>
                ))}
              </ListGroup>
            }
          />
        )}
        {event?.people?.length > 0 && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.event.people}
            value={
              <ListGroup>
                {event.people.map(person => (
                  <ListGroupItem key={person.uuid}>
                    <LinkTo modelType="Person" model={person} />
                  </ListGroupItem>
                ))}
              </ListGroup>
            }
          />
        )}
        {event?.tasks?.length > 0 && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.event.tasks}
            value={
              <ListGroup>
                {event.tasks.map(task => (
                  <ListGroupItem key={task.uuid}>
                    <BreadcrumbTrail
                      modelType="Task"
                      leaf={task}
                      ascendantObjects={task.ascendantTasks}
                      parentField="parentTask"
                    />
                  </ListGroupItem>
                ))}
              </ListGroup>
            }
          />
        )}
      </div>
    </div>
  )
}

export default EventPreview
