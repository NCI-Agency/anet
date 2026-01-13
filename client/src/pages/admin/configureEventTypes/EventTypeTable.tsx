import { gqlAllEventTypeFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { SEARCH_OBJECT_TYPES, setSearchQuery } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RemoveButton from "components/RemoveButton"
import { deserializeQueryParams } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import { Event } from "models"
import moment from "moment"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import AddNewEventTypeModal from "./AddNewEventTypeModal"

const GQL_CREATE_EVENT_TYPE = gql`
  mutation ($eventType: EventTypeInput!) {
    createEventType(eventType: $eventType) {
      ${gqlAllEventTypeFields}
    }
  }
`

const GQL_UPDATE_EVENT_TYPE = gql`
  mutation ($eventType: EventTypeInput!) {
    updateEventType(eventType: $eventType)
  }
`

const GQL_DELETE_EVENT_TYPE = gql`
  mutation ($uuid: String!) {
    deleteEventType(uuid: $uuid)
  }
`

interface EventTypeTableProps {
  pageDispatchers?: PageDispatchersPropType
  setSearchQuery: (...args: unknown[]) => unknown
}

const EventTypeTable = ({
  pageDispatchers,
  setSearchQuery
}: EventTypeTableProps) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const navigate = useNavigate()

  const { loading, error, data, refetch } = API.useApiQuery(
    Event.getEventTypesQuery
  )

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const eventTypes = (data?.eventTypes || []).slice().sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === Model.STATUS.ACTIVE ? -1 : 1
    }
    return (a.name || "").localeCompare(b.name || "")
  })

  if (done) {
    return result
  }

  const updateStatus = async (uuid, status) => {
    const newStatus =
      status === Model.STATUS.ACTIVE
        ? Model.STATUS.INACTIVE
        : Model.STATUS.ACTIVE
    await API.mutation(GQL_UPDATE_EVENT_TYPE, {
      eventType: {
        uuid,
        status: newStatus
      }
    })
    toast.success(
      `Event type ${newStatus === Model.STATUS.ACTIVE ? "activated" : "deactivated"} successfully`
    )
    refetch()
  }

  const addNewEventType = async values => {
    try {
      await API.mutation(GQL_CREATE_EVENT_TYPE, {
        eventType: {
          status: Model.STATUS.ACTIVE,
          name: values.name
        }
      })
      toast.success("Event type created successfully")
    } catch (error) {
      toast.error(`Could not create event type: ${error?.message}`)
    } finally {
      setShowAddModal(false)
      refetch()
    }
  }

  const deleteEventType = async (uuid: string) => {
    try {
      await API.mutation(GQL_DELETE_EVENT_TYPE, { uuid })
      toast.success("Event type deleted successfully")
    } catch (error) {
      toast.error(`Could not delete event type: ${error?.message}`)
    } finally {
      refetch()
    }
  }

  const validateName = (name: string): boolean => {
    return !eventTypes.some(eventType => eventType.name === name)
  }

  const goToEventTypeSearch = (uuid: any) => {
    const queryParams = { eventTypeUuid: uuid }
    deserializeQueryParams(
      SEARCH_OBJECT_TYPES.EVENTS,
      queryParams,
      (objectType, filters, text) => {
        setSearchQuery({ objectType, filters, text })
        navigate("/search")
      }
    )
  }

  return (
    <>
      <AddNewEventTypeModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSave={addNewEventType}
        validateName={validateName}
      />
      <Fieldset
        title="Event Types"
        action={
          <Button onClick={() => setShowAddModal(true)}>
            Add New Event Type
          </Button>
        }
      >
        {_isEmpty(eventTypes) ? (
          <em>No event types found</em>
        ) : (
          <Table striped hover responsive className="align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th># of Related Events</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map(eventType => (
                <tr key={eventType.name}>
                  <td>{eventType.name}</td>
                  <td>
                    <Icon
                      icon={
                        eventType.status === Model.STATUS.ACTIVE
                          ? IconNames.TICK
                          : IconNames.CROSS
                      }
                      className={
                        eventType.status === Model.STATUS.ACTIVE
                          ? "text-success"
                          : "text-danger"
                      }
                    />
                  </td>
                  <td>
                    {moment(eventType.createdAt).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td>
                    {moment(eventType.updatedAt).format("YYYY-MM-DD HH:mm")}
                  </td>
                  <td>
                    <div className="d-inline-flex align-items-center gap-1">
                      <span>{eventType.relatedEventsCount ?? 0}</span>
                      {eventType.relatedEventsCount > 0 && (
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => goToEventTypeSearch(eventType.uuid)}
                          title="View related events"
                        >
                          <Icon icon={IconNames.SEARCH} />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex gap-3">
                      <Button
                        variant={`${eventType.status === Model.STATUS.ACTIVE ? "danger" : "primary"}`}
                        style={{ width: 100 }}
                        onClick={() =>
                          updateStatus(eventType.uuid, eventType.status)
                        }
                      >
                        {eventType.status === Model.STATUS.ACTIVE
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                      <RemoveButton
                        title="Delete event type"
                        onClick={() => deleteEventType(eventType.uuid)}
                        disabled={eventType.relatedEventsCount > 0}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Fieldset>
    </>
  )
}

const mapDispatchToProps = dispatch => ({
  ...mapPageDispatchersToProps(dispatch),
  setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery))
})

export default connect(null, mapDispatchToProps)(EventTypeTable)
