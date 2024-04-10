import _get from "lodash/get"
import PropTypes from "prop-types"
import React from "react"
import utils from "utils"

const EmailAddressList = ({ label, emailAddresses }) => {
  if (_get(emailAddresses, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <>
      {emailAddresses?.map(ea => (
        <div key={ea.network}>{utils.createMailtoLink(ea.address)}</div>
      ))}
    </>
  )
}

EmailAddressList.propTypes = {
  label: PropTypes.string.isRequired,
  emailAddresses: PropTypes.array
}

export default EmailAddressList
