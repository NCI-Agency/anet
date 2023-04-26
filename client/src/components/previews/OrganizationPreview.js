import { gql } from "@apollo/client"
import API from "api"
import DictionaryField from "components/DictionaryField"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import RichTextEditor from "components/RichTextEditor"
import _isEmpty from "lodash/isEmpty"
import { Location, Organization } from "models"
import { PositionRole } from "models/Position"
import OrganizationLaydown from "pages/organizations/Laydown"
import OrganizationTasks from "pages/organizations/OrganizationTasks"
import pluralize from "pluralize"
import { getPositionsForRole } from "positionUtil"
import PropTypes from "prop-types"
import React from "react"
import { Badge, ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_LOCATION_FIELDS = `
  fragment locationFields on Location {
    uuid
    name
    type
  }
`
const GQL_ORGANIZATION_FIELDS = `
  fragment organizationFields on Organization {
    uuid
    shortName
    longName
    identificationCode
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    uuid
    name
    rank
    avatarUuid
    status
  }
`
const GQL_POSITION_FIELDS = `
  fragment positionFields on Position {
    uuid
    name
    code
    status
    type
    role
  }
`
const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ...organizationFields
      status
      profile
      location {
        ...locationFields
        lat
        lng
      }
      parentOrg {
        ...organizationFields
      }
      childrenOrgs(query: { status: ACTIVE }) {
        ...organizationFields
      }
      ascendantOrgs(query: { status: ACTIVE }) {
        ...organizationFields
        administratingPositions {
          ...positionFields
          location {
            ...locationFields
          }
          organization {
            ...organizationFields
          }
          person {
            ...personFields
          }
        }
      }
      positions {
        ...positionFields
        person {
          ...personFields
        }
        associatedPositions {
          ...positionFields
          person {
            ...personFields
          }
        }
      }
    }
  }

  ${GQL_LOCATION_FIELDS}
  ${GQL_ORGANIZATION_FIELDS}
  ${GQL_PERSON_FIELDS}
  ${GQL_POSITION_FIELDS}
`

const OrganizationPreview = ({ className, uuid }) => {
  const { data, error, refetch } = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const organization = new Organization(
    data.organization ? data.organization : {}
  )

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4 className="ellipsized-text">{`Organization ${organization.shortName}`}</h4>
      </div>
      <div className="preview-section">
        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.organization.longName}
          value={organization.longName}
        />

        {organization?.parentOrg?.uuid && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.organization.parentOrg}
            value={
              <LinkTo modelType="Organization" model={organization.parentOrg} />
            }
          />
        )}

        {organization?.childrenOrgs?.length > 0 && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.organization.childrenOrgs}
            value={
              <ListGroup>
                {organization.childrenOrgs.map(childOrg => (
                  <ListGroupItem key={childOrg.uuid}>
                    <LinkTo modelType="Organization" model={childOrg} />
                  </ListGroupItem>
                ))}
              </ListGroup>
            }
          />
        )}

        {renderLeadingPositions(
          organization.positions,
          PositionRole.LEADER.toString(),
          pluralize(utils.titleCase(PositionRole.LEADER.humanNameOfRole()))
        )}

        {renderLeadingPositions(
          organization.positions,
          PositionRole.DEPUTY.toString(),
          pluralize(utils.titleCase(PositionRole.DEPUTY.humanNameOfRole()))
        )}

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.organization.identificationCode}
          value={organization.identificationCode}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.organization.location}
          value={
            organization.location && (
              <>
                <LinkTo modelType="Location" model={organization.location} />{" "}
                <Badge>
                  {Location.humanNameOfType(organization.location.type)}
                </Badge>
              </>
            )
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.organization.status}
          value={Organization.humanNameOfStatus(organization.status)}
        />

        {organization.profile && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.organization.profile}
            value={<RichTextEditor readOnly value={organization.profile} />}
          />
        )}
      </div>

      <OrganizationLaydown
        organization={organization}
        refetch={refetch}
        readOnly
      />
      {organization.isTaskEnabled() && (
        <OrganizationTasks
          organization={organization}
          queryParams={{
            status: Model.STATUS.ACTIVE,
            pageSize: 10,
            taskedOrgUuid: organization.uuid
          }}
        />
      )}
    </div>
  )

  function renderLeadingPositions(positions, role, label) {
    const positionList = getPositionsForRole(positions, role)
    if (!_isEmpty(positionList)) {
      return <PreviewField label={label} value={positionList} />
    }
  }
}

OrganizationPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default OrganizationPreview
