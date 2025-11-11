import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import RemoveButton from "components/RemoveButton"
import { ALIGN_OPTIONS, MERGE_SIDES, setAMergedField } from "mergeUtils"
import React from "react"
import { Button, Table } from "react-bootstrap"
import utils from "utils"

interface PickEmailAddressButtonProps {
  emailAddress: any
  align: (typeof ALIGN_OPTIONS)[keyof typeof ALIGN_OPTIONS]
  isSelected: boolean
  onClick: () => void
}

const PickEmailAddressButton = ({
  emailAddress,
  align,
  isSelected,
  onClick
}: PickEmailAddressButtonProps) => (
  <Button
    size="sm"
    variant={isSelected ? "success" : "primary"}
    onClick={onClick}
    title={`Use this ${emailAddress.network} address`}
  >
    <Icon
      icon={
        align === ALIGN_OPTIONS.LEFT
          ? IconNames.DOUBLE_CHEVRON_RIGHT
          : IconNames.DOUBLE_CHEVRON_LEFT
      }
    />
  </Button>
)

interface EmailAddressTableProps {
  label: string
  emailAddresses?: any[]
  align?: (typeof ALIGN_OPTIONS)[keyof typeof ALIGN_OPTIONS]
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const EmailAddressTable = ({
  label,
  emailAddresses,
  align,
  mergeState,
  dispatchMergeActions
}: EmailAddressTableProps) => {
  const rows = emailAddresses ?? []
  if (rows.length === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }

  const getMerged = () => mergeState?.merged?.emailAddresses ?? []

  const upsertByNetwork = (list, item) => {
    const idx = list.findIndex(e => e?.network === item?.network)
    if (idx === -1) {
      return [...list, item]
    }
    const next = [...list]
    next[idx] = item
    return next
  }

  const pickFromSide = item => {
    if (!dispatchMergeActions) {
      return
    }
    if (!mergeState?.merged && align && align !== ALIGN_OPTIONS.CENTER) {
      const sidePerson = mergeState[align]
      if (sidePerson?.uuid) {
        dispatchMergeActions(setAMergedField("uuid", sidePerson.uuid, align))
      }
    }
    const current = getMerged()
    const next = upsertByNetwork(current, item)
    dispatchMergeActions(
      setAMergedField(
        "emailAddresses",
        next,
        isFullySelected(next, emailAddresses) ? align : "partial"
      )
    )
  }

  const removeFromMerged = network => {
    if (!dispatchMergeActions) {
      return
    }
    const current = getMerged()
    const next = current.filter(e => e?.network !== network)
    dispatchMergeActions(
      setAMergedField("emailAddresses", next, getSelectedSide(next))
    )
  }

  const isSelectedForNetwork = network => {
    const currentState = getMerged().find(e => e?.network === network)
    const networkValue = emailAddresses?.find(e => e?.network === network)
    return (
      currentState &&
      networkValue &&
      currentState.address === networkValue.address
    )
  }

  const isFullySelected = (current, values) => {
    if (current.length !== values?.length) {
      return false
    }
    for (const ea of values ?? []) {
      const match = current.find(
        e => e?.network === ea?.network && e?.address === ea?.address
      )
      if (!match) {
        return false
      }
    }
    return true
  }

  const getSelectedSide = current => {
    if (current.length === 0) {
      return null
    }
    const left = mergeState?.[MERGE_SIDES.LEFT] ?? {}
    const right = mergeState?.[MERGE_SIDES.RIGHT] ?? {}
    const leftMatch = current.every(ea => {
      const leftEas = left.emailAddresses ?? []
      const match = leftEas.find(
        le => le?.network === ea?.network && le?.address === ea?.address
      )
      return !!match
    })
    if (leftMatch && isFullySelected(current, left.emailAddresses ?? [])) {
      return MERGE_SIDES.LEFT
    }
    return isFullySelected(current, right.emailAddresses ?? [])
      ? MERGE_SIDES.RIGHT
      : "partial"
  }

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          {align === ALIGN_OPTIONS.RIGHT && <th />}
          <th>Network</th>
          <th>Address</th>
          {align === ALIGN_OPTIONS.LEFT && <th />}
        </tr>
      </thead>
      <tbody>
        {rows.map(ea => (
          <tr key={ea.network} className="align-middle">
            {align === ALIGN_OPTIONS.RIGHT && (
              <td>
                <PickEmailAddressButton
                  emailAddress={ea}
                  align={align}
                  isSelected={isSelectedForNetwork(ea.network)}
                  onClick={() => pickFromSide(ea)}
                />
              </td>
            )}

            <td>{ea.network}</td>
            <td>{utils.createMailtoLink(ea.address)}</td>

            {align === ALIGN_OPTIONS.LEFT && (
              <td>
                <PickEmailAddressButton
                  emailAddress={ea}
                  align={align}
                  isSelected={isSelectedForNetwork(ea.network)}
                  onClick={() => pickFromSide(ea)}
                />
              </td>
            )}

            {align === ALIGN_OPTIONS.CENTER && (
              <td>
                <RemoveButton
                  title="Remove Address"
                  onClick={() => removeFromMerged(ea.network)}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default EmailAddressTable
