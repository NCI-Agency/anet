import { expect } from "chai"
import lodash from "lodash"

const axios = require("axios")

const apiUrl = `${process.env.SERVER_URL}/graphql?user=erin&pass=erin`

// centered on General Hospital, zoom level 15, not padded
const polygon01 =
  "POLYGON ((-52.77621746063233 47.56453866910163, -52.741935 47.56453866910163, -52.70763874053956 47.56453866910163, -52.70763874053956 47.571772, -52.70763874053956 47.57901543200339, -52.741935 47.57901543200339, -52.77621746063233 47.57901543200339, -52.77621746063233 47.571772, -52.77621746063233 47.56453866910163))"

// centered on General Hospital, zoom level 15, padded by 0.5
const polygon02 =
  "POLYGON ((-52.81050682067872 47.55730028765075, -52.741935 47.55730028765075, -52.67334938049317 47.55730028765075, -52.67334938049317 47.571772, -52.67334938049317 47.58625381345426, -52.741935 47.58625381345426, -52.81050682067872 47.58625381345426, -52.81050682067872 47.571772, -52.81050682067872 47.55730028765075))"

// centered on General Hospital, zoom level 11, padded by 0.5
const polygon03 =
  "POLYGON ((-57.13165283203125 46.642388783472754, -52.741935 46.642388783472754, -48.35357666015625 46.642388783472754, -48.35357666015625 47.571772, -48.35357666015625 48.49544709355706, -52.741935 48.49544709355706, -57.13165283203125 48.49544709355706, -57.13165283203125 47.571772, -57.13165283203125 46.642388783472754))"

const locationQueryTemplate = {
  operationName: null,
  variables: {
    locationQuery: {
      pageSize: 0,
      withinPolygon: "",
      sortBy: "NAME"
    }
  },
  query: `
    query($locationQuery: LocationSearchQueryInput) {
      locationList(query: $locationQuery) {
        totalCount
        list {
          name
        }
      }
    }
  `
}

const reportQueryTemplate = {
  operationName: null,
  variables: {
    reportQuery: {
      pageSize: 0,
      state: "PUBLISHED",
      sortBy: "ENGAGEMENT_DATE",
      withinPolygon: ""
    }
  },
  query: `
    query ($reportQuery: ReportSearchQueryInput) {
      reportList(query: $reportQuery) {
        totalCount
        list {
          location {
            name
          }
        }
      }
    }
  `
}

const positionQueryTemplate = {
  operationName: null,
  variables: {
    positionQuery: {
      pageSize: 0,
      withinPolygon: ""
    }
  },
  query: `
    query ($positionQuery: PositionSearchQueryInput) {
      positionList(query: $positionQuery) {
        totalCount
        list {
          name
          location {
            name
          }
        }
      }
    }
  `
}

describe("Location geo search, when map center is (-52.741935 47.571772)", () => {
  it("should return one location for visible map bounds", async() => {
    const query = lodash.cloneDeep(locationQueryTemplate)
    query.variables.locationQuery.withinPolygon = polygon01
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.locationList?.list || []
    expect(resultList.length).to.equal(1)
    expect(resultList[0].name).to.equal("General Hospital")
  })

  const locations01 = [
    "Cabot Tower",
    "Fort Amherst",
    "General Hospital",
    "Murray's Hotel",
    "Wishingwells Park"
  ]

  it("should return 5 locations for padded (0.5) map bounds", async() => {
    const query = lodash.cloneDeep(locationQueryTemplate)
    query.variables.locationQuery.withinPolygon = polygon02
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.locationList?.list || []
    expect(resultList.length).to.equal(5)
    expect(resultList[0].name).to.equal(locations01[0])
    expect(resultList[1].name).to.equal(locations01[1])
    expect(resultList[2].name).to.equal(locations01[2])
    expect(resultList[3].name).to.equal(locations01[3])
    expect(resultList[4].name).to.equal(locations01[4])
  })

  it("should return 9 locations in zoom level 11 for padded (0.5) map bounds", async() => {
    const query = lodash.cloneDeep(locationQueryTemplate)
    query.variables.locationQuery.withinPolygon = polygon03
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.locationList?.list || []
    expect(resultList.length).to.equal(9)
    expect(resultList[0].name).to.equal("Cabot Tower")
    expect(resultList[1].name).to.equal("Conception Bay South Police Station")
    expect(resultList[2].name).to.equal("Fort Amherst")
    expect(resultList[3].name).to.equal("General Hospital")
    expect(resultList[4].name).to.equal("Harbour Grace Police Station")
    expect(resultList[5].name).to.equal("Murray's Hotel")
    expect(resultList[6].name).to.equal("Portugal Cove Ferry Terminal")
    expect(resultList[7].name).to.equal("St Johns Airport")
    expect(resultList[8].name).to.equal("Wishingwells Park")
  })

  it("should return reports in only General Hospital for visible map bounds", async() => {
    const query = lodash.cloneDeep(reportQueryTemplate)
    query.variables.reportQuery.withinPolygon = polygon01
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.reportList?.list || []
    expect(resultList.length).to.be.gt(1)
    expect(
      resultList.every(r => r.location.name === "General Hospital")
    ).to.equal(true)
  })

  it(`should return reports from any of "${locations01.join()}" for padded (0.5) map bounds`, async() => {
    const query = lodash.cloneDeep(reportQueryTemplate)
    query.variables.reportQuery.withinPolygon = polygon02
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.reportList?.list || []
    expect(resultList.length).to.be.gt(1)
    resultList.forEach(r => expect(r.location.name).to.be.oneOf(locations01))
  })

  it("shouldn't return any positions for visible map bounds", async() => {
    const query = lodash.cloneDeep(positionQueryTemplate)
    query.variables.positionQuery.withinPolygon = polygon01
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.positionList?.list || []
    expect(resultList.length).to.equal(0)
  })

  it("should return one position for padded map bounds", async() => {
    const query = lodash.cloneDeep(positionQueryTemplate)
    query.variables.positionQuery.withinPolygon = polygon02
    const result = await axios.post(apiUrl, query)
    expect(result?.status).to.equal(200)

    const resultList = result?.data?.data?.positionList?.list || []
    expect(resultList.length).to.equal(1)
    expect(resultList[0].name).to.equal("Planning Captain")
    expect(resultList[0].location.name).to.equal("Wishingwells Park")
  })
})
