import React, { PureComponent } from "react"

export default class NotFound extends PureComponent {
  componentDidMount() {
    document.getElementsByTagName("html")[0].classList.add("not-found")
  }

  componentWillUnmount() {
    document.getElementsByTagName("html")[0].classList.remove("not-found")
  }

  render() {
    return (
      <div>
        <h1 style={{ textAlign: "center" }} className="not-found-text">
          {this.props.text}
        </h1>
      </div>
    )
  }
}
