import { gql } from "@apollo/client"
import { DEFAULT_SEARCH_PROPS, PAGE_PROPS_NO_NAV } from "actions"
import API from "api"
import { initInvisibleFields } from "components/CustomFields"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
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
      updatedAt
      shortName
      longName
      identificationCode
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      status
      profile
      app6context
      app6standardIdentity
      app6symbolSet
      app6hq
      app6amplifier
      app6entity
      app6entityType
      app6entitySubtype
      app6sectorOneModifier
      app6sectorTwoModifier
      emailAddresses {
        network
        address
      }
      location {
        uuid
        name
        lat
        lng
        type
      }
      parentOrg {
        uuid
        shortName
        longName
        identificationCode
        ascendantOrgs {
          uuid
          app6context
          app6standardIdentity
          app6symbolSet
          parentOrg {
            uuid
          }
        }
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      tasks {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
      }
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
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
