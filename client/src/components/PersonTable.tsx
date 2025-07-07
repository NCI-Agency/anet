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
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import _isEmpty from "lodash/isEmpty"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"
import Settings from "settings"

const GQL_GET_PERSON_LIST = gql`
  query ($personQuery: PersonSearchQueryInput) {
    personList(query: $personQuery) {
      pageNum
      pageSize
      totalCount
      list {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        emailAddresses {
          network
          address
        }
        position {
          uuid
          name
          type
          role
          code
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          location {
            uuid
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
    }
  }
`

interface PersonTableProps {
  // query variables for people, when query & pagination wanted:
  queryParams?: any
}

const PersonTable = (props: PersonTableProps) => {
  if (props.queryParams) {
    return <PaginatedPerson {...props} />
  }
  return <BasePersonTable {...props} />
}

interface PaginatedPersonProps {
  pageDispatchers?: PageDispatchersPropType
  queryParams?: any
}

const PaginatedPerson = ({
  queryParams,
  pageDispatchers,
  ...otherProps
}: PaginatedPersonProps) => {
  const [pageNum, setPageNum] = useState(0)
  const personQuery = Object.assign({}, queryParams, { pageNum })
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON_LIST, {
    personQuery
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
    list: people
  } = data.personList

  return (
    <BasePersonTable
      people={people}
      pageSize={pageSize}
      pageNum={curPage}
      totalCount={totalCount}
      goToPage={setPageNum}
      {...otherProps}
    />
  )
}

interface BasePersonTableProps {
  id?: string
  // list of people:
  people: any[]
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

const BasePersonTable = ({
  id,
  people,
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
}: BasePersonTableProps) => {
  if (_get(people, "length", 0) === 0) {
    return <em>No people found</em>
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
        <Table responsive hover striped id={id}>
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
              <th>Position</th>
              <th>Location</th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            {people.map(person => (
              <tr key={person.uuid}>
                {allowSelection && (
                  <>
                    <td
                      style={{ verticalAlign: "middle", textAlign: "center" }}
                    >
                      {!_isEmpty(person.emailAddresses) && (
                        <Checkbox
                          checked={isSelected(person.uuid)}
                          onChange={() =>
                            toggleSelection(person.uuid, person.emailAddresses)}
                        />
                      )}
                    </td>
                    <td>
                      <EmailAddressList
                        label={Settings.fields.person.emailAddresses.label}
                        emailAddresses={person.emailAddresses}
                      />
                    </td>
                  </>
                )}
                <td>
                  <LinkTo modelType="Person" model={person} />
                </td>
                <td>
                  <LinkTo modelType="Position" model={person.position} />
                  {person.position && person.position.code
                    ? `, ${person.position.code}`
                    : ""}
                </td>
                <td>
                  <LinkTo
                    modelType="Location"
                    model={person.position && person.position.location}
                    whenUnspecified=""
                  />
                </td>
                <td>
                  {person.position && person.position.organization && (
                    <LinkTo
                      modelType="Organization"
                      model={person.position.organization}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </UltimatePaginationTopDown>
    </div>
  )
}

export default connect(null, mapPageDispatchersToProps)(PersonTable)
