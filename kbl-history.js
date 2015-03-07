d3.kblHistory = function module () {
  var attrs = {
    canvasWidth : 800,
    canvasHeight : 350,
    tableHeight : 300,
    isTeamMode : true,
    blockColExtent : [],
  };//end of attributes
  var modes =  ['team', 'coach'];
  var margin = {top:20, right : 10, bottom : 10, left : 50}
  var x = d3.scale.ordinal(), y=d3.scale.ordinal(), xAxis = d3.svg.axis();
  var wa = d3.scale.linear();
  var teamMap = d3.map({'OB':'OB','SS':'삼성','MB':'MBC',
    'HT':'해태','LT':'롯데','SM':'삼미','LG':'LG','DS':'두산','KA':'KIA',
    'BG':'빙그레','HH':'한화','SK':'SK','NS':'넥센','NC':'NC','SB':'쌍방울',
    'CB':'청보','TP':'태평양','HD':'현대'})
  var svg, curData, curMode = modes[0], suppData=[];
  var exports = function (_selection) {
    _selection.each(function(_data) {
      d3.select(this).style('width', attrs.canvasWidth+'px')//.style('height', attrs.canvasHeight+'px')

      var width = attrs.canvasWidth - margin.left - margin.right;
      var height =  attrs.tableHeight - margin.top - margin.bottom;
      var yearExtent = d3.extent(_data, function(d) {return d.year})
      var waExtent = d3.extent(_data, function(d) {return d.wa})
      var nestedByTeam = nestFunc('final_team_code', 'first_coach_name')
      .entries(_data);
      var nestedByCoach = nestFunc('first_coach_name', 'final_team_code')
      .entries(_data);

      curData = (curMode===modes[0] ? nestedByTeam : nestedByCoach);

      x.rangeRoundBands([0, width])
        .domain(d3.range(yearExtent[0], yearExtent[1]+1))
      y.rangeRoundBands([0, height]).domain(curData.map(function(d) {return d.key}))

      //FIXME : get the scale of  winning rates
      xAxis.tickSize(0)
      .tickFormat(function(d) {
        return d3.format('02d')(d%100) + "'"
        //d3.format('d'))
      })
      .orient("top")
      .scale(x)

      if (!svg) {
        svg = _selection.selectAll('svg.jg-svg')
          .data([curData])
        .enter().append('svg')
        .attr('class','jg-svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', attrs.canvasHeight)
      }

      svg.call(svgInit)
    }); //end of each
  } // end of exports

  function svgInit(svg) {

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);

    var table = svg.append('g')
    .attr('class', 'jg-table')
    .attr('transform', d3.svg.transform().translate(function() {return [0,margin.top]})) //margin.left

    table.call(drawRows)

    //TODO : draw year-blocks 1.draw winning rates 2.draw score avg.

  }

  function drawRows(table) {

    //TODO : add label to row
    var row = table.selectAll('g.jg-row')
      .data(function(d) {return d}, function(d) { return d.key}) // => team level
    .enter().append('g')
    .attr('class', 'jg-row')
    .attr('transform', d3.svg.transform().translate(function(d) {
      d.y = y(d.key);
      return [0, d.y]
    }))

    row.call(drawLabel);
    row.call(drawCols);
  }

  function drawLabel(row, isSupp) {

    row.selectAll('.jg-team-label')
        .data(function(d) {return [d.key]})
      .enter().append('text')
      .attr('class','jg-team-label')
      .attr('text-anchor', 'end')
      .attr('x', margin.left*.95)
      .attr('y', function(d){return y.rangeBand()*.5  }) //+ margin.top
      .attr('dy', '.35em')
      .text(function(d) {return (isSupp ? teamMap.get(d): d)})
  }

  function drawCols(row, isSupp) {
    isSupp = isSupp || false;
    var col = row.selectAll('g.jg-col')
      .data(function (d) {
        if(isSupp) return d.values
        return d.values.reduce(function(pre, cur){ return pre.concat(cur.values)}, [])
      })
    .enter().append('g')
    .sort(function(a,b) {
      return a[0].year - b[0].year
    })
    .attr('class', 'jg-col')
    .attr('transform', d3.svg.transform().translate(function(d) {
      d.x = x(d[0].year) + margin.left;
      return [d.x, 0]
    }))

    if(!isSupp) {
      col.on('mouseover', mouseOverColFunc)
      .on('click', clickColFunc)
    }

    col.append('rect')
    .attr('class', 'jg-col-block')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', function(d) {
      d.width = d.length * x.rangeBand();
      return d.width//x(d[d.length-1].year+1) - x(d[0].year);
    })
    .attr('height', y.rangeBand())

    col.call(drawRank);
  }

  function drawRank(col) {
    //FIXME : write the rank of teams temporarily
    var rank = col.selectAll('text.jg-rank-text')
        .data(function(d){return d;})
      .enter().append('text')
      .attr('class', 'jg-rank-text')
      .attr('x', function(d,i) { return i*x.rangeBand() + x.rangeBand()*.5})
      .attr('y', function(d,i) {return y.rangeBand()*.5})
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .text(function(d) {return d.rank})

  }

  function mouseOverColFunc(d,i) {
    var thisCoach =d[0].first_coach_name
    var col = svg.select('.jg-table').selectAll('.jg-col');
    col.classed({'jg-mouseover':false})
    var linkData = [];
    var overed = col.filter(function(d) {return d[0].first_coach_name === thisCoach})
      .classed({'jg-mouseover':true})
      .each(function(d, i) {
        var thisCol = d3.select(this)
        var point = {}
        point.x = thisCol.datum().x;
        point.y = d3.select(thisCol.node().parentNode).datum().y;
        point.width = thisCol.datum().width;
        linkData.push(point);
      }) //end of each

    drawDiagonals(linkData);

    var suppRow = svg.selectAll('.jg-supp.jg-row')
      .data([{key:thisCoach, values:overed.data()}], function(d){ return d.key})

    suppRow.enter().append('g')
      .classed({'jg-supp':true, 'jg-row':true})
      .attr('transform', d3.svg.transform().translate(function(d) { return [0, attrs.tableHeight] }))

    suppRow.exit().remove();
    suppRow.call(drawCols, true)
    suppRow.call(drawLabel)
  }

  function clickColFunc(d,i) {

    if (d3.select(this).classed('jg-clicked')) {
      svg.selectAll('.jg-col').classed({'jg-mouseover':false})
      svg.selectAll('.jg-col').classed({'jg-clicked':false})
      attrs.canvasHeight -= y.rangeBand();
      svg.attr('height', attrs.canvasHeight);
    } else {
      var thisCoach =d[0].first_coach_name
      svg.selectAll('.jg-col').classed({'jg-clicked':false})
      var clicked = svg.selectAll('.jg-col.jg-mouseover')//.filter(function(d) {return d[0].first_coach_name === thisCoach})
        .classed({'jg-clicked':true, 'jg-mouseover':false})

      attrs.canvasHeight += y.rangeBand();
      svg.attr('height', attrs.canvasHeight);
      svg.selectAll('.jg-supp.jg-row')
        .classed({'jg-supp':false, 'jg-supp-fixed':true})
      var size = svg.selectAll('.jg-supp-fixed').size();
      svg.selectAll('.jg-supp-fixed')
        .transition().duration(400)
        .attr("transform", d3.svg.transform().translate(function(d,i) {
          var dy = attrs.tableHeight+ (y.rangeBand())+ ((size-i)*y.rangeBand());
          return [0,dy]
        }))

    }
  }/// end of clickColFunc;

  function drawDiagonals(linkData) {
    linkData.sort(function(a,b) { return a.x - b.x;})
    linkData = linkData.reduce(function(pre,cur,i,arr) {
      if (i < arr.length-1) {
        var link = {};
        link.source = {}
        link.source.x = cur.x+ cur.width;
        link.source.y = cur.y+ y.rangeBand()*.5;
        pre.push(link);
      }

      if (i>0) {
        var lastLink = pre[i-1];
        lastLink.target = {}
        lastLink.target.x = cur.x;
        lastLink.target.y = cur.y+y.rangeBand()*.5;
      }

      return pre;
    }, []);

    var diagonal = d3.svg.diagonal()
    .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })
    .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
    .projection(function(d) { return [d.y, d.x]; });
    d3.selectAll('.jg-link').remove();
    var linkPath = svg.select('.jg-table')
      .selectAll('.jg-link')
        .data(linkData, function(d){return [d.source.x, d.source.y, d.target.x, d.target.y].join('-')})

    linkPath.enter().append('path')
      .attr("class", "jg-link")
      .attr("d", diagonal);

    linkPath.exit().remove();

    var linkPoint = svg.select('.jg-table')
      .selectAll('circle.jg-link')
        .data(linkData.reduce(function(pre, cur){
          pre.push({x:cur.source.x, y:cur.source.y})
          pre.push({x:cur.target.x, y:cur.target.y})
          return pre;
        }, []))

    linkPoint.enter().append('circle')
      .attr("class", "jg-link")
      .attr('cx', function(d){return d.x})
      .attr('cy', function(d){return d.y})
      .attr('r', 4);
    linkPoint.exit().remove();
  }// end of drawDiagonals

  function nestFunc(key1, key2 ) {
    return d3.nest()
      .key(function(d) {return d[key1]})
      .key(function(d) {return d[key2]})
      .sortValues(function(a,b) { return a.year-b.year})
      .rollup(rollupFunc)
  }

  function rollupFunc(leaves) {
    var newLeaves = [],
      tempLeaves = [],
      preYear = -1;

    leaves.forEach(function(l) {
      if (tempLeaves.length === 0 || (preYear+1) === l.year) {
        tempLeaves.push(l)
      } else {
        newLeaves.push(tempLeaves)
        tempLeaves = [];
        tempLeaves.push(l);
      }
      preYear = l.year;
    })

    if (tempLeaves.length >0) {
      newLeaves.push(tempLeaves);
    }
    return newLeaves;
  }



  function createAccessorFunc(_attr) {
    function accessor(val) {
      if (!arguments.length) {
        return attrs[_attr]
      }
      attrs[_attr] = val;
      return exports;
    }
    return accessor;
  }

  for (var attr in attrs) {
    if((!exports[attr]) && attrs.hasOwnProperty(attr)) {
      exports[attr] = createAccessorFunc(attr);
    }
  }

  return exports;
}
