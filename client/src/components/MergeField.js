import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React, { useEffect, useRef, useState } from "react"

const MergeField = ({
  label,
  value,
  align,
  action,
  mergeFieldHeights,
  setMergeFieldHeights
}) => {
  const fieldRef = useRef(null)
  const [updated, setUpdated] = useState(false)

  useEffect(() => {
    // We have 3 columns of fields, each field should have same height, we use label to search for previously set value
    // if a column has bigger height, that height wins
    if (fieldRef.current) {
      const currentHeight = fieldRef.current.clientHeight
      const savedHeight = mergeFieldHeights?.[label] || 0
      if (savedHeight < currentHeight) {
        setMergeFieldHeights({ ...mergeFieldHeights, [label]: currentHeight })
      } else if (savedHeight > currentHeight) {
        // if some other column field height is bigger, we update small ui
        setUpdated(true)
      }
    }
    return () => {}
  }, [label, mergeFieldHeights, setMergeFieldHeights])

  const fDir = align === "right" ? "row-reverse" : "row"
  return (
    <MergeFieldBox
      fDir={fDir}
      ref={fieldRef}
      /* We first let its height be auto to get the natural height */
      fieldHeight={updated ? `${mergeFieldHeights[label]}px` : "auto"}
    >
      <div style={{ flex: "1 1 auto" }}>
        <LabelBox align={align}>{label}</LabelBox>
        <ValueBox align={align}>{value}</ValueBox>
      </div>
      {action}
    </MergeFieldBox>
  )
}

const MergeFieldBox = styled.div`
  display: flex;
  flex-direction: ${props => props.fDir};
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  height: ${props => props.fieldHeight};
`

const LabelBox = styled.div`
  text-align: ${props => props.align};
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
  flex-direction: row;
  justify-content: ${props => ALIGN_TO_JUSTIFY[props.align]};
  align-items: center;
`

MergeField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.oneOf(["left", "right", "center"]).isRequired,
  action: PropTypes.node,
  mergeFieldHeights: PropTypes.object,
  setMergeFieldHeights: PropTypes.func
}

export default MergeField
