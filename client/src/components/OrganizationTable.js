import API, { Settings } from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import {
  PageDispatchersPropType,
  mapPageDispatchersToProps,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import { Organization } from "models"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import REMOVE_ICON from "resources/delete.png"

const GQL_GET_ORGANIZATION_LIST = gql`
  query($organizationQuery: OrganizationSearchQueryInput) {
    organizationList(query: $organizationQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        shortName
      }
    }
  }
`

const OrganizationTable = props => {
  if (props.queryParams) {
    return <PaginatedOrganizations {...props} />
  }
  return <BaseOrganizationTable {...props} />
}

OrganizationTable.propTypes = {
  // query variables for organizations, when query & pagination wanted:
  queryParams: PropTypes.object
}

const PaginatedOrganizations = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}) => {
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

PaginatedOrganizations.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object
}

const BaseOrganizationTable = ({
  id,
  showDelete,
  onDelete,
  organizations,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_get(organizations, "length", 0) === 0) {
    return <em>No organizations found</em>
  }

  return (
    <div>
      <UltimatePaginationTopDown
        componentClassName="searchPagination"
        className="pull-right"
        pageNum={pageNum}
        pageSize={pageSize}
        totalCount={totalCount}
        goToPage={goToPage}
      >
        <Table
          striped
          condensed
          hover
          responsive
          className="organizations_table"
          id={id}
        >
          <thead>
            <tr>
              <th>Name</th>
              {Settings.fields.advisor.org.identificationCode && (
                <th>{Settings.fields.advisor.org.identificationCode.label}</th>
              )}
              <th />
            </tr>
          </thead>
          <tbody>
            {Organization.map(organizations, org => {
              const nameComponents = []
              org.shortName && nameComponents.push(org.shortName)
              org.longName && nameComponents.push(org.longName)
              return (
                <tr key={org.uuid}>
                  <td>
                    <LinkTo modelType="Organization" model={org}>
                      {nameComponents.join(" - ")}
                    </LinkTo>
                  </td>
                  {Settings.fields.advisor.org.identificationCode && (
                    <td>{org.identificationCode}</td>
                  )}
                  {showDelete && (
                    <td
                      onClick={() => onDelete(org)}
                      id={"organizationDelete_" + org.uuid}
                    >
                      <span style={{ cursor: "pointer" }}>
                        <img
                          src={REMOVE_ICON}
                          height={14}
                          alt="Remove organization"
                        />
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

BaseOrganizationTable.propTypes = {
  id: PropTypes.string,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of organizations:
  organizations: PropTypes.array,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(OrganizationTable)
