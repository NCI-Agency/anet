import Fieldset from "components/Fieldset"
import OrganizationalChart from "components/graphs/OrganizationalChart"
import { Organization } from "models"
import PropTypes from "prop-types"
import React from "react"
import ContainerDimensions from "react-container-dimensions"
import { Element } from "react-scroll"

const OrganizationLaydown = ({ organization }) => {
  return (
    <Element name="laydown">
      <Fieldset
        id="orgChart"
        name="orgChart"
        className="scroll-anchor-container"
        style={{ background: "none" }}
      >
        <ContainerDimensions>
          {({ width, height }) => (
            <OrganizationalChart
              label="test"
              org={organization}
              exportTitle={`Organization diagram for ${organization}`}
              width={width}
              height={height}
            />
          )}
        </ContainerDimensions>
      </Fieldset>
    </Element>
  )
}

OrganizationLaydown.propTypes = {
  organization: PropTypes.instanceOf(Organization).isRequired
}

export default OrganizationLaydown
