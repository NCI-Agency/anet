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
		COMPLETED: 'completed',
		ONGOING: 'ongoing',
		OVERDUE: 'overdue'
    }
    
    findParents = task => {
        const parents = []
        const matchTask = element => {
            if (element.id === task.parentTask.id) 
                return element
        }
        while (task.parentTask) 
            parents.unshift(task = this.state.data.find(matchTask))
        return parents
    }

    render() {
        const {data} = this.state
        const now = new Date()
        const phaseAccessors = _.transform(Settings.fields.task.customFieldEnum2.enum, (result,val,key) => {
            result.push( {   id : "_phase" + key,  Header: val,
                accessor: task => {
                    if (task.customFieldEnum2 !== key)
                        return null
                    if (task.projectedCompletion)
                        return ProgramSummaryView.STATUS.COMPLETED
                    else if (task.plannedCompletion < now)
                        return ProgramSummaryView.STATUS.OVERDUE
                    else 
                        return ProgramSummaryView.STATUS.ONGOING
                },
                aggregate: (values, rows) => values.reduce((accumulator, currentValue) => 
                {
                    if (typeof currentValue === 'string') 
                    {    
                        ++ accumulator[currentValue]
                        return accumulator
                    }
                    else if (currentValue) 
                    {
                    accumulator[ProgramSummaryView.STATUS.COMPLETED] = currentValue[ProgramSummaryView.STATUS.COMPLETED] + accumulator[ProgramSummaryView.STATUS.COMPLETED]
                    accumulator[ProgramSummaryView.STATUS.OVERDUE] = currentValue[ProgramSummaryView.STATUS.OVERDUE] + accumulator[ProgramSummaryView.STATUS.OVERDUE]
                    accumulator[ProgramSummaryView.STATUS.ONGOING] = currentValue[ProgramSummaryView.STATUS.ONGOING] + accumulator[ProgramSummaryView.STATUS.ONGOING]
                    }
                    return accumulator
                }, {completed:0, ongoing:0, overdue:0}),
                Cell: row => {
                    if (!row.value)
                        return null
                    if (typeof row.value === 'string')
                        return row.value
                    const number = row.value.overdue > 0 ? row.value.overdue : row.value.ongoing
                    const all = row.value.ongoing+row.value.overdue+row.value.completed
                    const rest = all - number
                    return <div style={{background: 'lightGray'}}>                
                        <div style={{width: ''+100*number/all+'%', float:'left', 'textAlign':'right', background: row.value.overdue > 0 ? 'red' : 'green'}}>
                            {number > 0 ? number : ""}
                        </div>
                        {number === 0 ? 0 : ""}
                        {rest>0 && "/"+ rest }
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
                            Header: "EF2",
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
                    ], phaseAccessors, [
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
            totalCount, list { id, shortName, longName, customFieldEnum2, plannedCompletion, projectedCompletion, parentTask { id }, }
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
