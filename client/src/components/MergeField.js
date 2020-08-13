import PropTypes from "prop-types"
import React from "react"

const MergeField = ({ label, value, align, action }) => {
  const flexDir = align === "right" ? "row-reverse" : "row"
  return (
    <div style={{ ...FIELD_STYLE, flexDirection: flexDir }}>
      <div style={{ flex: "1 1 auto" }}>
        <div style={{ ...LABEL_STYLE, textAlign: align }}>{label}</div>
        <div style={{ textAlign: align }}>{value}</div>
      </div>
      {action}
    </div>
  )
}

const FIELD_STYLE = {
  borderBottom: "1px solid #CCCCCC",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "8px 0",
  height: "46px"
}

const LABEL_STYLE = {
  fontWeight: "bold",
  textDecoration: "underline"
}

MergeField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  align: PropTypes.string.isRequired,
  action: PropTypes.node
}

export default MergeField
