import AggregationWidgetContainer, {
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import _isEmpty from "lodash/isEmpty"
import _uniqueId from "lodash/uniqueId"
import { PeriodsPropType } from "periodUtils"
import PropTypes from "prop-types"
import React from "react"

/* The InstantAssessmentsRow component displays the results of the aggregation
 * of the assessments made on a given question (as part of the instant
 * assessments made on a given entity), grouped per period of time:
 * - instant assessments => made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks) or
 *   assessments made on the entity/subentity itself;
 */

export const InstantAssessmentsRow = ({
  questionKey,
  questionConfig,
  periods,
  periodsData,
  isFirstRow
}) => {
  const aggregationWidget = getAggregationWidget(questionConfig)
  if (_isEmpty(periods) || !aggregationWidget) {
    return null
  }
  return (
    <tr>
      {periods.map((period, index) => (
        <td key={index}>
          {_isEmpty(periodsData[index]) ? (
            isFirstRow ? (
              <em>No assessments</em>
            ) : null
          ) : (
            <AggregationWidgetContainer
              key={`assessment-${questionKey}`}
              fieldConfig={questionConfig}
              fieldName={questionKey}
              data={periodsData[index]}
              widget={aggregationWidget}
              widgetId={`${questionKey}-${_uniqueId("assessment")}`}
            />
          )}
        </td>
      ))}
    </tr>
  )
}
InstantAssessmentsRow.propTypes = {
  periods: PeriodsPropType.isRequired,
  periodsData: PropTypes.arrayOf(PropTypes.array).isRequired,
  questionKey: PropTypes.string.isRequired,
  questionConfig: PropTypes.object.isRequired,
  isFirstRow: PropTypes.bool
}
