import { gql } from "@apollo/client"
import API from "api"
import AuthorizationGroupMembersTable from "components/AuthorizationGroupMembersTable"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import { GRAPHQL_ENTITY_AVATAR_FIELDS } from "components/Model"
import PositionTable from "components/PositionTable"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"

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
      administrativePositions {
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        person {
          uuid
          name
          rank
          avatarUuid
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
            avatarUuid
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            ${GQL_EMAIL_ADDRESSES}
          }
          ... on Position {
            uuid
            type
            name
            ${GQL_EMAIL_ADDRESSES}
          }
        }
      }
    }
  }
`

const AuthorizationGroupPreview = ({ className, uuid }) => {
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
        <h4 className="ellipsized-text">{`Authorization Group ${authorizationGroup.name}`}</h4>
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

AuthorizationGroupPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default AuthorizationGroupPreview
