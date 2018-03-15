import React from "react"
import API from 'api'
import _ from 'lodash'
import ReactTable from "react-table"
import "react-table/react-table.css"
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import moment from 'moment'

export default class ProgramSummaryView extends React.Component {
    constructor() {
        super()
        this.state = {
            data: []
        }
    }

    static STATUS = {
		COMPLETED: {id: 'completed', color: 'green'},
		ONGOING: {id: 'ongoing', color: 'black'},
        OVERDUE: {id: 'overdue', color: 'red'}
    }
    
    findParents = task => {
        const parents = []
        const matchParentTask = element => {
            if (element.id === task.parentTask.id) 
                return element
        }
        while (task.parentTask) 
            parents.unshift(task = this.state.data.find(matchParentTask))
        return parents
    }

    render() {
        const {data} = this.state
        const now = new Date()

        // Making a starting object for aggregations with stats initialized at 0
        const initialStats = Object.values(ProgramSummaryView.STATUS).reduce((accumulator, currentValue) => {accumulator[currentValue.id]=0; return accumulator},{})

        // Making a column for each possible enum value of customFieldEnum2
        const customFieldEnum2Columns = _.transform(Settings.fields.task.customFieldEnum2.enum, (result,val,key) => {
            result.push( {   id : "_phase" + key,  Header: val,
                accessor: task => {
                    if (task.customFieldEnum2 !== key)
                        return null
                    if (task.projectedCompletion) // TODO: refactor projectedCompletion into dateOfCompletion
                        return ProgramSummaryView.STATUS.COMPLETED
                    else if (task.plannedCompletion < now)
                        return ProgramSummaryView.STATUS.OVERDUE
                    else 
                        return ProgramSummaryView.STATUS.ONGOING
                },
                aggregate: (values, rows) => values.reduce((accumulator, currentValue) => {
                    if (currentValue)
                        if (currentValue.id) // TODO: find better way to recognize non-aggregated values
                            ++ accumulator[currentValue.id]
                        else if (currentValue)
                            Object.values(ProgramSummaryView.STATUS).forEach(element => accumulator[element.id] += currentValue[element.id])
                    return accumulator
                }, Object.assign({}, initialStats)) ,
                Cell: row => {
                    if (!row.value)
                        return null

                    if (row.value.id)
                        return <div style={{color: row.value.color}}> {row.value.id} </div>

                    const number = row.value.overdue > 0 ? row.value.overdue : row.value.completed
                    const all = row.value.ongoing+row.value.overdue+row.value.completed
                    return <div style={{background: 'lightGray'}}>                
                        <div style={{width: ''+100*number/all+'%', float:'left', textAlign:'right', background: row.value.overdue > 0 ? 'red' : 'green'}}>
                            {number > 0 ? number : ""}
                            {number > 0 && number===all && "/"+ all }
                        </div>
                        {number === 0 ? 0 : ""}
                        {number<all && "/"+ all }
                    </div>
                }
            })},[])

        return (
                    <ReactTable
                        data={data.filter(task => this.findParents(task).length > 1)}
                        pivotBy={['EF', 'PT']}
                        columns={_.union([
                        {
                            id: "EF",
                            Header: "EF",
                            accessor: task => {
                                const parents = this.findParents(task)
                                return parents.length > 0 && (parents[0].shortName + " " + parents[0].longName)
                            }
                        }, {
                            id: "PT",
                            Header: "Program Task",
                            accessor: task => {
                                const parents = this.findParents(task)
                                return parents.length > 1 && (parents[1].shortName  + " " + parents[1].longName)
                            },
                            Aggregated: row => null
                        }, {
                            Header: "Task",
                            accessor: "shortName",
                            Aggregated: row => null,
                            Cell: row => row.original && (<LinkTo task={row.original} key={row.original.id}>{row.original.shortName + " " + row.original.longName}</LinkTo>)
                        }
                    ], customFieldEnum2Columns, [
                        {
                            id: "plannedCompletion",
                            Header: "Planned completion",
                            accessor: "plannedCompletion",
                            aggregate: (values, rows) => _.max(values),
                            Cell: row => row.row.plannedCompletion && (<div style={{color: row.row.plannedCompletion < now && !row.row.projectedCompletion ? 'red' : 'black'}}> { moment(row.row.plannedCompletion).format('DD MMM YYYY')} </div>)
                        }])}
                        defaultPageSize={25}/>
        )
    }

    fetchData() {
        const chartQuery = API.query(/* GraphQL */
        `taskList (f:getAll pageSize:10000) { 
            totalCount, list { id, shortName, longName, customFieldEnum2, plannedCompletion, projectedCompletion, customFieldRef1 { id }, }
        }`)

        Promise
            .all([chartQuery])
            .then(values => {
                const taskList = values[0].taskList.list
                this.setState({data: taskList})
            })
    }

    componentDidMount() {
        this.fetchData()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.date.valueOf() !== this.props.date.valueOf()) {
            this.fetchData()
        }
    }
}
