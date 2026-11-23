import { usePageTitle } from "components/Page"
import UserPreferences from "components/preferences/UserPreferences"

const MyPreferences = () => {
  usePageTitle("My Preferences")
  return (
    <UserPreferences actionLabel="Save Preferences" title="My Preferences" />
  )
}

export default MyPreferences
