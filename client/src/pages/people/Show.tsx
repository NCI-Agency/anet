import { gql } from "@apollo/client"
import { Icon, IconSize } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import AssignPositionModal from "components/AssignPositionModal"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import CountryDisplay from "components/CountryDisplay"
import { mapReadonlyCustomFieldsToComps } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EditAssociatedPositionsModal from "components/EditAssociatedPositionsModal"
import EditHistory from "components/EditHistory"
import EmailAddressTable from "components/EmailAddressTable"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS,
  SENSITIVE_CUSTOM_FIELDS_PARENT
} from "components/Model"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import PreviousPositions from "components/PreviousPositions"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Attachment, Person, Position } from "models"
import moment from "moment"
import { personTour } from "pages/GuidedTour"
import React, { useContext, useEffect, useState } from "react"
import {
  Button,
  Col,
  Container,
  FormGroup,
  FormLabel,
  OverlayTrigger,
  Row,
  Table,
  Tooltip
} from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import Settings from "settings"
import utils from "utils"

const GQL_GET_PERSON = gql`
  query($uuid: String!) {
    person(uuid: $uuid) {
      uuid
      name
      rank
      ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      status
      pendingVerification
      isSubscribed
      updatedAt
      phoneNumber
      user
      domainUsername
      openIdSubject
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
        role
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
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
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      authorizationGroups {
        uuid
        name
        description
      }
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      customFields
      ${GRAPHQL_CUSTOM_SENSITIVE_INFORMATION_FIELDS}
      ${GRAPHQL_ASSESSMENTS_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const GQL_UPDATE_PREVIOUS_POSITIONS = gql`
  mutation ($person: PersonInput!) {
    updatePersonHistory(person: $person)
  }
