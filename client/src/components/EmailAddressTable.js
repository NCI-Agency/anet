import _get from "lodash/get"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import utils from "utils"

const EmailAddressTable = ({ label, emailAddresses }) => {
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

EmailAddressTable.propTypes = {
  label: PropTypes.string.isRequired,
  emailAddresses: PropTypes.array
}

export default EmailAddressTable
