import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Attachment, Person } from "models"
import moment from "moment"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PersonForm from "./Form"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      avatarUuid
      status
      emailAddress
      phoneNumber
      pendingVerification
      domainUsername
      openIdSubject
      biography
      country
      gender
      endOfTourDate
      code
      position {
        uuid
        name
        type
        role
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
      }
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      customFields
      ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
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
  usePageTitle(data?.person && `Edit | ${data.person.rank} ${data.person.name}`)
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
    if (data.person.customSensitiveInformation) {
      // Add sensitive information fields to formCustomFields
      data.person[SENSITIVE_CUSTOM_FIELDS_PARENT] = utils.parseSensitiveFields(
        data.person.customSensitiveInformation
      )
    }
  }
  const person = new Person(data ? data.person : {})
  const legendText = person.isPendingVerification()
    ? "Create your account"
    : `Edit ${person.name}`
  const saveText = person.isPendingVerification()
    ? "Update profile"
    : "Save Person"

  // mutates the object
  initInvisibleFields(person, Settings.fields.person.customFields)
  initInvisibleFields(person, Settings.fields.person.customSensitiveInformation)

  return (
    <div>
      <PersonForm
        initialValues={person}
        edit
        title={legendText}
        saveText={saveText}
        notesComponent={
          <RelatedObjectNotes
            notes={person.notes}
            relatedObject={
              person.uuid && {
                relatedObjectType: Person.relatedObjectType,
                relatedObjectUuid: person.uuid,
                relatedObject: person
              }
            }
          />
        }
      />
    </div>
  )
}

PersonEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PersonEdit)
