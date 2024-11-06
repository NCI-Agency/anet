import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import React from "react"
import { Button } from "react-bootstrap"

interface PeriodsNavigationProps {
  offset?: number
  onChange: (...args: unknown[]) => unknown
  disabledLeft?: boolean
  disabledRight?: boolean
}

const PeriodsNavigation = ({
  offset,
  onChange,
  disabledLeft,
  disabledRight
}: PeriodsNavigationProps) => (
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
PeriodsNavigation.defaultProps = {
  offset: 0,
  disabledLeft: false,
  disabledRight: false
}

export default PeriodsNavigation
