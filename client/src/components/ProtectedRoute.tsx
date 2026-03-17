import AppContext from "components/AppContext"
import PageMissing from "pages/PageMissing"
import React, { useContext } from "react"
import { Outlet } from "react-router-dom"

interface ProtectedRouteProps {
  authorizationCallback: (currentUser: any) => boolean
}

const ProtectedRoute = ({ authorizationCallback }: ProtectedRouteProps) => {
  const { currentUser } = useContext(AppContext)
  if (authorizationCallback?.(currentUser)) {
    return <Outlet />
  }

  return <PageMissing />
}

export default ProtectedRoute
