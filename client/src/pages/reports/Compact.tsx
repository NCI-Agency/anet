import { gql } from "@apollo/client"
import styled from "@emotion/styled"
import { DEFAULT_PAGE_PROPS, DEFAULT_SEARCH_PROPS } from "actions"
import API from "api"
import AppContext from "components/AppContext"
import InstantAssessmentsContainerField from "components/assessments/instant/InstantAssessmentsContainerField"
import { BreadcrumbTrail } from "components/BreadcrumbTrail"
import CompactTable, {
  CompactFooterContent,
  CompactHeaderContent,
  CompactRow,
  CompactRowContentS,
  CompactRowS,
  CompactSubTitle,
  CompactTitle,
  CompactView,
  FullColumn,
  PAGE_SIZES
} from "components/Compact"
import { ReadonlyCustomFields } from "components/CustomFields"
import DictionaryField from "components/DictionaryField"
import Fieldset from "components/Fieldset"
import LinkTo from "components/LinkTo"
import ListItems from "components/ListItems"
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ASSESSMENTS_FIELDS,
  GRAPHQL_ENTITY_AVATAR_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import "components/RelatedObjectNotes"
import { RelatedObjectsTable } from "components/RelatedObjectsTable"
import { ActionButton, ActionStatus } from "components/ReportWorkflow"
import RichTextEditor from "components/RichTextEditor"
import SimpleMultiCheckboxDropdown from "components/SimpleMultiCheckboxDropdown"
import { Formik } from "formik"
import _isEmpty from "lodash/isEmpty"
import { Person, Report, Task } from "models"
import moment from "moment"
import React, { useContext, useState } from "react"
import { Button, Dropdown, DropdownButton } from "react-bootstrap"
import { connect } from "react-redux"
import { useNavigate, useParams } from "react-router-dom"
import TASKS_ICON from "resources/tasks.png"
import Settings from "settings"
import utils from "utils"

const GQL_GET_REPORT = gql`
  query($uuid: String!) {
    report(uuid: $uuid) {
      uuid
      intent
      classification
      engagementDate
      duration
      atmosphere
      atmosphereDetails
      keyOutcomes
      reportText
      nextSteps
      cancelledReason
      updatedAt
      releasedAt
      state
      location {
        uuid
        name
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      authors {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        position {
          uuid
          organization {
            uuid
            shortName
            longName
            identificationCode
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
                  ${GRAPHQL_ENTITY_AVATAR_FIELDS}
                }
              }
            }
          }
        }
      }
      attendees {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        status
        primary
        author
        attendee
        interlocutor
        user
        endOfTourDate
        position {
          uuid
          name
          type
          role
          code
          status
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          organization {
            uuid
            shortName
            longName
            identificationCode
          }
          location {
            uuid
            name
          }
        }
      }
      primaryAdvisor {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      primaryInterlocutor {
        uuid
        name
        rank
        ${GRAPHQL_ENTITY_AVATAR_FIELDS}
      }
      tasks {
        uuid
        shortName
        longName
        parentTask {
          uuid
          shortName
        }
        ascendantTasks {
          uuid
          shortName
          parentTask {
            uuid
          }
        }
        taskedOrganizations {
          uuid
          shortName
          longName
          identificationCode
        }
        customFields
      }
      comments {
        uuid
        text
        createdAt
        updatedAt
        author {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      interlocutorOrg {
        uuid
        shortName
        longName
        identificationCode
      }
      advisorOrg {
        uuid
        shortName
        longName
        identificationCode
      }
      workflow {
        type
        createdAt
        step {
          uuid
          name
          approvers {
            uuid
            name
            person {
              uuid
              name
              rank
              ${GRAPHQL_ENTITY_AVATAR_FIELDS}
            }
          }
        }
        person {
          uuid
          name
          rank
          ${GRAPHQL_ENTITY_AVATAR_FIELDS}
        }
      }
      approvalStep {
        uuid
        name
        approvers {
          uuid
        }
        nextStepUuid
      }
      reportSensitiveInformation {
        uuid
        text
      }
      authorizedMembers {
        relatedObjectType
        relatedObjectUuid
        relatedObject {
          ... on AuthorizationGroup {
            uuid
            name
          }
          ... on Organization {
            uuid
            shortName
            longName
            identificationCode
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Person {
            uuid
            name
            rank
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
          ... on Position {
            uuid
            type
            name
            ${GRAPHQL_ENTITY_AVATAR_FIELDS}
          }
        }
      }
      customFields
      ${GRAPHQL_ASSESSMENTS_FIELDS}
    }
  }
`

