import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import _isEmpty from "lodash/isEmpty"
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
        variant="outline-secondary"
        id="toggleShowValues"
      >
        {showValues ? "Hide" : "Show"} {filteredValues.length}{" "}
        {utils.pluralizeWord(filteredValues.length, "value")}
      </Button>
      <Collapse in={showValues}>
        <Table>
          <tbody style={{ display: "table", width: "100%" }}>
            {filteredValues.map((val, index) => (
              <tr key={index}>
                <td>{JSON.stringify(val)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Collapse>
    </div>
  )
}
DefaultAggWidget.propTypes = aggregationWidgetPropTypes
DefaultAggWidget.defaultProps = aggregationWidgetDefaultProps

export default DefaultAggWidget
