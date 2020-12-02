import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { mapReadonlyCustomFieldsToComps } from "components/CustomFieldsReadonly"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import PropTypes from "prop-types"
import React, { useContext } from "react"
import { Col, ControlLabel, FormGroup, Grid, Row, Table } from "react-bootstrap"
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

  const { data } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })

  if (!data) {
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

        const orderedFields = orderPersonFields()
        const numberOfFieldsUnderAvatar =
          Settings.fields.person.numberOfFieldsInLeftColumn || 6
        const leftColumUnderAvatar = orderedFields.slice(
          0,
          numberOfFieldsUnderAvatar
        )
        const rightColum = orderedFields.slice(numberOfFieldsUnderAvatar)

        return (
          <div className={className}>
            <Form className="form-horizontal" method="post">
              <Fieldset title={`${person.rank} ${person.name}`} />
              <Fieldset>
                <Grid fluid>
                  <Row>
                    <Col md={6}>
                      <AvatarDisplayComponent
                        avatar={person.avatar}
                        className="large-person-avatar"
                        height={256}
                        width={256}
                        style={{
                          maxWidth: "100%"
                        }}
                      />
                      {leftColumUnderAvatar}
                    </Col>
                    <Col md={6}>{rightColum}</Col>
                  </Row>
                </Grid>
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
                            <LinkToNotPreviewed
                              modelType="Position"
                              model={pp.position}
                            />
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

        function orderPersonFields() {
          const mappedCustomFields = mapReadonlyCustomFieldsToComps({
            fieldsConfig: Person.shownCustomFields,
            values
          })
          const mappedNonCustomFields = mapNonCustomFields()
          // map fields that have privileged access check to the condition
          const privilegedAccessedFields = {
            domainUsername: {
              accessCond: isAdmin
            }
          }
          return (
            Settings.fields.person.showPageOrderedFields
              // first filter if there is privileged accessed fields and its access condition is true
              .filter(key =>
                privilegedAccessedFields[key]
                  ? privilegedAccessedFields[key].accessCond
                  : true
              )
              // then map it to components and keys, keys used for React list rendering
              .map(key => [
                mappedNonCustomFields[key] || mappedCustomFields[key],
                key
              ])
              .map(([el, key]) =>
                React.cloneElement(el, {
                  key,
                  extraColElem: null,
                  labelColumnWidth: 4
                })
              )
          )
        }

        function mapNonCustomFields() {
          const classNameExceptions = {
            biography: "biography"
          }

          // map fields that have specific human values
          const humanValuesExceptions = {
            status: Person.humanNameOfStatus(values.status),
            emailAddress: emailHumanValue,
            endOfTourDate:
              person.endOfTourDate &&
              moment(person.endOfTourDate).format(
                Settings.dateFormats.forms.displayShort.date
              ),
            role: Person.humanNameOfRole(values.role),
            biography: parseHtmlWithLinkTo(person.biography, LinkToNotPreviewed)
          }
          return Person.shownStandardFields.reduce((accum, key) => {
            accum[key] = (
              <Field
                name={key}
                label={
                  Settings.fields.person[key]?.label ||
                  Settings.fields.person[key]
                }
                component={FieldHelper.ReadonlyField}
                humanValue={humanValuesExceptions[key]}
                className={classNameExceptions[key]}
              />
            )

            return accum
          }, {})
        }
      }}
    </Formik>
  )

  function renderPosition(position) {
    return (
      <div style={{ textAlign: "center" }}>
        <h4>
          <LinkToNotPreviewed
            modelType="Position"
            model={position}
            className="position-name"
          />{" "}
          (
          <LinkToNotPreviewed
            modelType="Organization"
            model={position.organization}
          />
          )
        </h4>
      </div>
    )
  }

  function renderCounterparts(position) {
    const assocTitle =
      position.type === Position.TYPE.PRINCIPAL ? "Is advised by" : "Advises"
    return (
      <FormGroup controlId="counterparts">
        <Col sm={2} componentClass={ControlLabel}>
          {assocTitle}
        </Col>
        <Col sm={10}>
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
                      <LinkToNotPreviewed
                        modelType="Person"
                        model={assocPos.person}
                      />
                    )}
                  </td>
                  <td>
                    <LinkToNotPreviewed modelType="Position" model={assocPos} />
                  </td>
                  <td>
                    <LinkToNotPreviewed
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
