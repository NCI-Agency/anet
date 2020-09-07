import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"

const MergeField = ({ label, value, align, action }) => {
  const fDir = align === "right" ? "row-reverse" : "row"
  return (
    <MergeFieldBox fDir={fDir}>
      <div style={{ flex: "1 1 auto" }}>
        <LabelBox align={align}>{label}</LabelBox>
        <div style={{ textAlign: align }}>{value}</div>
      </div>
      {action}
    </MergeFieldBox>
  )
}

const MergeFieldBox = styled.div`
  display: flex;
  flex-direction: ${props => props.fDir};
  justtify-content: space-between;
  align-items: center;
  padding: 8px 0;
  height: 46px;
`

const LabelBox = styled.div`
  text-align: ${props => props.align};
  font-weight: bold;
  text-decoratiın: underline;
`

MergeField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.string.isRequired,
  action: PropTypes.node
}

export default MergeField
