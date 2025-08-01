import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import App6SymbolPreview from "components/App6SymbolPreview"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import AttachmentsDetailView from "components/Attachment/AttachmentsDetailView"
import AuthorizationGroupTable from "components/AuthorizationGroupTable"
import EntityAvatarDisplay from "components/avatar/EntityAvatarDisplay"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import EmailAddressTable from "components/EmailAddressTable"
import EventCollection from "components/EventCollection"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS,
  GRAPHQL_NOTES_FIELDS
} from "components/Model"
import { AnchorNavItem } from "components/Nav"
import {
  jumpToTop,
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  SubscriptionIcon,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import RelatedObjectNotes from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import SubNav from "components/SubNav"
import { Field, Form, Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Attachment, Location, Organization, Report } from "models"
import { PositionRole } from "models/Position"
import { orgTour } from "pages/GuidedTour"
import pluralize from "pluralize"
import { getPositionsForRole } from "positionUtil"
import React, { useContext, useEffect, useState } from "react"
import {
  Badge,
  Button,
  Col,
  FormCheck,
  FormGroup,
  ListGroup,
  ListGroupItem,
  Nav,
  Row
} from "react-bootstrap"
import { connect } from "react-redux"
import { Link, useLocation, useParams } from "react-router-dom"
import { RECURSE_STRATEGY } from "searchUtils"
import Settings from "settings"
import utils from "utils"
import OrganizationLaydown from "./Laydown"
import OrganizationTasks from "./OrganizationTasks"

const GQL_LOCATION_FIELDS = `
  fragment locationFields on Location {
    uuid
    name
    type
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
  }
`
const GQL_ORGANIZATION_FIELDS = `
  fragment organizationFields on Organization {
    uuid
    shortName
    longName
    identificationCode
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    uuid
    name
    rank
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
    status
  }
`
const GQL_POSITION_FIELDS = `
  fragment positionFields on Position {
    uuid
    name
    code
    status
    type
    role
    ${GRAPHQL_ENTITY_AVATAR_FIELDS}
  }
`
const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ...organizationFields
      status
      isSubscribed
      profile
      app6context
      app6standardIdentity
      app6symbolSet
      app6hq
      app6amplifier
      app6entity
      app6entityType
      app6entitySubtype
      app6sectorOneModifier
      app6sectorTwoModifier
      updatedAt
      emailAddresses {
        network
        address
      }
      location {
        ...locationFields
        lat
        lng
      }
      parentOrg {
        ...organizationFields
      }
      childrenOrgs(query: { status: ACTIVE }) {
        ...organizationFields
      }
      ascendantOrgs(query: { status: ACTIVE }) {
        ...organizationFields
        app6context
        app6standardIdentity
        app6symbolSet
        parentOrg {
          uuid
        }
        administratingPositions {
          ...positionFields
          location {
            ...locationFields
          }
          organization {
            ...organizationFields
          }
          person {
            ...personFields
          }
        }
      }
      positions {
        ...positionFields
        person {
          ...personFields
        }
        associatedPositions {
          ...positionFields
          person {
          ...personFields
          }
        }
      }
      planningApprovalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            ...personFields
          }
        }
      }
      approvalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            ...personFields
          }
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
      ${GRAPHQL_ASSESSMENTS_FIELDS}
      ${GRAPHQL_NOTES_FIELDS}
    }
  }

  ${GQL_LOCATION_FIELDS}
  ${GQL_ORGANIZATION_FIELDS}
  ${GQL_PERSON_FIELDS}
  ${GQL_POSITION_FIELDS}
