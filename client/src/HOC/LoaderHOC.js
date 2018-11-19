import PropTypes from 'prop-types'
import React, { Component } from 'react'
import _isEmpty from 'lodash/isEmpty'
import { showLoading, hideLoading } from 'react-redux-loading-bar'
import './LoaderHOC.css'

export const mapDispatchToProps = (dispatch, ownProps) => ({
    showLoading: () => dispatch(showLoading()),
    hideLoading: () => dispatch(hideLoading()),
})

const LoaderHOC = (isLoading) => (dataPropName) => (WrappedComponent) => {
    return class LoaderHOC extends Component {

        isLoadingData(prop) {
            return (
                prop ||
                prop === undefined
            )
        }

        render() {
            const dataIsEmpty = _isEmpty(this.props[dataPropName])
            const showLoader =  dataIsEmpty && this.isLoadingData(this.props[isLoading])

            if (showLoader) {
                return <div className='loader'></div>
            } else if (dataIsEmpty) {
                return <div><em>No data</em></div>
            }
            else {
                return <WrappedComponent {...this.props} />
            }
        }
    }
}

export default LoaderHOC
