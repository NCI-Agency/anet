import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import AggregationWidget from "components/AggregationWidget"
import AppContext from "components/AppContext"
import AddAssessmentModal from "components/assessments/AddAssessmentModal"
import ConfirmDelete from "components/ConfirmDelete"
import {
  getFieldPropsFromFieldConfig,
  ReadonlyCustomFields
} from "components/CustomFields"
import Fieldset from "components/Fieldset"
import { Formik } from "formik"
import LinkTo from "components/LinkTo"
import Model from "components/Model"
import { Person } from "models"
import moment from "moment"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Button, Panel, Table } from "react-bootstrap"
import REMOVE_ICON from "resources/delete.png"
import "components/assessments/AssessmentResultsTable.css"

/* The AssessmentResultsTable component displays the results of two types of
 * assessments made on a given entity and subentities:
 * - instant assessments => made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks) or
 *   assessments made on the entity/subentity itself;
 *   the configuration of these assessments can be retrieved using
 *   entity.getInstantAssessmentConfig()
 * - periodic assessments => made on the entity/subentities periodically,
 *   as a measurement of the given period of time;
 *   the config and yupSchema for these assessments is to be found in
 *   entity.getPeriodicAssessmentDetails(recurrence)
 */

const PERIOD_START_SHORT_FORMAT = "D"
const PERIOD_START_MIDDLE_FORMAT = "D MMMM"
const PERIOD_START_LONG_FORMAT = "D MMMM YYYY"
const PERIOD_END_FORMAT = "D MMMM YYYY"

const periodToString = period => {
  if (period.start.isSame(period.end, "day")) {
    return period.end.format(PERIOD_END_FORMAT)
  } else {
    const periodStartFormat =
      period.start.year() !== period.end.year()
        ? PERIOD_START_LONG_FORMAT
        : period.start.month() !== period.end.month()
          ? PERIOD_START_MIDDLE_FORMAT
          : PERIOD_START_SHORT_FORMAT
    return `${period.start.format(periodStartFormat)} - ${period.end.format(
      PERIOD_END_FORMAT
    )}`
  }
}

const periodsPropType = PropTypes.arrayOf(
  PropTypes.shape({
    start: PropTypes.object,
    end: PropTypes.object,
    allowNewAssessments: PropTypes.bool
  })
)
const periodsConfigPropType = PropTypes.shape({
  recurrence: PropTypes.string,
  periods: periodsPropType
})

const AssessmentsTableHeader = ({ periodsConfig }) => (
  <thead>
    <tr key="periods">
      <>
        {periodsConfig.periods.map(period => (
          <th key={period.start}>{periodToString(period)}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  periodsConfig: periodsConfigPropType
}

const InstantAssessmentRow = ({
  questionKey,
  questionConfig,
  entity,
  periods
}) => {
  const aggWidgetProps = {
    widget: questionConfig.aggregation?.widget || questionConfig.widget,
    aggregationType: questionConfig.aggregation?.aggregationType,
    vertical: true
  }
  const fieldProps = getFieldPropsFromFieldConfig(questionConfig)
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          <AggregationWidget
            key={`assessment-${questionKey}`}
            values={entity.getInstantAssessmentResults(period)[questionKey]}
            {...aggWidgetProps}
            {...fieldProps}
          />
        </td>
      ))}
    </tr>
  )
}
InstantAssessmentRow.propTypes = {
  entity: PropTypes.object,
  periods: periodsPropType,
  questionKey: PropTypes.string,
  questionConfig: PropTypes.object
}