`

interface OrganizationShowProps {
  pageDispatchers?: PageDispatchersPropType
}

const OrganizationShow = ({ pageDispatchers }: OrganizationShowProps) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
  const [attachments, setAttachments] = useState([])
  const [filterPendingApproval, setFilterPendingApproval] = useState(false)
  const [includeChildrenOrgs, setIncludeChildrenOrgs] = useState(true)
  const { uuid } = useParams()
  const { loading, error, data, refetch } = API.useApiQuery(
    GQL_GET_ORGANIZATION,
    {
      uuid
    }
  )
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(data?.organization?.shortName)
  useEffect(() => {
    setAttachments(data?.organization?.attachments || [])
  }, [data])
  if (done) {
    return result
  }
  if (data) {
    data.organization[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.organization.customFields
    )
  }
  const organization = new Organization(data ? data.organization : {})

  const isAdmin = currentUser?.isAdmin()
  const canAdministrateOrg =
    currentUser?.hasAdministrativePermissionsForOrganization(organization)
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled
  const avatar =
    attachments?.some(
      a => a.uuid === organization?.entityAvatar?.attachmentUuid
    ) && organization.entityAvatar

  const myOrg =
    currentUser && currentUser.position
      ? currentUser.position.organization
      : null
  const isMyOrg = myOrg && organization.uuid === myOrg.uuid
  const orgSubNav = (
    <Nav className="flex-column">
      <span id="style-nav">
        <Nav.Item>
          <AnchorNavItem to="info">Info</AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="orgChart">Diagram</AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="supportedPositions">
            Supported positions
          </AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="vacantPositions">Vacant positions</AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="administratingPositions">
            {Settings.fields.organization.administratingPositions.label}
          </AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="planningApprovals">Approvals</AnchorNavItem>
        </Nav.Item>
        {organization.isTaskEnabled() && (
          <Nav.Item>
            <AnchorNavItem to="tasks">
              {pluralize(Settings.fields.task.shortLabel)}
            </AnchorNavItem>
          </Nav.Item>
        )}
        <Nav.Item>
          <AnchorNavItem to="events">Events</AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="reports">Reports</AnchorNavItem>
        </Nav.Item>
      </span>
    </Nav>
  )
  const reportQueryParams = {
    orgUuid: uuid
  }
  const eventQueryParams = {
    hostOrgUuid: uuid
  }
  if (filterPendingApproval) {
    reportQueryParams.state = Report.STATE.PENDING_APPROVAL
  }
  if (includeChildrenOrgs) {
    reportQueryParams.orgRecurseStrategy = RECURSE_STRATEGY.CHILDREN
  }

  return (
    <Formik enableReinitialize initialValues={organization}>
      {({ values }) => {
        const searchText = [
          organization.shortName,
          organization.longName,
          organization.identificationCode
        ].join(" ")
        const action = (
          <>
            {isAdmin && (
              <Link
                id="mergeWithOther"
                to="/admin/merge/organizations"
                state={{ initialLeftUuid: organization.uuid }}
                className="btn btn-outline-secondary"
              >
                Merge with other organization
              </Link>
            )}
            {canAdministrateOrg && (
              <LinkTo
                modelType="Organization"
                model={Organization.pathForNew({
                  parentOrgUuid: organization.uuid
                })}
                button
              >
                Create sub-organization
              </LinkTo>
            )}

            {canAdministrateOrg && (
              <LinkTo
                modelType="Organization"
                model={organization}
                edit
                button="primary"
                id="editButton"
              >
                Edit
              </LinkTo>
            )}
            <FindObjectsButton
              objectLabel="Organization"
              searchText={searchText}
            />
            <RelatedObjectNotes
              notes={organization.notes}
              relatedObject={
                organization.uuid && {
                  relatedObjectType: Organization.relatedObjectType,
                  relatedObjectUuid: organization.uuid,
                  relatedObject: organization
                }
              }
            />
          </>
        )
        return (
          <div>
            <SubNav subnavElemId="myorg-nav">{isMyOrg && orgSubNav}</SubNav>

            <SubNav subnavElemId="all-org-nav">{!isMyOrg && orgSubNav}</SubNav>

            {currentUser.isSuperuser() && (
              <div className="float-end">
                <GuidedTour
                  title="Take a guided tour of this organization's page."
                  tour={orgTour}
                  autostart={
                    (localStorage.newUser === "true" &&
                      localStorage.hasSeenOrgTour !== "true") ||
                    routerLocation?.state?.showGuidedTour === true
                  }
                  onEnd={() => (localStorage.hasSeenOrgTour = "true")}
                />
              </div>
            )}

            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={
                  <>
                    {
                      <SubscriptionIcon
                        subscribedObjectType="organizations"
                        subscribedObjectUuid={organization.uuid}
                        isSubscribed={organization.isSubscribed}
                        updatedAt={organization.updatedAt}
                        refetch={refetch}
                        setError={error => {
                          setStateError(error)
                          jumpToTop()
                        }}
                        persistent
                      />
                    }{" "}
                    Organization {organization.shortName}
                  </>
                }
                action={action}
              />
              <Fieldset>
                <Row>
                  <Col sm={12} md={12} lg={4} xl={3} className="text-center">
                    <EntityAvatarDisplay
                      avatar={avatar}
                      defaultAvatar={Organization.relatedObjectType}
                    />
                  </Col>
                  <Col
                    lg={8}
                    xl={9}
                    className="d-flex flex-column justify-content-center"
                  >
                    <FormGroup>
                      <Row
                        style={{ marginBottom: "1rem", alignItems: "center" }}
                      >
                        <Col sm={7}>
                          <Row>
                            <Col>
                              <DictionaryField
                                wrappedComponent={Field}
                                dictProps={
                                  Settings.fields.organization.shortName
                                }
                                name="shortName"
                                component={FieldHelper.ReadonlyField}
                              />
                              <DictionaryField
                                wrappedComponent={Field}
                                dictProps={
                                  Settings.fields.organization.longName
                                }
                                name="longName"
                                component={FieldHelper.ReadonlyField}
                              />
                            </Col>
                          </Row>
                        </Col>
                        <Col
                          sm={5}
                          className="d-flex flex-column justify-content-center align-items-center"
                        >
                          <App6SymbolPreview
                            values={values}
                            size={120}
                            maxHeight={250}
                          />
                        </Col>
                      </Row>
                    </FormGroup>
                  </Col>
                </Row>
              </Fieldset>
              <Fieldset id="info" title="Additional Information">
                {organization.parentOrg && organization.parentOrg.uuid && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.organization.parentOrg}
                    name="parentOrg"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      organization.parentOrg && (
                        <LinkTo
                          modelType="Organization"
                          model={organization.parentOrg}
                        />
                      )
                    }
                  />
                )}

                {organization.childrenOrgs &&
                  organization.childrenOrgs.length > 0 && (
                    <DictionaryField
                      wrappedComponent={Field}
                      dictProps={Settings.fields.organization.childrenOrgs}
                      name="childrenOrgs"
                      component={FieldHelper.ReadonlyField}
                      humanValue={
                        <ListGroup>
                          {organization.childrenOrgs.map(childOrg => (
                            <ListGroupItem key={childOrg.uuid}>
                              <LinkTo
                                modelType="Organization"
                                model={childOrg}
                              />
                            </ListGroupItem>
                          ))}
                        </ListGroup>
                      }
                    />
                  )}

                {renderLeadingPositions(
                  organization.positions,
                  PositionRole.LEADER.toString(),
                  pluralize(
                    utils.titleCase(PositionRole.LEADER.humanNameOfRole())
                  )
                )}

                {renderLeadingPositions(
                  organization.positions,
                  PositionRole.DEPUTY.toString(),
                  pluralize(
                    utils.titleCase(PositionRole.DEPUTY.humanNameOfRole())
                  )
                )}

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.identificationCode}
                  name="identificationCode"
                  component={FieldHelper.ReadonlyField}
                />

                {organization.location && (
                  <DictionaryField
                    wrappedComponent={Field}
                    dictProps={Settings.fields.organization.location}
                    name="location"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      organization.location && (
                        <>
                          <LinkTo
                            modelType="Location"
                            model={organization.location}
                          />{" "}
                          <Badge>
                            {Location.humanNameOfType(
                              organization.location.type
                            )}
                          </Badge>
                        </>
                      )
                    }
                  />
                )}

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.emailAddresses}
                  name="emailAddresses"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <EmailAddressTable
                      label={Settings.fields.organization.emailAddresses.label}
                      emailAddresses={organization.emailAddresses}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.authorizationGroups}
                  name="authorizationGroups"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <AuthorizationGroupTable
                      authorizationGroups={organization.authorizationGroups}
                    />
                  }
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfStatus}
                />

                <DictionaryField
                  wrappedComponent={Field}
                  dictProps={Settings.fields.organization.profile}
                  name="profile"
                  component={FieldHelper.ReadonlyField}
                  humanValue={
                    <RichTextEditor readOnly value={organization.profile} />
                  }
                />

                {attachmentsEnabled && (
                  <Field
                    name="attachments"
                    label="Attachments"
                    component={FieldHelper.ReadonlyField}
                    humanValue={
                      <AttachmentsDetailView
                        attachments={attachments}
                        updateAttachments={setAttachments}
                        relatedObjectType={Organization.relatedObjectType}
                        relatedObjectUuid={values.uuid}
                        allowEdit={canAdministrateOrg}
                      />
                    }
                  />
                )}
              </Fieldset>

              {Settings.fields.organization.customFields && (
                <Fieldset title="Organization information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.organization.customFields}
                    values={values}
                  />
                </Fieldset>
              )}

              <OrganizationLaydown
                organization={organization}
                refetch={refetch}
              />
              <Approvals
                relatedObject={organization}
                objectType="Organization"
                canEdit={canAdministrateOrg}
                refetch={refetch}
              />
              {organization.isTaskEnabled() && (
                <OrganizationTasks
                  organization={organization}
                  queryParams={{
                    status: Model.STATUS.ACTIVE,
                    pageSize: 10,
                    taskedOrgUuid: organization.uuid
                  }}
                />
              )}
              <Fieldset
                id="events"
                title={`Events hosted by ${organization.shortName}`}
              >
                <EventCollection
                  paginationKey={`e_${uuid}`}
                  queryParams={eventQueryParams}
                  mapId="events"
                  showEventSeries
                />
              </Fieldset>
              <Fieldset
                id="reports"
                title={`Reports from ${organization.shortName}`}
              >
                <ReportCollection
                  paginationKey={`r_${uuid}`}
                  queryParams={reportQueryParams}
                  mapId="reports"
                  reportsFilter={
                    <>
                      <Button
                        value="toggle-filter"
                        size="sm"
                        onClick={() =>
                          setFilterPendingApproval(!filterPendingApproval)
                        }
                        variant="outline-secondary"
                      >
                        {filterPendingApproval
                          ? "Show all reports"
                          : "Show pending approval"}
                      </Button>
                      <FormCheck
                        type="checkbox"
                        label="include reports from sub-orgs"
                        checked={includeChildrenOrgs}
                        onChange={() =>
                          setIncludeChildrenOrgs(!includeChildrenOrgs)
                        }
                      />
                    </>
                  }
                />
              </Fieldset>
            </Form>
            <AssessmentResultsContainer
              entity={organization}
              entityType={Organization}
              canAddPeriodicAssessment={canAdministrateOrg}
              canAddOndemandAssessment={canAdministrateOrg}
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

  function renderLeadingPositions(positions, role, label) {
    const positionList = getPositionsForRole(positions, role)
    if (!_isEmpty(positionList)) {
      return (
        <Field
          name={label}
          component={FieldHelper.ReadonlyField}
          label={label}
          humanValue={positionList}
        />
      )
    }
  }
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapPageDispatchersToProps
)(OrganizationShow)
