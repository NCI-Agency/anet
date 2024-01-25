import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import { Attachment, Organization } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import OrganizationForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      identificationCode
      status
      location {
        uuid
        name
        lat
        lng
        type
      }
      profile
      parentOrg {
        uuid
        shortName
        longName
        identificationCode
      }
      planningApprovalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            avatarUuid
          }
        }
      }
      administratingPositions {
        uuid
        name
        code
        type
        role
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
        person {
          uuid
          name
          rank
          avatarUuid
        }
      }
      approvalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            avatarUuid
          }
        }
      }
      tasks {
        uuid
        shortName
        longName
      }
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const OrganizationEdit = ({ pageDispatchers }) => {
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid,
    pageProps: PAGE_PROPS_NO_NAV,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(
    data?.organization?.shortName && `Edit | ${data.organization.shortName}`
  )
  if (done) {
    return result
  }
  if (data) {
    data.organization[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.organization.customFields
    )
  }
  const organization = new Organization(data ? data.organization : {})
  // mutates the object
  initInvisibleFields(organization, Settings.fields.organization.customFields)
  return (
    <div>
      <OrganizationForm
        edit
        initialValues={organization}
        title={`Organization ${organization.shortName}`}
        notesComponent={
          <RelatedObjectNotes
            notes={organization.notes}
            relatedObject={
              organization.uuid && {
                relatedObjectType: Organization.relatedObjectType,
                relatedObjectUuid: organization.uuid,
                relatedObject: organization
              }
            }
          />
        }
      />
    </div>
  )
}

OrganizationEdit.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(OrganizationEdit)
