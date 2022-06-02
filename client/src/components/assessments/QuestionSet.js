import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"
import Fieldset from "components/Fieldset"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { useMemo } from "react"

const QuestionSet = ({
  entity,
  relatedObject,
  questionSets,
  parentFieldName,
  formikProps,
  readonly,
  vertical
}) => {
  const filteredQuestionSets = useMemo(() => {
    const entityConfigs = {}
    Object.keys(questionSets).forEach(set => {
      entityConfigs[set] = Model.filterAssessmentConfig(
        questionSets[set],
        entity,
        relatedObject
      )
    })
    return entityConfigs
  }, [entity, questionSets, relatedObject])
  const { values } = formikProps
  return (
    <>
      {Object.keys(questionSets).map(set => {
        return (
          <Fieldset
            title={questionSets[set]?.label}
            description={!readonly && questionSets[set]?.description}
            key={`questionSet-${set}`}
            style={{ paddingRight: "0", marginBottom: "0" }}
          >
            {!_isEmpty(filteredQuestionSets[set].questions) &&
              (readonly ? (
                <ReadonlyCustomFields
                  parentFieldName={`${parentFieldName}.${set}.questions`}
                  fieldsConfig={filteredQuestionSets[set].questions}
                  values={values}
                  vertical={vertical}
                />
              ) : (
                <CustomFieldsContainer
                  formikProps={formikProps}
                  fieldsConfig={filteredQuestionSets[set].questions}
                  parentFieldName={`${parentFieldName}.${set}.questions`}
                  vertical={vertical}
                />
              ))}
            {!_isEmpty(filteredQuestionSets[set].questionSets) && (
              <QuestionSet
                entity={entity}
                relatedObject={relatedObject}
                questionSets={filteredQuestionSets[set].questionSets}
                parentFieldName={`${parentFieldName}.${set}.questionSets`}
                formikProps={formikProps}
                readonly={readonly}
                vertical={vertical}
              />
            )}
          </Fieldset>
        )
      })}
    </>
  )
}

QuestionSet.propTypes = {
  entity: PropTypes.object,
  relatedObject: PropTypes.object,
  questionSets: PropTypes.object,
  parentFieldName: PropTypes.string,
  formikProps: PropTypes.object,
  readonly: PropTypes.bool,
  vertical: PropTypes.bool
}

export default QuestionSet