interface CompactReportViewProps {
  pageDispatchers?: PageDispatchersPropType
}

const CompactReportView = ({ pageDispatchers }: CompactReportViewProps) => {
  const navigate = useNavigate()
  const { uuid } = useParams()
  const { currentUser } = useContext(AppContext)
  const [pageSize, setPageSize] = useState(PAGE_SIZES.A4)
  const { loading, error, data } = API.useApiQuery(GQL_GET_REPORT, {
    uuid
  })

  const [optionalFields, setOptionalFields] = useState(OPTIONAL_FIELDS_INIT)
  const { done, result } = useBoilerplate({
    loading,
    error,
    modelName: "Report",
    uuid,
    pageProps: DEFAULT_PAGE_PROPS,
    searchProps: DEFAULT_SEARCH_PROPS,
    pageDispatchers
  })
  usePageTitle(
    data?.report && `Print | ${data.report.intent || data.report.uuid}`
  )
  if (done) {
    return result
  }
  let report
  if (!data) {
    report = new Report()
  } else {
    data.report.cancelled = !!data.report.cancelledReason
    data.report.tasks = Task.fromArray(data.report.tasks)
    data.report.attendees = Person.fromArray(data.report.attendees)
    data.report.to = ""
    data.report[DEFAULT_CUSTOM_FIELDS_PARENT] = utils.parseJsonSafe(
      data.report.customFields
    )
    report = new Report(data.report)
  }

  if (_isEmpty(report)) {
    return (
      <CompactReportViewHeader
        returnToDefaultPage={returnToDefaultPage}
        noReport
      />
    )
  }

  // Get initial tasks/attendees instant assessments values
  report = Object.assign(report, report.getTasksEngagementAssessments())
  report = Object.assign(report, report.getAttendeesEngagementAssessments())
  const backgroundText = report.isDraft() ? "DRAFT" : ""
  const isAuthor = report.authors?.some(a => Person.isEqual(currentUser, a))
  // Author can always read assessments
  const canReadAssessments = isAuthor
  return (
    <Formik
      validationSchema={Report.yupSchema}
      validateOnMount
      initialValues={report}
    >
      {() => (
        <>
          <CompactReportViewHeader
            onPrintClick={printReport}
            returnToDefaultPage={returnToDefaultPage}
            optionalFields={optionalFields}
            setOptionalFields={setOptionalFields}
            setPageSize={setPageSize}
          />
          <CompactView
            className="compact-view"
            pageSize={pageSize}
            backgroundText={backgroundText}
          >
            <CompactHeaderContent
              color={null}
              policyAndClassification={utils.getPolicyAndClassificationForChoice(
                report.classification
              )}
              releasableTo={utils.getReleasableToForChoice(
                report.classification
              )}
            />
            <CompactTable>
              <FullColumn>
                <CompactTitle
                  label={getReportTitle()}
                  className="reportField"
                />
                <CompactSubTitle
                  label={getReportSubTitle()}
                  className="reportField"
                />
                <DictionaryField
                  wrappedComponent={CompactRow}
                  dictProps={Settings.fields.report.intent}
                  content={report.intent}
                  className="reportField"
                  hideIfEmpty
                />
                <DictionaryField
                  wrappedComponent={CompactRow}
                  dictProps={Settings.fields.report.keyOutcomes}
                  content={<ListItems value={report.keyOutcomes} />}
                  className="reportField"
                  hideIfEmpty
                />
                {!report.cancelled && (
                  <>
                    <DictionaryField
                      wrappedComponent={CompactRow}
                      dictProps={Settings.fields.report.atmosphere}
                      content={
                        !report.atmosphereDetails
                          ? utils.sentenceCase(report.atmosphere)
                          : `${utils.sentenceCase(report.atmosphere)} - ${report.atmosphereDetails}`
                      }
                      className="reportField"
                      hideIfEmpty
                    />
                  </>
                )}
                <DictionaryField
                  wrappedComponent={CompactRow}
                  dictProps={Settings.fields.report.nextSteps}
                  content={<ListItems value={report.nextSteps} />}
                  className="reportField"
                  hideIfEmpty
                />
                <CompactRow
                  id="interlocutors"
                  label="Interlocutors"
                  content={getAttendeesAndAssessments(true)}
                  className="reportField"
                  hideIfEmpty
                />
                <CompactRow
                  id="advisors"
                  label="Advisors"
                  content={getAttendeesAndAssessments(false)}
                  className="reportField"
                  hideIfEmpty
                />
                <CompactRow
                  id="tasks"
                  label={Settings.fields.task.longLabel}
                  content={getTasksAndAssessments()}
                  className="reportField"
                  hideIfEmpty
                />
                {report.cancelled && (
                  <DictionaryField
                    wrappedComponent={CompactRow}
                    dictProps={Settings.fields.report.cancelledReason}
                    content={utils.sentenceCase(report.cancelledReason)}
                    className="reportField"
                    hideIfEmpty
                  />
                )}
                {optionalFields.workflow.active &&
                  report.showWorkflow() &&
                  !!report.workflow.length && (
                    <CompactRowReportWorkflow
                      workflow={report.workflow}
                      className="reportField"
                      isCompact
                    />
                  )}
                {report.reportText && (
                  <DictionaryField
                    wrappedComponent={CompactRow}
                    dictProps={Settings.fields.report.reportText}
                    content={
                      <RichTextEditor
                        readOnly
                        showAvatar={false}
                        value={report.reportText}
                      />
                    }
                    className="reportField keyDetailsRow"
                    hideIfEmpty
                    label={null}
                  />
                )}
                {optionalFields.reportSensitiveInformation.active &&
                  report.reportSensitiveInformation?.text && (
                    <>
                      <CompactRow
                        id="reportSensitiveInformation"
                        content={
                          <RichTextEditor
                            readOnly
                            showAvatar={false}
                            value={report.reportSensitiveInformation.text}
                          />
                        }
                        className="reportField"
                        hideIfEmpty
                        label="Sensitive information"
                        labelAlignment="top"
                      />
                      <CompactRow
                        id="authorizedMembers"
                        content={
                          <RelatedObjectsTable
                            title="Authorized Members"
                            relatedObjects={report.authorizedMembers}
                          />
                        }
                        className="reportField"
                        hideIfEmpty
                        label="Authorized Members"
                      />
                    </>
                  )}
                {optionalFields.assessments.active && (
                  <CompactRow
                    id="assessments"
                    content={
                      <CompactReportViewS>
                        {getAttendeesAndAssessments(
                          true,
                          true,
                          "interlocutors-assessments"
                        )}
                        {getAttendeesAndAssessments(
                          false,
                          true,
                          "advisors-assessments"
                        )}
                        {getTasksAndAssessments(true, "tasks-assessments")}
                      </CompactReportViewS>
                    }
                    className="reportField"
                    hideIfEmpty
                  />
                )}
                {Settings.fields.report.customFields && (
                  <CompactRow
                    id="customFields"
                    content={
                      <ReadonlyCustomFields
                        fieldsConfig={Settings.fields.report.customFields}
                        values={report}
                        vertical
                        isCompact
                        hideIfEmpty
                      />
                    }
                    className="reportField"
                    hideIfEmpty
                  />
                )}
              </FullColumn>
            </CompactTable>
            <CompactFooterContent
              object={report}
              color={null}
              policyAndClassification={utils.getPolicyAndClassificationForChoice(
                report.classification
              )}
            />
          </CompactView>
        </>
      )}
    </Formik>
  )

  function returnToDefaultPage() {
    navigate("..")
  }

  function printReport() {
    if (typeof window.print === "function") {
      window.print()
    } else {
      alert("Press CTRL+P to print this report")
    }
  }

  function getReportTitle() {
    return (
      <>
        Engagement
        {report.primaryInterlocutor && (
          <>
            {" of "}
            <LinkTo
              modelType="Person"
              showAvatar={false}
              model={report.primaryInterlocutor}
            />
          </>
        )}{" "}
        by{" "}
        <LinkTo
          modelType="Person"
          showAvatar={false}
          model={report.primaryAdvisor}
        />
        <br />
        on{" "}
        {moment(report.engagementDate).format(
          Report.getEngagementDateFormat()
        )}{" "}
        at{" "}
        {report.location && (
          <LinkTo
            modelType="Location"
            showAvatar={false}
            model={report.location}
          />
        )}
      </>
    )
  }

  function getReportSubTitle() {
    const timeToShow = !report.isPublished()
      ? moment(report.updatedAt)
      : moment(report.releasedAt)
    return (
      <div style={{ fontSize: "12px", marginBottom: "10px" }}>
        <div>
          Authored on{" "}
          {timeToShow.format(Settings.dateFormats.forms.displayShort.withTime)}{" "}
          [{Report.STATE_LABELS[report.state]}]
        </div>
        <div>
          <div>
            Printed by{" "}
            <LinkTo
              modelType="Person"
              model={currentUser}
              showAvatar={false}
              style={{ fontSize: "12px" }}
            />{" "}
            on{" "}
            {moment().format(Settings.dateFormats.forms.displayLong.withTime)}
          </div>
        </div>
      </div>
    )
  }

  function getTasksAndAssessments(displayAssessments?: boolean, id?: string) {
    return (
      // return only name and objective if no assessment
      displayAssessments ? (
        <InstantAssessmentsContainerField
          id={id}
          entityType={Task}
          entities={report.tasks}
          relatedObject={report}
          parentFieldName={Report.TASKS_ASSESSMENTS_PARENT_FIELD}
          formikProps={{
            values: report
          }}
          isCompact
          canRead={canReadAssessments}
          readonly
        />
      ) : (
        report.tasks.map((task, i) => (
          <React.Fragment key={task.uuid}>
            {i > 0 && <img src={TASKS_ICON} alt="★" className="ms-1 me-1" />}
            <BreadcrumbTrail
              modelType="Task"
              leaf={task}
              ascendantObjects={task.ascendantTasks}
              parentField="parentTask"
            />
          </React.Fragment>
        ))
      )
    )
  }

  function getAttendeesAndAssessments(
    interlocutor: boolean,
    displayAssessments?: boolean,
    id?: string
  ) {
    const attendees = report.attendees.filter(
      at => at.interlocutor === interlocutor
    )
    return displayAssessments ? (
      <InstantAssessmentsContainerField
        id={id}
        entityType={Person}
        entities={attendees}
        relatedObject={report}
        parentFieldName={Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD}
        formikProps={{
          values: report
        }}
        isCompact
        canRead={canReadAssessments}
        readonly
      />
    ) : (
      attendees.map(attendee => (
        <LinkTo
          key={attendee.uuid}
          modelType="Person"
          showAvatar={false}
          model={attendee}
        />
      ))
    )
  }
}

