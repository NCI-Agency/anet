import FileSaver from 'file-saver'
import moment from 'moment'
import GQL from 'graphqlapi'

let identity = function(field) { return field }

export class CSVExport {

	serializers = {
		reports:  {
			id : identity,
			intent : identity,
			engagementDate: (field) => {return moment(field).format('D MMM YYYY')},
			releasedAt: (field) => {return moment(field).format('D MMM YYYY')},
			createdAt: (field) => {return moment(field).format('D MMM YYYY')},
			updatedAt: (field) => {return moment(field).format('D MMM YYYY')},
			keyOutcomes: identity,
			nextSteps: identity,
			cancelledReason: identity,
			atmosphere: identity,
			atmosphereDetails: identity,
			state: identity,
			author: (field) => {return field.name},
			primaryAdvisor: (field) => {return field.name},
			primaryPrincipal: (field) => {return field.name},
			advisorOrg: (field) => {return field.shortName},
			principalOrg: (field) => {return field.shortName},
			location: (field) => {return field.name},
			attendees: (field) => {return field.map(function (item) {return item.name}).join(", ")},
			poams: (field) => {return field.map(function (item) {return item.shortName}).join(", ")},
			comments: (field) => {return field.map(function (item) {return  item.author + ": " + item.text}).join(",/n ")},
			reportText: identity,
		}
	}

	search_config = {
		reports : {
			listName : 'reports: reportList',
			variableType: 'ReportSearchQuery',
			fields :  `
				id, intent, engagementDate, releasedAt, createdAt, updatedAt, keyOutcomes, nextSteps, cancelledReason
				atmosphere, atmosphereDetails, state
				author { id, name },
				primaryAdvisor { id, name, role, position { organization { id, shortName}}},
				primaryPrincipal { id, name, role, position { organization { id, shortName}}},
				advisorOrg { id, shortName},
				principalOrg { id, shortName},
				location { id, name, lat, lng},
				attendees { name},
				poams {id, shortName, longName},
				reportText
			`
		},
		people : {
			listName : 'people: personList',
			variableType: 'PersonSearchQuery',
			fields: 'id, name, rank, emailAddress, role , position { id, name, organization { id, shortName} }'
		},
		positions : {
			listName: 'positions: positionList',
			variableType: 'PositionSearchQuery',
			fields: 'id , name, type, organization { id, shortName}, person { id, name }'
		},
		poams : {
			listName: 'poams: poamList',
			variableType: 'PoamSearchQuery',
			fields: 'id, shortName, longName'
		},
		locations : {
			listName: 'locations: locationList',
			variableType: 'LocationSearchQuery',
			fields : 'id, name, lat, lng'
		},
		organizations : {
			listName: 'organizations: organizationList',
			variableType: 'OrganizationSearchQuery',
			fields: 'id, shortName, longName, type'
		}
	}


	getSearchAll(type, query) {
//		query = Object.without(query, 'type')
		query.pageSize = 0  // retrieve all the filtered reports

		let config = this.search_config[type]
		let part = new GQL.Part(/* GraphQL */`
			${config.listName} (f:search, query:$${type}Query) {
				pageNum, pageSize, totalCount, list { ${config.fields} }
			}
			`).addVariable(type + "Query", config.variableType, query)
		return part
	}



	export(type,query,progressfn) {

		setTimeout(() => {
			let keys = Object.keys(this.serializers[type])
			let csvdata = [keys]
			let serializers = this.serializers[type]

			GQL.run([this.getSearchAll(type, query) ]).then(function(data)  {
				let counter = 0
				let length = data[type].list.length
				function iterator () {
					let report = data[type].list[counter]

					var results = []
					keys.forEach(function (key) {
						var result = report[key]
						if (typeof(result) === 'undefined' || result == null) {
							result = ""
						} else if (key in serializers) {
							result = serializers[key](result)
						}
						if (typeof result === 'string' && result !== "" ) {
							result = "\"" + result + "\""
						}

						results.push(result)
					})
					csvdata.push(results)
					progressfn(counter,length)

					counter++
					if (counter < length) {
						setTimeout(iterator, 1)
					} else {
						var blob = new Blob([csvdata.map(function (row) {return row.join(",")}).join("\n")], {type: "text/plain;charset=utf-8"})
						FileSaver.saveAs(blob, type+".csv")
					}
				}
				iterator()
			}).catch(response =>
				console.log(response)
			)
		}, 1)
	}
}

export default class Export {
	static csvExport = new CSVExport()
}
