import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import Pie from "components/graphs/Pie"
import PropTypes from "prop-types"
import React from "react"

const PieWidget = ({
  values,
  entitiesCount,
  legend,
  showLegend = true,
  ...otherWidgetProps
}) => {
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
          {Object.map(legend, (key, choice) => (
            <React.Fragment key={key}>
              <span style={{ backgroundColor: choice.color }}>
                {choice.label}{" "}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  )
}
PieWidget.propTypes = {
  entitiesCount: PropTypes.number,
  legend: PropTypes.object,
  showLegend: PropTypes.bool,
  ...aggregationWidgetPropTypes
}
PieWidget.defaultProps = aggregationWidgetDefaultProps

export default PieWidget
