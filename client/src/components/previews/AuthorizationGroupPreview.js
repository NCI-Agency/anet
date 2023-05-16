import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import PositionTable from "components/PositionTable"
import { AuthorizationGroup } from "models"
import PropTypes from "prop-types"
import React from "react"

const GQL_GET_AUTHORIZATION_GROUP = gql`
  query ($uuid: String) {
    authorizationGroup(uuid: $uuid) {
      uuid
      name
      description
      positions {
        uuid
        name
        code
        type
        role
        status
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      status
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
        <h4>{`Authorization Group ${authorizationGroup.name}`}</h4>
      </div>
      <div className="preview-section">
        <PreviewField label="Name" value={authorizationGroup.name} />

        <PreviewField
          label="Status"
          value={AuthorizationGroup.humanNameOfStatus(
            authorizationGroup.status
          )}
        />

        <div className="preview-section">
          <PositionTable positions={authorizationGroup.positions} />
        </div>
      </div>
    </div>
  )
}

AuthorizationGroupPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default AuthorizationGroupPreview
