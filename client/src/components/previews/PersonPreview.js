import { gql } from "@apollo/client"
import API from "api"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import LinkTo from "components/LinkTo"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Col, Form, Table } from "react-bootstrap"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      status
      pendingVerification
      emailAddress
      phoneNumber
      domainUsername
      biography
      country
      gender
      endOfTourDate
      avatar(size: 256)
      code
      position {
        uuid
        name
        type
        organization {
          uuid
          shortName
          identificationCode
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

const PersonPreview = ({ className, uuid }) => {
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
  const assignedRole =
    position.type === Position.TYPE.PRINCIPAL
      ? Settings.fields.advisor.person.name
      : Settings.fields.principal.person.name

  // User can always edit themselves
  // Admins can always edit anybody
  // SuperUsers can edit people in their org, their descendant orgs, or un-positioned people.
  const isAdmin = currentUser && currentUser.isAdmin()
  const hasPosition = position && position.uuid

  return (
    <div className={`${className} preview-content-scroll`}>
      <div className="preview-sticky-title">
        <h4>{`${person.rank} ${person.name}`}</h4>
      </div>
      <div
        style={{
          backgroundColor: "white",
          padding: "15px 10px 15px 10px",
          borderRadius: "4px"
        }}
      >
        <div className="d-flex">
          <Col>
            <AvatarDisplayComponent
              avatar={person.avatar}
              className="large-person-avatar"
              height={256}
              width={256}
              style={{
                maxWidth: "70%"
              }}
            />
            <FieldHelper.ReadonlyField
              name="rank"
              label={Settings.fields.person.rank}
              field={{ id: "", value: person.rank }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="role"
              humanValue={Person.humanNameOfRole(person.role)}
              label="Role"
              field={{ id: "", value: person.role }}
              form={{ touched: "false" }}
            />
            {isAdmin && (
              <FieldHelper.ReadonlyField
                name="domainUsername"
                label="Domain username"
                field={{ id: "", value: person.domainUsername }}
                form={{ touched: "false" }}
              />
            )}
            <FieldHelper.ReadonlyField
              name="status"
              label="Status"
              humanValue={Person.humanNameOfStatus(person.status)}
              field={{ id: "", value: person.status }}
              form={{ touched: "false" }}
            />
          </Col>
          <Col>
            <FieldHelper.ReadonlyField
              name="phoneNumber"
              label={Settings.fields.person.phoneNumber}
              field={{ id: "", value: person.phoneNumber }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="emailAddress"
              label={Settings.fields.person.emailAddress.label}
              // humanValue={emailHumanValue}
              field={{ id: "", value: person.emailAddress }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="country"
              label={Settings.fields.person.country}
              field={{ id: "", value: person.country }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="code"
              label={Settings.fields.person.code}
              field={{ id: "", value: person.code }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="gender"
              label={Settings.fields.person.gender}
              field={{ id: "", value: person.gender }}
              form={{ touched: "false" }}
            />
            <FieldHelper.ReadonlyField
              name="endOfTourDate"
              label={Settings.fields.person.endOfTourDate}
              humanValue={
                person.endOfTourDate &&
                moment(person.endOfTourDate).format(
                  Settings.dateFormats.forms.displayShort.date
                )
              }
              field={{ id: "", value: 0 }}
              form={{ touched: "false" }}
            />
          </Col>
        </div>
        <FieldHelper.ReadonlyField
          name="biography"
          label="Bio"
          humanValue={parseHtmlWithLinkTo(person.biography)}
          field={{ id: "", value: 0 }}
          form={{ touched: "false" }}
          vertical
        />
      </div>
      <br />
      <h4>Position</h4>
      <div
        style={{
          backgroundColor: "white",
          padding: "15px 10px 15px 10px",
          borderRadius: "4px",
          marginTop: "1rem"
        }}
      >
        <div
          title="Current Position"
          id={"current-position"}
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
      {/* <h4>Person information</h4>
      {Settings.fields.person.customFields && (
        <div id="custom-fields">
          <ReadonlyCustomFields
            fieldsConfig={Settings.fields.person.customFields}
            values={{}}
          />
        </div>
      )} */}
      <h4>Previous positions</h4>
      <div
        style={{
          backgroundColor: "white",
          padding: "15px 10px 15px 10px",
          borderRadius: "4px",
          marginTop: "1rem"
        }}
      >
        {(_isEmpty(person.previousPositions) && (
          <em>No positions found</em>
        )) || (
          <Table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Dates</th>
              </tr>
            </thead>
            <tbody>
              {person.previousPositions.map((pp, idx) => (
                <tr key={idx} id={`previousPosition_${idx}`}>
                  <td>
                    <LinkTo modelType="Position" model={pp.position} />
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
        )}
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
    const assocTitle =
      position.type === Position.TYPE.PRINCIPAL ? "Is advised by" : "Advises"
    return (
      <Form.Group controlId="counterparts">
        <Col sm={1} as={Form.Text}>
          {assocTitle}
        </Col>
        <Col sm={9}>
          <Table>
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
    // when the person is not in a position, any super user can assign them.

    if (Person.isEqual(currentUser, person)) {
      return (
        <em>
          You are not assigned to a position. Contact your organization's super
          user to be added.
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

PersonPreview.propTypes = {
  className: PropTypes.string,
  uuid: PropTypes.string
}

export default PersonPreview
