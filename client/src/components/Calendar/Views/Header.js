import PropTypes from "prop-types"
import React from "react"
const Header = ({ title, prevAction, nextAction, todayAction }) => {
  return (
    <div className="Header">
      <button onClick={prevAction}>Prev</button>
      <button onClick={todayAction}>Today</button>
      <button onClick={nextAction}>Next</button>
      <span>{title}</span>
    </div>
  )
}

Header.propTypes = {
  title: PropTypes.string,
  prevAction: PropTypes.func,
  nextAction: PropTypes.func,
  todayAction: PropTypes.func
}

export default Header
