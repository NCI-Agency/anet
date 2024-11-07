import React from "react"
import { Pagination } from "react-bootstrap"
import { createUltimatePagination, ITEM_TYPES } from "react-ultimate-pagination"

interface PaginationLinkPropType {
  isActive?: boolean
  onClick?: (...args: unknown[]) => unknown
}

interface PageLinkProps extends PaginationLinkPropType {
  value?: string | number
}

const PageLink = ({ value, isActive, onClick }: PageLinkProps) => (
  <Pagination.Item active={isActive} activeLabel="" onClick={onClick}>
    {value}
  </Pagination.Item>
)
const EllipsisLink = ({ isActive, onClick }: PaginationLinkPropType) => (
  <Pagination.Ellipsis disabled={isActive} onClick={onClick} />
)

const FirstPageLink = ({ isActive, onClick }: PaginationLinkPropType) => (
  <Pagination.First disabled={isActive} onClick={onClick} />
)

const PreviousPageLink = ({ isActive, onClick }: PaginationLinkPropType) => (
  <Pagination.Prev disabled={isActive} onClick={onClick} />
)

const NextPageLink = ({ isActive, onClick }: PaginationLinkPropType) => (
  <Pagination.Next disabled={isActive} onClick={onClick} />
)

const LastPageLink = ({ isActive, onClick }: PaginationLinkPropType) => (
  <Pagination.Last disabled={isActive} onClick={onClick} />
)

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

interface UltimatePaginationProps {
  Component?: string
  componentClassName?: string
  className?: string
  pageNum?: number
  pageSize?: number
  totalCount?: number
  goToPage?: (...args: unknown[]) => unknown
}

const UltimatePagination = ({
  Component,
  componentClassName,
  className,
  pageNum = 0,
  pageSize = 0,
  totalCount = 0,
  goToPage
}: UltimatePaginationProps) => {
  // We may have a pagination overshoot, so set the number of pages
  // to the maximum of the requested page and the total number of pages
  const numPages = Math.max(
    pageNum + 1,
    pageSize <= 0 ? 1 : Math.ceil(totalCount / pageSize)
  )
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

export default UltimatePagination