const CompactReportViewS = styled.div`
  .table {
    & span.badge {
      background-color: unset !important;
      padding: 0px;
      font-size: 12px !important;
    }

    & tr tr {
      display: flex;
      gap: 20px;

      & th {
        width: unset;
        font-weight: normal;
        white-space: nowrap;
      }
      & td {
        padding: 0px;
        font-weight: bold;
      }
    }

    & h4 {
      font-size: 16px;
    }

    & fieldset {
      padding: 10px 16px !important;
      background-color: unset;
      border: 1px solid #d1d5db;
      box-shadow: none;
    }
  }
`

const OPTIONAL_FIELDS_INIT = {
  assessments: {
    text: "Assessments",
    active: false
  },
  reportSensitiveInformation: {
    text: "Sensitive Information",
    active: false
  },
  workflow: {
    text: "Workflow",
    active: false
  }
}

interface CompactReportViewHeaderProps {
  onPrintClick?: (...args: unknown[]) => unknown
  returnToDefaultPage?: (...args: unknown[]) => unknown
  noReport?: boolean
  optionalFields: Record<
    string,
    {
      text: string
      active: boolean
    }
  >
  setOptionalFields?: (...args: unknown[]) => unknown
  setPageSize?: (...args: unknown[]) => unknown
}

const CompactReportViewHeader = ({
  onPrintClick,
  returnToDefaultPage,
  noReport = false,
  optionalFields,
  setOptionalFields,
  setPageSize
}: CompactReportViewHeaderProps) => (
  <Header>
    <HeaderTitle value="title">Summary / Print</HeaderTitle>
    <DropdownButton
      title="Page Size"
      variant="outline-secondary"
      id="pageSizeButton"
    >
      {Object.entries(PAGE_SIZES).map(([key, pageSize]) => (
        <Dropdown.Item
          key={key}
          onClick={() => setPageSize(pageSize)}
          style={{ minWidth: "205px" }}
        >
          {pageSize.name}
        </Dropdown.Item>
      ))}
    </DropdownButton>
    <SimpleMultiCheckboxDropdown
      id="optionalFields"
      label="Optional Fields ⇓"
      options={optionalFields}
      setOptions={setOptionalFields}
    />
    <Buttons>
      {!noReport && (
        <Button value="print" variant="primary" onClick={onPrintClick}>
          Print
        </Button>
      )}
      <Button
        value="detailedView"
        variant="primary"
        onClick={returnToDefaultPage}
      >
        Detailed View
      </Button>
    </Buttons>
  </Header>
)

