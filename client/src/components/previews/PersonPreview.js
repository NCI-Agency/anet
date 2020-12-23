import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { ReadonlyCustomFields } from "components/CustomFields"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Col, ControlLabel, FormGroup, Table } from "react-bootstrap"
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

const PersonPreview = ({ className, uuid, previewId }) => {
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
    <Formik enableReinitialize initialValues={person}>
      {({ values }) => {
        const emailHumanValue = (
          <a href={`mailto:${person.emailAddress}`}>{person.emailAddress}</a>
        )

        return (
          <div className={className}>
            <Form className="form-horizontal" method="post">
              <Fieldset title={`${person.rank} ${person.name}`} />
              <Fieldset>
                <AvatarDisplayComponent
                  avatar={person.avatar}
                  className="large-person-avatar"
                  height={256}
                  width={256}
                  style={{
                    maxWidth: "100%"
                  }}
                />
                <Field
                  name="rank"
                  label={Settings.fields.person.rank}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="role"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Person.humanNameOfRole(values.role)}
                />
                {isAdmin && (
                  <Field
                    name="domainUsername"
                    component={FieldHelper.ReadonlyField}
                  />
                )}
                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Person.humanNameOfStatus(values.status)}
                />
                <Field
                  name="phoneNumber"
                  label={Settings.fields.person.phoneNumber}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="emailAddress"
                  label={Settings.fields.person.emailAddress.label}
                  component={FieldHelper.ReadonlyField}
                  humanValue={emailHumanValue}
                />
                <Field
                  name="country"
                  label={Settings.fields.person.country}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="code"
                  label={Settings.fields.person.code}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="gender"
                  label={Settings.fields.person.gender}
                  component={FieldHelper.ReadonlyField}
                />
                <Field
                  name="endOfTourDate"
                  label={Settings.fields.person.endOfTourDate}
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    person.endOfTourDate &&
                    moment(person.endOfTourDate).format(
                      Settings.dateFormats.forms.displayShort.date
                    )
                  }
                />
                <Field
                  name="biography"
                  className="biography"
                  component={FieldHelper.ReadonlyField}
                  humanValue={parseHtmlWithLinkTo(person.biography, LinkTo)}
                />
              </Fieldset>
              <Fieldset title="Position">
                <Fieldset
                  title="Current Position"
                  id={`current-position-${previewId}`}
                  className={
                    !position || !position.uuid ? "warning" : undefined
                  }
                >
                  {hasPosition
                    ? renderPosition(position)
                    : renderPositionBlankSlate(person)}
                </Fieldset>

                {hasPosition && (
                  <Fieldset title={`Assigned ${assignedRole}`}>
                    {renderCounterparts(position)}
                  </Fieldset>
                )}
              </Fieldset>
              {Settings.fields.person.customFields && (
                <Fieldset title="Person information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.person.customFields}
                    values={values}
                    linkToComp={LinkTo}
                  />
                </Fieldset>
              )}
              <Fieldset
                title="Previous positions"
                id={`previous-positions-${previewId}`}
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
                        <tr
                          key={idx}
                          id={`previousPosition_${idx}-${previewId}`}
                        >
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
              </Fieldset>
            </Form>
          </div>
        )
      }}
    </Formik>
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
      <FormGroup controlId="counterparts">
        <Col sm={1} componentClass={ControlLabel}>
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
      </FormGroup>
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
  previewId: PropTypes.string,
  uuid: PropTypes.string
}
export default PersonPreview
