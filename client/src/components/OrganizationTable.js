import { gql } from "@apollo/client"
import API from "api"
import Checkbox from "components/Checkbox"
import EmailAddressList from "components/EmailAddressList"
import LinkTo from "components/LinkTo"
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
import PropTypes from "prop-types"
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
  noOrganizationsMessage,
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
}) => {
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

BaseOrganizationTable.propTypes = {
  id: PropTypes.string,
  showDelete: PropTypes.bool,
  onDelete: PropTypes.func,
  // list of organizations:
  organizations: PropTypes.array,
  noOrganizationsMessage: PropTypes.string,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func,
  allowSelection: PropTypes.bool,
  // if allowSelection is true:
  selection: PropTypes.instanceOf(Map),
  isAllSelected: PropTypes.func,
  toggleAll: PropTypes.func,
  isSelected: PropTypes.func,
  toggleSelection: PropTypes.func
}

BaseOrganizationTable.defaultProps = {
  noOrganizationsMessage: "No organizations found"
}

export default connect(null, mapPageDispatchersToProps)(OrganizationTable)
