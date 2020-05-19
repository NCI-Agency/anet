import CountPerValueAggregation from "components/aggregations/CountPerValueAggregation"
import NumbersListAggregation from "components/aggregations/NumbersListAggregation"
import ReportsByTaskAggregation from "components/aggregations/ReportsByTaskAggregation"
import ValuesListAggregation from "components/aggregations/ValuesListAggregation"
import { CUSTOM_FIELD_TYPE } from "components/Model"

const AGGREGATION_TYPE = {
  REPORTS_BY_TASK: "countReportsByTask",
  COUNT_PER_VALUE: "countPerValue",
  NUMBERS_LIST: "numbersList",
  VALUES_LIST: "valuesList"
}

const DEFAULT_AGGREGATION_TYPE_PER_FIELD_TYPE = {
  [CUSTOM_FIELD_TYPE.TEXT]: AGGREGATION_TYPE.VALUES_LIST,
  [CUSTOM_FIELD_TYPE.NUMBER]: AGGREGATION_TYPE.NUMBERS_LIST,
  [CUSTOM_FIELD_TYPE.DATE]: AGGREGATION_TYPE.VALUES_LIST,
  [CUSTOM_FIELD_TYPE.DATETIME]: AGGREGATION_TYPE.VALUES_LIST,
  [CUSTOM_FIELD_TYPE.ENUM]: AGGREGATION_TYPE.COUNT_PER_VALUE,
  [CUSTOM_FIELD_TYPE.ENUMSET]: AGGREGATION_TYPE.COUNT_PER_VALUE,
  [CUSTOM_FIELD_TYPE.ARRAY_OF_OBJECTS]: AGGREGATION_TYPE.VALUES_LIST,
  [CUSTOM_FIELD_TYPE.SPECIAL_FIELD]: AGGREGATION_TYPE.VALUES_LIST
}

const AGGREGATION_TYPE_COMPONENTS = {
  [AGGREGATION_TYPE.REPORTS_BY_TASK]: ReportsByTaskAggregation,
  [AGGREGATION_TYPE.COUNT_PER_VALUE]: CountPerValueAggregation,
  [AGGREGATION_TYPE.NUMBERS_LIST]: NumbersListAggregation,
  [AGGREGATION_TYPE.VALUES_LIST]: ValuesListAggregation
}

export const getAggregationComponentForFieldConfig = fieldConfig => {
  const aggregationType =
    fieldConfig.aggregation?.aggregationType ||
    DEFAULT_AGGREGATION_TYPE_PER_FIELD_TYPE[fieldConfig.type]
  return aggregationType ? AGGREGATION_TYPE_COMPONENTS[aggregationType] : null
}
