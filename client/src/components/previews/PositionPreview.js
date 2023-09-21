import { gql } from "@apollo/client"
import API from "api"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { Location, Position } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React from "react"
import { Badge, Table } from "react-bootstrap"
import Settings from "settings"

const GQL_GET_POSITION = gql`
  query ($uuid: String!) {
    position(uuid: $uuid) {
      uuid
      name
      type
      role
      status
      code
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
        role
        avatar(size: 32)
      }
      associatedPositions {
        uuid
        name
        type
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
        organization {
          uuid
          shortName
          longName
          identificationCode
        }
      }
      previousPeople {
        startTime
        endTime
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      location {
        uuid
        name
        type
        lat
        lng
      }
    }
  }
`

const PositionPreview = ({ className, uuid }) => {
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

  const isPrincipal = position.type === Position.TYPE.PRINCIPAL
  const assignedRole = isPrincipal
    ? Settings.fields.advisor.person.name
    : Settings.fields.principal.person.name
  const positionSettings = isPrincipal
    ? Settings.fields.principal.position
    : Settings.fields.advisor.position

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`Position ${position.name}`}</h4>
      </div>
      <div className="preview-section">
        <PreviewField
          label="Type"
          value={Position.humanNameOfType(position.type)}
        />

        {position.organization && (
          <PreviewField
            label="Organization"
            value={
              <LinkTo modelType="Organization" model={position.organization} />
            }
          />
        )}

        <PreviewField
          label="Location"
          value={
            position.location && (
              <>
                <LinkTo modelType="Location" model={position.location} />{" "}
                <Badge>
                  {Location.humanNameOfType(position.location.type)}
                </Badge>
              </>
            )
          }
        />

        <PreviewField
          label={positionSettings.code.label}
          value={position.code}
        />

        <PreviewField
          label="Status"
          value={Position.humanNameOfStatus(position.status)}
        />

        <PreviewField
          label={Settings.fields.position.role.label}
          value={Position.humanNameOfRole(position.role)}
        />
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

      <h4>{`Assigned ${assignedRole}`}</h4>
      <div className="preview-section">
        <Table>
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
          <em>
            {position.name} has no associated {assignedRole}
          </em>
        )}
      </div>

      <h4>Previous position holders</h4>
      <div className="preview-section">
        <Table>
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

PositionPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default PositionPreview
