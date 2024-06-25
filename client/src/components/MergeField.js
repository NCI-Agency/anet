import styled from "@emotion/styled"
import { ALIGN_OPTIONS, setHeightOfAField } from "mergeUtils"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

const MergeField = ({
  label,
  fieldName,
  value,
  align,
  action,
  mergeState,
  dispatchMergeActions,
  className
}) => {
  const fieldRef = useRef(null)
  const [height, setSetHeight] = useState("auto")

  useEffect(() => {
    // We have more than one column of fields, each field should have same height
    // if a column has bigger height, that height wins
    if (fieldRef.current) {
      const currentHeight = fieldRef.current.clientHeight
      const savedHeight = mergeState.heightMap?.[fieldName] || 0
      if (savedHeight < currentHeight) {
        dispatchMergeActions(setHeightOfAField(fieldName, currentHeight))
        setSetHeight("auto")
      } else if (savedHeight > currentHeight) {
        // if some other column field height is bigger, we update small ui
        setSetHeight(`${savedHeight}px`)
      }
    }
    return () => {}
  }, [fieldName, mergeState, dispatchMergeActions])

  const selectedSide = mergeState.getSelectedSide(fieldName)
  const bgColor =
    selectedSide || align !== ALIGN_OPTIONS.CENTER ? null : "#fed8b1"

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
      {action}
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
  height: ${props => props.fieldHeight};
  background-color: ${props => props.bgColor};
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
  action: PropTypes.node,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func,
  className: PropTypes.string
}

export default MergeField
