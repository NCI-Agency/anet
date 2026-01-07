import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import API from "api"
import Fieldset from "components/Fieldset"
import Model from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _isEmpty from "lodash/isEmpty"
import moment from "moment"
import React, { useState } from "react"
import { Button, Table } from "react-bootstrap"
import { connect } from "react-redux"

const GQL_EVENT_TYPES = gql`
  query {
    eventTypes {
      code
      status
      createdAt
      updatedAt
    }
  }
`

const GQL_UPDATE_EVENT_TYPE_STATUS = gql`
  mutation ($code: String!, $status: Status!) {
    updateEventTypeStatus(code: $code, status: $status)
  }
`

const DEFAULT_PAGESIZE = 25

interface EventTypeTableProps {
  pageDispatchers?: PageDispatchersPropType
}

const EventTypeTable = ({ pageDispatchers }: EventTypeTableProps) => {
  const [pageNum, setPageNum] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGESIZE)

  const { loading, error, data, refetch } = API.useApiQuery(GQL_EVENT_TYPES, {})

  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })

  const eventTypes = data?.eventTypes || []

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
    refetch()
  }

  return (
    <>
      <Fieldset title="Event Types">
        {_isEmpty(eventTypes) ? (
          <em>No event types found</em>
        ) : (
          <UltimatePaginationTopDown
            componentClassName="searchPagination"
            className="float-end"
            pageNum={pageNum}
            pageSize={pageSize}
            goToPage={setPageNum}
          >
            <Table striped hover responsive className="align-middle">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Updated At</th>
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
                      <Button
                        variant={`${eventType.status === Model.STATUS.ACTIVE ? "danger" : "primary"}`}
                        onClick={() =>
                          updateStatus(eventType.code, eventType.status)
                        }
                      >
                        {eventType.status === Model.STATUS.ACTIVE
                          ? "Deactivate"
                          : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </UltimatePaginationTopDown>
        )}
      </Fieldset>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(EventTypeTable)
