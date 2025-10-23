import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import RemoveButton from "components/RemoveButton"
import { MERGE_SIDES, setAMergedField } from "mergeUtils"
import React from "react"
import { Button, Table } from "react-bootstrap"
import utils from "utils"

interface EmailAddressTableProps {
  label: string
  emailAddresses?: any[]
  mergeMode?: boolean
  align?: "left" | "right" | "center"
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const EmailAddressTable = ({
  label,
  emailAddresses,
  mergeMode,
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
    if (!mergeMode || !dispatchMergeActions) {
      return
    }
    if (!mergeState?.merged && align && align !== "center") {
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
    if (!mergeMode || !dispatchMergeActions) {
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
    const left = mergeState?.left ?? {}
    const right = mergeState?.right ?? {}
    const leftMatch = current.every(ea => {
      const leftEas = left.emailAddresses ?? []
      const match = leftEas.find(
        le => le?.network === ea?.network && le?.address === ea?.address
      )
      return !!match
    })
    if (isFullySelected(current, left.emailAddresses ?? [])) {
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
          {align === "right" && <th />}
          <th>Network</th>
          <th>Address</th>
          {align === "left" && <th />}
        </tr>
      </thead>
      <tbody>
        {rows.map(ea => (
          <tr key={ea.network} className="align-middle">
            {mergeMode && align === "right" && (
              <td>
                <Button
                  size="sm"
                  variant={
                    isSelectedForNetwork(ea.network) ? "success" : "primary"
                  }
                  onClick={() => pickFromSide(ea)}
                  title={`Use this ${ea.network} address`}
                >
                  <Icon icon={IconNames.DOUBLE_CHEVRON_LEFT} />
                </Button>
              </td>
            )}

            <td>{ea.network}</td>
            <td>{utils.createMailtoLink(ea.address)}</td>

            {mergeMode && align === "left" && (
              <td>
                <Button
                  size="sm"
                  variant={
                    isSelectedForNetwork(ea.network) ? "success" : "primary"
                  }
                  onClick={() => pickFromSide(ea)}
                  title={`Use this ${ea.network} address`}
                >
                  <Icon icon={IconNames.DOUBLE_CHEVRON_RIGHT} />
                </Button>
              </td>
            )}

            {mergeMode && align === "center" && (
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
