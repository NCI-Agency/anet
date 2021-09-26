import {
  aggregationWidgetDefaultProps,
  aggregationWidgetPropTypes
} from "components/aggregations/utils"
import _isEmpty from "lodash/isEmpty"
import React, { useState } from "react"
import { Button, Collapse, Table } from "react-bootstrap"
import utils from "utils"

const RichTextWidget = ({ values, whenUnspecified, ...otherWidgetProps }) => {
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
            {filteredValues.map((val, index) => (
              <tr key={index}>
                <td>{val}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Collapse>
    </div>
  )
}
RichTextWidget.propTypes = aggregationWidgetPropTypes
RichTextWidget.defaultProps = aggregationWidgetDefaultProps

export default RichTextWidget
