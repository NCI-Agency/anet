import { Icon } from "@blueprintjs/core"
import { IconNames } from "@blueprintjs/icons"
import RemoveButton from "components/RemoveButton"
import { ALIGN_OPTIONS, MERGE_SIDES, setAMergedField } from "mergeUtils"
import React from "react"
import { Button, Table } from "react-bootstrap"

interface PickPhoneNumberButtonProps {
  phoneNumber: any
  align: (typeof ALIGN_OPTIONS)[keyof typeof ALIGN_OPTIONS]
  isSelected: boolean
  onClick: () => void
}

const PickPhoneNumberButton = ({
  phoneNumber,
  align,
  isSelected,
  onClick
}: PickPhoneNumberButtonProps) => (
  <Button
    size="sm"
    variant={isSelected ? "success" : "primary"}
    onClick={onClick}
    title={`Use this ${phoneNumber.type} number`}
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

interface PhoneNumberTableProps {
  label: string
  phoneNumber?: any[]
  align?: (typeof ALIGN_OPTIONS)[keyof typeof ALIGN_OPTIONS]
  mergeState?: any
  dispatchMergeActions?: (...args: unknown[]) => unknown
}

const PhoneNumberTable = ({
  label,
  phoneNumber,
  align,
  mergeState,
  dispatchMergeActions
}: PhoneNumberTableProps) => {
  const getPhoneNumbersWithDetails = list =>
    list?.filter(pn => pn?.details) ?? []
  const rows = getPhoneNumbersWithDetails(phoneNumber)
  if (rows.length === 0) {
    return <em>No {label.toLowerCase()} available</em>
  }
  const getMerged = () => mergeState?.merged?.phoneNumber ?? []
  const isSamePhoneNumber = (pn1, pn2) =>
    isSamePhoneType(pn1, pn2) && isSamePhoneNumberDetails(pn1, pn2)
  const isSamePhoneType = (pn1, pn2) => pn1?.type === pn2?.type
  const isSamePhoneNumberDetails = (pn1, pn2) => pn1?.details === pn2?.details

  const upsertByDetails = (list, item) => {
    const idx = list.findIndex(p => isSamePhoneNumberDetails(p, item))
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
    const next = upsertByDetails(current, item)
    dispatchMergeActions(
      setAMergedField(
        "phoneNumber",
        next,
        isFullySelected(next, phoneNumber) ? align : "partial"
      )
    )
  }

  const removeFromMerged = pn => {
    if (!dispatchMergeActions) {
      return
    }
    const current = getMerged()
    const next = current.filter(p => !isSamePhoneNumber(p, pn))
    dispatchMergeActions(
      setAMergedField("phoneNumber", next, getSelectedSide(next))
    )
  }

  const isSelected = pn => {
    const currentState = getMerged().find(p => isSamePhoneNumber(p, pn))
    const typeValue = phoneNumber?.find(p => isSamePhoneNumber(p, pn))
    return currentState && typeValue
  }

  const isFullySelected = (current, values) => {
    const rowsWithDetails = getPhoneNumbersWithDetails(values)
    if (current.length !== rowsWithDetails.length) {
      return false
    }
    for (const pn of rowsWithDetails) {
      const match = current.some(p => isSamePhoneNumber(p, pn))
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
    const leftMatch = current.every(pn => {
      const leftPns = left.phoneNumber ?? []
      const match = leftPns.some(lp => isSamePhoneNumber(lp, pn))
      return !!match
    })
    if (leftMatch && isFullySelected(current, left.phoneNumber ?? [])) {
      return MERGE_SIDES.LEFT
    }
    return isFullySelected(current, right.phoneNumber ?? [])
      ? MERGE_SIDES.RIGHT
      : "partial"
  }

  return (
    <Table striped hover responsive>
      <thead>
        <tr>
          {align === ALIGN_OPTIONS.RIGHT && <th />}
          <th>Type</th>
          <th>Number</th>
          {(align === ALIGN_OPTIONS.LEFT || align === ALIGN_OPTIONS.CENTER) && (
            <th />
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((pn, i) => (
          <tr key={`${pn.type}-${pn.details}-${i}`} className="align-middle">
            {align === ALIGN_OPTIONS.RIGHT && (
              <td>
                <PickPhoneNumberButton
                  phoneNumber={pn}
                  align={align}
                  isSelected={isSelected(pn)}
                  onClick={() => pickFromSide(pn)}
                />
              </td>
            )}

            <td className="text-nowrap">{pn.type}</td>
            <td>{pn.details}</td>

            {align === ALIGN_OPTIONS.LEFT && (
              <td>
                <PickPhoneNumberButton
                  phoneNumber={pn}
                  align={align}
                  isSelected={isSelected(pn)}
                  onClick={() => pickFromSide(pn)}
                />
              </td>
            )}

            {align === ALIGN_OPTIONS.CENTER && (
              <td>
                <RemoveButton
                  title="Remove phone number"
                  onClick={() => removeFromMerged(pn)}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default PhoneNumberTable
