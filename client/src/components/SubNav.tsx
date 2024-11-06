import ReactDOM from "react-dom"

interface SubNavProps {
  subnavElemId: string
  children?: React.ReactNode
}

const SubNav = ({ subnavElemId, children }: SubNavProps) => {
  const subnavElem = document.getElementById(subnavElemId)
  return subnavElem && ReactDOM.createPortal(children, subnavElem)
}

export default SubNav
