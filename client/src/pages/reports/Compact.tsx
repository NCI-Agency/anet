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
import {
  DEFAULT_CUSTOM_FIELDS_PARENT,
  GRAPHQL_ENTITY_AVATAR_FIELDS
} from "components/Model"
import {
  mapPageDispatchersToProps,
  PageDispatchersPropType,
  useBoilerplate,
  usePageTitle
} from "components/Page"
import { GRAPHQL_NOTES_FIELDS } from "components/RelatedObjectNotes"
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
      authorizationGroups {
        uuid
        name
        description
      }
      customFields
      ${GRAPHQL_NOTES_FIELDS}
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
              classification={
                Settings.classification.choices[report.classification]
              }
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
                />
                <DictionaryField
                  wrappedComponent={CompactRow}
                  dictProps={Settings.fields.report.keyOutcomes}
                  content={report.keyOutcomes}
                  className="reportField"
                />
                {!report.cancelled && (
                  <>
                    <DictionaryField
                      wrappedComponent={CompactRow}
                      dictProps={Settings.fields.report.atmosphere}
                      content={utils.sentenceCase(report.atmosphere)}
                      className="reportField"
                    />
                    <DictionaryField
                      wrappedComponent={CompactRow}
                      dictProps={Settings.fields.report.atmosphereDetails}
                      content={report.atmosphereDetails}
                      className="reportField"
                    />
                  </>
                )}
                <DictionaryField
                  wrappedComponent={CompactRow}
                  dictProps={Settings.fields.report.nextSteps}
                  content={report.nextSteps}
                  className="reportField"
                />
                <CompactRow
                  id="interlocutors"
                  label="Interlocutors"
                  content={getAttendeesAndAssessments(true)}
                  className="reportField"
                />
                <CompactRow
                  id="advisors"
                  label="Advisors"
                  content={getAttendeesAndAssessments(false)}
                  className="reportField"
                />
                <CompactRow
                  id="tasks"
                  label={Settings.fields.task.longLabel}
                  content={getTasksAndAssessments()}
                  className="reportField"
                />
                {report.cancelled && (
                  <DictionaryField
                    wrappedComponent={CompactRow}
                    dictProps={Settings.fields.report.cancelledReason}
                    content={utils.sentenceCase(report.cancelledReason)}
                    className="reportField"
                  />
                )}
                {optionalFields.workflow.active && report.showWorkflow() && (
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
                      <RichTextEditor readOnly value={report.reportText} />
                    }
                    className="reportField"
                  />
                )}
                {Settings.fields.report.customFields && (
                  <ReadonlyCustomFields
                    fieldsConfig={Settings.fields.report.customFields}
                    values={report}
                    vertical
                    isCompact
                  />
                )}
              </FullColumn>
            </CompactTable>
            <CompactFooterContent
              object={report}
              classification={
                Settings.classification.choices[report.classification]
              }
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
            <LinkTo modelType="Person" model={report.primaryInterlocutor} />
          </>
        )}{" "}
        by <LinkTo modelType="Person" model={report.primaryAdvisor} />
        <br />
        on{" "}
        {moment(report.engagementDate).format(
          Report.getEngagementDateFormat()
        )}{" "}
        at{" "}
        {report.location && (
          <LinkTo modelType="Location" model={report.location} />
        )}
      </>
    )
  }

  function getReportSubTitle() {
    const timeToShow = !report.isPublished()
      ? moment(report.updatedAt)
      : moment(report.releasedAt)
    return (
      <>
        Authored on{" "}
        {timeToShow.format(Settings.dateFormats.forms.displayShort.withTime)} [
        {Report.STATE_LABELS[report.state]}]
      </>
    )
  }

  function getTasksAndAssessments() {
    return (
      // return only name and objective if no assessment
      optionalFields.assessments.active ? (
        <InstantAssessmentsContainerField
          entityType={Task}
          entities={report.tasks}
          relatedObject={report}
          parentFieldName={Report.TASKS_ASSESSMENTS_PARENT_FIELD}
          formikProps={{
            values: report
          }}
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

  function getAttendeesAndAssessments(interlocutor) {
    const attendees = report.attendees.filter(
      at => at.interlocutor === interlocutor
    )
    return optionalFields.assessments.active ? (
      <InstantAssessmentsContainerField
        entityType={Person}
        entities={attendees}
        relatedObject={report}
        parentFieldName={Report.ATTENDEES_ASSESSMENTS_PARENT_FIELD}
        formikProps={{
          values: report
        }}
        canRead={canReadAssessments}
        readonly
        showEntitiesWithoutAssessments
      />
    ) : (
      attendees.map(attendee => (
        <LinkTo key={attendee.uuid} modelType="Person" model={attendee} />
      ))
    )
  }
}

const OPTIONAL_FIELDS_INIT = {
  assessments: {
    text: "Assessments",
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
  noReport,
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

CompactReportViewHeader.defaultProps = {
  noReport: false
}

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
      <CompactRowContentS colSpan="2">{content}</CompactRowContentS>
    </CompactWorkflowRowS>
  )
}

const CompactWorkflowRowS = styled(CompactRowS)`
  & > td {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
    align-items: center;
    text-align: center;
    & > div {
      position: relative;
      margin-right: 18px;
    }
    & > div:not(:last-child):after {
      position: absolute;
      right: -18px;
      top: 0;
      content: "→";
    }
    & > div > button {
      padding: 0 5px !important;
      margin: 0;
    }
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
    <div className="workflow-action">
      <ActionStatus action={action} />
      <ActionButton action={action} />
    </div>
  )
}
