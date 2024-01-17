import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import PositionTable from "components/PositionTable"
import { RelatedObjectsTable } from "components/RelatedObjectsTable"
import DictionaryField from "HOC/DictionaryField"
import { AuthorizationGroup } from "models"
import pluralize from "pluralize"
import PropTypes from "prop-types"
import React from "react"
import Settings from "settings"

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
        }
        person {
          uuid
          name
          rank
          avatarUuid
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
          }
          ... on Person {
            uuid
            name
            rank
            avatarUuid
          }
          ... on Position {
            uuid
            type
            name
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
  const DictPreviewField = DictionaryField(PreviewField)

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4 className="ellipsized-text">{`Authorization Group ${authorizationGroup.name}`}</h4>
      </div>
      <div className="preview-section">
        <DictPreviewField
          dictProps={Settings.fields.authorizationGroup.description}
          label="Description"
          value={authorizationGroup.description}
        />

        <DictPreviewField
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
        <PositionTable positions={authorizationGroup.administrativePositions} />
      </div>

      <h4>
        {
          Settings.fields.authorizationGroup.authorizationGroupRelatedObjects
            ?.label
        }
      </h4>
      <div className="preview-section">
        <RelatedObjectsTable
          title={pluralize.singular(
            Settings.fields.authorizationGroup.authorizationGroupRelatedObjects
              ?.label
          )}
          relatedObjects={authorizationGroup.authorizationGroupRelatedObjects}
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
