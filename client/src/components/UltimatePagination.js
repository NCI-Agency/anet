import PropTypes from "prop-types"
import React from "react"
import Pagination from "react-bootstrap/lib/Pagination"
import { createUltimatePagination, ITEM_TYPES } from "react-ultimate-pagination"

const paginationLinkPropTypes = {
  isActive: PropTypes.bool,
  onClick: PropTypes.func
}

const PageLink = ({ value, isActive, onClick }) => (
  <Pagination.Item active={isActive} onClick={onClick}>
    {value}
  </Pagination.Item>
)
PageLink.propTypes = {
  ...paginationLinkPropTypes,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
}
const EllipsisLink = ({ isActive, onClick }) => (
  <Pagination.Ellipsis disabled={isActive} onClick={onClick} />
)
EllipsisLink.propTypes = paginationLinkPropTypes

const FirstPageLink = ({ isActive, onClick }) => (
  <Pagination.First disabled={isActive} onClick={onClick} />
)
FirstPageLink.propTypes = paginationLinkPropTypes

const PreviousPageLink = ({ isActive, onClick }) => (
  <Pagination.Prev disabled={isActive} onClick={onClick} />
)
PreviousPageLink.propTypes = paginationLinkPropTypes

const NextPageLink = ({ isActive, onClick }) => (
  <Pagination.Next disabled={isActive} onClick={onClick} />
)
NextPageLink.propTypes = paginationLinkPropTypes

const LastPageLink = ({ isActive, onClick }) => (
  <Pagination.Last disabled={isActive} onClick={onClick} />
)
LastPageLink.propTypes = paginationLinkPropTypes

const WrappedPagination = createUltimatePagination({
  WrapperComponent: Pagination,
  itemTypeToComponent: {
    [ITEM_TYPES.PAGE]: PageLink,
    [ITEM_TYPES.ELLIPSIS]: EllipsisLink,
    [ITEM_TYPES.FIRST_PAGE_LINK]: FirstPageLink,
    [ITEM_TYPES.PREVIOUS_PAGE_LINK]: PreviousPageLink,
    [ITEM_TYPES.NEXT_PAGE_LINK]: NextPageLink,
    [ITEM_TYPES.LAST_PAGE_LINK]: LastPageLink
  }
})

const UltimatePagination = props => {
  const {
    Component,
    componentClassName,
    className,
    pageNum,
    pageSize,
    totalCount,
    goToPage
  } = props
  const numPages = pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
  if (numPages < 2) {
    return null
  }
  return (
    <Component className={componentClassName}>
      <WrappedPagination
        className={className}
        currentPage={pageNum + 1}
        totalPages={numPages}
        boundaryPagesRange={1}
        siblingPagesRange={2}
        hideEllipsis={false}
        hidePreviousAndNextPageLinks={false}
        hideFirstAndLastPageLinks
        onChange={value => goToPage(value - 1)}
      />
    </Component>
  )
}

UltimatePagination.propTypes = {
  Component: PropTypes.string,
  componentClassName: PropTypes.string,
  className: PropTypes.string,
  pageNum: PropTypes.number,
  pageSize: PropTypes.number,
  totalCount: PropTypes.number,
  goToPage: PropTypes.func
}

UltimatePagination.defaultProps = {
  pageNum: 0,
  pageSize: 0,
  totalCount: 0
}

export default UltimatePagination
