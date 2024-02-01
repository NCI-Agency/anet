import _get from "lodash/get"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"

const EmailAddressTable = ({ emailAddresses }) => {
  if (_get(emailAddresses, "length", 0) === 0) {
    return <em>No email addresses found</em>
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
            <td>
              <a href={`mailto:${ea.address}`}>{ea.address}</a>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

EmailAddressTable.propTypes = {
  emailAddresses: PropTypes.array
}

export default EmailAddressTable
