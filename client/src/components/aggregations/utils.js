import ValuesListAggregation from "components/aggregations/ValuesListAggregation"
import ReportsByTaskAggregation from "components/aggregations/ReportsByTaskAggregation"
import CountPerValueAggregation from "components/aggregations/CountPerValueAggregation"

export const WIDGET_AGGREGATIONS = {
  likertScale: ValuesListAggregation,
  numberAggregation: ValuesListAggregation,
  countPerValue: CountPerValueAggregation,
  reportsByTask: ReportsByTaskAggregation,
  default: ValuesListAggregation
}
