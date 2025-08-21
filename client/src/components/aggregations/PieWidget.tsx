import { AggregationWidgetPropType } from "components/aggregations/utils"
import Pie from "components/graphs/Pie"
import React from "react"
import utils from "utils"

interface PieWidgetProps extends AggregationWidgetPropType {
  entitiesCount?: number
  legend?: any
  showLegend?: boolean
}

const PieWidget = ({
  values,
  entitiesCount,
  legend,
  showLegend = true,
  ...otherWidgetProps // eslint-disable-line @typescript-eslint/no-unused-vars
}: PieWidgetProps) => {
  return (
    <>
      <Pie
        width={70}
        height={70}
        data={values}
        label={entitiesCount}
        segmentFill={entity => legend[entity.data.key]?.color}
        segmentLabel={d => d.data.value}
      />
      {showLegend && (
        <div className="pieLegend">
          {Object.map(legend, (key, choice) => {
            const textColor = utils.getContrastYIQ(choice.color)
            return (
              <React.Fragment key={key}>
                <span
                  style={{
                    backgroundColor: choice.color,
                    color: textColor,
                    padding: "2px"
                  }}
                >
                  {choice.label}
                </span>
              </React.Fragment>
            )
          })}
        </div>
      )}
    </>
  )
}

export default PieWidget
