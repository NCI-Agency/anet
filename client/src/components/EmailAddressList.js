import PropTypes from "prop-types"
import React from "react"
import utils from "utils"

const EmailAddressList = ({ emailAddresses }) => (
  <>
    {emailAddresses?.map(ea => (
      <div key={ea.network}>{utils.createMailtoLink(ea.address)}</div>
    ))}
  </>
)

EmailAddressList.propTypes = {
  emailAddresses: PropTypes.array
}

export default EmailAddressList