const Header = styled.header`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  max-width: 21cm;
`

const HeaderTitle = styled.h3`
  margin: 0;
  @media print {
    display: none;
  }
`

const Buttons = styled.div`
  margin-bottom: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  button {
    margin-left: 5px;
    margin-right: 5px;
  }
`

interface CompactWorkflowRowProps {
  content?: React.ReactNode
}

export const CompactWorkflowRow = ({ content }: CompactWorkflowRowProps) => {
  return (
    <CompactWorkflowRowS>
      <CompactRowContentS colSpan={2}>{content}</CompactRowContentS>
    </CompactWorkflowRowS>
  )
}

const CompactWorkflowRowS = styled(CompactRowS)`
  & > td {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    text-align: left;
    list-style-type: disc;
  }
`

export default connect(null, mapPageDispatchersToProps)(CompactReportView)

interface CompactRowReportWorkflowProps {
  workflow: any[]
  isCompact?: boolean
}

export const CompactRowReportWorkflow = ({
  workflow,
  isCompact
}: CompactRowReportWorkflowProps) => (
  <Fieldset
    className="workflow-fieldset compact"
    title="Workflow"
    isCompact={isCompact}
  >
    <CompactWorkflowRow
      content={workflow.map(action => {
        const key = action.step
          ? `${action.createdAt}-${action.step.uuid}`
          : action.createdAt
        return <CompactRowReportAction action={action} key={key} />
      })}
    />
  </Fieldset>
)

interface CompactRowReportActionProps {
  action: any
}

const CompactRowReportAction = ({ action }: CompactRowReportActionProps) => {
  return (
    <CompactRowReportActionS className="workflow-action">
      <ActionStatus action={action} />
      <ActionButton action={action} isCompact />
    </CompactRowReportActionS>
  )
}

const CompactRowReportActionS = styled.div`
  margin: 0px !important;
  display: list-item !important;
  text-align: left !important;

  & button {
    width: fit-content !important;
    vertical-align: middle;
    background-color: unset !important;
    margin: 0px !important;
    padding: 0px;
    border: none;
  }

  & button::after {
    display: none;
  }

  & .action-status {
    display: inline-block;
    vertical-align: middle;
    margin-right: 10px;
  }
`
