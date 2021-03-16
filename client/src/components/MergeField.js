import styled from "@emotion/styled"
import { setHeightOfAField } from "mergeUtils"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

const MergeField = ({
  label,
  fieldName,
  value,
  align,
  action,
  mergeState,
  dispatchMergeActions
}) => {
  const fieldRef = useRef(null)
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    // We have more than one columns of fields, each field should have same height
    // if a column has bigger height, that height wins
    if (fieldRef.current) {
      const currentHeight = fieldRef.current.clientHeight
      const savedHeight = mergeState.heightMap?.[fieldName] || 0
      if (savedHeight < currentHeight) {
        dispatchMergeActions(setHeightOfAField(fieldName, currentHeight))
      } else if (savedHeight > currentHeight) {
        // if some other column field height is bigger, we update small ui
        setUpdated(true)
      }
    }
    return () => {}
  }, [fieldName, mergeState, dispatchMergeActions])

  return (
    <MergeFieldBox
      align={align}
      ref={fieldRef}
      /* We first let its height be auto to get the natural height */
      /* If it is bigger than already existing one's height in the other column */
      /* we set other field to this height in useEffect */
      fieldHeight={updated ? `${mergeState.heightMap[fieldName]}px` : "auto"}
    >
      <div style={{ flex: "1 1 auto" }}>
        <LabelBox align={align}>{label}</LabelBox>
        <ValueBox align={align}>{value}</ValueBox>
      </div>
      {action}
    </MergeFieldBox>
  )
}

const ROW_DIRECTION = {
  column: "row",
  right: "row-reverse",
  left: "row",
  center: "row"
}

const FLEX_DIRECTION = {
  column: "column",
  right: "row",
  left: "row",
  center: "row"
}

const TEXT_ALIGN = {
  right: "right",
  left: "left",
  center: "center",
  column: "center"
}

const MergeFieldBox = styled.div`
  display: flex;
  flex-direction: ${props => ROW_DIRECTION[props.align]};
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  height: ${props => props.fieldHeight};
`

const LabelBox = styled.div`
  text-align: ${props => TEXT_ALIGN[props.align]};
  font-weight: bold;
  text-decoration: underline;
`
const ALIGN_TO_JUSTIFY = {
  center: "center",
  left: "flex-start",
  right: "flex-end"
}

const ValueBox = styled.div`
  display: flex;
  flex-direction: ${props => FLEX_DIRECTION[props.align]};
  justify-content: ${props => ALIGN_TO_JUSTIFY[props.align]};
  align-items: center;
`

MergeField.propTypes = {
  label: PropTypes.string.isRequired,
  fieldName: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.oneOf(["left", "right", "center", "column"]).isRequired,
  action: PropTypes.node,
  mergeState: PropTypes.object,
  dispatchMergeActions: PropTypes.func
}

export default MergeField
