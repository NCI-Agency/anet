import PropTypes from "prop-types"
import React from "react"
import UltimatePagination from "components/UltimatePagination"

const UltimatePaginationTopDown = props => {
  const {
    componentClassName,
    className,
    pageNum,
    pageSize,
    totalCount,
    goToPage,
    contentElement
  } = props

  return (
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
      {contentElement}
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
}

UltimatePaginationTopDown.propTypes = {
  componentClassName: PropTypes.string,
  className: PropTypes.string,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  goToPage: PropTypes.func,
  contentElement: PropTypes.object
}

export default UltimatePaginationTopDown
