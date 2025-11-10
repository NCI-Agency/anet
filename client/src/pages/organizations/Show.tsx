import {
  gqlAllAttachmentFields,
  gqlAllOrganizationFields,
  gqlApprovalStepFields,
  gqlAssessmentsFields,
  gqlEmailAddressesFields,
  gqlEntityAvatarFields,
  gqlEntityFieldsMap,
  gqlNotesFields,
  gqlPaginationFields
} from "constants/GraphQLDefinitions"
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
import EventMatrix from "components/EventMatrix"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import FindObjectsButton from "components/FindObjectsButton"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
import Model, { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
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
import _isEmpty from "lodash/isEmpty"
import { Location, Organization, Report } from "models"
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
    ${gqlEntityFieldsMap.Location}
    lat
    lng
    type
  }
`
const GQL_ORGANIZATION_FIELDS = `
  fragment organizationFields on Organization {
    ${gqlEntityFieldsMap.Organization}
    app6context
    app6standardIdentity
    app6symbolSet
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    ${gqlEntityFieldsMap.Person}
  }
`
const GQL_POSITION_FIELDS = `
  fragment positionFields on Position {
    ${gqlEntityFieldsMap.Position}
    type
    role
  }
`
const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ${gqlAllOrganizationFields}
      ${gqlEmailAddressesFields}
      ${gqlEntityAvatarFields}
      location {
        ...locationFields
      }
      parentOrg {
        ...organizationFields
      }
      childrenOrgs {
        ...organizationFields
      }
      ascendantOrgs {
        ...organizationFields
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
        ${gqlApprovalStepFields}
      }
      approvalSteps {
        ${gqlApprovalStepFields}
      }
      tasks {
        ${gqlEntityFieldsMap.Task}
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
        }
      }
      authorizationGroups {
        ${gqlEntityFieldsMap.AuthorizationGroup}
      }
      attachments {
        ${gqlAllAttachmentFields}
      }
      ${gqlAssessmentsFields}
      ${gqlNotesFields}
    }

    taskList(query: { taskedOrgUuid: [$uuid], orgRecurseStrategy: ${RECURSE_STRATEGY.CHILDREN}, pageSize: 0 }) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.Task}
        selectable
        parentTask {
          ${gqlEntityFieldsMap.Task}
        }
        ascendantTasks {
          ${gqlEntityFieldsMap.Task}
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
        }
        descendantTasks {
          ${gqlEntityFieldsMap.Task}
          selectable
          parentTask {
            ${gqlEntityFieldsMap.Task}
          }
          ascendantTasks {
            ${gqlEntityFieldsMap.Task}
            parentTask {
              ${gqlEntityFieldsMap.Task}
            }
          }
        }
      }
    }

    eventSeriesList(query: { anyOrgUuid: [$uuid], pageSize: 0 }) {
      ${gqlPaginationFields}
      list {
        ${gqlEntityFieldsMap.EventSeries}
        ownerOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        hostOrg {
          ${gqlEntityFieldsMap.Organization}
        }
        adminOrg {
          ${gqlEntityFieldsMap.Organization}
        }
      }
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
  const allTasks = data?.taskList?.list ?? []
  const allEventSeries = data?.eventSeriesList?.list ?? []

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
      <FindObjectsButton objectLabel="Organization" searchText={searchText} />
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
      <div className="form-horizontal">
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
                <Row style={{ marginBottom: "1rem", alignItems: "center" }}>
                  <Col sm={7}>
                    <Row>
                      <Col>
                        <DictionaryField
                          wrappedComponent={FieldHelper.ReadonlyField}
                          dictProps={Settings.fields.organization.shortName}
                          field={{
                            name: "shortName",
                            value: organization.shortName
                          }}
                        />
                        <DictionaryField
                          wrappedComponent={FieldHelper.ReadonlyField}
                          dictProps={Settings.fields.organization.longName}
                          field={{
                            name: "longName",
                            value: organization.longName
                          }}
                        />
                      </Col>
                    </Row>
                  </Col>
                  <Col
                    sm={5}
                    className="d-flex flex-column justify-content-center align-items-center"
                  >
                    <App6SymbolPreview
                      values={organization}
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
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.organization.parentOrg}
              field={{ name: "parentOrg" }}
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
                wrappedComponent={FieldHelper.ReadonlyField}
                dictProps={Settings.fields.organization.childrenOrgs}
                field={{ name: "childrenOrgs" }}
                humanValue={
                  <ListGroup>
                    {organization.childrenOrgs.map(childOrg => (
                      <ListGroupItem key={childOrg.uuid}>
                        <LinkTo modelType="Organization" model={childOrg} />
                      </ListGroupItem>
                    ))}
                  </ListGroup>
                }
              />
            )}

          {renderLeadingPositions(
            organization.positions,
            PositionRole.LEADER.toString(),
            pluralize(utils.titleCase(PositionRole.LEADER.humanNameOfRole()))
          )}

          {renderLeadingPositions(
            organization.positions,
            PositionRole.DEPUTY.toString(),
            pluralize(utils.titleCase(PositionRole.DEPUTY.humanNameOfRole()))
          )}

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.organization.identificationCode}
            field={{
              name: "identificationCode",
              value: organization.identificationCode
            }}
          />

          {organization.location && (
            <DictionaryField
              wrappedComponent={FieldHelper.ReadonlyField}
              dictProps={Settings.fields.organization.location}
              field={{ name: "location" }}
              humanValue={
                organization.location && (
                  <LinkTo modelType="Location" model={organization.location}>
                    {`${Location.toString(organization.location)} `}
                    <Badge bg="secondary">
                      {Location.humanNameOfType(organization.location.type)}
                    </Badge>
                  </LinkTo>
                )
              }
            />
          )}

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.organization.emailAddresses}
            field={{ name: "emailAddresses" }}
            humanValue={
              <EmailAddressTable
                label={Settings.fields.organization.emailAddresses.label}
                emailAddresses={organization.emailAddresses}
              />
            }
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.organization.authorizationGroups}
            field={{ name: "authorizationGroups" }}
            humanValue={
              <AuthorizationGroupTable
                authorizationGroups={organization.authorizationGroups}
                showDistributionList
                showForSensitiveInformation
              />
            }
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.organization.status}
            field={{ name: "status" }}
            humanValue={Organization.humanNameOfStatus(organization.status)}
          />

          <DictionaryField
            wrappedComponent={FieldHelper.ReadonlyField}
            dictProps={Settings.fields.organization.profile}
            field={{ name: "profile" }}
            humanValue={
              <RichTextEditor readOnly value={organization.profile} />
            }
          />

          {attachmentsEnabled && (
            <FieldHelper.ReadonlyField
              field={{ name: "attachments" }}
              label="Attachments"
              humanValue={
                <AttachmentsDetailView
                  attachments={attachments}
                  updateAttachments={setAttachments}
                  relatedObjectType={Organization.relatedObjectType}
                  relatedObjectUuid={organization.uuid}
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
              values={organization}
            />
          </Fieldset>
        )}

        <OrganizationLaydown organization={organization} refetch={refetch} />

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

        {(!!allTasks.length || !!allEventSeries.length) && (
          <Fieldset
            id="syncMatrix"
            title={`Sync matrix for ${organization.shortName}`}
          >
            <EventMatrix tasks={allTasks} eventSeries={allEventSeries} />
          </Fieldset>
        )}

        <Fieldset id="reports" title={`Reports from ${organization.shortName}`}>
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
                  onChange={() => setIncludeChildrenOrgs(!includeChildrenOrgs)}
                />
              </>
            }
          />
        </Fieldset>
      </div>

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

  function renderLeadingPositions(positions, role, label) {
    const positionList = getPositionsForRole(positions, role)
    if (!_isEmpty(positionList)) {
      return (
        <FieldHelper.ReadonlyField
          field={{ name: label }}
          label={label}
          humanValue={positionList}
        />
      )
    }
  }
}

const mapStateToProps = state => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapPageDispatchersToProps
)(OrganizationShow)
