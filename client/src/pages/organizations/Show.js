import { gql } from "@apollo/client"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
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
import { Location, Organization, Report } from "models"
import { orgTour } from "pages/HopscotchTour"
import pluralize from "pluralize"
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
import DictionaryField from "../../HOC/DictionaryField"
import OrganizationLaydown from "./Laydown"
import OrganizationTasks from "./OrganizationTasks"

const GQL_GET_ORGANIZATION = gql`
  query($uuid: String) {
    organization(uuid: $uuid) {
      uuid
      shortName
      longName
      status
      isSubscribed
      updatedAt
      identificationCode
      type
      location {
        uuid
        name
        lat
        lng
        type
      }
      profile
      parentOrg {
        uuid
        shortName
        longName
        identificationCode
        type
      }
      childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
        shortName
        longName
        identificationCode
        type
      }
      positions {
        uuid
        name
        code
        status
        type
        person {
          uuid
          name
          status
          rank
          role
          avatar(size: 32)
        }
        associatedPositions {
          uuid
          name
          type
          code
          status
          person {
            uuid
            name
            status
            rank
            role
            avatar(size: 32)
          }
        }
      }
      administratingPositions {
        uuid
        name
        code
        type
        status
        location {
          uuid
          name
        }
        organization {
          uuid
          shortName
        }
        person {
          uuid
          name
          rank
          role
          avatar(size: 32)
        }
      }
      planningApprovalSteps {
        uuid
        name
        approvers {
          uuid
          name
          person {
            uuid
            name
            rank
            role
            avatar(size: 32)
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
            uuid
            name
            rank
            role
            avatar(size: 32)
          }
        }
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const OrganizationShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
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
  const IdentificationCodeFieldWithLabel = DictionaryField(Field)
  const LongNameWithLabel = DictionaryField(Field)

  const canAdministrateOrg =
    currentUser &&
    currentUser.hasAdministrativePermissionsForOrganization(organization)
  const isAdvisorOrg = organization.type === Organization.TYPE.ADVISOR_ORG
  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG
  const orgSettings = isPrincipalOrg
    ? Settings.fields.principal.org
    : Settings.fields.advisor.org

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
                <LongNameWithLabel
                  dictProps={orgSettings.longName}
                  name="longName"
                  component={FieldHelper.ReadonlyField}
                />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfType}
                />

                {organization.parentOrg && organization.parentOrg.uuid && (
                  <Field
                    name="parentOrg"
                    component={FieldHelper.ReadonlyField}
                    label={Settings.fields.organization.parentOrg}
                    humanValue={
                      organization.parentOrg && (
                        <LinkTo
                          modelType="Organization"
                          model={organization.parentOrg}
                        >
                          {Organization.toIdentificationCodeString(
                            organization.parentOrg
                          )}
                        </LinkTo>
                      )
                    }
                  />
                )}

                {organization.childrenOrgs &&
                  organization.childrenOrgs.length > 0 && (
                    <Field
                      name="childrenOrgs"
                      component={FieldHelper.ReadonlyField}
                      label="Sub organizations"
                      humanValue={
                        <ListGroup>
                          {organization.childrenOrgs.map(organization => (
                            <ListGroupItem key={organization.uuid}>
                              <LinkTo
                                modelType="Organization"
                                model={organization}
                              >
                                {Organization.toIdentificationCodeString(
                                  organization
                                )}
                              </LinkTo>
                            </ListGroupItem>
                          ))}
                        </ListGroup>
                      }
                    />
                )}

                <IdentificationCodeFieldWithLabel
                  dictProps={orgSettings.identificationCode}
                  name="identificationCode"
                  component={FieldHelper.ReadonlyField}
                />

                {organization.location && (
                  <Field
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

                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfStatus}
                />

                <Field
                  name="profile"
                  component={FieldHelper.ReadonlyField}
                  label={Settings.fields.organization.profile}
                  humanValue={
                    <RichTextEditor readOnly value={organization.profile} />
                  }
                />
              </Fieldset>

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
              {Settings.fields.organization.customFields && (
                <Fieldset title="Organization information" id="custom-fields">
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.organization.customFields}
                    values={values}
                  />
                </Fieldset>
              )}
            </Form>
          </div>
        )
      }}
    </Formik>
  )
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
