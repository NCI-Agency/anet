import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import LinkTo from "components/LinkTo"
import React from "react"

interface CountryDisplayProps {
  country?: any
  obsoleteCountry?: string
  plain?: boolean
}

const CountryDisplay = ({
  country,
  obsoleteCountry,
  plain
}: CountryDisplayProps) => {
  const icon = (
    <Icon
      icon={IconNames.FLAG}
      style={{ marginLeft: 5, marginRight: 5, height: "1em" }}
    />
  )
  return (
    <>
      {country &&
        (plain ? (
          <span>
            {icon}
            {country.name}
          </span>
        ) : (
          <LinkTo modelType="Location" model={country} showIcon={false}>
            {icon}
            {country.name}
          </LinkTo>
        ))}
      {obsoleteCountry && <em> (old value: {obsoleteCountry})</em>}
    </>
  )
}

export default CountryDisplay
