import { gql } from "@apollo/client"
import { Icon, IconSize, Tooltip } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import AssignPositionModal from "components/AssignPositionModal"
import AvatarDisplayComponent from "components/AvatarDisplayComponent"
import { mapReadonlyCustomFieldsToComps } from "components/CustomFields"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import EditHistory from "components/EditHistory"
import { parseHtmlWithLinkTo } from "components/editor/LinkAnet"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
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
import {
  Button,
  Col,
  ControlLabel,
  FormGroup,
  Grid,
  Row,
  Table
} from "react-bootstrap"
import { connect } from "react-redux"
import { useHistory, useLocation, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"
import PreviousPositions from "./PreviousPositions"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      role
      status
      pendingVerification
      isSubscribed
      updatedAt
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
      ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const GQL_UPDATE_PREVIOUS_POSITIONS = gql`
  mutation($person: PersonInput!) {
    updatePreviousPositions(person: $person)
  }
`

const PersonShow = ({ pageDispatchers }) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const history = useHistory()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
  const [showAssignPositionModal, setShowAssignPositionModal] = useState(false)
  const [
    showAssociatedPositionsModal,
    setShowAssociatedPositionsModal
  ] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
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
    if (data.person.customSensitiveInformation) {
      // Add sensitive information fields to formCustomFields
      data.person[SENSITIVE_CUSTOM_FIELDS_PARENT] = utils.parseSensitiveFields(
        data.person.customSensitiveInformation
      )
    }
  }
  const person = new Person(data ? data.person : {})
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
  const canAddAssessment =
    isAdmin ||
    currentUser.position.associatedPositions
      .filter(ap => ap.person)
      .map(ap => ap.person.uuid)
      .includes(person.uuid)

  const action = (
    <div>
      <Button
        value="compactView"
        type="button"
        bsStyle="primary"
        onClick={onCompactClick}
      >
        Summary / Print
      </Button>
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

  const orderedFields = orderPersonFields()
  const numberOfFieldsUnderAvatar = person.getNumberOfFieldsInLeftColumn() || 6
  const leftColumUnderAvatar = orderedFields.slice(0, numberOfFieldsUnderAvatar)
  const rightColum = orderedFields.slice(numberOfFieldsUnderAvatar)
  return (
    <Formik enableReinitialize initialValues={person}>
      {() => {
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
            />
            <Messages error={stateError} success={stateSuccess} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={
                  <>
                    {
                      <SubscriptionIcon
                        subscribedObjectType="people"
                        subscribedObjectUuid={person.uuid}
                        isSubscribed={person.isSubscribed}
                        updatedAt={person.updatedAt}
                        refetch={refetch}
                        setError={error => {
                          setStateError(error)
                          jumpToTop()
                        }}
                        persistent
                      />
                    }{" "}
                    {person.rank} {person.name}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <Grid fluid>
                  <Row>
                    <Col md={6}>
                      <AvatarDisplayComponent
                        avatar={person.avatar}
                        height={256}
                        width={256}
                        style={{
                          maxWidth: "100%",
                          display: "block",
                          margin: "0 auto",
                          marginBottom: "10px"
                        }}
                      />
                      {leftColumUnderAvatar}
                    </Col>
                    <Col md={6}>{rightColum}</Col>
                  </Row>
                </Grid>
              </Fieldset>
              {canChangePosition && (
                <AssignPositionModal
                  showModal={showAssignPositionModal}
                  person={person}
                  onCancel={() => hideAssignPositionModal(false)}
                  onSuccess={() => hideAssignPositionModal(true)}
                />
              )}

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
              {isAdmin && (
                <EditHistory
                  history1={person.previousPositions}
                  initialHistory={person.previousPositions}
                  historyComp={PreviousPositions}
                  currentlyOccupyingEntity={person.position}
                  midColTitle="New History"
                  externalButton
                  historyEntityType="position"
                  parentEntityType={person.role}
                  showModal={showHistoryModal}
                  setShowModal={setShowHistoryModal}
                  setHistory={history => onSavePreviousPositions(history)}
                />
              )}
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
            </Form>
            <AssessmentResultsContainer
              entity={person}
              entityType={Person}
              canAddAssessment={canAddAssessment}
              onUpdateAssessment={() => {
                loadAppData()
                refetch()
              }}
            />
          </div>
        )
      }}
    </Formik>
  )

  function orderPersonFields() {
    const mappedCustomFields = mapReadonlyCustomFieldsToComps({
      fieldsConfig: person.getCustomFieldsOrderedAsObject(),
      values: person
    })
    const mappedSensitiveFields = mapReadonlyCustomFieldsToComps({
      fieldsConfig: person.getSensitiveFieldsOrderedAsObject(),
      parentFieldName: SENSITIVE_CUSTOM_FIELDS_PARENT,
      values: person
    })
    const mappedNonCustomFields = mapNonCustomFields()
    // map fields that have privileged access check to the condition
    const privilegedAccessedFields = {
      domainUsername: {
        accessCond: isAdmin
      }
    }

    const extraColElems = {
      position: getPositionActions(),
      prevPositions: getPreviousPositionsActions()
    }

    return (
      person
        .getShowPageFieldsOrdered()
        // first filter if there is privileged accessed fields and its access condition is true
        .filter(key =>
          privilegedAccessedFields[key]
            ? privilegedAccessedFields[key].accessCond
            : true
        )
        // filter out unauthorized sensitive fields
        .filter(
          key =>
            !Object.keys(Person.customSensitiveInformation).includes(key) ||
            Person.isAuthorized(
              currentUser,
              Person.customSensitiveInformation?.[key],
              position
            )
        )
        // Also filter if somehow there is no field in both maps
        .filter(
          key =>
            mappedNonCustomFields[key] ||
            mappedCustomFields[key] ||
            mappedSensitiveFields[key]
        )
        // then map it to components and keys, keys used for React list rendering
        .map(key => [
          mappedNonCustomFields[key] ||
            mappedCustomFields[key] ||
            mappedSensitiveFields[key],
          key
        ])
        .map(([el, key]) =>
          React.cloneElement(el, {
            key,
            extraColElem: extraColElems[key] || el.props.extraColElem,
            labelColumnWidth: 4
          })
        )
    )
  }

  function mapNonCustomFields() {
    const classNameExceptions = {
      biography: "biography"
    }

    const idExceptions = {
      position: "current-position"
    }
    // map fields that have specific human person
    const humanValuesExceptions = {
      biography: parseHtmlWithLinkTo(person.biography),
      emailAddress: emailHumanValue,
      endOfTourDate:
        person.endOfTourDate &&
        moment(person.endOfTourDate).format(
          Settings.dateFormats.forms.displayShort.date
        ),
      position: getPositionHumanValue(),
      prevPositions: getPrevPositionsHumanValue(),
      role: Person.humanNameOfRole(person.role),
      status: Person.humanNameOfStatus(person.status)
    }
    return person.getNormalFieldsOrdered().reduce((accum, key) => {
      accum[key] = (
        <Field
          name={key}
          label={
            Settings.fields.person[key]?.label || Settings.fields.person[key]
          }
          component={FieldHelper.ReadonlyField}
          humanValue={humanValuesExceptions[key]}
          className={classNameExceptions[key]}
          id={idExceptions[key]}
        />
      )

      return accum
    }, {})
  }

  function getPositionHumanValue() {
    return hasPosition ? (
      <>
        <LinkTo
          modelType="Position"
          model={position}
          className="position-name"
        />{" "}
        (
        <LinkTo modelType="Organization" model={position.organization} />)
      </>
    ) : (
      "<none>"
    )
  }

  function getPositionActions() {
    const editPositionButton =
      hasPosition && canChangePosition ? (
        <Tooltip content="Edit position" position="top">
          <LinkTo
            modelType="Position"
            model={position}
            edit
            button="primary"
            showIcon={false}
            showAvatar={false}
          >
            <Icon iconSize={IconSize.LARGE} icon={IconNames.EDIT} />
          </LinkTo>
        </Tooltip>
      ) : null

    const changePositionButton =
      hasPosition && canChangePosition ? (
        <Tooltip content="Change position" position="top">
          <Button
            onClick={() => setShowAssignPositionModal(true)}
            bsStyle="primary"
            className="change-assigned-position"
          >
            <Icon iconSize={IconSize.LARGE} icon={IconNames.EXCHANGE} />
          </Button>
        </Tooltip>
      ) : null

    // when the person is not in a position, any super user can assign them.
    const canAssignPosition = currentUser.isSuperUser()

    const assignPositionButton =
      !hasPosition && canAssignPosition ? (
        <Tooltip content="Assign a position" position="top">
          <Button
            onClick={() => setShowAssignPositionModal(true)}
            bsStyle="primary"
          >
            <Icon iconSize={IconSize.LARGE} icon={IconNames.INSERT} />
          </Button>
        </Tooltip>
      ) : null

    // if current user has no access for position actions return null so extraColElem will disappear
    if (!(editPositionButton || changePositionButton || assignPositionButton)) {
      return null
    }

    return (
      <>
        {editPositionButton}
        {changePositionButton}
        {assignPositionButton}
      </>
    )
  }

  function getPreviousPositionsActions() {
    const editHistoryButton = isAdmin ? (
      <Tooltip content="Edit history" position="top">
        <Button
          onClick={() => setShowHistoryModal(true)}
          bsStyle="primary"
          className="edit-history"
        >
          <Icon iconSize={IconSize.LARGE} icon={IconNames.EDIT} />
        </Button>
      </Tooltip>
    ) : null

    return <>{editHistoryButton}</>
  }

  function getPrevPositionsHumanValue() {
    return _isEmpty(person.previousPositions) ? (
      <em>No positions found</em>
    ) : (
      <Table id="previous-positions">
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

  function onCompactClick() {
    if (!_isEmpty(person)) {
      history.push(`${person.uuid}/compact`)
    }
  }

  function onSavePreviousPositions(history) {
    const newPerson = person.filterClientSideFields()
    newPerson.previousPositions = history
    API.mutation(GQL_UPDATE_PREVIOUS_POSITIONS, { person: newPerson })
      .then(data =>
        history.push(Person.pathFor(person), { success: "History edited" })
      )
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

PersonShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

export default connect(null, mapPageDispatchersToProps)(PersonShow)
