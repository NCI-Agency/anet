import {
  gqlAllOrganizationFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import App6SymbolPreview from "components/App6SymbolPreview"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import { PreviewTitle } from "components/previews/PreviewTitle"
import RichTextEditor from "components/RichTextEditor"
import _isEmpty from "lodash/isEmpty"
import { Location, Organization } from "models"
import { PositionRole } from "models/Position"
import OrganizationLaydown from "pages/organizations/Laydown"
import OrganizationTasks from "pages/organizations/OrganizationTasks"
import pluralize from "pluralize"
import { getPositionsForRole } from "positionUtil"
import React from "react"
import { Badge, ListGroup, ListGroupItem } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_LOCATION_FIELDS = `
  fragment locationFields on Location {
    ${gqlEntityFieldsMap.Location}
    lat
    lng
    type
  }
`
const GQL_ORGANIZATION_FIELDS = `
  fragment organizationFields on Organization {
    ${gqlEntityFieldsMap.Organization}
    app6context
    app6standardIdentity
    app6symbolSet
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    ${gqlEntityFieldsMap.Person}
  }
`
const GQL_POSITION_FIELDS = `
  fragment positionFields on Position {
    ${gqlEntityFieldsMap.Position}
  }
`
const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ${gqlAllOrganizationFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      location {
        ...locationFields
      }
      parentOrg {
        ...organizationFields
      }
      childrenOrgs {
        ...organizationFields
      }
      ascendantOrgs {
        ...organizationFields
        parentOrg {
          uuid
        }
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

interface OrganizationPreviewProps {
  className?: string
  uuid?: string
}

const OrganizationPreview = ({ className, uuid }: OrganizationPreviewProps) => {
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
      <PreviewTitle
        title={`Organization ${organization.shortName}`}
        status={organization.status}
      />
      <div className="preview-section">
        <div className="text-center">
          <EntityAvatarDisplay
            avatar={organization.entityAvatar}
            defaultAvatar={Organization.relatedObjectType}
          />
          <App6SymbolPreview values={organization} size={120} maxHeight={200} />
        </div>

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
              <LinkTo modelType="Location" model={organization.location}>
                {`${Location.toString(organization.location)} `}
                <Badge bg="secondary">
                  {Location.humanNameOfType(organization.location.type)}
                </Badge>
              </LinkTo>
            )
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.organization.emailAddresses}
          value={
            <EmailAddressTable
              label={Settings.fields.organization.emailAddresses.label}
              emailAddresses={organization.emailAddresses}
            />
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

export default OrganizationPreview
