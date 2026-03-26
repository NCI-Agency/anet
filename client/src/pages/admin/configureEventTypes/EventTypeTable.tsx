import { gqlAllEventTypeFields } from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { SEARCH_OBJECT_TYPES, setSearchQuery } from "actions"
import API from "api"
import Fieldset from "components/Fieldset"
import { MessagesWithConflict } from "components/Messages"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RemoveButton from "components/RemoveButton"
import { deserializeQueryParams } from "components/SearchFilters"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router"
import AddNewEventTypeModal from "./AddNewEventTypeModal"

const GQL_GET_EVENT_TYPES = gql`
  query {
    eventTypes {
      ${gqlAllEventTypeFields}
    }
  }
`

const GQL_UPDATE_EVENT_TYPE = gql`
  mutation ($eventType: EventTypeInput!, $force: Boolean) {
    updateEventType(eventType: $eventType, force: $force)
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
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [stateSuccess, setStateSuccess] = useState(null)
  const [stateError, setStateError] = useState(null)
  const [selectedEventType, setSelectedEventType] = useState(null)

  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_EVENT_TYPES)

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

  const updateStatus = async (eventType: any, force?: boolean) => {
    setSelectedEventType(eventType)
    const newStatus =
      eventType.status === Model.STATUS.ACTIVE
        ? Model.STATUS.INACTIVE
        : Model.STATUS.ACTIVE
    try {
      await API.mutation(GQL_UPDATE_EVENT_TYPE, {
        eventType: {
          ...Object.without(eventType, "relatedEventsCount"),
          status: newStatus
        },
        force
      })
      setSuccess(
        `Event type ${newStatus === Model.STATUS.ACTIVE ? "activated" : "deactivated"} successfully`
      )
      refetch()
    } catch (error) {
      setError(error)
    }
  }

  const deleteEventType = async (uuid: string) => {
    try {
      await API.mutation(GQL_DELETE_EVENT_TYPE, { uuid })
      setSuccess("Event type deleted successfully")
      refetch()
    } catch (error) {
      setError(error)
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
        showModal={showAddModal}
        onCancel={() => hideAddModal(false)}
        onSuccess={() => hideAddModal(true)}
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
        <MessagesWithConflict
          error={stateError}
          success={stateSuccess}
          objectType="EventType"
          onCancel={() => {
            setSuccess(null)
          }}
          onConfirm={() => {
            updateStatus(selectedEventType, true)
          }}
        />
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
                    {eventType.status === Model.STATUS.ACTIVE
                      ? "Active"
                      : "Inactive"}
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
                        onClick={() => updateStatus(eventType)}
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

  function setSuccess(msg) {
    setStateSuccess(msg)
    setStateError(null)
    setSelectedEventType(null)
  }

  function setError(err) {
    setStateError(err)
    setStateSuccess(null)
  }

  function hideAddModal(success) {
    setShowAddModal(false)
    if (success) {
      setStateSuccess("Event type created")
      refetch()
    }
  }
}

const mapDispatchToProps = dispatch => ({
  ...mapPageDispatchersToProps(dispatch),
  setSearchQuery: searchQuery => dispatch(setSearchQuery(searchQuery))
})

export default connect(null, mapDispatchToProps)(EventTypeTable)
