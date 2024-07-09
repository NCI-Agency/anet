import styled from "@emotion/styled"
import _get from "lodash/get"
import _isEqual from "lodash/isEqual"
import {
  ALIGN_OPTIONS,
  getActionButton,
  MERGE_SIDES,
  setHeightOfAField
} from "mergeUtils"
import PropTypes from "prop-types"
import React, { useEffect, useMemo, useRef, useState } from "react"

const MergeField = ({
  label,
  fieldName,
  value,
  align,
  action,
  mergeState,
  autoMerge,
  dispatchMergeActions,
  className
}) => {
  const fieldRef = useRef(null)
  const [height, setHeight] = useState("auto")

  useEffect(() => {
    // We have more than one column of fields, each field should have same height
    // if a column has bigger height, that height wins
    if (fieldRef.current) {
      const currentHeight =
        fieldRef.current.getBoundingClientRect?.()?.height ??
        fieldRef.current.clientHeight
      const savedHeight = mergeState.heightMap?.[fieldName] || 0
      if (savedHeight < currentHeight) {
        dispatchMergeActions(setHeightOfAField(fieldName, currentHeight))
        setHeight("auto")
      } else if (savedHeight > currentHeight) {
        // if some other column field height is bigger, we update small ui
        setHeight(`${savedHeight}px`)
      }
    }
    return () => {}
  }, [fieldName, mergeState, dispatchMergeActions])

  // automatically merge when allowed and both sides are equal
  const canAutoMerge = useMemo(
    () =>
      autoMerge &&
      _isEqual(
        _get(mergeState[MERGE_SIDES.LEFT], fieldName),
        _get(mergeState[MERGE_SIDES.RIGHT], fieldName)
      ),
    [autoMerge, fieldName, mergeState]
  )
  useEffect(() => {
    if (canAutoMerge && !mergeState.selectedMap[fieldName]) {
      action?.()
    }
  }, [canAutoMerge, action, fieldName, mergeState])

  // show an action button for fields that need to be merged manually
  const actionButton = useMemo(
    () =>
      !canAutoMerge &&
      action &&
      getActionButton(action, align, mergeState, fieldName),
    [canAutoMerge, action, align, fieldName, mergeState]
  )

  // get selected side (has side effect!)
  const selectedSide = mergeState.getSelectedSide(fieldName)

  // show an orange background for center fields that haven't been merged yet
  const bgColor =
    align === ALIGN_OPTIONS.CENTER && !selectedSide ? "#fed8b1" : null

  return (
    <MergeFieldBox
      align={align}
      ref={fieldRef}
      /* We first let its height be auto to get the natural height */
      /* If it is bigger than already existing one's height in the other column */
      /* we set other field to this height in useEffect */
      fieldHeight={height}
      bgColor={bgColor}
    >
      <div style={{ flex: "1 1 auto" }}>
        <LabelBox align={align}>{label}</LabelBox>
        <ValueBox className={className} align={align}>
          {value}
        </ValueBox>
      </div>
      {actionButton}
    </MergeFieldBox>
  )
}

const ROW_DIRECTION = {
  [ALIGN_OPTIONS.LEFT]: "row",
  [ALIGN_OPTIONS.CENTER]: "row",
  [ALIGN_OPTIONS.RIGHT]: "row-reverse"
}

const TEXT_ALIGN = {
  [ALIGN_OPTIONS.LEFT]: "left",
  [ALIGN_OPTIONS.CENTER]: "center",
  [ALIGN_OPTIONS.RIGHT]: "right"
}

const MergeFieldBox = styled.div`
  display: flex;
  flex-direction: ${props => ROW_DIRECTION[props.align]};
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  min-height: ${props => props.fieldHeight};
  background-color: ${props => props.bgColor};
  &:not(:first-of-type) {
    border-top: 1px solid #cccccc;
  }
`

const LabelBox = styled.div`
  text-align: ${props => TEXT_ALIGN[props.align]};
  font-weight: bold;
  text-decoration: underline;
`
const ALIGN_ITEMS = {
  [ALIGN_OPTIONS.LEFT]: "flex-start",
  [ALIGN_OPTIONS.CENTER]: "center",
  [ALIGN_OPTIONS.RIGHT]: "flex-end"
}

const ValueBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => ALIGN_ITEMS[props.align]};
`

MergeField.propTypes = {
  label: PropTypes.string.isRequired,
  fieldName: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.oneOf(Object.values(ALIGN_OPTIONS)).isRequired,
  action: PropTypes.func,
  mergeState: PropTypes.object,
  autoMerge: PropTypes.bool,
  dispatchMergeActions: PropTypes.func,
  className: PropTypes.string
}

export default MergeField
