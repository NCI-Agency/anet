import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import PropTypes from "prop-types"
import React from "react"
import { Button } from "react-bootstrap"

const PeriodsNavigation = ({
  offset,
  onChange,
  disabledLeft,
  disabledRight
}) => (
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    <Button
      variant="outline-secondary"
      disabled={disabledLeft}
      onClick={() => onChange(offset + 1)}
    >
      <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} /> previous period
    </Button>
    <Button
      variant="outline-secondary"
      disabled={disabledRight}
      onClick={() => onChange(offset - 1)}
    >
      next period <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
    </Button>
  </div>
)
PeriodsNavigation.propTypes = {
  offset: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  disabledLeft: PropTypes.bool,
  disabledRight: PropTypes.bool
}
PeriodsNavigation.defaultProps = {
  offset: 0,
  disabledLeft: false,
  disabledRight: false
}

export default PeriodsNavigation
