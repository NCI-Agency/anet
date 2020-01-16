import API, { Settings } from "api"
import { gql } from "apollo-boost"
import LinkTo from "components/LinkTo"
import { mapDispatchToProps, useBoilerplate } from "components/Page"
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

const PaginatedOrganizations = props => {
  const { queryParams, ...otherProps } = props
  const [pageNum, setPageNum] = useState(0)
  const organizationQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION_LIST, {
    organizationQuery
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    ...props
  })
  if (done) {
    return result
  }

  const paginatedOrganizations = data.organizationList

  return (
    <BaseOrganizationTable
      paginatedOrganizations={paginatedOrganizations}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

PaginatedOrganizations.propTypes = {
  queryParams: PropTypes.object
}

const BaseOrganizationTable = props => {
  let organizations
  if (props.paginatedOrganizations) {
    var { pageSize, pageNum, totalCount } = props.paginatedOrganizations
    organizations = props.paginatedOrganizations.list
  } else {
    organizations = props.organizations
  }

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
        goToPage={props.goToPage}
      >
        <Table
          striped
          condensed
          hover
          responsive
          className="organizations_table"
          id={props.id}
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
                    <LinkTo organization={org}>
                      {nameComponents.join(" - ")}
                    </LinkTo>
                  </td>
                  {Settings.fields.advisor.org.identificationCode && (
                    <td>{org.identificationCode}</td>
                  )}
                  {props.showDelete && (
                    <td
                      onClick={() => props.onDelete(org)}
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
  // list of organizations, when no pagination wanted:
  organizations: PropTypes.array,
  // list of organizations, when pagination wanted:
  paginatedOrganizations: PropTypes.shape({
    totalCount: PropTypes.number,
    pageNum: PropTypes.number,
    pageSize: PropTypes.number,
    list: PropTypes.array.isRequired
  }),
  goToPage: PropTypes.func
}

export default connect(null, mapDispatchToProps)(OrganizationTable)
