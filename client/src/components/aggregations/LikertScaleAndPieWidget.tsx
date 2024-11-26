import PieWidget from "components/aggregations/PieWidget"
import { AggregationWidgetPropType } from "components/aggregations/utils"
import LikertScale from "components/graphs/LikertScale"
import _isEmpty from "lodash/isEmpty"
import React from "react"

const LikertScaleAndPieWidget = ({
  values,
  ...otherWidgetProps
}: AggregationWidgetPropType) => {
  const { likertScaleValues, pieValues } = values
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap"
      }}
    >
      <div
        style={{
          flexGrow: "0"
        }}
      >
        <PieWidget {...pieValues} {...otherWidgetProps} showLegend={false} />
      </div>
      {!_isEmpty(likertScaleValues) && (
        <div
          style={{
            flexGrow: "1"
          }}
        >
          <LikertScale
            {...likertScaleValues}
            {...otherWidgetProps}
            whenUnspecified=""
          />
        </div>
      )}
    </div>
  )
}

export default LikertScaleAndPieWidget
