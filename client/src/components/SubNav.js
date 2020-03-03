import PropTypes from "prop-types"
import ReactDOM from "react-dom"

const SubNav = ({ subnavElemId, children }) => {
  const subnavElem = document.getElementById(subnavElemId)
  return subnavElem && ReactDOM.createPortal(children, subnavElem)
}
SubNav.propTypes = {
  subnavElemId: PropTypes.string.isRequired,
  children: PropTypes.node
}

export default SubNav
