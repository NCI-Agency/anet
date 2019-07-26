import _isEmpty from "lodash/isEmpty"
import PropTypes from "prop-types"
import React, { Component } from "react"
import { hideLoading, showLoading } from "react-redux-loading-bar"
import "./LoaderHOC.css"

export const mapDispatchToProps = (dispatch, ownProps) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
})

const LoaderHOC = isLoading => dataPropName => WrappedComponent => {
  return class LoaderHOC extends Component {
    static propTypes = {
      loaderMessage: PropTypes.string
    }

    isLoadingData(prop) {
      return prop || prop === undefined
    }

    render() {
      const dataIsEmpty = _isEmpty(this.props[dataPropName])
      const showLoader =
        dataIsEmpty && this.isLoadingData(this.props[isLoading])
      const loaderMessage = this.props.loaderMessage
      const defaultMessage = (
        <div>
          <em>No data</em>
        </div>
      )

      if (showLoader) {
        return <div className="loader" />
      } else if (dataIsEmpty) {
        return _isEmpty(loaderMessage) ? defaultMessage : loaderMessage
      } else {
        return <WrappedComponent {...this.props} />
      }
    }
  }
}

export default LoaderHOC
