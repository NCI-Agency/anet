import React from 'react'
import pluralize from 'pluralize'

import Settings from 'Settings'

import ReportStateSearch from 'components/advancedSearch/ReportStateSearch'
import DateRangeSearch from 'components/advancedSearch/DateRangeSearch'
import AutocompleteFilter from 'components/advancedSearch/AutocompleteFilter'
import OrganizationFilter from 'components/advancedSearch/OrganizationFilter'
import PositionTypeSearchFilter from 'components/advancedSearch/PositionTypeSearchFilter'
import SelectSearchFilter from 'components/advancedSearch/SelectSearchFilter'
import TextInputFilter from 'components/advancedSearch/TextInputFilter'

import {Location, Person, Task, Position, Organization} from 'models'

const taskFilters = props => {
	const taskFiltersObj = {
		Organization: <OrganizationFilter
						queryKey="responsibleOrgId"
						queryIncludeChildOrgsKey="includeChildrenOrgs"/>,
		Status: <SelectSearchFilter
						queryKey="status"
						values={[Task.STATUS.ACTIVE, Task.STATUS.INACTIVE]}
						labels={["Active", "Inactive"]}/>
	}
	const projectedCompletion = Settings.fields.task.projectedCompletion
	if (projectedCompletion)
		taskFiltersObj[projectedCompletion.label] = <DateRangeSearch
			queryKey="projectedCompletion" />
	const plannedCompletion = Settings.fields.task.plannedCompletion
	if (plannedCompletion)
		taskFiltersObj[plannedCompletion.label] = <DateRangeSearch
			queryKey="plannedCompletion" />
	const customEnum1 = Settings.fields.task.customFieldEnum1
	if (customEnum1)
		taskFiltersObj[customEnum1.label] = <SelectSearchFilter
			queryKey="projectStatus"
			values={Object.keys(customEnum1.enum)}
			labels={Object.values(customEnum1.enum)} />
	const customField = Settings.fields.task.customField
	if (customField)
		taskFiltersObj[customField.label] = <TextInputFilter
			queryKey="customField" />

	return taskFiltersObj
}

export default {
	searchFilters: function() {
		const filters = {}
		filters.Reports = {
			filters: {
				Author: <AutocompleteFilter
					queryKey="authorId"
					objectType={Person}
					valueKey="name"
					fields={Person.autocompleteQuery}
					template={Person.autocompleteTemplate}
					queryParams={{role: Person.ROLE.ADVISOR}}
					placeholder="Filter reports by author..."
				/>,
				Attendee: <AutocompleteFilter
					queryKey="attendeeId"
					objectType={Person}
					valueKey="name"
					fields={Person.autocompleteQuery}
					template={Person.autocompleteTemplate}
					placeholder="Filter reports by attendee..."
				/>,
				"Author Position": <AutocompleteFilter
					queryKey="authorPositionId"
					objectType={Position}
					valueKey="name"
					fields={Position.autocompleteQuery}
					template={Position.autocompleteTemplate}
					queryParams={{type: [Position.TYPE.ADVISOR, Position.TYPE.SUPER_USER, Position.TYPE.ADMINISTRATOR]}}
					placeholder="Filter reports by author position..."
				/>,
				"Attendee Position": <AutocompleteFilter
					queryKey="attendeePositionId"
					objectType={Position}
					valueKey="name"
					fields={Position.autocompleteQuery}
					template={Position.autocompleteTemplate}
					placeholder="Filter reports by attendee position..."
				/>,
				Organization: <OrganizationFilter
					queryKey="orgId"
					queryIncludeChildOrgsKey="includeOrgChildren"
				/>,
				"Engagement Date": <DateRangeSearch queryKey="engagementDate" />,
				"Release Date": <DateRangeSearch queryKey="releasedAt" />,
				"Update Date": <DateRangeSearch queryKey="updatedAt" />,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter reports by location..."
					url="/api/locations/search"
				/>,
				State: <ReportStateSearch />,
				Atmospherics: <SelectSearchFilter
					queryKey="atmosphere"
					values={["POSITIVE","NEUTRAL","NEGATIVE"]}
				/>,
				Tag: <AutocompleteFilter
					queryKey="tagId"
					valueKey="name"
					placeholder="Filter reports by tag..."
					url="/api/tags/search"
				/>,
			}
		}
	
		const taskShortLabel = Settings.fields.task.shortLabel
		filters.Reports.filters[taskShortLabel] =
			<AutocompleteFilter
				queryKey="taskId"
				objectType={Task}
				fields={Task.autocompleteQuery}
				template={Task.autocompleteTemplate}
				valueKey="shortName"
				placeholder={`Filter reports by ${taskShortLabel}...`}
			/>
	
	
		const countries = Settings.fields.advisor.person.countries || [] // TODO: make search also work with principal countries
		filters.People = {
			filters: {
				Organization: <OrganizationFilter
					queryKey="orgId"
					queryIncludeChildOrgsKey="includeChildOrgs"
				/>,
				Role: <SelectSearchFilter
					queryKey="role"
					values={[Person.ROLE.ADVISOR,Person.ROLE.PRINCIPAL]}
					labels={[Settings.fields.advisor.person.name, Settings.fields.principal.person.name]}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Person.STATUS.ACTIVE, Person.STATUS.INACTIVE, Person.STATUS.NEW_USER]}
				/>,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter by location..."
					url="/api/locations/search"
				/>,
				Nationality: <SelectSearchFilter
					queryKey="country"
					values={countries}
					labels={countries}
				/>,
			}
		}
	
		filters.Organizations = {
			filters: {
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Organization.STATUS.ACTIVE, Organization.STATUS.INACTIVE]}
				/>,
				"Organization type": <SelectSearchFilter
					queryKey="type"
					values={[Organization.TYPE.ADVISOR_ORG, Organization.TYPE.PRINCIPAL_ORG]}
					labels={[Settings.fields.advisor.org.name, Settings.fields.principal.org.name]}
				  />,
			}
		}
	
		filters.Positions = {
			filters: {
				"Position type": <PositionTypeSearchFilter
					queryKey="type"
					values={[Position.TYPE.ADVISOR, Position.TYPE.PRINCIPAL]}
					labels={[Settings.fields.advisor.position.name, Settings.fields.principal.position.name]}
				/>,
				Organization: <OrganizationFilter
					queryKey="organizationId"
					queryIncludeChildOrgsKey="includeChildrenOrgs"
					ref={this.setOrganizationFilter}
				/>,
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Position.STATUS.ACTIVE, Position.STATUS.INACTIVE]}
				/>,
				Location: <AutocompleteFilter
					queryKey="locationId"
					valueKey="name"
					placeholder="Filter by location..."
					url="/api/locations/search"
				/>,
				"Is filled?": <SelectSearchFilter
					queryKey="isFilled"
					values={["true","false"]}
					labels={["Yes","No"]}
				/>,
			}
		}
	
		filters.Locations = {
			filters: {
				Status: <SelectSearchFilter
					queryKey="status"
					values={[Location.STATUS.ACTIVE, Location.STATUS.INACTIVE]}
				/>,
			}
		}
	
		//Task filters
		filters[pluralize(taskShortLabel)] = {
			filters: taskFilters()
		}
	
		return filters
	}
}
