import _get from "lodash/get"
import React from "react"
import utils from "utils"

interface EmailAddressListProps {
  label: string
  emailAddresses?: any[]
  noMailLinks?: boolean
}

const EmailAddressList = ({
  label,
  emailAddresses,
  noMailLinks
}: EmailAddressListProps) => {
  if (_get(emailAddresses, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <>
      {emailAddresses?.map(ea => (
        <div key={ea.network}>
          {noMailLinks ? ea.address : utils.createMailtoLink(ea.address)}
        </div>
      ))}
    </>
  )
}

export default EmailAddressList
