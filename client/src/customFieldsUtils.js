import LikertScale from "components/graphs/LikertScale"
import RichTextEditor from "components/RichTextEditor"

export const SPECIAL_WIDGET_TYPES = {
  LIKERT_SCALE: "likertScale",
  RICH_TEXT_EDITOR: "richTextEditor"
}
export const SPECIAL_WIDGET_COMPONENTS = {
  [SPECIAL_WIDGET_TYPES.LIKERT_SCALE]: LikertScale,
  [SPECIAL_WIDGET_TYPES.RICH_TEXT_EDITOR]: RichTextEditor
}

export const getArrayObjectValue = (values, fieldName) => {
  const nameKeys = fieldName.split(".")
  return nameKeys.reduce((v, key) => (v && v[key] ? v[key] : []), values)
}

export const getFieldPropsFromFieldConfig = fieldConfig => {
  const {
    aggregations,
    type,
    typeError,
    placeholder,
    helpText,
    validations,
    visibleWhen,
    objectFields,
    ...fieldProps
  } = fieldConfig
  return fieldProps
}