`

interface PersonShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const PersonShow = ({ pageDispatchers }: PersonShowProps) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
  const [attachments, setAttachments] = useState([])
  const [showAssignPositionModal, setShowAssignPositionModal] = useState(false)
  const [showAssociatedPositionsModal, setShowAssociatedPositionsModal] =
    useState(false)
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
  usePageTitle(data?.person && `${data.person.rank} ${data?.person.name}`)
  useEffect(() => {
    setAttachments(data?.person?.attachments || [])
  }, [data])
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
  const assignedRole = Settings.fields.regular.person.name

  // User can always edit themselves
  // Admins can always edit anybody
  // Superusers can edit people in their org, their descendant orgs, or un-positioned people.
  const isAdmin = currentUser?.isAdmin()
  const hasPosition = position?.uuid
  const canEdit =
    Person.isEqual(currentUser, person) ||
    isAdmin ||
    (hasPosition &&
      currentUser.hasAdministrativePermissionsForOrganization(
        position.organization
      )) ||
    (!hasPosition && currentUser.isSuperuser())
  // When the person is not in a position, any superuser can assign them.
  const canAssignPosition = currentUser.isSuperuser()
  const canAddPeriodicAssessment =
    Position.isRegular(position) &&
    (isAdmin ||
      currentUser.position.associatedPositions
        .filter(ap => ap.person)
        .map(ap => ap.person.uuid)
        .includes(person.uuid))
  const canAddOndemandAssessment = isAdmin
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(a => a.uuid === person?.entityAvatar?.attachmentUuid) &&
    person.entityAvatar

  const searchText = [person.name, person.code].join(" ")
  const action = (
    <>
      {isAdmin && (
        <Link
          id="mergeWithOther"
          to="/admin/merge/people"
          state={{ initialLeftUuid: person.uuid }}
          className="btn btn-outline-secondary"
        >
          Merge with other person
        </Link>
      )}
      <Button value="compactView" variant="primary" onClick={onCompactClick}>
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
      <FindObjectsButton objectLabel="Person" searchText={searchText} />
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
    </>
  )

  const extraColElems = {
    position: getPositionActions(),
    prevPositions: getPreviousPositionsActions()
  }

  // Keys of fields which should span over 2 columns
  const fullWidthFieldKeys = person.getFullWidthFields()

  const fullWidthFields = []
  const orderedFields = orderPersonFields()
    .filter(([el, key]) => {
      if (fullWidthFieldKeys.includes(key)) {
        fullWidthFields.push(cloneField([el, key], 2))
        return false
      }
      return true
    })
    .map(field => cloneField(field, 4))

  const numberOfFieldsUnderAvatar = person.getNumberOfFieldsInLeftColumn() || 6
  const leftColumnUnderAvatar = orderedFields.slice(
    0,
    numberOfFieldsUnderAvatar
  )
  const rightColumn = orderedFields.slice(numberOfFieldsUnderAvatar)

  return (
    <Formik enableReinitialize initialValues={person}>
      {() => {
        return (
          <div>
            <div className="float-end">
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
            <Messages error={stateError} success={stateSuccess} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                id="info"
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
                    {person.rank} {Person.militaryName(person.name)}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <Container fluid>
                  <Row>
                    <Col md={6} className="text-center">
                      <EntityAvatarDisplay
                        avatar={avatar}
                        defaultAvatar={Person.relatedObjectType}
                      />
                      {leftColumnUnderAvatar}
                    </Col>
                    <Col md={6}>{rightColumn}</Col>
                  </Row>
                  <Row>
                    <Col md={12}>{fullWidthFields}</Col>
                    {attachmentsEnabled && (
                      <Col md={12}>
                        <Field
                          name="attachments"
                          label="Attachments"
                          component={FieldHelper.ReadonlyField}
                          humanValue={
                            <AttachmentsDetailView
                              attachments={attachments}
                              updateAttachments={setAttachments}
                              relatedObjectType={Person.relatedObjectType}
                              relatedObjectUuid={person.uuid}
                              allowEdit={canEdit}
                            />
                          }
                        />
                      </Col>
                    )}
                  </Row>
                </Container>
              </Fieldset>

              {canEdit && (
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
                    canEdit && (
                      <Button
                        onClick={() => setShowAssociatedPositionsModal(true)}
                        variant="outline-secondary"
                      >
                        Change assigned {assignedRole}
                      </Button>
                    )
                  }
                >
                  {renderCounterparts(position)}
                  {canEdit && (
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
                  mainTitle="Edit position history"
                  history1={person.previousPositions}
                  initialHistory={person.previousPositions}
                  currentlyOccupyingEntity={person.position}
                  historyEntityType="position"
                  parentEntityUuid1={person.uuid}
                  showModal={showHistoryModal}
                  setShowModal={setShowHistoryModal}
                  setHistory={history => onSavePreviousPositions(history)}
                />
              )}
              <Fieldset title="Reports authored" id="reports-authored">
                <ReportCollection
                  paginationKey={`r_authored_${uuid}`}
                  queryParams={{
                    authorUuid: uuid
                  }}
                  mapId="reports-authored"
                />
              </Fieldset>
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
              canAddPeriodicAssessment={canAddPeriodicAssessment}
              canAddOndemandAssessment={canAddOndemandAssessment}
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
      user: {
        accessCond: isAdmin
      },
      domainUsername: {
        accessCond: isAdmin
      },
      openIdSubject: {
        accessCond: isAdmin
      }
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
    )
  }

  function cloneField([el, key], columnWidth) {
    return React.cloneElement(el, {
      key,
      extraColElem: extraColElems[key] || el.props.extraColElem || null,
      labelColumnWidth: columnWidth
    })
  }

  function mapNonCustomFields() {
    const classNameExceptions = {
      biography: "biography"
    }

    // map fields that have specific human value
    const humanValuesExceptions = {
      authorizationGroups: (
        <AuthorizationGroupTable
          authorizationGroups={person.authorizationGroups}
        />
      ),
      biography: <RichTextEditor readOnly value={person.biography} />,
      user: utils.formatBoolean(person.user),
      phoneNumber: person.phoneNumber || (
        <em>
          No {Settings.fields.person.phoneNumber.label.toLowerCase()} available
        </em>
      ),
      emailAddresses: (
        <EmailAddressTable
          label={Settings.fields.person.emailAddresses.label}
          emailAddresses={person.emailAddresses}
        />
      ),
      country: (
        <CountryDisplay
          country={person.country}
          obsoleteCountry={person.obsoleteCountry}
        />
      ),
      endOfTourDate:
        person.endOfTourDate &&
        moment(person.endOfTourDate).format(
          Settings.dateFormats.forms.displayShort.date
        ),
      position: getPositionHumanValue(),
      prevPositions: getPrevPositionsHumanValue(),
      status: Person.humanNameOfStatus(person.status)
    }
    return person.getNormalFieldsOrdered().reduce((accum, key) => {
      accum[key] = (
        <DictionaryField
          wrappedComponent={Field}
          dictProps={Settings.fields.person[key]}
          name={key}
          component={FieldHelper.ReadonlyField}
          humanValue={humanValuesExceptions[key]}
          className={classNameExceptions[key]}
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
      hasPosition && canEdit ? (
        <OverlayTrigger
          key="edit-position-overlay"
          placement="top"
          overlay={<Tooltip id="edit-position-tooltip">Edit position</Tooltip>}
        >
          <span>
            <LinkTo
              modelType="Position"
              model={position}
              edit
              button="primary"
              showIcon={false}
              showAvatar={false}
            >
              <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
            </LinkTo>
          </span>
        </OverlayTrigger>
      ) : null

    const changePositionButton =
      hasPosition && canEdit ? (
        <OverlayTrigger
          key="change-position-overlay"
          placement="top"
          overlay={
            <Tooltip id="change-position-tooltip">Change Position</Tooltip>
          }
        >
          <Button
            onClick={() => setShowAssignPositionModal(true)}
            className="change-assigned-position"
          >
            <Icon size={IconSize.LARGE} icon={IconNames.EXCHANGE} />
          </Button>
        </OverlayTrigger>
      ) : null

    const assignPositionButton =
      !hasPosition && canAssignPosition ? (
        <OverlayTrigger
          key="assign-position-overlay"
          placement="top"
          overlay={
            <Tooltip id="assign-position-tooltip">Assign a position</Tooltip>
          }
        >
          <Button onClick={() => setShowAssignPositionModal(true)}>
            <Icon size={IconSize.LARGE} icon={IconNames.INSERT} />
          </Button>
        </OverlayTrigger>
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
      <OverlayTrigger
        key="edit-history-overlay"
        placement="top"
        overlay={<Tooltip id="edit-history-tooltip">Edit history</Tooltip>}
      >
        <Button
          onClick={() => setShowHistoryModal(true)}
          className="edit-history"
        >
          <Icon size={IconSize.LARGE} icon={IconNames.EDIT} />
        </Button>
      </OverlayTrigger>
    ) : null

    return <>{editHistoryButton}</>
  }

  function getPrevPositionsHumanValue() {
    return <PreviousPositions history={person.previousPositions} />
  }

  function renderCounterparts(position) {
    return (
      <FormGroup controlId="counterparts">
        <Col sm={4}>
          <FormLabel>Counterpart of</FormLabel>
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
      navigate("compact")
    }
  }

  function onSavePreviousPositions(history) {
    const newPerson = person.filterClientSideFields()
    newPerson.previousPositions = history
    API.mutation(GQL_UPDATE_PREVIOUS_POSITIONS, { person: newPerson })
      .then(data => {
        refetch()
      })
      .catch(error => {
        setStateError(error)
        jumpToTop()
      })
  }
}

export default connect(null, mapPageDispatchersToProps)(PersonShow)
