import _get from "lodash/get"
import React from "react"
import { Table } from "react-bootstrap"
import utils from "utils"

interface EmailAddressTableProps {
  label: string
  emailAddresses?: any[]
}

const EmailAddressTable = ({
  label,
  emailAddresses
}: EmailAddressTableProps) => {
  if (_get(emailAddresses, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Network</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        {emailAddresses.map(ea => (
          <tr key={ea.network}>
            <td>{ea.network}</td>
            <td>{utils.createMailtoLink(ea.address)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default EmailAddressTable
