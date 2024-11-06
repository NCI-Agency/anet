import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import React from "react"

interface TrendIconProps {
  trendValue?: number
}

const TrendIcon = (props: TrendIconProps) => {
  if (props.trendValue > 0) {
    return <Icon icon={IconNames.TRENDING_UP} />
  }
  if (props.trendValue < 0) {
    return <Icon icon={IconNames.TRENDING_DOWN} />
  }
  return <Icon icon={IconNames.EQUALS} />
}

const prettyDifferenceText = difference =>
  `${difference > 0 ? "+" : ""}${difference || "no"}`

interface EngagementTrendsProps {
  newValue?: number
  oldValue?: number
  totalValue?: number
}

const EngagementTrends = (props: EngagementTrendsProps) => (
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

export { EngagementTrends, TrendIcon, prettyDifferenceText }
