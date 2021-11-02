import PropTypes from "prop-types"
import React from "react"
import Fieldset from "components/Fieldset"
import Model from "components/Model"
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
            {readonly ? (
              <ReadonlyCustomFields
                parentFieldName={`${parentFieldName}.${set}`}
                fieldsConfig={entityInstantAssessmentConfig.questions}
                values={values}
              />
            ) : (
              <CustomFieldsContainer
                formikProps={formikProps}
                fieldsConfig={entityInstantAssessmentConfig.questions}
                parentFieldName={`${parentFieldName}.${set}`}
              />
            )}
            {entityInstantAssessmentConfig.questionSets && (
              <QuestionSet
                entity={entity}
                relatedObject={relatedObject}
                questionSets={entityInstantAssessmentConfig.questionSets}
                parentFieldName={`${parentFieldName}.${set}`}
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
