// Print friendly table layout for pages
import styled from "@emotion/styled"
import PropTypes from "prop-types"
import React from "react"

const CompactTable = ({ children }) => {
  return (
    <CompactTableS>
      <thead>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </thead>
      <tbody>{children}</tbody>
      <tfoot>
        <tr>
          <EmptySpaceTdS colSpan="2" />
        </tr>
      </tfoot>
    </CompactTableS>
  )
}

CompactTable.propTypes = {
  children: PropTypes.node
}

export default CompactTable

const CompactTableS = styled.table`
  width: 100% !important;
  background-color: transparent !important;
  table,
  tbody,
  tr {
    width: 100% !important;
    background-color: transparent !important;
  }
  td {
    background-color: transparent !important;
  }
`
// Used to leave a space from top and bottom in each printed pages
const EmptySpaceTdS = styled.td`
  height: 80px;
`

export const CompactRow = ({ label, content, ...otherProps }) => {
  const { style, className } = otherProps
  // merge custom style
  const CustomStyled = styled(CompactRowS)`
    ${style};
  `
  // lower case if string
  const lowerLabel =
    typeof label === "string" ? label.toLocaleLowerCase() : label

  // top level th have different width
  const isTopLevelTh = className === "reportField"

  return (
    <CustomStyled className={className || null}>
      <RowLabelS isTopLevelTh={isTopLevelTh}>{lowerLabel}</RowLabelS>
      <CompactRowContentS>{content}</CompactRowContentS>
    </CustomStyled>
  )
}

CompactRow.propTypes = {
  label: PropTypes.node,
  content: PropTypes.node
}

export const CompactRowS = styled.tr`
  vertical-align: top;
  font-family: "Times New Roman", Times, serif;
  width: 100%;
`

const RowLabelS = styled.th`
  padding: 4px 0;
  font-style: italic;
  color: grey;
  max-width: 50%;
  font-weight: 300;
  width: ${props => (props.isTopLevelTh ? "15%" : "auto")};
`

export const CompactRowContentS = styled.td`
  padding: 4px 1rem;
  & .form-control-static {
    margin-bottom: 0;
    padding-top: 0;
  }
`

export const CompactTitle = ({ label }) => {
  return (
    <CompactTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactTitleS>
  )
}

CompactTitle.propTypes = {
  label: PropTypes.node
}

const CompactTitleS = styled(CompactRowS)`
  & > th {
    font-size: 18px;
    font-style: normal;
    color: black;
    text-align: center;
    font-weight: bold;
  }
`

export const CompactSubTitle = ({ label }) => {
  return (
    <CompactSubTitleS>
      <RowLabelS colSpan="2">{label}</RowLabelS>
    </CompactSubTitleS>
  )
}

CompactSubTitle.propTypes = {
  label: PropTypes.node
}

const CompactSubTitleS = styled(CompactRowS)`
  & > th {
    font-style: italic;
    color: black;
    text-align: center;
    font-weight: normal;
  }
`
