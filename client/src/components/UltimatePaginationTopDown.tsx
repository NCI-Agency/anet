import UltimatePagination from "components/UltimatePagination"
import React from "react"

interface UltimatePaginationTopDownProps {
  componentClassName?: string
  className?: string
  pageNum?: number
  pageSize?: number
  totalCount?: number
  goToPage?: (...args: unknown[]) => unknown
  children?: React.ReactNode
}

const UltimatePaginationTopDown = ({
  componentClassName,
  className,
  pageNum,
  pageSize,
  totalCount,
  goToPage,
  children
}: UltimatePaginationTopDownProps) => (
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

export default UltimatePaginationTopDown
