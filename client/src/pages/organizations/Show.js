import { Tab, Tabs } from "@blueprintjs/core"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import { gql } from "apollo-boost"
import AppContext from "components/AppContext"
import Approvals from "components/approvals/Approvals"
import Fieldset from "components/Fieldset"
import OrganizationalChart from "components/graphs/OrganizationalChart"
import GuidedTour from "components/GuidedTour"
import LinkTo from "components/LinkTo"
import Messages from "components/Messages"
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
import { RECURSE_STRATEGY } from "components/SearchFilters"
import SubNav from "components/SubNav"
import { Organization, Report, Task } from "models"
import { orgTour } from "pages/HopscotchTour"
import pluralize from "pluralize"
import React, { useContext, useState } from "react"
import { Button, Checkbox, Nav } from "react-bootstrap"
import ContainerDimensions from "react-container-dimensions"
import { connect } from "react-redux"
import { useLocation, useParams } from "react-router-dom"
import Settings from "settings"
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
      ${GRAPHQL_NOTES_FIELDS}
    }
  }
`

const OrganizationShow = ({ pageDispatchers }) => {
  const { currentUser } = useContext(AppContext)
  const routerLocation = useLocation()
  const [filterPendingApproval, setFilterPendingApproval] = useState(false)
  const [includeChildrenOrgs, setIncludeChildrenOrgs] = useState(false)
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

  const organization = new Organization(data ? data.organization : {})
  const stateSuccess = routerLocation.state && routerLocation.state.success
  const stateError = routerLocation.state && routerLocation.state.error

  const isSuperUser = currentUser && currentUser.isSuperUserForOrg(organization)
  const isAdmin = currentUser && currentUser.isAdmin()
  const isAdvisorOrg = organization.type === Organization.TYPE.ADVISOR_ORG
  const isPrincipalOrg = organization.type === Organization.TYPE.PRINCIPAL_ORG

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
    <div>
      {done && result}
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

      <div
        className="legend"
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "flex-start"
        }}
      >
        <ContainerDimensions>
          {({ width, height }) => (
            <Tabs id="tabs">
              <h4 className="title-text" style={{ flexGrow: 0 }}>
                {`Organization ${organization.shortName}`}
              </h4>
              <Tab
                id="tab-diagram"
                title="Diagram"
                panel={
                  <OrganizationalChart
                    label="test"
                    org={organization}
                    exportTitle={`Organization diagram for ${organization}`}
                    width={width}
                    height={height}
                  />
                }
              />
              <Tab
                id="tab-positions"
                title="Positions"
                panel={<div style={{ width: `${width}px` }} />}
              />
              {!isPrincipalOrg && (
                <Tab
                  id="tab-approval-workflow"
                  title="Approval workflow"
                  panel={
                    <div style={{ width: `${width}px` }}>
                      <Approvals relatedObject={organization} />
                    </div>
                  }
                />
              )}
              <Tabs.Expander />
              {isAdmin && (
                <LinkTo
                  modelType="Organization"
                  model={Organization.pathForNew({
                    parentOrgUuid: organization.uuid
                  })}
                  button
                  style={{ flexGrow: 0 }}
                >
                  Create sub-organization
                </LinkTo>
              )}

              {(isAdmin || (isSuperUser && isAdvisorOrg)) && (
                <LinkTo
                  modelType="Organization"
                  model={organization}
                  edit
                  button="primary"
                  id="editButton"
                  style={{ flexGrow: 0 }}
                >
                  Edit
                </LinkTo>
              )}
            </Tabs>
          )}
        </ContainerDimensions>
      </div>

      {organization.isTaskEnabled() && (
        <OrganizationTasks
          organization={organization}
          queryParams={{
            status: Task.STATUS.ACTIVE,
            pageSize: 10,
            taskedOrgUuid: organization.uuid
          }}
        />
      )}

      <Fieldset id="reports" title={`Reports from ${organization.shortName}`}>
        <ReportCollection
          paginationKey={`r_${uuid}`}
          queryParams={reportQueryParams}
          reportsFilter={
            !isSuperUser ? null : (
              <>
                <Button
                  value="toggle-filter"
                  className="btn btn-sm"
                  onClick={() =>
                    setFilterPendingApproval(!filterPendingApproval)}
                >
                  {filterPendingApproval
                    ? "Show all reports"
                    : "Show pending approval"}
                </Button>
                <Checkbox
                  checked={includeChildrenOrgs}
                  onChange={() => setIncludeChildrenOrgs(!includeChildrenOrgs)}
                >
                  include reports from sub-orgs
                </Checkbox>
              </>
            )
          }
        />
      </Fieldset>
    </div>
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
