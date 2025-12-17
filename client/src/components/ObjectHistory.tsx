import {
  gqlAuditTrailFields,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import { RelatedObjectDisplay } from "components/RelatedObjectDisplay"
import ResponsiveLayoutContext from "components/ResponsiveLayoutContext"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _isEmpty from "lodash/isEmpty"
import moment from "moment/moment"
import React, { useContext, useState } from "react"
import {
  Button,
  Offcanvas,
  OverlayTrigger,
  Table,
  Tooltip
} from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_OBJECT_AUDIT_TRAIL_LIST = gql`
  query ($auditTrailQuery: AuditTrailSearchQueryInput) {
    auditTrailList(query: $auditTrailQuery) {
      ${gqlPaginationFields}
      list {
        ${gqlAuditTrailFields}
      }
    }
  }
`

const ObjectHistoryList = ({
  pageDispatchers,
  objectUuid
}: ObjectHistoryProps) => {
  const [pageNum, setPageNum] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const auditTrailQuery = { pageNum, relatedObjectUuid: objectUuid }
  const { loading, error, data } = API.useApiQuery(
    GQL_GET_OBJECT_AUDIT_TRAIL_LIST,
    {
      auditTrailQuery
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const {
    totalCount = 0,
    pageSize,
    list: auditTrail = []
  } = data.auditTrailList
  return _isEmpty(auditTrail) ? (
    <em>No audit trail entries found</em>
  ) : (
    <UltimatePaginationTopDown
      Component="header"
      componentClassName="searchPagination"
      className="float-end"
      pageNum={pageNum}
      pageSize={pageSize}
      totalCount={totalCount}
      goToPage={setPageNum}
    >
      <Table striped hover responsive>
        <thead>
          <tr>
            <th>Date</th>
            <th>Who</th>
            <th>Type</th>
            <th>Description</th>
            <th>
              {showDetails ? (
                <>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip>Hide Details</Tooltip>}
                  >
                    <Icon
                      icon={IconNames.EYE_OFF}
                      className="me-1"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowDetails(false)}
                    />
                  </OverlayTrigger>
                  Details
                </>
              ) : (
                <OverlayTrigger
                  placement="top"
                  overlay={<Tooltip>Show Details</Tooltip>}
                >
                  <Icon
                    icon={IconNames.EYE_ON}
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowDetails(true)}
                  />
                </OverlayTrigger>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {auditTrail.map(at => (
            <tr key={at.uuid}>
              <td className="text-nowrap">
                {moment(at.createdAt).format(
                  Settings.dateFormats.forms.displayShort.withTime
                )}
              </td>
              <td>
                <RelatedObjectDisplay
                  relatedObjectType="people"
                  relatedObjectUuid={at.objectUuid}
                  relatedObject={at.person}
                />
              </td>
              <td>{at.updateType}</td>
              <td>{at.updateDescription}</td>
              <td>{showDetails && at.updateDetails}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </UltimatePaginationTopDown>
  )
}

interface ObjectHistoryProps {
  pageDispatchers?: PageDispatchersPropType
  objectUuid: string
}

const ObjectHistory = ({ pageDispatchers, objectUuid }: ObjectHistoryProps) => {
  const { topbarOffset } = useContext(ResponsiveLayoutContext)
  const [show, setShow] = useState(false)

  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)

  return (
    <>
      <Button onClick={handleShow} title="Show history">
        <Icon icon={IconNames.HISTORY} />
      </Button>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        backdrop={false}
        className="w-50"
        style={{ zIndex: "1200", marginTop: topbarOffset }}
      >
        <Offcanvas.Header closeButton className="border-top">
          <Offcanvas.Title>History</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {show && (
            <ObjectHistoryList
              pageDispatchers={pageDispatchers}
              objectUuid={objectUuid}
            />
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  )
}

export default connect(null, mapPageDispatchersToProps)(ObjectHistory)
