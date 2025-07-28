import _isArray from "lodash/isArray"
import _isEmpty from "lodash/isEmpty"
import {
  AdvancedMultiSelectOverlayTable,
  AdvancedSingleSelectOverlayTable
} from "./AdvancedSelectOverlayTable"

export function getAdvancedSelectOverlayTableComponent(
  multiSelect?: boolean
): React.ComponentType<unknown> {
  return multiSelect
    ? AdvancedMultiSelectOverlayTable
    : AdvancedSingleSelectOverlayTable
}

export function getSelectedItemValue(
  multiSelect: boolean,
  selectedItems: object | object[],
  item: object,
  getValueCallback: (selectedItem: object, item: object) => any
) {
  return multiSelect
    ? selectedItems?.some(selectedItem => getValueCallback(selectedItem, item))
    : getValueCallback(selectedItems, item)
}

function getEventWithoutExtraFields(event: object) {
  return Object.without(event, "parents", "children")
}

function getEventArrayWithoutExtraFields(eventArray: object[]) {
  return eventArray?.map(event => getEventWithoutExtraFields(event))
}

export function handleChangeEvent(
  event: object | object[],
  setValue: (value: object | object[]) => void
) {
  if (_isArray(event)) {
    setValue(prevValue => ({
      ...prevValue,
      value: getEventArrayWithoutExtraFields(event)
    }))
  } else if (typeof event === "object") {
    setValue(prevValue => ({
      ...prevValue,
      value: getEventWithoutExtraFields(event)
    }))
  }
}

function getItemFromMap(treeMap: object, item: object, mapFields: string[]) {
  if (!treeMap[item.uuid]) {
    const newItem = { uuid: item.uuid }
    mapFields.forEach(field => {
      newItem[field] = item[field]
    })
    treeMap[item.uuid] = newItem
  }
  return treeMap[item.uuid]
}

function addParentsToMapItem(
  treeMap: object,
  item: object,
  mapFields: string[],
  parents: object[] = []
) {
  return parents.map(parent => {
    const po = getItemFromMap(treeMap, parent, mapFields)
    if (!item.parents) {
      item.parents = [po]
    } else if (!item.parents.some(p => p.uuid === po.uuid)) {
      item.parents.push(po)
    }
    return po
  })
}

function addChildrenToMapItem(
  treeMap: object,
  item: object,
  mapFields: string[],
  children: object[] = []
) {
  return children.map(child => {
    const co = getItemFromMap(treeMap, child, mapFields)
    if (!item.children) {
      item.children = [co]
    } else if (!item.children.some(c => c.uuid === co.uuid)) {
      item.children.push(co)
    }
    return co
  })
}

function getChildren(
  item: object,
  descendants: object[],
  parentsField: string
) {
  return (
    descendants
      ?.filter(d => !_isEmpty(d[parentsField]))
      .filter(d =>
        (_isArray(d[parentsField]) ? d[parentsField] : [d[parentsField]]).some(
          p => p.uuid === item.uuid
        )
      ) ?? []
  )
}

function setChildren(
  treeMap: object,
  item: object,
  mapFields: string[],
  descendants: object[],
  parentsField: string
) {
  const o = getItemFromMap(treeMap, item, mapFields)
  const newChildren = getChildren(o, descendants, parentsField)
  for (const child of addChildrenToMapItem(
    treeMap,
    o,
    mapFields,
    newChildren
  )) {
    addParentsToMapItem(treeMap, child, mapFields, [o])
    setChildren(treeMap, child, mapFields, descendants, parentsField)
  }
}

function getParents(item: object, ascendants: object[], parentsField: string) {
  const parentsUuids =
    ascendants
      ?.filter(a => a.uuid === item.uuid)
      .filter(a => !_isEmpty(a[parentsField]))
      .flatMap(a =>
        _isArray(a[parentsField]) ? a[parentsField] : [a[parentsField]]
      )
      .map(p => p.uuid) ?? []
  return ascendants?.filter(a => parentsUuids.includes(a.uuid)) ?? []
}

function setParents(
  treeMap: object,
  item: object,
  mapFields: string[],
  ascendants: object[],
  parentsField: string
) {
  const o = getItemFromMap(treeMap, item, mapFields)
  const newParents = getParents(o, ascendants, parentsField)
  for (const parent of addParentsToMapItem(treeMap, o, mapFields, newParents)) {
    addChildrenToMapItem(treeMap, parent, mapFields, [o])
    setParents(treeMap, parent, mapFields, ascendants, parentsField)
  }
}

export function buildTree(
  ascendantsField: string,
  descendantsField: string,
  parentsField: string,
  items: object[] = [],
  mapFields: string[] = ["name"]
) {
  const treeMap = {}
  for (const item of items) {
    setChildren(treeMap, item, mapFields, item[descendantsField], parentsField)
    setParents(treeMap, item, mapFields, item[ascendantsField], parentsField)
  }
  return treeMap
}

function hasDescendantValueSelected(item: object, value: object) {
  return value.children?.some(
    child =>
      child.uuid === item?.uuid || hasDescendantValueSelected(item, child)
  )
}

function hasAscendantValueSelected(item: object, value: object) {
  return value.parents?.some(
    child => child.uuid === item?.uuid || hasAscendantValueSelected(item, child)
  )
}

export function compareItems(selectedItem: object, item: object) {
  return selectedItem?.uuid === item?.uuid
}

export function buildFlattenedList(
  values: object[],
  selectableItems: object[],
  multiSelect: boolean,
  selectedItems: object | object[],
  expandedItems: Set<string>,
  level: number = 0
) {
  const selectableItemsUuids = new Set(selectableItems?.map(item => item.uuid))
  return (
    values?.flatMap(value => {
      const isValueSelected = getSelectedItemValue(
        multiSelect,
        selectedItems,
        value,
        compareItems
      )
      const isDescendantValueSelected = getSelectedItemValue(
        multiSelect,
        selectedItems,
        value,
        hasDescendantValueSelected
      )
      const isAscendantValueSelected = getSelectedItemValue(
        multiSelect,
        selectedItems,
        value,
        hasAscendantValueSelected
      )
      const isCollapsed = !expandedItems?.has(value.uuid)
      const isAscendantValueSelectedAndCollapsed =
        isDescendantValueSelected && isCollapsed ? null : false
      const isSelected =
        isValueSelected || isAscendantValueSelected
          ? true
          : isAscendantValueSelectedAndCollapsed
      const disabled = multiSelect && isAscendantValueSelected
      const isNotSelectable =
        selectableItems != null && !selectableItemsUuids.has(value.uuid)
      const valueWithLevel = {
        ...value,
        level,
        isSelected,
        disabled,
        isNotSelectable
      }
      const childrenWithLevel = isCollapsed
        ? []
        : buildFlattenedList(
            value.children,
            selectableItems,
            multiSelect,
            selectedItems,
            expandedItems,
            level + 1
          )
      return [valueWithLevel, ...childrenWithLevel]
    }) ?? []
  )
}
