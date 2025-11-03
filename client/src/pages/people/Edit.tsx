import {
  gqlAllAttachmentFields,
  gqlAllPersonFields,
  gqlCustomSensitiveInformationFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlNotesFields,
  gqlUsersFields
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Person } from "models"
import moment from "moment"
import React, { useContext } from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PersonForm from "./Form"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      ${gqlAllPersonFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      ${gqlUsersFields}
      country {
        ${gqlEntityFieldsMap.Location}
      }
      position {
        ${gqlEntityFieldsMap.Position}
        type
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
      }
      attachments {
        ${gqlAllAttachmentFields}
      }
      ${gqlCustomSensitiveInformationFields}
      ${gqlNotesFields}
    }
  }
`

interface PersonEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const PersonEdit = ({ pageDispatchers }: PersonEditProps) => {
  const { currentUser } = useContext(AppContext)
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
  const isPending =
    person.isPendingVerification() && Person.isEqual(currentUser, person)
  const legendText = isPending
    ? "Create your account"
    : `Edit ${Person.militaryName(person.name)}`
  const saveText = isPending ? "Update profile" : "Save Person"

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

export default connect(null, mapPageDispatchersToProps)(PersonEdit)
