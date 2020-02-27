import PropTypes from "prop-types"
import React from "react"
import UltimatePagination from "components/UltimatePagination"

const UltimatePaginationTopDown = ({
  componentClassName,
  className,
  pageNum,
  pageSize,
  totalCount,
  goToPage,
  children
}) => (
  <>
    <UltimatePagination
      Component="header"
      componentClassName={componentClassName}
      className={className}
      pageNum={pageNum}
      pageSize={pageSize}
      totalCount={totalCount}
      goToPage={goToPage}
    />
    {children}
    <UltimatePagination
      Component="footer"
      componentClassName={componentClassName}
      className={className}
      pageNum={pageNum}
      pageSize={pageSize}
      totalCount={totalCount}
      goToPage={goToPage}
    />
  </>
)

UltimatePaginationTopDown.propTypes = {
  componentClassName: PropTypes.string,
  className: PropTypes.string,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  goToPage: PropTypes.func,
  children: PropTypes.node
}

export default UltimatePaginationTopDown
