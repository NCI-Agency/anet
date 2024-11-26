import React, { useEffect } from "react"

interface NotFoundProps {
  text?: string
}

const NotFound = ({ text }: NotFoundProps) => {
  useEffect(() => {
    document.getElementsByTagName("html")[0].classList.add("not-found")
    return () => {
      document.getElementsByTagName("html")[0].classList.remove("not-found")
    }
  }, [])

  return (
    <div>
      <h1 style={{ textAlign: "center" }} className="not-found-text">
        {text}
      </h1>
    </div>
  )
}

export default NotFound
