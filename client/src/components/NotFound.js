import PropTypes from "prop-types"
import React, { useEffect } from "react"

const NotFound = ({ text }) => {
  useEffect(() => {
    document.getElementsByTagName("html")[0].classList.add("not-found")
    return () => {
      document.getElementsByTagName("html")[0].classList.remove("not-found")
    }
  }, [])

  return (
    <div>
      <h1 style={{ textAlign: "center" }} className="not-found-text">
        {text}
      </h1>
    </div>
  )
}

NotFound.propTypes = {
  text: PropTypes.string
}

export default NotFound
