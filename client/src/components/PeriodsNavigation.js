import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"

const PeriodsNavigation = ({ offset, onChange }) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <Button
      bsStyle="default"
      type="button"
      onClick={() => onChange(offset + 1)}
    >
      <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} /> previous period
    </Button>
    <Button
      bsStyle="default"
      type="button"
      onClick={() => onChange(offset - 1)}
    >
      next period <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
    </Button>
  </div>
)
PeriodsNavigation.propTypes = {
  offset: PropTypes.number,
  onChange: PropTypes.func.isRequired
}
PeriodsNavigation.defaultProps = {
  offset: 0
}

export default PeriodsNavigation
