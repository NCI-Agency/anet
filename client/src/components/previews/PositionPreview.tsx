import {
  gqlAllPositionFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap
} from "constants/GraphQLDefinitions"
import { gql } from "@apollo/client"
import API from "api"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { PreviewTitle } from "components/previews/PreviewTitle"
import RichTextEditor from "components/RichTextEditor"
import { Location, Position } from "models"
import moment from "moment"
import React from "react"
import { Badge, Table } from "react-bootstrap"
import Settings from "settings"

const GQL_GET_POSITION = gql`
  query ($uuid: String!) {
    position(uuid: $uuid) {
      ${gqlAllPositionFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      organization {
        ${gqlEntityFieldsMap.Organization}
      }
      person {
        ${gqlEntityFieldsMap.Person}
      }
      associatedPositions {
        ${gqlEntityFieldsMap.Position}
        person {
          ${gqlEntityFieldsMap.Person}
        }
        organization {
          ${gqlEntityFieldsMap.Organization}
        }
      }
      previousPeople {
        startTime
        endTime
        person {
          ${gqlEntityFieldsMap.Person}
        }
      }
      location {
        ${gqlEntityFieldsMap.Location}
        lat
        lng
        type
      }
    }
  }
`

interface PositionPreviewProps {
  className?: string
  uuid?: string
}

const PositionPreview = ({ className, uuid }: PositionPreviewProps) => {
  const { data, error } = API.useApiQuery(GQL_GET_POSITION, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  const position = new Position(data.position ? data.position : {})

  return (
    <div className={`${className} preview-content-scroll`}>
      <PreviewTitle
        title={`Position ${position.name}`}
        status={position.status}
      />
      <div className="preview-section">
        <div className="text-center">
          <EntityAvatarDisplay
            avatar={position.entityAvatar}
            defaultAvatar={Position.relatedObjectType}
          />
        </div>

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.type}
          value={Position.humanNameOfType(position.type)}
        />
        {position.type === Position.TYPE.SUPERUSER && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.position.superuserType}
            value={Position.humanNameOfSuperuserType(position.superuserType)}
          />
        )}
        {position.organization && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.position.organization}
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
          />
        )}

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.location}
          value={
            position.location && (
              <LinkTo modelType="Location" model={position.location}>
                {`${Location.toString(position.location)} `}
                <Badge bg="secondary">
                  {Location.humanNameOfType(position.location.type)}
                </Badge>
              </LinkTo>
            )
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.code}
          value={position.code}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.emailAddresses}
          value={
            <EmailAddressTable
              label={Settings.fields.position.emailAddresses.label}
              emailAddresses={position.emailAddresses}
            />
          }
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.status}
          value={Position.humanNameOfStatus(position.status)}
        />

        <DictionaryField
          wrappedComponent={PreviewField}
          dictProps={Settings.fields.position.role}
          value={Position.humanNameOfRole(position.role)}
        />

        {position.description && (
          <DictionaryField
            wrappedComponent={PreviewField}
            dictProps={Settings.fields.position.description}
            value={<RichTextEditor readOnly value={position.description} />}
          />
        )}
      </div>

      <h4>Current assigned person</h4>
      <div className="preview-section" style={{ textAlign: "center" }}>
        {position.person && position.person.uuid ? (
          <div>
            <h4 className="assigned-person-name">
              <LinkTo modelType="Person" model={position.person} />
            </h4>
            <p />
          </div>
        ) : (
          <div>
            <p className="position-empty-message">
              <em>{position.name} is currently empty.</em>
            </p>
          </div>
        )}
      </div>

      <h4>Assigned counterparts</h4>
      <div className="preview-section">
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
            </tr>
          </thead>
          <tbody>
            {Position.map(position.associatedPositions, (pos, idx) =>
              renderAssociatedPositionRow(pos, idx)
            )}
          </tbody>
        </Table>

        {position.associatedPositions.length === 0 && (
          <em>{position.name} has no counterparts assigned</em>
        )}
      </div>

      <h4>Previous position holders</h4>
      <div className="preview-section">
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Dates</th>
            </tr>
          </thead>
          <tbody>
            {position.previousPeople.map((pp, idx) => (
              <tr key={idx} id={`previousPerson_${idx}`}>
                <td>
                  <LinkTo modelType="Person" model={pp.person} />
                </td>
                <td>
                  {moment(pp.startTime).format(
                    Settings.dateFormats.forms.displayShort.date
                  )}{" "}
                  - &nbsp;
                  {pp.endTime &&
                    moment(pp.endTime).format(
                      Settings.dateFormats.forms.displayShort.date
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  )

  function renderAssociatedPositionRow(pos, idx) {
    let personName
    if (!pos.person) {
      personName = "Unfilled"
    } else {
      personName = <LinkTo modelType="Person" model={pos.person} />
    }
    return (
      <tr key={pos.uuid} id={`associatedPosition_${idx}`}>
        <td>{personName}</td>
        <td>
          <LinkTo modelType="Position" model={pos} />
        </td>
      </tr>
    )
  }
}

export default PositionPreview
