import AggregationWidget from "components/AggregationWidgets"
import Fieldset from "components/Fieldset"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

/* The AssessmentResults component displays the results of two types of
 * assessments made on a given entity and subentities:
 * - aggregation of the assessments made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks);
 *   the definition of these assessments is to be found in
 *   entity.customFields.assessmentDefinition
 * - display of the last period related assessment made on the entity/subentities
 *   as a conclusion about the given period of time;
 *   the definition of these assessments is to be found in
 *   entity.periodAssessmentConfig()
 */

const AssessmentsTableHeader = ({ title, periods }) => (
  <thead>
    {title && (
      <tr key="title">
        <th colSpan={periods.length}>{title}</th>
      </tr>
    )}
    <tr key="periods">
      <>
        {periods.map(period => (
          <th key={period.start}>{period.start.format("MMM-YYYY")}</th>
        ))}
      </>
    </tr>
  </thead>
)
AssessmentsTableHeader.propTypes = {
  title: PropTypes.string,
  periods: PropTypes.array
}

const AssessmentsTableRow = ({ questionKey, questionDef, data }) => {
  const aggWidgetProps = {
    widget: questionDef.aggregation?.widget || questionDef.widget,
    aggregationType: questionDef.aggregation?.aggregationType,
    vertical: true
  }
  const widgetLayoutConfig = Object.without(
    questionDef,
    "aggregation",
    "type",
    "typeError",
    "placeholder",
    "helpText",
    "validations",
    "visibleWhen",
    "objectFields"
  )

  return (
    <tr>
      {data.map((assessment, index) => (
        <td key={index}>
          <AggregationWidget
            key={`assessment-${questionKey}`}
            values={assessment[questionKey]}
            {...aggWidgetProps}
            {...widgetLayoutConfig}
          />
        </td>
      ))}
    </tr>
  )
}
AssessmentsTableRow.propTypes = {
  questionKey: PropTypes.string,
  questionDef: PropTypes.object,
  data: PropTypes.array
}

const EntityAssessmentResultsTable = ({
  entity,
  style,
  assessmentPeriods,
  canEdit,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  const assessmentDefinition = JSON.parse(
    JSON.parse(entity.customFields || "{}").assessmentDefinition || "{}"
  )
  const assessmentResults = assessmentPeriods.map(p =>
    entity.getAssessmentResults(p)
  )

  return (
    <Table striped bordered condensed hover responsive>
      <AssessmentsTableHeader
        title={entity?.toString()}
        periods={assessmentPeriods}
      />
      <tbody>
        {Object.keys(assessmentDefinition || {}).map(key => (
          <AssessmentsTableRow
            key={key}
            questionKey={key}
            questionDef={assessmentDefinition[key]}
            data={assessmentResults}
          />
        ))}
      </tbody>
    </Table>
  )
}
EntityAssessmentResultsTable.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object
    })
  ),
  onAddAssessment: PropTypes.func,
  canEdit: PropTypes.bool
}

const AssessmentResultsTable2 = ({
  entity,
  subEntities,
  style,
  assessmentPeriods,
  canEdit,
  onAddAssessment
}) => {
  if (!entity) {
    return null
  }
  return (
    <>
      <div style={{ ...style }}>
        <Fieldset
          title={`${entity.toString()} assessment results`}
          id="entity-assessments-results"
        >
          <EntityAssessmentResultsTable
            style={{ flex: "0 0 100%" }}
            entity={entity}
            assessmentPeriods={assessmentPeriods}
            canEdit={false}
            onAddAssessment={onAddAssessment}
          />
        </Fieldset>
      </div>
      <>
        {!_isEmpty(subEntities) && (
          <Fieldset
            title="Subtasks assessment results"
            id="subentities-assessments-results"
          >
            {subEntities?.map(subEntity => (
              <EntityAssessmentResultsTable
                key={`subassessment-${subEntity.uuid}`}
                entity={subEntity}
                assessmentPeriods={assessmentPeriods}
                canEdit={false}
              />
            ))}
          </Fieldset>
        )}
      </>
    </>
  )
}
AssessmentResultsTable2.propTypes = {
  style: PropTypes.object,
  entity: PropTypes.object,
  subEntities: PropTypes.array,
  assessmentPeriods: PropTypes.arrayOf(
    PropTypes.shape({
      start: PropTypes.object,
      end: PropTypes.object
    })
  ),
  onAddAssessment: PropTypes.func,
  canEdit: PropTypes.bool
}

export default AssessmentResultsTable2