const BasePeriodicAssessment = ({
  assessment,
  assessmentConfig,
  note,
  currentUser
}) => {
  const byMe = Person.isEqual(currentUser, note.author)
  const parentFieldName = `assessment-${note.uuid}`
  return (
    <Panel bsStyle="primary" style={{ borderRadius: "15px" }}>
      <Panel.Heading
        style={{
          padding: "1px 1px",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          paddingRight: "10px",
          paddingLeft: "10px",
          // whiteSpace: "nowrap", TODO: disabled for now as not working well in IE11
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end"
        }}
      >
        <>
          <i>{moment(note.updatedAt).fromNow()}</i>{" "}
          <LinkTo
            modelType="Person"
            model={note.author}
            style={{ color: "white" }}
          />
          {byMe && (
            <>
              <Button
                title="Edit assessment"
                  // FIXME: implement edit assessment
                  // onClick={() => showRelatedObjectNoteModal(note.uuid)}
                bsSize="xsmall"
                bsStyle="primary"
              >
                <Icon icon={IconNames.EDIT} />
              </Button>
              <ConfirmDelete
                  // FIXME: implement delete assessment
                onConfirmDelete={() => console.log("to be implemented")}
                objectType="note"
                objectDisplay={"#" + note.uuid}
                title="Delete note"
                bsSize="xsmall"
                bsStyle="primary"
              >
                <img src={REMOVE_ICON} height={14} alt="Delete assessment" />
              </ConfirmDelete>
            </>
          )}
        </>
      </Panel.Heading>
      <Panel.Body>
        <div
          style={{
            overflowWrap: "break-word",
            /* IE: */ wordWrap: "break-word"
          }}
        >
          <Formik
            enableReinitialize
            initialValues={{
              [parentFieldName]: assessment
            }}
          >
            {({ values }) => {
              return (
                <ReadonlyCustomFields
                  parentFieldName={parentFieldName}
                  fieldsConfig={assessmentConfig}
                  values={values}
                  vertical
                />
              )
            }}
          </Formik>
        </div>
      </Panel.Body>
    </Panel>
  )
}
BasePeriodicAssessment.propTypes = {
  assessment: PropTypes.object,
  assessmentConfig: PropTypes.object,
  note: Model.notePropTypes,
  currentUser: PropTypes.instanceOf(Person)
}

const PeriodicAssessment = props => (
  <AppContext.Consumer>
    {context => (
      <BasePeriodicAssessment currentUser={context.currentUser} {...props} />
    )}
  </AppContext.Consumer>
)

const BasePeriodicAssessmentRows = ({
  entity,
  entityType,
  periodsConfig,
  canAddAssessment,
  onAddAssessment,
  currentUser
}) => {
  const { recurrence, periods } = periodsConfig
  const {
    assessmentConfig: periodicAssessmentConfig,
    assessmentYupSchema: periodicAssessmentYupSchema
  } = entity.getPeriodicAssessmentDetails(recurrence)
  if (!periodicAssessmentConfig) {
    return null
  }

  const periodsAssessments = []
  const periodsAllowNewAssessment = []
  periods.forEach(period => {
    const periodAssessments = entity.getPeriodAssessments(
      recurrence,
      period,
      currentUser
    )
    const myPeriodAssessments = periodAssessments.filter(
      ({ note, assessment }) => Person.isEqual(currentUser, note.author)
    )
    periodsAssessments.push(periodAssessments)
    // Only allow adding new assessments for a period if the user has the rights
    // for it, if the period is configured to allow adding new assessments and
    // if the current user didn't already made an assessment for the period
    periodsAllowNewAssessment.push(
      canAddAssessment &&
        period.allowNewAssessments &&
        _isEmpty(myPeriodAssessments)
    )
  })
  const hasPeriodicAssessmentsRow = !_isEmpty(
    periodsAssessments.filter(x => !_isEmpty(x))
  )
  const hasAddAssessmentRow = !_isEmpty(
    periodsAllowNewAssessment.filter(x => x)
  )
  return (
    <>
      {hasPeriodicAssessmentsRow && (
        <tr>
          {periodsAssessments.map((periodAssessments, index) => {
            return (
              <td key={index}>
                {periodAssessments &&
                  periodAssessments.map(({ note, assessment }, i) => (
                    <div key={note.uuid}>
                      <PeriodicAssessment
                        note={note}
                        assessment={assessment}
                        assessmentConfig={periodicAssessmentConfig}
                      />
                    </div>
                  ))}
              </td>
            )
          })}
        </tr>
      )}
      {hasAddAssessmentRow && (
        <tr>
          {periods.map((period, index) => {
            const periodDisplay = periodToString(period)
            const addAssessmentLabel = `Make a new ${entity?.toString()} assessment for ${periodDisplay}`
            return (
              <td key={index}>
                {periodsAllowNewAssessment[index] && (
                  <AddAssessmentModal
                    entity={entity}
                    entityType={entityType}
                    title={`Assessment for ${entity.toString()} for ${periodDisplay}`}
                    addAssessmentLabel={addAssessmentLabel}
                    yupSchema={periodicAssessmentYupSchema}
                    recurrence={recurrence}
                    assessmentPeriod={period}
                    assessmentConfig={periodicAssessmentConfig}
                    onSuccess={() => {
                      onAddAssessment()
                    }}
                  />
                )}
              </td>
            )
          })}
        </tr>
      )}
    </>
  )
}
BasePeriodicAssessmentRows.propTypes = {
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  periodsConfig: periodsConfigPropType,
  canAddAssessment: PropTypes.bool,
  onAddAssessment: PropTypes.func,
  currentUser: PropTypes.instanceOf(Person)
}

