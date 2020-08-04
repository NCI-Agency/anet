import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import _isEmpty from "lodash/isEmpty"
import _uniqueId from "lodash/uniqueId"
import React, { useState } from "react"
import { Button, Collapse, Table } from "react-bootstrap"
import utils from "utils"

const DefaultAggWidget = ({ values, whenUnspecified, ...otherWidgetProps }) => {
  const [showValues, setShowValues] = useState(false)
  const filteredValues = values.filter(value => !utils.isNullOrUndefined(value))
  if (_isEmpty(filteredValues)) {
    return whenUnspecified
  }
  return (
    <div>
      <Button
        className="toggle-section-button"
        style={{ marginBottom: "1rem" }}
        onClick={() => setShowValues(!showValues)}
        id="toggleShowValues"
      >
        {showValues ? "Hide" : "Show"} {filteredValues.length} values
      </Button>
      <Collapse in={showValues}>
        <Table>
          <tbody>
            {filteredValues.map(val => {
              const keyValue = _uniqueId("value_")
              return (
                <tr key={keyValue}>
                  <td>{JSON.stringify(val)}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </Collapse>
    </div>
  )
}
DefaultAggWidget.propTypes = aggregationWidgetPropTypes
DefaultAggWidget.defaultProps = aggregationWidgetDefaultProps

export default DefaultAggWidget
