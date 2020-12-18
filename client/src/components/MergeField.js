import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"

const MergeField = ({ label, value, align, action, customStyle }) => {
  const fDir = align === "right" ? "row-reverse" : "row"
  return (
    <MergeFieldBox fDir={fDir} customStyle={customStyle}>
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
  height: 50px;
  ${props => props.customStyle};
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
  customStyle: PropTypes.string
}

export default MergeField
