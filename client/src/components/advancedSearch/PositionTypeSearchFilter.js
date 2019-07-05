import autobind from "autobind-decorator"
import SelectSearchFilter from "components/advancedSearch/SelectSearchFilter"
import { Position } from "models"

export default class PositionTypeSearchFilter extends SelectSearchFilter {
  @autobind
  toQuery() {
    // Searching for advisors implies searching for super users and admins as well
    const value =
      this.state.value.value === Position.TYPE.ADVISOR
        ? [
            Position.TYPE.ADVISOR,
            Position.TYPE.SUPER_USER,
            Position.TYPE.ADMINISTRATOR
          ]
        : this.state.value.value
    return { [this.props.queryKey]: value }
  }
}
