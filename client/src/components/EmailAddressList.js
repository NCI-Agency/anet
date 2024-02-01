import PropTypes from "prop-types"
import React from "react"

const EmailAddressList = ({ emailAddresses }) => (
  <>
    {emailAddresses?.map(ea => (
      <div key={ea.network}>
        <a href={`mailto:${ea.address}`}>{ea.address}</a>
      </div>
    ))}
  </>
)

EmailAddressList.propTypes = {
  emailAddresses: PropTypes.array
}

export default EmailAddressList
