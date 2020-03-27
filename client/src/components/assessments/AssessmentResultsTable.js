import AggregationWidget from "components/AggregationWidgets"
import Fieldset from "components/Fieldset"
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
    <tr>
      {periods.map(period => (
        <th key={period.start}>{period.start.format("MMM-YYYY")}</th>
      ))}
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

const AssessmentResultsTable = ({
  entity,
  subEntities,
  style,
  assessmentPeriods,
  canAddAssessment,
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
    <>
      <div style={{ ...style, margin: 10 }}>
        <Fieldset
          title={`${entity.toString()} assessment results`}
          id="assessments-results"
        >
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
        </Fieldset>
      </div>
      <>
        {subEntities?.map(subEntity => (
          <AssessmentResultsTable
            key={`subassessment-${subEntity.uuid}`}
            entity={subEntity}
            assessmentPeriods={assessmentPeriods}
            canAddAssessment={false}
          />
        ))}
      </>
    </>
  )
}
AssessmentResultsTable.propTypes = {
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
  canAddAssessment: PropTypes.bool
}

export default AssessmentResultsTable
