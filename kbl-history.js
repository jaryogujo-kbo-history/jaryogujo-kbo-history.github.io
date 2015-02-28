d3.kblHistoryDataMng = function () {
  var exports = {},
    dispatch = d3.dispatch('dataReady', 'dataLoading'),
    data;

  exports.loadCsv = function(_path) {
    var loadCsv = d3.csv(_path);
    loadCsv.on('progress', function() {
      dispatch.dataLoading(d3.event.loaded);
    });

    loadCsv.get(function(_err, _res) {
      _res.forEach(function(d) {
        //clean data!!
        for (var k in d) {
          if(d.hasOwnProperty(k) && !isNaN(d[k])) {
            d[k] = +d[k]
          } else if (k === 'coach_name') {
            d[k] = d[k].split(',').map(function(d) {return d.trim()})
            d['first_coach_name'] = d[k][0]
          }
        }
      })
      data = _res;
      dispatch.dataReady(_res);
    })

  }

  exports.data = function () {
    return data;
  };

  d3.rebind(exports, dispatch, 'on');
  return exports;
}

d3.kblHistory = function module () {
  var attrs = {
    canvasWidth : 800,
    canvasHeight : 400,
    isTeamMode : true,
    blockColExtent : [],
  };//end of attributes
  var margin = {top:20, right : 10, bottom : 10, left : 50}
  var x = d3.scale.ordinal(), y=d3.scale.ordinal(), xAxis = d3.svg.axis();
  var wa = d3.scale.linear();
  var teamMap = d3.map({'OB':'OB','SS':'삼성','MB':'MBC',
  'HT':'해태','LT':'롯데','SM':'삼미','LG':'LG','DS':'두산','KA':'KIA',
  'BG':'빙그레','HH':'한화','SK':'SK','NS':'넥센','NC':'NC','SB':'쌍방울',
  'CB':'청보','TP':'태평양','HD':'현대'})
  var svg, curData;
  var exports = function (_selection) {
    _selection.each(function(_data) {
      d3.select(this).style('width', attrs.canvasWidth+'px').style('height', attrs.canvasHeight+'px')

      var width = attrs.canvasWidth - margin.left - margin.right;
      var height =  attrs.canvasHeight - margin.top - margin.bottom;
      var yearExtent = d3.extent(_data, function(d) {return d.year})
      var waExtent = d3.extent(_data, function(d) {return d.wa})
      var nestedByTeam = nestFunc('final_team_code', 'first_coach_name')
      .entries(_data);
      var nestedByCoach = nestFunc('first_coach_name', 'final_team_code')
      .entries(_data);

      curData = nestedByTeam;
      x.rangeRoundBands([0, width])
        .domain(d3.range(yearExtent[0], yearExtent[1]+1))
      y.rangeRoundBands([0, height]).domain(curData.map(function(d) {return d.key}))

      //FIXME : get the scale of  winning rates
      xAxis.tickSize(0)
      //.ticks(20)
      //.tickValues(x.domain().filter(function(d) {return (d%2===0)}))
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
        .attr('height', height + margin.top + margin.bottom)
      }

      svg.call(svgInit)
    }); //end of each
  } // end of exports

  function svgInit(svg) {
    var labelCol = svg.append('g')
    .attr('transfrom', d3.svg.transform().translate([0, margin.top]))

    labelCol.selectAll('text.jg-team-label')
      .data(function(d) {return d.map(function(dd) { return dd.key})})
    .enter().append('text')
    .attr('class','jg-team-label')
    .attr('text-anchor', 'end')
    .attr('x', margin.left*.95)
    .attr('y', function(d){return y(d) + y.rangeBand()*.5 + margin.top })
    .attr('dy', '.35em')
    .text(function(d) {return teamMap.get(d)})

    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);

    var table = svg.append('g')
    .attr('transform', d3.svg.transform().translate(function() {return [margin.left, margin.top]}))

    var row = table.selectAll('g.jg-row')
      .data(function(d) {return d}) // => team level
    .enter().append('g')
    .attr('class', 'jg-row')
    .attr('transform', d3.svg.transform().translate(function(d) {return [0, y(d.key)]}))

    var col = row.selectAll('g.jg-col')
      .data(function(d) {
        return d.values.reduce(
          function(pre, cur){
            return pre.concat(cur.values)}, [])
      }) //d.values => coach level
    .enter().append('g')
    .attr('class', 'jg-col')
    .attr('transform', d3.svg.transform().translate(function(d) {return [x(d[0].year), 0]}))
    .on('click', function(d,i) {
      if (d3.select(this).classed('filtered')) {

        col.classed({'filtered':false})
      } else {
        var thisCoach =d[0].first_coach_name
        col.classed({'filtered':false})

        col.filter(function(d) {
              return d[0].first_coach_name === thisCoach
          })
          //.selectAll('rect.jg-col-block')
          .classed({'filtered':true})
      }
    })

    col.append('rect')
    .attr('class', 'jg-col-block')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', function(d) {
      return d.length * x.rangeBand()//x(d[d.length-1].year+1) - x(d[0].year);
    })
    .attr('height', y.rangeBand())
    /*
    .style('fill', function(d,i) {
      if (i%2==0) {
        return '#ddd'
      } else {
        return '#e8e8e8'
      }
    })
    */
    .style('stroke', '#eee')

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

    //TODO : draw year-blocks 1.draw winning rates 2.draw score avg.


    //TODO :

  }


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