const PeriodicAssessmentRows = props => (
  <AppContext.Consumer>
    {context => (
      <BasePeriodicAssessmentRows
        currentUser={context.currentUser}
        {...props}
      />
    )}
  </AppContext.Consumer>
)

const EntityAssessmentResults = ({
  entity,
  entityType,
  style,
  periodsConfig,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const instantAssessmentConfig = entity.getInstantAssessmentConfig()
  const { periods } = periodsConfig
  return (
    <>
      <tr>
        <td colSpan={periods.length} className="entity-title-row">
          <LinkTo modelType={entityType.resourceName} model={entity} />
        </td>
      </tr>
      {Object.keys(instantAssessmentConfig || {}).map(key => (
        <InstantAssessmentRow
          key={key}
          questionKey={key}
          questionConfig={instantAssessmentConfig[key]}
          periods={periods}
          entity={entity}
        />
      ))}
      <PeriodicAssessmentRows
        entity={entity}
        entityType={entityType}
        periodsConfig={periodsConfig}
        canAddAssessment={canAddAssessment}
        onAddAssessment={onAddAssessment}
      />
    </>
  )
}
EntityAssessmentResults.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  periodsConfig: periodsConfigPropType,
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

const AssessmentResultsTable = ({
  entity,
  entityType,
  subEntities,
  style,
  periodsConfig,
  canAddAssessment,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const { recurrence } = periodsConfig
  const entityInstantAssessmentConfig = entity.getInstantAssessmentConfig()
  const subentitiesInstantAssessmentConfig = subEntities
    ?.map(s => s.getInstantAssessmentConfig())
    .filter(mc => !_isEmpty(mc))
  const {
    assessmentConfig: periodicAssessmentConfig
  } = entity.getPeriodicAssessmentDetails(recurrence)
  const showAssessmentResults =
    !_isEmpty(entityInstantAssessmentConfig) ||
    !_isEmpty(subentitiesInstantAssessmentConfig) ||
    !_isEmpty(periodicAssessmentConfig)
  return (
    <>
      {showAssessmentResults && (
        <div style={{ ...style }}>
          <Fieldset
            title={`Assessment results - ${recurrence}`}
            id={`"entity-assessments-results-${recurrence}`}
          >
            <Table condensed responsive className="assessments-table">
              <AssessmentsTableHeader periodsConfig={periodsConfig} />
              <tbody>
                {!_isEmpty(subEntities) && (
                  <>
                    {subEntities?.map(subEntity => (
                      <EntityAssessmentResults
                        key={`subassessment-${subEntity.uuid}`}
                        entity={subEntity}
                        entityType={entityType}
                        periodsConfig={periodsConfig}
                        canAddAssessment={false}
                      />
                    ))}
                  </>
                )}
                <EntityAssessmentResults
                  entity={entity}
                  entityType={entityType}
                  periodsConfig={periodsConfig}
                  canAddAssessment={canAddAssessment}
                  onAddAssessment={onAddAssessment}
                />
              </tbody>
            </Table>
          </Fieldset>
        </div>
      )}
    </>
  )
}
AssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  entityType: PropTypes.func.isRequired,
  subEntities: PropTypes.array,
  periodsConfig: periodsConfigPropType,
  onAddAssessment: PropTypes.func,
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsTable
