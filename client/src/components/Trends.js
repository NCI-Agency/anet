import { IconNames } from "@blueprintjs/icons"
import { Icon } from "@blueprintjs/core"
import PropTypes from "prop-types"
import React from "react"

const TrendIcon = props => {
  if (props.trendValue > 0) {
    return <Icon icon={IconNames.TRENDING_UP} />
  }
  if (props.trendValue < 0) {
    return <Icon icon={IconNames.TRENDING_DOWN} />
  }
  return <Icon icon={IconNames.EQUALS} />
}

TrendIcon.propTypes = {
  trendValue: PropTypes.number
}

const prettyDifferenceText = difference =>
  `${difference > 0 ? "+" : ""}${difference || "no"}`

const EngagementTrends = props => (
  <span>
    <strong>
      <big>{props.oldValue}</big>
    </strong>
    <TrendIcon trendValue={props.newValue - props.oldValue} /> engagements in
    past 30d, (
    <strong>{prettyDifferenceText(props.newValue - props.oldValue)}</strong>{" "}
    change, <strong>{props.totalValue}</strong> all-time)
  </span>
)

EngagementTrends.propTypes = {
  newValue: PropTypes.number,
  oldValue: PropTypes.number,
  totalValue: PropTypes.number
}

export { EngagementTrends, TrendIcon, prettyDifferenceText }
