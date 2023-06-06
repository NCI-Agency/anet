import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import { Organization } from "models"
import { PositionRole } from "models/Position"
import OrganizationLaydown from "pages/organizations/Laydown"
import OrganizationTasks from "pages/organizations/OrganizationTasks"
import PropTypes from "prop-types"
import React from "react"
import { ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"

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
    type
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    uuid
    name
    status
    rank
    role
    avatar(size: 32)
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

  function showLeadingPositions(positions, role, label) {
    return (
      positions &&
      positions.some(pos => pos.role === role) && (
        <PreviewField
          label={label}
          value={
            <ListGroup>
              {positions.map(
                pos =>
                  pos.role === role && (
                    <ListGroupItem key={pos.uuid}>
                      <LinkTo modelType="Position" model={pos}>
                        {pos.name}
                      </LinkTo>
                    </ListGroupItem>
                  )
              )}
            </ListGroup>
          }
        />
      )
    )
  }

  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG
  const orgSettings = isPrincipalOrg
    ? Settings.fields.principal.org
    : Settings.fields.advisor.org

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`Organization ${organization.shortName}`}</h4>
      </div>
      <div className="preview-section">
        <PreviewField
          label="Status"
          value={Organization.humanNameOfStatus(organization.status)}
        />

        <PreviewField
          label="Type"
          value={Organization.humanNameOfType(organization.type)}
        />

        {showLeadingPositions(
          organization.positions,
          PositionRole.LEADER.toString(),
          "Leaders"
        )}

        {showLeadingPositions(
          organization.positions,
          PositionRole.DEPUTY.toString(),
          "Deputies"
        )}

        <PreviewField
          label={orgSettings.longName.label}
          value={organization.longName}
        />

        <PreviewField
          label={orgSettings.identificationCode?.label}
          value={organization.identificationCode}
        />

        {organization?.parentOrg?.uuid && (
          <PreviewField
            label={Settings.fields.organization.parentOrg}
            value={
              <LinkTo modelType="Organization" model={organization.parentOrg}>
                {organization.parentOrg.shortName}{" "}
                {organization.parentOrg.longName}{" "}
                {organization.parentOrg.identificationCode}
              </LinkTo>
            }
          />
        )}

        {organization?.childrenOrgs?.length > 0 && (
          <PreviewField
            label="Sub organizations"
            value={
              <ListGroup>
                {organization.childrenOrgs.map(organization => (
                  <ListGroupItem key={organization.uuid}>
                    <LinkTo modelType="Organization" model={organization}>
                      {organization.shortName} {organization.longName}{" "}
                      {organization.identificationCode}
                    </LinkTo>
                  </ListGroupItem>
                ))}
              </ListGroup>
            }
          />
        )}
      </div>

      <OrganizationLaydown organization={organization} refetch={refetch} />
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
}

OrganizationPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default OrganizationPreview
