import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import AssignPositionModal from "components/AssignPositionModal"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { ReadonlyCustomFields } from "components/CustomFields"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Position } from "models"
import moment from "moment"
import { personTour } from "pages/HopscotchTour"
import React, { useContext, useState } from "react"
import { Button, Col, ControlLabel, FormGroup, Table } from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import { parseHtmlWithLinkTo } from "utils_links"

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
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const PersonShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
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
    pageDispatchers
  })
  if (done) {
    return result
  }
  if (data) {
    data.person[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.person.customFields
    )
  }
  const person = new Person(data ? data.person : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
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
  const canAddAssessment = currentUser.position.associatedPositions
    .filter(ap => ap.person)
    .map(ap => ap.person.uuid)
    .includes(person.uuid)
  return (
    <Formik enableReinitialize initialValues={person}>
      {({ values }) => {
        const action = (
          <div>
            {canEdit && (
              <LinkTo
                modelType="Person"
                model={person}
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
                  relatedObjectType: Person.relatedObjectType,
                  relatedObjectUuid: person.uuid,
                  relatedObject: person
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
                  humanValue={parseHtmlWithLinkTo(person.biography)}
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
                        <LinkTo
                          modelType="Position"
                          model={position}
                          edit
                          button="default"
                        >
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

              {Settings.fields.person.customFields && (
                <Fieldset title="Person information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.person.customFields}
                    values={values}
                  />
                </Fieldset>
              )}
            </Form>

            <AssessmentResultsContainer
              entity={person}
              entityType={Person}
              canAddAssessment={canAddAssessment}
              onUpdateAssessment={refetch}
            />
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
    const canChangePosition = currentUser.isSuperUser()

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

PersonShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PersonShow)
