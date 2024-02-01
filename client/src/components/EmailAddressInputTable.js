import RemoveButton from "components/RemoveButton"
import PropTypes from "prop-types"
import React from "react"
import { Table } from "react-bootstrap"
import Settings from "settings"

const EmailAddressInputTable = ({ emailAddresses, handleChange }) => {
  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          <th>Network</th>
          <th>Address</th>
        </tr>
      </thead>
      <tbody>
        {Settings.emailNetworks.map(en => (
          <tr key={en}>
            <td style={{ verticalAlign: "middle" }}>{en}</td>
            <td className="input-group">
              <input
                className="form-control"
                name={`${en}-address`}
                value={getEmailAddress(en, emailAddresses)}
                onChange={e =>
                  setEmailAddress(en, emailAddresses, e?.target?.value)}
              />
              <RemoveButton
                id={`${en}-clear`}
                title="Clear address"
                onClick={() => clearEmailAddress(en, emailAddresses)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )

  function _getEmailAddress(network, emailAddresses) {
    return emailAddresses.find(ea => ea.network === network)
  }

  function getEmailAddress(network, emailAddresses) {
    return _getEmailAddress(network, emailAddresses)?.address || ""
  }

  function setEmailAddress(network, emailAddresses, address) {
    const existingEmailAddress = _getEmailAddress(network, emailAddresses)
    if (existingEmailAddress) {
      existingEmailAddress.address = address
    } else {
      emailAddresses.push({ network, address })
    }
    handleChange([...emailAddresses])
  }

  function clearEmailAddress(network, emailAddresses, callback) {
    const emailAddress = _getEmailAddress(network, emailAddresses)
    if (emailAddress) {
      emailAddress.address = ""
      handleChange([...emailAddresses])
    }
  }
}

EmailAddressInputTable.propTypes = {
  emailAddresses: PropTypes.array.isRequired,
  handleChange: PropTypes.func.isRequired
}

EmailAddressInputTable.defaultProps = {
  emailAddresses: []
}

export default EmailAddressInputTable
