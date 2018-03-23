import React from "react"
import API from 'api'
import _ from 'lodash'
import Settings from 'Settings'
import LinkTo from 'components/LinkTo'
import moment from 'moment'

import 'components/OrganizationView.css'

let d3 = require('d3')

const graphCss = {
	width: '100%',
    height: '1000px'
}

export default class OrganizationView extends React.Component {
    constructor() {
        super()
        this.state = {
            data: []
        }

    }

    render() {
        return (
            <svg ref={el => this.svgElement = el} style={graphCss} />
        )
    }

    fetchData() {
        const chartQuery = API.query(/* GraphQL */
            `organizationList(f:getAll pageSize:100000)
            {
                list
                {
                id,shortName,parentOrg{id},childrenOrgs{id}
                }
            }`)

        Promise
            .all([chartQuery])
            .then(values => {
                const taskList = values[0].organizationList.list
                this.setState({data: taskList})
            })
    }

    componentDidMount() {
        const svg = d3.select(this.svgElement)
        const canvas = this.canvas = svg.append("g");
        svg .call(d3.zoom().on("zoom",  () => canvas.attr("transform", d3.event.transform) ));
        this.fetchData()
    }

    componentDidUpdate(prevProps, prevState) {
        var tree = d3.tree()

        tree.nodeSize([15,60])
    
        const rootOrg = {childrenOrgs : _.filter(this.state.data, org => !(org.parentOrg && org.parentOrg.id))}

        var root = d3.hierarchy(rootOrg, d => { 
            return _.map( d ? d.childrenOrgs : []   , (orgRef) => _.find(this.state.data, function (e) {
                return e.id === orgRef.id
            } ) )
        })

      var link = this.canvas.selectAll(".link")
        .data(tree(root).links())
        .enter().append("path")
          .attr("class", "link")
          .attr("d", d3.linkHorizontal()
              .x(function(d) { return d.y; })
              .y(function(d) { return d.x; }));
    
      var node = this.canvas.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
          .attr("class", function(d) { return "node" + (d.children ? " node--internal" : " node--leaf"); })
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
    
      node.append("circle")
          .attr("r", 2.5);
    
      node.append("text")
          .attr("dy", 3)
          .attr("x", function(d) { return d.children ? -8 : 8; })
          .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
           .text(function(d) { 
               return d.data && d.data.shortName
            });
    }
}
