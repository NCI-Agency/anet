import { gql } from "@apollo/client"
import API from "api"
import AuthorizationGroupMembersTable from "components/AuthorizationGroupMembersTable"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import PositionTable from "components/PositionTable"
import { AuthorizationGroup } from "models"
import React from "react"
import Settings from "settings"
import utils from "utils"

const GQL_EMAIL_ADDRESSES = `
  emailAddresses {
    network
    address
  }
`
const GQL_GET_AUTHORIZATION_GROUP = gql`
  query ($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      status
      distributionList
      forSensitiveInformation
      administrativePositions {
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      authorizationGroupRelatedObjects {
        relatedObjectType
        relatedObjectUuid
        relatedObject {
          ... on Organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Position {
            uuid
            type
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
        }
      }
    }
  }
`

interface AuthorizationGroupPreviewProps {
  className?: string
  uuid?: string
}

const AuthorizationGroupPreview = ({
  className,
  uuid
}: AuthorizationGroupPreviewProps) => {
  const { data, error } = API.useApiQuery(GQL_GET_AUTHORIZATION_GROUP, { uuid })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const authorizationGroup = new AuthorizationGroup(
    data.authorizationGroup ? data.authorizationGroup : {}
  )

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4 className="ellipsized-text">{`Community ${authorizationGroup.name}`}</h4>
      </div>
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.authorizationGroup.description}
          label="Description"
          value={authorizationGroup.description}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.authorizationGroup.status}
          value={AuthorizationGroup.humanNameOfStatus(
            authorizationGroup.status
          )}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.authorizationGroup.distributionList}
          value={utils.formatBoolean(authorizationGroup.distributionList)}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.authorizationGroup.forSensitiveInformation}
          value={utils.formatBoolean(
            authorizationGroup.forSensitiveInformation
          )}
        />
      </div>

      <h4>
        {Settings.fields.authorizationGroup.administrativePositions?.label}
      </h4>
      <div className="preview-section">
        <PositionTable
          positions={authorizationGroup.administrativePositions}
          showLocation
        />
      </div>

      <h4>
        {
          Settings.fields.authorizationGroup.authorizationGroupRelatedObjects
            ?.label
        }
      </h4>
      <div className="preview-section">
        <AuthorizationGroupMembersTable
          authorizationGroup={authorizationGroup}
        />
      </div>
    </div>
  )
}

export default AuthorizationGroupPreview
