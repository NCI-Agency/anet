import AggregationWidgetContainer, {
  getAggregationWidget
} from "components/aggregations/AggregationWidgetContainer"
import _isEmpty from "lodash/isEmpty"
import { formatPeriodBoundary, PeriodsPropType } from "periodUtils"
import React from "react"

interface QuestionsRowProps {
  idSuffix: string
  periods: PeriodsPropType
  periodsData: any[][]
  questionKey: string
  questionConfig: any
  isFirstRow?: boolean
}

/* The QuestionsRow component displays the results of the aggregation
 * of the assessments made on a given question (as part of the instant
 * assessments made on a given entity), grouped per period of time:
 * - instant assessments => made on the entity/subentities when
 *   working on them in relation to another type of entity (example:
 *   assessments made on tasks, while filling  report related to the tasks) or
 *   assessments made on the entity/subentity itself;
 */

export const QuestionsRow = ({
  idSuffix,
  questionKey,
  questionConfig,
  periods,
  periodsData,
  isFirstRow
}: QuestionsRowProps) => {
  const aggregationWidget = getAggregationWidget(questionConfig)
  if (_isEmpty(periods) || !aggregationWidget) {
    return null
  }
  return (
    <tr>
      {periods.map((period, index) => {
        const key = `${questionKey}-assessment-${formatPeriodBoundary(
          period.start
        )}`
        return (
          <td key={key}>
            {_isEmpty(periodsData[index]) ? (
              isFirstRow ? (
                <em>No engagement assessments</em>
              ) : null
            ) : (
              <AggregationWidgetContainer
                key={key}
                fieldConfig={questionConfig}
                fieldName={questionKey}
                data={periodsData[index]}
                widget={aggregationWidget}
                widgetId={`${key}-${idSuffix}`}
              />
            )}
          </td>
        )
      })}
    </tr>
  )
}

interface QuestionSetRowProps {
  idSuffix: string
  periods: PeriodsPropType
  periodsData: any[][]
  questionSetKey: string
  questionSetConfig: any
  isFirstRow?: boolean
}

export const QuestionSetRow = ({
  idSuffix,
  questionSetKey,
  questionSetConfig,
  periods,
  periodsData,
  isFirstRow
}: QuestionSetRowProps) => {
  return (
    <tr>
      {periods.map((period, index) => {
        const key = `${questionSetKey}-assessment-${formatPeriodBoundary(
          period.start
        )}`
        return (
          <td key={key}>
            {_isEmpty(periodsData[index]) ? (
              isFirstRow ? (
                <em>No engagement assessments</em>
              ) : null
            ) : (
              <div
                style={{
                  backgroundColor: "#f2f2f2",
                  borderRadius: "5px",
                  padding: "5px"
                }}
              >
                <div style={{ fontSize: "18px", fontWeight: "bold" }}>
                  {questionSetConfig.label || "Question Set"}
                </div>
                {Object.entries(questionSetConfig.questions || {}).map(
                  ([question, questionConfig]) => {
                    const aggregationWidget =
                      getAggregationWidget(questionConfig)
                    return (
                      <AggregationWidgetContainer
                        key={question}
                        fieldConfig={questionConfig}
                        fieldName={`questionSets.${questionSetKey}.questions.${question}`}
                        data={periodsData[index]}
                        widget={aggregationWidget}
                        widgetId={`${idSuffix}-${question}`}
                      />
                    )
                  }
                )}
                {!_isEmpty(questionSetConfig.questionSets) &&
                  Object.entries(questionSetConfig.questionSets || {}).map(
                    ([questionSet, config]) => (
                      <table key={questionSet}>
                        <tbody>
                          <QuestionSetRow
                            idSuffix={`${idSuffix}-${questionSet}`}
                            key={questionSet}
                            questionSetConfig={config}
                            questionSetKey={`${questionSetKey}.questionSets.${questionSet}`}
                            periods={periods}
                            periodsData={periodsData}
                          />
                        </tbody>
                      </table>
                    )
                  )}
              </div>
            )}
          </td>
        )
      })}
    </tr>
  )
}
