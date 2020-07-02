import React from "react"
import { Button } from "react-bootstrap"
import PropTypes from "prop-types"

const PeriodsNavigation = ({ offset, onChange }) => (
  <>
    <Button
      bsStyle="default"
      type="button"
      onClick={() => onChange(offset + 1)}
    >
      previous period
    </Button>
    {offset - 1 >= 0 && (
      <Button
        bsStyle="default"
        type="button"
        onClick={() => onChange(offset - 1)}
      >
        next period
      </Button>
    )}
  </>
)
PeriodsNavigation.propTypes = {
  offset: PropTypes.number,
  onChange: PropTypes.func
}

export default PeriodsNavigation
