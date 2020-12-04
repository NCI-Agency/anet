import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import { ReadonlyCustomFields } from "components/CustomFields"
import * as FieldHelper from "components/FieldHelper"
import Fieldset from "components/Fieldset"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import LinkToNotPreviewed from "components/LinkToNotPreviewed"
import Messages from "components/Messages"
import Model, { DEFAULT_CUSTOM_FIELDS_PARENT } from "components/Model"
import { AnchorNavItem } from "components/Nav"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate
} from "components/Page"
import RelatedObjectNotes, {
  GRAPHQL_NOTES_FIELDS
} from "components/RelatedObjectNotes"
import ReportCollection from "components/ReportCollection"
import SubNav from "components/SubNav"
import { Field, Form, Formik } from "formik"
import { Organization, Position, Report } from "models"
import { orgTour } from "pages/HopscotchTour"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
import {
  Button,
  Checkbox,
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
      identificationCode
      type
      parentOrg {
        uuid
        shortName
        longName
        identificationCode
      }
      childrenOrgs(query: { pageNum: 0, pageSize: 0, status: ACTIVE }) {
        uuid
        shortName
        longName
        identificationCode
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
  const [filterPendingApproval, setFilterPendingApproval] = useState(false)
  const [includeChildrenOrgs, setIncludeChildrenOrgs] = useState(true)
  const { uuid } = useParams()
  const { loading, error, data } = API.useApiQuery(GQL_GET_ORGANIZATION, {
    uuid
  })
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Organization",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  if (done) {
    return result
  }
  if (data) {
    data.organization[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.organization.customFields
    )
  }
  const organization = new Organization(data ? data.organization : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error
  const IdentificationCodeFieldWithLabel = DictionaryField(Field)
  const LongNameWithLabel = DictionaryField(Field)

  const isSuperUser = currentUser && currentUser.isSuperUserForOrg(organization)
  const isAdmin = currentUser && currentUser.isAdmin()
  const isAdvisorOrg = organization.type === Organization.TYPE.ADVISOR_ORG
  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG
  const orgSettings = isPrincipalOrg
    ? Settings.fields.principal.org
    : Settings.fields.advisor.org

  const superUsers = organization.positions.filter(
    pos =>
      pos.status !== Model.STATUS.INACTIVE &&
      (!pos.person || pos.person.status !== Model.STATUS.INACTIVE) &&
      (pos.type === Position.TYPE.SUPER_USER ||
        pos.type === Position.TYPE.ADMINISTRATOR)
  )
  const myOrg =
    currentUser && currentUser.position
      ? currentUser.position.organization
      : null
  const isMyOrg = myOrg && organization.uuid === myOrg.uuid
  const orgSubNav = (
    <Nav>
      <AnchorNavItem to="info">Info</AnchorNavItem>
      <AnchorNavItem to="supportedPositions">Supported positions</AnchorNavItem>
      <AnchorNavItem to="vacantPositions">Vacant positions</AnchorNavItem>
      {!isPrincipalOrg && (
        <AnchorNavItem to="approvals">Approvals</AnchorNavItem>
      )}
      {organization.isTaskEnabled() && (
        <AnchorNavItem to="tasks">
          {pluralize(Settings.fields.task.shortLabel)}
        </AnchorNavItem>
      )}
      <AnchorNavItem to="reports">Reports</AnchorNavItem>
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
            {isAdmin && (
              <LinkToNotPreviewed
                modelType="Organization"
                model={Organization.pathForNew({
                  parentOrgUuid: organization.uuid
                })}
                button
              >
                Create sub-organization
              </LinkToNotPreviewed>
            )}

            {(isAdmin || (isSuperUser && isAdvisorOrg)) && (
              <LinkToNotPreviewed
                modelType="Organization"
                model={organization}
                edit
                button="primary"
                id="editButton"
              >
                Edit
              </LinkToNotPreviewed>
            )}
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

            {currentUser.isSuperUser() && (
              <div className="pull-right">
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
            <Messages success={stateSuccess} error={stateError} />
            <Form className="form-horizontal" method="post">
              <Fieldset
                title={`Organization ${organization.shortName}`}
                action={action}
              />
              <Fieldset id="info">
                <Field
                  name="status"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfStatus}
                />

                <Field
                  name="type"
                  component={FieldHelper.ReadonlyField}
                  humanValue={Organization.humanNameOfType}
                />

                <LongNameWithLabel
                  dictProps={orgSettings.longName}
                  name="longName"
                  component={FieldHelper.ReadonlyField}
                />

                <IdentificationCodeFieldWithLabel
                  dictProps={orgSettings.identificationCode}
                  name="identificationCode"
                  component={FieldHelper.ReadonlyField}
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
                          previewId="org-show-org"
                        >
                          {organization.parentOrg.shortName}{" "}
                          {organization.parentOrg.longName}{" "}
                          {organization.parentOrg.identificationCode}
                        </LinkTo>
                      )
                    }
                  />
                )}

                {organization.isAdvisorOrg() && (
                  <Field
                    name="superUsers"
                    component={FieldHelper.ReadonlyField}
                    label="Super users"
                    humanValue={
                      <>
                        {superUsers.map(position => (
                          <p key={position.uuid}>
                            {position.person ? (
                              <LinkTo
                                modelType="Person"
                                model={position.person}
                                previewId="org-show-person"
                              />
                            ) : (
                              <i>
                                <LinkTo
                                  modelType="Position"
                                  model={position}
                                  previewId="org-show-pos"
                                />
                                - (Unfilled)
                              </i>
                            )}
                          </p>
                        ))}
                        {superUsers.length === 0 && (
                          <p>
                            <i>No super users</i>
                          </p>
                        )}
                      </>
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
                                previewId="org-show-child-org"
                              >
                                {organization.shortName} {organization.longName}{" "}
                                {organization.identificationCode}
                              </LinkTo>
                            </ListGroupItem>
                          ))}
                        </ListGroup>
                      }
                    />
                )}
              </Fieldset>

              <OrganizationLaydown
                organization={organization}
                linkToComp={LinkTo}
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
                  linkToComp={LinkTo}
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
                        className="btn btn-sm"
                        onClick={() =>
                          setFilterPendingApproval(!filterPendingApproval)
                        }
                      >
                        {filterPendingApproval
                          ? "Show all reports"
                          : "Show pending approval"}
                      </Button>
                      <Checkbox
                        checked={includeChildrenOrgs}
                        onChange={() =>
                          setIncludeChildrenOrgs(!includeChildrenOrgs)
                        }
                      >
                        include reports from sub-orgs
                      </Checkbox>
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
