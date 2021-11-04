import PropTypes from "prop-types"
import React from "react"
import Fieldset from "components/Fieldset"
import Model from "components/Model"
import _isEmpty from "lodash/isEmpty"
import {
  CustomFieldsContainer,
  ReadonlyCustomFields
} from "components/CustomFields"

const QuestionSet = ({
  entity,
  relatedObject,
  questionSets,
  parentFieldName,
  formikProps,
  readonly
}) => {
  const { values } = formikProps
  return (
    <>
      {Object.keys(questionSets).map(set => {
        const entityInstantAssessmentConfig = Model.filterAssessmentConfig(
          questionSets[set],
          entity,
          relatedObject
        )
        return (
          <Fieldset title={questionSets[set]?.label} key={`questionSet-${set}`}>
            {!_isEmpty(entityInstantAssessmentConfig.questions) &&
              (readonly ? (
                <ReadonlyCustomFields
                  parentFieldName={`${parentFieldName}.${set}.questions`}
                  fieldsConfig={entityInstantAssessmentConfig.questions}
                  values={values}
                />
              ) : (
                <CustomFieldsContainer
                  formikProps={formikProps}
                  fieldsConfig={entityInstantAssessmentConfig.questions}
                  parentFieldName={`${parentFieldName}.${set}.questions`}
                />
              ))}
            {!_isEmpty(entityInstantAssessmentConfig.questionSets) && (
              <QuestionSet
                entity={entity}
                relatedObject={relatedObject}
                questionSets={entityInstantAssessmentConfig.questionSets}
                parentFieldName={`${parentFieldName}.${set}.questionSets`}
                formikProps={formikProps}
                readonly={readonly}
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
  readonly: PropTypes.bool
}

export default QuestionSet
