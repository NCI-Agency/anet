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
import moment from "moment"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import AddNewEventTypeModal from "./AddNewEventTypeModal"

const GQL_EVENT_TYPES = gql`
  query {
    eventTypes {
      code
      status
      createdAt
      updatedAt
      relatedEventsCount
    }
  }
`

const GQL_CREATE_EVENT_TYPE = gql`
  mutation ($code: String!) {
    createEventType(code: $code) {
      code
    }
  }
`

const GQL_UPDATE_EVENT_TYPE_STATUS = gql`
  mutation ($code: String!, $status: Status!) {
    updateEventTypeStatus(code: $code, status: $status)
  }
`

const GQL_DELETE_EVENT_TYPE = gql`
  mutation ($code: String!) {
    deleteEventType(code: $code)
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

  const { loading, error, data, refetch } = API.useApiQuery(GQL_EVENT_TYPES, {})

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const eventTypes = (data?.eventTypes || []).slice().sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === Model.STATUS.ACTIVE ? -1 : 1
    }
    return (a.code || "").localeCompare(b.code || "")
  })

  if (done) {
    return result
  }

  const updateStatus = async (code, status) => {
    const newStatus =
      status === Model.STATUS.ACTIVE
        ? Model.STATUS.INACTIVE
        : Model.STATUS.ACTIVE
    await API.mutation(GQL_UPDATE_EVENT_TYPE_STATUS, {
      code,
      status: newStatus
    })
    toast.success(
      `Event type ${newStatus === Model.STATUS.ACTIVE ? "activated" : "deactivated"} successfully`
    )
    refetch()
  }

  const addNewEventType = async values => {
    try {
      await API.mutation(GQL_CREATE_EVENT_TYPE, { code: values.code })
      toast.success("Event type created successfully")
      refetch()
    } catch (error: any) {
      const gqlError = error?.graphQLErrors?.[0]
      const reason =
        gqlError?.extensions?.exception?.reason ??
        gqlError?.message ??
        error?.message
      console.log(reason)

      switch (reason) {
        case "EVENT_TYPE_ALREADY_EXISTS":
          toast.warn("An event type with that code already exists.")
          break
        case "EVENT_TYPE_CODE_REQUIRED":
          toast.error("Please enter a code for the event type.")
          break
        default:
          toast.error("Could not create event type.")
      }
    } finally {
      setShowAddModal(false)
      refetch()
    }
  }

  const deleteEventType = async (code: string) => {
    try {
      await API.mutation(GQL_DELETE_EVENT_TYPE, { code })
      toast.success("Event type deleted successfully")
      refetch()
    } catch (error: any) {
      const gqlError = error?.graphQLErrors?.[0]
      const reason =
        gqlError?.extensions?.exception?.reason ??
        gqlError?.message ??
        error?.message

      switch (reason) {
        case "EVENT_TYPE_IN_USE":
          toast.warn(
            "This event type is in use, therefore it cannot be deleted."
          )
          break
        case "EVENT_TYPE_NOT_FOUND":
          toast.error("Event type not found.")
          break
        default:
          toast.error("Could not delete event type.")
      }
    } finally {
      refetch()
    }
  }

  const validateCode = (code: string): boolean => {
    return !eventTypes.some(eventType => eventType.code === code)
  }

  const goToEventTypeSearch = (code: string) => {
    const queryParams = { type: code }
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
        validateCode={validateCode}
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
                <th>Code</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Updated At</th>
                <th># of Related Events</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eventTypes.map(eventType => (
                <tr key={eventType.code}>
                  <td>{eventType.code}</td>
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
                          onClick={() => goToEventTypeSearch(eventType.code)}
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
                          updateStatus(eventType.code, eventType.status)
                        }
                      >
                        {eventType.status === Model.STATUS.ACTIVE
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                      <RemoveButton
                        title="Delete event type"
                        onClick={() => deleteEventType(eventType.code)}
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
