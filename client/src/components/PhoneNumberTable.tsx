import _get from "lodash/get"
import React from "react"
import { Table } from "react-bootstrap"

interface PhoneNumberTableProps {
  label: string
  phoneNumber?: any[]
}

const PhoneNumberTable = ({ label, phoneNumber }: PhoneNumberTableProps) => {
  const numbers = (phoneNumber || []).filter(pn => pn?.details)
  if (_get(numbers, "length", 0) === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  return (
    <Table striped hover className="mb-0">
      <tbody>
        {numbers.map((pn, i) => (
          <tr key={`${pn.type}-${pn.details}-${i}`}>
            <td className="text-nowrap">{pn.type}</td>
            <td>{pn.details}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default PhoneNumberTable
