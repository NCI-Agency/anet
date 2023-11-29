import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import AssessmentResultsContainer from "components/assessments/AssessmentResultsContainer"
import AttachmentCard from "components/Attachment/AttachmentCard"
import { ReadonlyCustomFields } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
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
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import RichTextEditor from "components/RichTextEditor"
import SubNav from "components/SubNav"
import { Field, Form, Formik } from "formik"
import DictionaryField from "HOC/DictionaryField"
import _isEmpty from "lodash/isEmpty"
import { Attachment, Location, Organization, Report } from "models"
import { PositionRole } from "models/Position"
import { orgTour } from "pages/HopscotchTour"
import pluralize from "pluralize"
import { getPositionsForRole } from "positionUtil"
import React, { useContext, useState } from "react"
import {
  Badge,
  Button,
  FormCheck,
  ListGroup,
  ListGroupItem,
  Nav
} from "react-bootstrap"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
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
  }
`
const GQL_ORGANIZATION_FIELDS = `
  fragment organizationFields on Organization {
    uuid
    shortName
    longName
    identificationCode
    type
  }
`
const GQL_PERSON_FIELDS = `
  fragment personFields on Person {
    uuid
    name
    rank
    role
    avatarUuid
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
  }
`
const GQL_GET_ORGANIZATION = gql`
  query ($uuid: String) {
    organization(uuid: $uuid) {
      ...organizationFields
      status
      isSubscribed
      profile
      updatedAt
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
      attachments {
        ${Attachment.basicFieldsQuery}
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }

  ${GQL_LOCATION_FIELDS}
  ${GQL_ORGANIZATION_FIELDS}
  ${GQL_PERSON_FIELDS}
  ${GQL_POSITION_FIELDS}
`

const OrganizationShow = ({ pageDispatchers }) => {
  const { currentUser, loadAppData } = useContext(AppContext)
  const routerLocation = useLocation()
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const [stateError, setStateError] = useState(
    routerLocation.state && routerLocation.state.error
  )
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
  if (done) {
    return result
  }
  if (data) {
    data.organization[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.organization.customFields
    )
  }
  const organization = new Organization(data ? data.organization : {})
  const DictField = DictionaryField(Field)

  const canAdministrateOrg =
    currentUser &&
    currentUser.hasAdministrativePermissionsForOrganization(organization)
  const isAdvisorOrg = organization.type === Organization.TYPE.ADVISOR_ORG
  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG
  const orgSettings = isPrincipalOrg
    ? Settings.fields.principal.org
    : Settings.fields.advisor.org
  const attachmentsEnabled = !Settings.fields.attachment.featureDisabled

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
          <AnchorNavItem to="supportedPositions">
            Supported positions
          </AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="vacantPositions">Vacant positions</AnchorNavItem>
        </Nav.Item>
        <Nav.Item>
          <AnchorNavItem to="administratingPositions">
            {orgSettings.administratingPositions.label}
          </AnchorNavItem>
        </Nav.Item>
        {!isPrincipalOrg && (
          <Nav.Item>
            <AnchorNavItem to="approvals">Approvals</AnchorNavItem>
          </Nav.Item>
        )}
        {organization.isTaskEnabled() && (
          <Nav.Item>
            <AnchorNavItem to="tasks">
              {pluralize(Settings.fields.task.shortLabel)}
            </AnchorNavItem>
          </Nav.Item>
        )}
        <Nav.Item>
          <AnchorNavItem to="reports">Reports</AnchorNavItem>
        </Nav.Item>
      </span>
    </Nav>
  )
  const reportQueryParams = {
    orgUuid: uuid
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
        const action = (
          <div>
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
          </div>
        )
        return (
          <div>
            <SubNav subnavElemId="myorg-nav">{isMyOrg && orgSubNav}</SubNav>

            <SubNav subnavElemId="advisor-org-nav">
              {!isMyOrg && isAdvisorOrg && orgSubNav}
            </SubNav>

            <SubNav subnavElemId="principal-org-nav">
              {!isMyOrg && isPrincipalOrg && orgSubNav}
            </SubNav>

            {currentUser.isSuperuser() && (
              <div className="float-end">
                <GuidedTour
                  title="Take a guided tour of this organization's page."
                  tour={orgTour}
                  autostart={
                    localStorage.newUser === "true" &&
                    localStorage.hasSeenOrgTour !== "true"
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
              <Fieldset id="info">
                <DictField
                  dictProps={Settings.fields.organization.longName}
                  name="longName"
                  component={FieldHelper.ReadonlyField}
                />

                <DictField
                  dictProps={Settings.fields.organization.type}
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfType}
                />

                {organization.parentOrg && organization.parentOrg.uuid && (
                  <DictField
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
                    <DictField
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

                <DictField
                  dictProps={Settings.fields.organization.identificationCode}
                  name="identificationCode"
                  component={FieldHelper.ReadonlyField}
                />

                {organization.location && (
                  <DictField
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

                <DictField
                  dictProps={Settings.fields.organization.status}
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfStatus}
                />

                <DictField
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
                      <div className="attachment-card-list">
                        {organization.attachments.map(attachment => (
                          <AttachmentCard
                            key={attachment.uuid}
                            attachment={attachment}
                          />
                        ))}
                      </div>
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
              {!isPrincipalOrg && <Approvals relatedObject={organization} />}
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
                          setFilterPendingApproval(!filterPendingApproval)}
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
                          setIncludeChildrenOrgs(!includeChildrenOrgs)}
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

OrganizationShow.propTypes = {
  pageDispatchers: PageDispatchersPropType
}

const mapStateToProps = (state, ownProps) => ({
  pagination: state.pagination
})

export default connect(
  mapStateToProps,
  mapPageDispatchersToProps
)(OrganizationShow)
