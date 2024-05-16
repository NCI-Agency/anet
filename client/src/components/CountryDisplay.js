import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import LinkTo from "components/LinkTo"
import PropTypes from "prop-types"
import React from "react"

const CountryDisplay = ({ country, obsoleteCountry, plain }) => {
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

CountryDisplay.propTypes = {
  country: PropTypes.object,
  obsoleteCountry: PropTypes.string,
  plain: PropTypes.bool
}

export default CountryDisplay
