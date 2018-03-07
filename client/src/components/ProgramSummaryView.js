import React from "react"
import API from 'api'
import _ from 'lodash'
import ReactTable from "react-table"
import "react-table/react-table.css"
import Settings from 'Settings'

export default class ProgramSummaryView extends React.Component {
    constructor() {
        super();
        this.state = {
            data: []
        }
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
        const phaseAccessors = _.transform(Settings.fields.task.customFieldEnum2.enum, (result,val,key) => {result.push( {   id : "_phase" + key,  Header: val,
                accessor: task => {
                    return task.customFieldEnum2 === key
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
                                return parents.length > 0 && parents[0].shortName
                            }
                        }, {
                            id: "PT",
                            Header: "Program Task",
                            accessor: task => {
                                const parents = this.findParents(task)
                                return parents.length > 1 && parents[1].shortName
                            }
                        }, {
                            Header: "Task",
                            accessor: "shortName"
                        }, {
                            Header: "Name",
                            accessor: "longName"
                        },
                    ], phaseAccessors)}
                        defaultPageSize={25}/>
        );
    }

    fetchData() {
        const chartQuery = API.query(/* GraphQL */
        `taskList (f:getAll pageSize:10000) { 
            totalCount, list { id, shortName, longName, customFieldEnum2, parentTask { id }, }
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
