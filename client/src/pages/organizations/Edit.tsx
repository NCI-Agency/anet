import {
  gqlAllAttachmentFields,
  gqlAllOrganizationFields,
  gqlApprovalStepFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlNotesFields
} from "constants/GraphQLDefinitions"
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
import RelatedObjectNotes from "components/RelatedObjectNotes"
import { Organization } from "models"
import React from "react"
import { connect } from "react-redux"
import { useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import OrganizationForm from "./Form"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String!) {
    organization(uuid: $uuid) {
      ${gqlAllOrganizationFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      location {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
      parentOrg {
        ${gqlEntityFieldsMap.Organization}
        ascendantOrgs {
          ${gqlEntityFieldsMap.Organization}
          app6context
          app6standardIdentity
          app6symbolSet
          parentOrg {
            ${gqlEntityFieldsMap.Organization}
        }
        }
      }
      planningApprovalSteps {
        ${gqlApprovalStepFields}
      }
      approvalSteps {
        ${gqlApprovalStepFields}
      }
      administratingPositions {
        ${gqlEntityFieldsMap.Position}
        location {
          ${gqlEntityFieldsMap.Location}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      tasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
        }
      }
      attachments {
        ${gqlAllAttachmentFields}
      }
      ${gqlNotesFields}
    }
  }
`

interface OrganizationEditProps {
  pageDispatchers?: PageDispatchersPropType
}

const OrganizationEdit = ({ pageDispatchers }: OrganizationEditProps) => {
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

export default connect(null, mapPageDispatchersToProps)(OrganizationEdit)
