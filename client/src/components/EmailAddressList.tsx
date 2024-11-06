import _get from "lodash/get"
import React from "react"
import utils from "utils"

interface EmailAddressListProps {
  label: string
  emailAddresses?: any[]
}

const EmailAddressList = ({ label, emailAddresses }: EmailAddressListProps) => {
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

export default EmailAddressList
