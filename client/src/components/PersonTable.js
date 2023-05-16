import { gql } from "@apollo/client"
import API from "api"
import LinkTo from "components/LinkTo"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import UltimatePaginationTopDown from "components/UltimatePaginationTopDown"
import _get from "lodash/get"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Table } from "react-bootstrap"
import { connect } from "react-redux"

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
        role
        emailAddress
        avatar(size: 32)
        position {
          uuid
          name
          type
          role
          code
          location {
            uuid
            name
          }
          organization {
            uuid
            shortName
          }
        }
      }
    }
  }
`

const PersonTable = props => {
  if (props.queryParams) {
    return <PaginatedPerson {...props} />
  }
  return <BasePersonTable {...props} />
}

PersonTable.propTypes = {
  // query variables for people, when query & pagination wanted:
  queryParams: PropTypes.object
}

const PaginatedPerson = ({ queryParams, pageDispatchers, ...otherProps }) => {
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

PaginatedPerson.propTypes = {
  pageDispatchers: PageDispatchersPropType,
  queryParams: PropTypes.object
}

const BasePersonTable = ({
  id,
  people,
  pageSize,
  pageNum,
  totalCount,
  goToPage
}) => {
  if (_get(people, "length", 0) === 0) {
    return <em>No people found</em>
  }

  return (
    <div>
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
              <th>Name</th>
              <th>Position</th>
              <th>Location</th>
              <th>Organization</th>
            </tr>
          </thead>
          <tbody>
            {people.map(person => (
              <tr key={person.uuid}>
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

BasePersonTable.propTypes = {
  id: PropTypes.string,
  // list of people:
  people: PropTypes.array.isRequired,
  // fill these when pagination wanted:
  totalCount: PropTypes.number,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  goToPage: PropTypes.func
}

export default connect(null, mapPageDispatchersToProps)(PersonTable)
