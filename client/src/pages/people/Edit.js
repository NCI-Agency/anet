import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Person } from "models"
import moment from "moment"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import utils from "utils"
import PersonForm from "./Form"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      emailAddress
      phoneNumber
      status
      pendingVerification
      domainUsername
      biography
      country
      gender
      endOfTourDate
      avatar(size: 256)
      code
      position {
        uuid
        name
        type
        organization {
          uuid
          shortName
          identificationCode
        }
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const PersonEdit = ({ pageDispatchers }) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "User",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }

  if (data) {
    if (data.person.endOfTourDate) {
      data.person.endOfTourDate = moment(data.person.endOfTourDate).format()
    }
    const parsedFullName = Person.parseFullName(data.person.name)
    data.person.firstName = parsedFullName.firstName
    data.person.lastName = parsedFullName.lastName
    data.person[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.person.customFields
    )
  }
  const person = new Person(data ? data.person : {})
  const legendText = person.isPendingVerification()
    ? "Create your account"
    : `Edit ${person.name}`
  const saveText = person.isPendingVerification()
    ? "Update profile"
    : "Save Person"

  return (
    <div>
      <RelatedObjectNotes
        notes={person.notes}
        relatedObject={
          person.uuid && {
            relatedObjectType: Person.relatedObjectType,
            relatedObjectUuid: person.uuid,
            relatedObject: person
          }
        }
        relatedObjectValue={person}
      />
      <PersonForm
        initialValues={person}
        edit
        title={legendText}
        saveText={saveText}
      />
    </div>
  )
}

PersonEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PersonEdit)
