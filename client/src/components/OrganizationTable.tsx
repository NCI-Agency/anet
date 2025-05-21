import { gql } from "@apollo/client"
import API from "api"
import Checkbox from "components/Checkbox"
import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RemoveButton from "components/RemoveButton"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import { Organization } from "models"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_ORGANIZATION_LIST = gql`
  query ($organizationQuery: OrganizationSearchQueryInput) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
        longName
        identificationCode
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        location {
          uuid
          name
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
    }
  }
`

interface OrganizationTableProps {
  // query variables for organizations, when query & pagination wanted:
  queryParams?: any
}

const OrganizationTable = (props: OrganizationTableProps) => {
  if (props.queryParams) {
    return <PaginatedOrganizations {...props} />
  }
  return <BaseOrganizationTable {...props} />
}

interface PaginatedOrganizationsProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PaginatedOrganizations = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}: PaginatedOrganizationsProps) => {
  const [pageNum, setPageNum] = useState(0)
  const organizationQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION_LIST, {
    organizationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    pageDispatchers
  })
  if (done) {
    return result
  }

  const {
    pageSize,
    pageNum: curPage,
    totalCount,
    list: organizations
  } = data.organizationList

  return (
    <BaseOrganizationTable
      organizations={organizations}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

interface BaseOrganizationTableProps {
  id?: string
  showLocation?: boolean
  showDelete?: boolean
  onDelete?: (...args: unknown[]) => unknown
  // list of organizations:
  organizations?: any[]
  noOrganizationsMessage?: string
  // fill these when pagination wanted:
  totalCount?: number
  pageNum?: number
  pageSize?: number
  goToPage?: (...args: unknown[]) => unknown
  allowSelection?: boolean
  // if allowSelection is true:
  selection?: Map
  isAllSelected?: (...args: unknown[]) => unknown
  toggleAll?: (...args: unknown[]) => unknown
  isSelected?: (...args: unknown[]) => unknown
  toggleSelection?: (...args: unknown[]) => unknown
}

const BaseOrganizationTable = ({
  id,
  showLocation,
  showDelete,
  onDelete,
  organizations,
  noOrganizationsMessage = "No organizations found",
  pageSize,
  pageNum,
  totalCount,
  goToPage,
  allowSelection,
  selection,
  isAllSelected,
  toggleAll,
  isSelected,
  toggleSelection
}: BaseOrganizationTableProps) => {
  if (_get(organizations, "length", 0) === 0) {
    return <em>{noOrganizationsMessage}</em>
  }

  return (
    <div>
      {allowSelection && (
        <em className="float-start">{selection.size} selected</em>
      )}
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="float-end"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table striped hover responsive className="organizations_table" id={id}>
          <thead>
            <tr>
              {allowSelection && (
                <>
                  <th style={{ verticalAlign: "middle", textAlign: "center" }}>
                    <Checkbox checked={isAllSelected()} onChange={toggleAll} />
                  </th>
                  <th>Email</th>
                </>
              )}
              <th>Name</th>
              {showLocation && <th>Location</th>}
              {showDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {Organization.map(organizations, org => (
              <tr key={org.uuid}>
                {allowSelection && (
                  <>
                    <td
                      style={{ verticalAlign: "middle", textAlign: "center" }}
                    >
                      {!_isEmpty(org.emailAddresses) && (
                        <Checkbox
                          checked={isSelected(org.uuid)}
                          onChange={() =>
                            toggleSelection(org.uuid, org.emailAddresses)}
                        />
                      )}
                    </td>
                    <td>
                      <EmailAddressList
                        label={
                          Settings.fields.organization.emailAddresses.label
                        }
                        emailAddresses={org.emailAddresses}
                      />
                    </td>
                  </>
                )}
                <td>
                  <LinkTo modelType="Organization" model={org} />
                </td>
                {showLocation && (
                  <td>
                    <LinkTo modelType="Location" model={org.location} />
                  </td>
                )}
                {showDelete && (
                  <td id={"organizationDelete_" + org.uuid}>
                    <RemoveButton
                      title="Remove organization"
                      onClick={() => onDelete(org)}
                    />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(OrganizationTable)
