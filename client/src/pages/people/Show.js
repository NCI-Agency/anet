import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API, { Settings } from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AssignPositionModal from "components/AssignPositionModal"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { ReadonlyCustomFields } from "components/CustomFields"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  mapDispatchToProps,
  propTypes as pagePropTypes,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection, {
  FORMAT_MAP,
  FORMAT_SUMMARY,
  FORMAT_TABLE,
  FORMAT_CALENDAR
} from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import { personTour } from "pages/HopscotchTour"
import PropTypes from "prop-types"
import React, { useState } from "react"
import { Button, Col, ControlLabel, FormGroup, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      status
      emailAddress
      phoneNumber
      domainUsername
      biography
      country
      gender
      endOfTourDate
      avatar(size: 256)
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
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const BasePersonShow = props => {
  const routerLocation = useLocation()
  const [showAssignPositionModal, setShowAssignPositionModal] = useState(false)
  const [
    showAssociatedPositionsModal,
    setShowAssociatedPositionsModal
  ] = useState(false)
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(GQL_GET_PERSON, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "User",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    ...props
  })
  if (done) {
    return result
  }
  if (data) {
    data.person.formCustomFields = JSON.parse(data.person.customFields)
  }
  const person = new Person(data ? data.person : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const { currentUser, ...myFormProps } = props
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
  const canEdit =
    Person.isEqual(currentUser, person) ||
    isAdmin ||
    (hasPosition && currentUser.isSuperUserForOrg(position.organization)) ||
    (!hasPosition && currentUser.isSuperUser()) ||
    (person.role === Person.ROLE.PRINCIPAL && currentUser.isSuperUser())
  const canChangePosition =
    isAdmin ||
    (!hasPosition && currentUser.isSuperUser()) ||
    (hasPosition && currentUser.isSuperUserForOrg(position.organization)) ||
    (person.role === Person.ROLE.PRINCIPAL && currentUser.isSuperUser())

  return (
    <Formik enableReinitialize initialValues={person} {...myFormProps}>
      {({ values }) => {
        const action = (
          <div>
            {canEdit && (
              <LinkTo
                person={person}
                edit
                button="primary"
                className="edit-person"
              >
                Edit
              </LinkTo>
            )}
          </div>
        )
        const emailHumanValue = (
          <a href={`mailto:${person.emailAddress}`}>{person.emailAddress}</a>
        )

        return (
          <div>
            <div className="pull-right">
              <GuidedTour
                title="Take a guided tour of this person's page."
                tour={personTour}
                autostart={
                  localStorage.newUser === "true" &&
                  localStorage.hasSeenPersonTour !== "true"
                }
                onEnd={() => (localStorage.hasSeenPersonTour = "true")}
              />
            </div>

            <RelatedObjectNotes
              notes={person.notes}
              relatedObject={
                person.uuid && {
                  relatedObjectType: "people",
                  relatedObjectUuid: person.uuid
                }
              }
              relatedObjectValue={person}
            />
            <Messages error={stateError} success={stateSuccess} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`${person.rank} ${person.name}`}
                action={action}
              />
              <Fieldset>
                <AvatarDisplayComponent
                  avatar={person.avatar}
                  height={256}
                  width={256}
                />
                <Field
                  name="rank"
                  label={Settings.fields.person.rank}
                  component={FieldHelper.renderReadonlyField}
                />
                <Field
                  name="role"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={Person.humanNameOfRole(values.role)}
                />
                {isAdmin && (
                  <Field
                    name="domainUsername"
                    component={FieldHelper.renderReadonlyField}
                  />
                )}
                <Field
                  name="status"
                  component={FieldHelper.renderReadonlyField}
                  humanValue={Person.humanNameOfStatus(values.status)}
                />
                <Field
                  name="phoneNumber"
                  label={Settings.fields.person.phoneNumber}
                  component={FieldHelper.renderReadonlyField}
                />
                <Field
                  name="emailAddress"
                  label={Settings.fields.person.emailAddress}
                  component={FieldHelper.renderReadonlyField}
                  humanValue={emailHumanValue}
                />
                <Field
                  name="country"
                  label={Settings.fields.person.country}
                  component={FieldHelper.renderReadonlyField}
                />
                <Field
                  name="gender"
                  label={Settings.fields.person.gender}
                  component={FieldHelper.renderReadonlyField}
                />
                <Field
                  name="endOfTourDate"
                  label={Settings.fields.person.endOfTourDate}
                  component={FieldHelper.renderReadonlyField}
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
                  component={FieldHelper.renderReadonlyField}
                  humanValue={
                    <div
                      dangerouslySetInnerHTML={{ __html: person.biography }}
                    />
                  }
                />
              </Fieldset>

              <Fieldset title="Position">
                <Fieldset
                  title="Current Position"
                  id="current-position"
                  className={
                    !position || !position.uuid ? "warning" : undefined
                  }
                  action={
                    hasPosition &&
                    canChangePosition && (
                      <div>
                        <LinkTo position={position} edit button="default">
                          Edit position details
                        </LinkTo>
                        <Button
                          onClick={() => setShowAssignPositionModal(true)}
                          className="change-assigned-position"
                        >
                          Change assigned position
                        </Button>
                      </div>
                    )
                  }
                >
                  {hasPosition
                    ? renderPosition(position)
                    : renderPositionBlankSlate(person)}
                  {canChangePosition && (
                    <AssignPositionModal
                      showModal={showAssignPositionModal}
                      person={person}
                      onCancel={() => hideAssignPositionModal(false)}
                      onSuccess={() => hideAssignPositionModal(true)}
                    />
                  )}
                </Fieldset>

                {hasPosition && (
                  <Fieldset
                    title={`Assigned ${assignedRole}`}
                    action={
                      canChangePosition && (
                        <Button
                          onClick={() => setShowAssociatedPositionsModal(true)}
                        >
                          Change assigned {assignedRole}
                        </Button>
                      )
                    }
                  >
                    {renderCounterparts(position)}
                    {canChangePosition && (
                      <EditAssociatedPositionsModal
                        position={position}
                        showModal={showAssociatedPositionsModal}
                        onCancel={() => hideAssociatedPositionsModal(false)}
                        onSuccess={() => hideAssociatedPositionsModal(true)}
                      />
                    )}
                  </Fieldset>
                )}
              </Fieldset>

              {person.isAdvisor() && (
                <Fieldset title="Reports authored" id="reports-authored">
                  <ReportCollection
                    paginationKey={`r_authored_${uuid}`}
                    queryParams={{
                      authorUuid: uuid
                    }}
                    viewFormats={[
                      FORMAT_CALENDAR,
                      FORMAT_SUMMARY,
                      FORMAT_TABLE,
                      FORMAT_MAP
                    ]}
                    mapId="reports-authored"
                  />
                </Fieldset>
              )}

              <Fieldset
                title={`Reports attended by ${person.name}`}
                id="reports-attended"
              >
                <ReportCollection
                  paginationKey={`r_attended_${uuid}`}
                  queryParams={{
                    attendeeUuid: uuid
                  }}
                  mapId="reports-attended"
                />
              </Fieldset>

              <Fieldset title="Previous positions" id="previous-positions">
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
                            <LinkTo position={pp.position} />
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

              {Settings.fields.person.customFields && (
                <Fieldset title="Person information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.person.customFields}
                    formikProps={{
                      values
                    }}
                  />
                </Fieldset>
              )}
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
          <LinkTo position={position} className="position-name" /> (
          <LinkTo organization={position.organization} />)
        </h4>
      </div>
    )
  }

  function renderCounterparts(position) {
    let assocTitle =
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
                    {assocPos.person && <LinkTo person={assocPos.person} />}
                  </td>
                  <td>
                    <LinkTo position={assocPos} />
                  </td>
                  <td>
                    <LinkTo organization={assocPos.organization} />
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
    const { currentUser } = props
    // when the person is not in a position, any super user can assign them.
    let canChangePosition = currentUser.isSuperUser()

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
          {canChangePosition && (
            <p>
              <Button onClick={() => setShowAssignPositionModal(true)}>
                Assign position
              </Button>
            </p>
          )}
        </div>
      )
    }
  }

  function hideAssignPositionModal(success) {
    setShowAssignPositionModal(false)
    if (success) {
      refetch()
    }
  }

  function hideAssociatedPositionsModal(success) {
    setShowAssociatedPositionsModal(false)
    if (success) {
      refetch()
    }
  }
}

BasePersonShow.propTypes = {
  ...pagePropTypes,
  currentUser: PropTypes.instanceOf(Person)
}

const PersonShow = props => (
  <AppContext.Consumer>
    {context => <BasePersonShow currentUser={context.currentUser} {...props} />}
  </AppContext.Consumer>
)

export default connect(null, mapDispatchToProps)(PersonShow)
