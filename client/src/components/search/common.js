import _isEmpty from "lodash/isEmpty"

export const GQL_EMAIL_ADDRESSES = `
  emailAddresses(network: $emailNetwork) {
    network
    address
  }
`

export const DEFAULT_PAGESIZE = 10

export function _isSubsetOf(set, subset) {
  return new Set([...set, ...subset]).size === set.size
}

export function _isAllSelected(list, selectedEmailAddresses) {
  const selectedUuids = new Set(selectedEmailAddresses?.keys())
  if (_isEmpty(selectedUuids)) {
    return false // nothing selected
  }
  const isSubset = _isSubsetOf(
    selectedUuids,
    list.filter(l => !_isEmpty(l.emailAddresses)).map(l => l.uuid)
  )
  return isSubset || null // return indeterminate if only some are selected
}

export function _toggleAll(
  list,
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  if (_isAllSelected(list, selectedEmailAddresses)) {
    list.forEach(l => selectedEmailAddresses.delete(l.uuid))
  } else {
    list
      .filter(l => !_isEmpty(l.emailAddresses))
      .forEach(l => selectedEmailAddresses.set(l.uuid, l.emailAddresses))
  }
  _updateSelection(
    selectedEmailAddresses,
    setSelectedEmailAddresses,
    updateRecipients
  )
}

export function _isSelected(uuid, setSelectedEmailAddresses) {
  return setSelectedEmailAddresses.has(uuid)
}

export function _toggleSelection(
  uuid,
  emailAddresses,
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  if (_isSelected(uuid, selectedEmailAddresses)) {
    selectedEmailAddresses.delete(uuid)
  } else {
    selectedEmailAddresses.set(uuid, emailAddresses)
  }
  _updateSelection(
    selectedEmailAddresses,
    setSelectedEmailAddresses,
    updateRecipients
  )
}

export function _updateSelection(
  selectedEmailAddresses,
  setSelectedEmailAddresses,
  updateRecipients
) {
  const newSelection = new Map(selectedEmailAddresses)
  setSelectedEmailAddresses(newSelection)
  updateRecipients(newSelection)
}
