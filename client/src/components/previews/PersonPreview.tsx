import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import CountryDisplay from "components/CountryDisplay"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import { PreviewField } from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ENTITY_AVATAR_FIELDS
} from "components/Model"
import PreviousPositions from "components/PreviousPositions"
import RichTextEditor from "components/RichTextEditor"
import { Person, Position } from "models"
import moment from "moment"
import React, { useContext } from "react"
import { Col, Form, Row, Table } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query ($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      status
      pendingVerification
      phoneNumber
      user
      domainUsername
      biography
      obsoleteCountry
      country {
        uuid
        name
      }
      gender
      endOfTourDate
      code
      emailAddresses {
        network
        address
      }
      position {
        uuid
        name
        type
        superuserType
        role
        organization {
          uuid
          shortName
          longName
          identificationCode
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
        associatedPositions {
          uuid
          name
          type
          role
          person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      previousPositions {
        startTime
        endTime
        position {
          uuid
          name
        }
      }
      customFields
    }
  }
`

interface PersonPreviewProps {
  className?: string
  uuid?: string
}

const PersonPreview = ({ className, uuid }: PersonPreviewProps) => {
  const { currentUser } = useContext(AppContext)

  const { data, error } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })

  if (!data) {
    if (error) {
      return <p>Could not load the preview</p>
    }
    return null
  }

  data.person[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
    data.person.customFields
  )

  const person = new Person(data.person ? data.person : {})

  // The position for this person's counterparts
  const position = person.position
  const assignedRole = Settings.fields.regular.person.name

  // User can always edit themselves
  // Admins can always edit anybody
  // Superusers can edit people in their org, their descendant orgs, or un-positioned people.
  const isAdmin = currentUser && currentUser.isAdmin()
  const hasPosition = position && position.uuid

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4 className="ellipsized-text">{`${person.rank} ${Person.militaryName(person.name)}`}</h4>
      </div>
      <div className="preview-section">
        <Row>
          <Col>
            <div className="text-center">
              <EntityAvatarDisplay
                avatar={person.entityAvatar}
                defaultAvatar={Person.relatedObjectType}
              />
            </div>

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.rank}
              value={person.rank}
            />

            {isAdmin && (
              <>
                <DictionaryField
                  wrappedComponent={PreviewField}
                  dictProps={Settings.fields.person.user}
                  value={utils.formatBoolean(person.user)}
                />
                <DictionaryField
                  wrappedComponent={PreviewField}
                  dictProps={Settings.fields.person.domainUsername}
                  value={person.domainUsername}
                />
              </>
            )}

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.status}
              value={Person.humanNameOfStatus(person.status)}
            />
          </Col>
          <Col>
            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.phoneNumber}
              value={
                person.phoneNumber || (
                  <em>
                    No {Settings.fields.person.phoneNumber.label.toLowerCase()}{" "}
                    available
                  </em>
                )
              }
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.emailAddresses}
              value={
                <EmailAddressTable
                  label={Settings.fields.person.emailAddresses.label}
                  emailAddresses={person.emailAddresses}
                />
              }
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.country}
              value={
                <CountryDisplay
                  country={person.country}
                  obsoleteCountry={person.obsoleteCountry}
                />
              }
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.code}
              value={person.code}
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.gender}
              value={person.gender}
            />

            <DictionaryField
              wrappedComponent={PreviewField}
              dictProps={Settings.fields.person.endOfTourDate}
              value={
                person.endOfTourDate &&
                moment(person.endOfTourDate).format(
                  Settings.dateFormats.forms.displayShort.date
                )
              }
            />
          </Col>
        </Row>

        <div className="preview-field-label">
          {Settings.fields.person.biography?.label}
        </div>
        <div className="preview-field-value">
          <RichTextEditor readOnly value={person.biography} />
        </div>
      </div>
      <h4>{Settings.fields.person.position?.label}</h4>
      <div className="preview-section">
        <div
          id="current-position"
          className={!position || !position.uuid ? "warning" : undefined}
        >
          {hasPosition
            ? renderPosition(position)
            : renderPositionBlankSlate(person)}
        </div>

        {hasPosition && (
          <div title={`Assigned ${assignedRole}`}>
            {renderCounterparts(position)}
          </div>
        )}
      </div>
      <br />
      <h4>{Settings.fields.person.prevPositions?.label}</h4>
      <div className="preview-section">
        <PreviousPositions history={person.previousPositions} />
      </div>
    </div>
  )

  function renderPosition(position) {
    return (
      <div style={{ textAlign: "center" }}>
        <h4>
          <LinkTo
            modelType="Position"
            model={position}
            className="position-name"
          />{" "}
          (
          <LinkTo modelType="Organization" model={position.organization} />)
        </h4>
      </div>
    )
  }

  function renderCounterparts(position) {
    return (
      <Form.Group controlId="counterparts">
        <Col sm={4}>
          <Form.Label>Counterpart of</Form.Label>
        </Col>
        <Col sm={12}>
          <Table striped hover responsive>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Organization</th>
              </tr>
            </thead>
            <tbody>
              {Position.map(position.associatedPositions, assocPos => (
                <tr key={assocPos.uuid}>
                  <td>
                    {assocPos.person && (
                      <LinkTo modelType="Person" model={assocPos.person} />
                    )}
                  </td>
                  <td>
                    <LinkTo modelType="Position" model={assocPos} />
                  </td>
                  <td>
                    <LinkTo
                      modelType="Organization"
                      model={assocPos.organization}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          {position.associatedPositions.length === 0 && (
            <em>{position.name} has no counterparts assigned</em>
          )}
        </Col>
      </Form.Group>
    )
  }
  function renderPositionBlankSlate(person) {
    // when the person is not in a position, any superuser can assign them.

    if (Person.isEqual(currentUser, person)) {
      return (
        <em>
          You are not assigned to a position. Contact your organization's
          superuser to be added.
        </em>
      )
    } else {
      return (
        <div style={{ textAlign: "center" }}>
          <p className="not-assigned-to-position-message">
            <em>{person.name} is not assigned to a position.</em>
          </p>
        </div>
      )
    }
  }
}

export default PersonPreview
