import { gql } from "@apollo/client"
import API from "api"
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
          label={orgSettings.longName.label}
          value={organization.longName}
        />

        <PreviewField
          label="Type"
          value={Organization.humanNameOfType(organization.type)}
        />

        {organization?.parentOrg?.uuid && (
          <PreviewField
            label={Settings.fields.organization.parentOrg}
            value={
              <LinkTo modelType="Organization" model={organization.parentOrg} />
            }
          />
        )}

        {organization?.childrenOrgs?.length > 0 && (
          <PreviewField
            label="Sub organizations"
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

        <PreviewField
          label={orgSettings.identificationCode?.label}
          value={organization.identificationCode}
        />

        <PreviewField
          label="Location"
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

        <PreviewField
          label="Status"
          value={Organization.humanNameOfStatus(organization.status)}
        />

        {organization.profile && (
          <PreviewField
            label={Settings.fields.organization.profile}
            value={<RichTextEditor readOnly value={organization.profile} />}
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
