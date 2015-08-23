d3.kblHistory = function module () {
  var attrs = {
    canvasWidth : 820,
    canvasHeight : 360,
    tableHeight : 360,
    yearStatHeight : 60,
    isTeamMode : true,
    blockColExtent : [],
  };//end of attributes
  var dispatch = d3.dispatch("rendered")
  var margin = {top:20, right : 10, bottom : 10, left : 70}
  var x = d3.scale.ordinal(), y=d3.scale.ordinal(),
    yearYR=d3.scale.linear().rangeRound([attrs.yearStatHeight-margin.top, 0]),
    yearYRall = d3.scale.linear().rangeRound([attrs.yearStatHeight-margin.top, 0]),
    thetaR = d3.scale.linear().range([0, Math.PI*(3/2)]),
    thetaRall = d3.scale.linear().range([0, Math.PI*(3/2)]);
  var wa = d3.scale.linear();
  var teamMap = d3.map({'OB':'OB','SS':'삼성','MB':'MBC',
    'HT':'해태','LT':'롯데','SM':'삼미','LG':'LG','DS':'두산','KA':'KIA',
    'BG':'빙그레','HH':'한화','SK':'SK','NS':'넥센','NC':'NC','SB':'쌍방울',
    'CB':'청보','TP':'태평양','HD':'현대'})
  var svg, svgYearStat, svgStack, svgTeamStat, svgLegend, legendDiv;
  var teamCoachData, coachTeamData, fixedCoaches=[];
  var width, height;
  var color = d3.scale.category10();
  var yearStatBrush, curYearExtent, yearData;

  var exports = function (_selection) {
    _selection.each(function(_data) {

      d3.select(this).style('width', attrs.canvasWidth+'px')//.style('height', attrs.canvasHeight+'px')
      width = attrs.canvasWidth - margin.left - margin.right;
      height =  attrs.canvasHeight - margin.top - margin.bottom;
      dataInit(_data);
      if (!svg) {
        /*
        var menuDiv = d3.select(this).append('div')
          .attr('class', 'jg-menu')
          .call(menuInit)
        */

        var teamStatDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-team-stat')
        svgTeamStat = teamStatDiv.append('svg')
          .attr('class','jg-svg-team-stat')
          .attr('width', width + margin.left + margin.right)
          .attr('height', attrs.yearStatHeight)

        var yearStatDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-year-stat')

        svgYearStat = yearStatDiv.selectAll('jg-svg-year-stat')
          .data([yearData])
          .enter().append('svg')
          .attr('class','jg-svg-year-stat')
          .attr('width', width + margin.left + margin.right)
          .attr('height', attrs.yearStatHeight)

        var tableDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-table')
        svg = tableDiv.selectAll('svg.jg-svg')
          .data([teamCoachData])
        .enter().append('svg')
        .attr('class','jg-svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', attrs.canvasHeight)
          .append('g')
        .attr('class', 'jg-svg-g')

        var stackDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-stack')

        attrs.stackHeight = y.rangeBand()*4;
        svgStack = stackDiv.append('svg')
          .attr('class','jg-svg-stack')
          .attr('width', width + margin.left + margin.right)
          .attr('height', attrs.stackHeight)
          .append('g')
          .attr('class', 'jg-stack')
          .attr('transform', d3.svg.transform().translate([0, margin.top/2]));
        legendDiv = d3.select(d3.select(this).node().parentNode).append('div')
            .attr('class', 'jg-legend')
            .call(legendInit)

      }
      svgYearStat.call(svgYearStatInit);
      svgTeamStat.call(svgTeamStatInit);
      svg.call(tableInit);
      svgStack.call(svgStackInit);
    }); //end of each
    dispatch.rendered("rendered");
  } // end of exports
  function legendInit(selection) {
    var w = 145, h = 227;
    selection.style('height', h+'px').style('width', w+'px')

    var sampleData = [[Object.create(teamCoachData[0].values[1].values[0][0])]]
    //, [Object.create(teamCoachData[1].values[0].values[0][1])]]
    var arcSize = x.rangeBand() * 2.5;
    var sample = selection.append('svg')
      .attr('class', 'jg-legend-arc-svg')
      .selectAll('.jg-legend-arc')
        .data(sampleData)
      .enter().append('g')
      .attr('class', 'jg-legend-arc')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [w/2 - arcSize/2, h/2-arcSize*.75]
      }))

    var arc = d3.kblHistoryArc()
      //.isAvg()
      .width(arcSize)
      .height(arcSize)
      .thetaR(thetaR)
      .thetaRall(thetaRall)
      .isLegend(true)
    sample.call(arc)
    selection.append('hr')
    var checkPlayOffDiv = selection.append('div')
      .attr('class', 'jg-playoff-check')
    checkPlayOffDiv.append('span')
      .text('플레이오프 진출 및 우승팀 표시')

    checkPlayOffDiv.append('input')
      .attr('id', 'jg-playoff')
      .property({type:'checkbox', name:'showPlayOff', value:'playOff'})
      .on('click', function(d) {
        var checked = d3.select(this).property('checked');
        checkChampDiv.select('input').property('checked', false);
        svg.selectAll('.jg-col .jg-rank-text.playoff')
          .classed({'jg-hidden':!checked})
        svgStack.selectAll('.jg-col .jg-rank-text.playoff')
          .classed({'jg-hidden':!checked})
        legendDiv.selectAll('.jg-rank-text.playoff, .jg-legend-star, .jg-legend-rank')
          .classed({'jg-hidden':!checked})
      })

    var checkChampDiv = selection.append('div')
      .attr('class', 'jg-playoff-check')
    checkChampDiv.append('span')
      .text('우승팀만 표시')
    checkChampDiv.append('input')
      .attr('id', 'jg-playoff')
      .property({type:'checkbox', name:'showPlayOff', value:'playOff'})
      .on('click', function(d) {
        checkPlayOffDiv.select('input').property('checked', false);
        var checked = d3.select(this).property('checked');
        if (checked) {
          svg.selectAll('.jg-col .jg-rank-text.playoff')
            .classed({'jg-hidden':checked})
          svgStack.selectAll('.jg-col .jg-rank-text.playoff')
            .classed({'jg-hidden':checked})
          legendDiv.selectAll('.jg-rank-text.playoff')
            .classed({'jg-hidden':checked})
        }
        svg.selectAll('.jg-col .jg-rank-text.champion')
          .classed({'jg-hidden':!checked})
        svgStack.selectAll('.jg-col .jg-rank-text.champion')
          .classed({'jg-hidden':!checked})
        legendDiv.selectAll('.jg-rank-text.playoff, .jg-legend-star, .jg-legend-rank')
          .classed({'jg-hidden':!checked})
      })

    var coaches = coachTeamData.map(function(d){return d.key})
    coaches.splice(0,0, '⚾︎ 특정 감독 살펴보기  ▾')
    var dropdownDiv = selection.append('div')
      .attr('class', 'jg-coach-select')

    var dropdown = dropdownDiv.append('select')
      .attr('class', 'jg-select')

    var options = dropdown.selectAll('option')
        .data(coaches)
      .enter().append('option')
      .property(function(d){ return {'value':d}})
      .html(function(d){return d})

    dropdown.on('change', function() {
      var selectedIndex = d3.select(this).property('selectedIndex');
      if (selectedIndex==0) {

      } else {
        var coachName = options[0][selectedIndex].__data__;
        svg.selectAll('.jg-col').classed({'jg-clicked':false})
        selectCol(coachName, false);
      }
    })
    $(window).on('scroll', function(event) {
      var threshold = 224;
      var scrollTop = $(window).scrollTop()
      if (scrollTop > threshold) {
        selection.style('top', (scrollTop+10) + 'px');
      } else {
        selection.style('top',threshold);
      }
    });
    return selection;
  }

  function dataInit(_data) {
    var yearExtent = d3.extent(_data, function(d) {return d.year})
    var waExtent = d3.extent(_data, function(d) {return d.wa})
    var normalRExtent = d3.extent(_data, function(d){return d.normal_r})
    var normalRallExtent = d3.extent(_data, function(d){return d.normal_rall})
    thetaRall.domain([d3.min([normalRExtent[0], normalRallExtent[0]]), d3.max([normalRExtent[1], normalRallExtent[1]])])
    thetaR.domain([thetaRall.domain()[1], thetaRall.domain()[0]]);
    yearYR.domain(thetaRall.domain()); //[2.761904761904762, 7.175]
    yearYRall.domain(thetaR.domain());

    calRanks(_data);
    calNestedData(_data);

    x.rangeRoundBands([0, width])
      .domain(d3.range(yearExtent[0], yearExtent[1]+1))
    y.rangeRoundBands([0, height])
      .domain(teamCoachData.map(function(d) {return d.key}))

    teamCoachData.forEach(function(d) {
      d.y = y(d.key);
    })
    var rExtent = d3.extent(_data, function(d){return d.r});
    var rallExtent = d3.extent(_data, function(d){return d.rall})
    var yearDescExtent = [d3.min([rExtent[0], rallExtent[0]]), d3.max([rExtent[1], rallExtent[1]])];
    yearData = d3.nest()
      .key(function(d) {return d.year})
      .sortKeys(d3.ascending)
      .rollup(function(leaves) {
        var teamR = leaves.map(function(d) {
          var rPerGame = d.r/d.game;
          d.r_per_game = rPerGame;
          return rPerGame
        });
        var teamRall = leaves.map(function(d) {
          var rallPerGame = d.rall/d.game;
          d.rall_per_game = rallPerGame;
          return rallPerGame
        })
        return {
          teams:leaves,
          min:{r:d3.min(teamR), rall:d3.min(teamRall)},
          max:{r:d3.max(teamR), rall:d3.max(teamRall)},
          median : {r:d3.median(teamR), rall:d3.median(teamRall)},
          mean: {r:d3.mean(teamR), rall:d3.mean(teamRall)},
          sd:{r:d3.deviation(teamR), rall:d3.deviation(teamRall)}
        };
      })
      .entries(_data);
      var rAvgExtent = [d3.min(yearData, function(d){return d3.min([d.values.min.r, d.values.min.rall])}),
      d3.max(yearData, function(d){return d3.max([d.values.max.r, d.values.max.rall])})];

  }

  function svgTeamStatInit(svg) {
    curYearExtent = turnRangeToExtent(yearStatBrush.extent());
    var avgData = getAverageData(teamCoachData, curYearExtent);

    var row = svg.append('g')
        .attr('class', 'jg-row jg-avg')
        .attr('transform', d3.svg.transform()
          .translate([(margin.left + attrs.canvasWidth - (avgData.length*x.rangeBand()*1.25))/2 ,margin.top/2])); //0
    row.call(drawAvgCol, avgData);

    return svg;
  }

  function drawAvgCol(selection, avgData) {
    var col = selection.selectAll('.jg-col')
        .data(avgData)

    col.enter().append('g')
      .attr('class', 'jg-col')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [x.rangeBand()*1.25*i, margin.top];
      }))
    col.selectAll('text')
        .data(function(d) { return d})
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('x', x.rangeBand()/2)
      .text(function(d){return teamMap.get(d.key)})

    var arc = d3.kblHistoryArc()
      .isAvg(true)
      .width(x.rangeBand())
      .height(y.rangeBand())
      .thetaR(thetaR)
      .thetaRall(thetaRall)

    col.call(arc);
  }

  function svgYearStatInit(svg) {
    var gLine = svg.append('g')
        .attr('class', 'jg-year-stat-line-g')
        .attr('transform', d3.svg.transform().translate([margin.left,  margin.top/2])); //0

    var gPoint = svg.append('g')
    .attr('class', 'jg-year-stat-point-g')
    .attr('transform', d3.svg.transform().translate([margin.left,  margin.top/2])); //0


    var col = gPoint.selectAll('g.jg-year-stat-col')
        .data(function(d) { return d})
      .enter().append('g')
      .attr('class', 'jg-year-stat-col')
      .attr('transform', d3.svg.transform().translate(function(d) {
        return [x(d.key), 0]
      }));


    col.call(drawYearStatcol)

    gPoint.call(drawBrushYearStat)
    curYearExtent = turnRangeToExtent(yearStatBrush.extent());
    return svg;
  }

  function svgStackInit(svg) {
    var xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickFormat(function(d) {
          return d3.format('02d')(d%100) + "'"
        })
      .orient("top")

    svg.append("g")
    .attr("class", "jg-x jg-axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);
  }

  function drawYearStatcol(selection) {
    var radius = 2;
    var pointFunc = function(className, propertyName, xRatio) {
      return selection.selectAll('.jg-year-stat-point.'+className)
            .data(function(d){
              return d.values.teams.map(function(d){return {team:d.final_team_code, val:d[propertyName]}})})
          .enter().append('circle')
          .attr('class', 'jg-year-stat-point '+className)
          .attr('cx', x.rangeBand()*xRatio)
          .attr('cy', function(d){return (propertyName === 'normal_r')? yearYR(d.val) : yearYRall(d.val)})
          .attr('r', radius);
    }
    var rPoint = pointFunc('jg-r', 'normal_r', .35)
    var rallPoint = pointFunc('jg-rall', 'normal_rall', .65)

    return selection;
  }

  function drawLineYearly(selection, selectedTeam) {
    var flatData = [];
    selectedTeam.values.forEach(function(d) {
      flatData = flatData.concat(d.values);
    })
    flatData = d3.merge(flatData);
    flatData.sort(function(a,b){return a.year-b.year})

    var lineFunc = function(data, className, propertyName, xRatio)  {
      var line = d3.svg.line()
        .x(function(d) {return x(d.x)+x.rangeBand()*xRatio})
        .y(function(d) {return (propertyName === 'normal_r')? yearYR(d.y) : yearYRall(d.y)})

      var chart = selection.select('.jg-year-stat-line-g')
        .selectAll('.jg-svg-stack-line.'+className)
          .data([data.map(function(d){return {x:d.year, y:d[propertyName]}})], function(){return selectedTeam.key})

      chart.enter().append('path')
        .attr('class', 'jg-svg-stack-line '+className)

      chart.attr('d', line)
        .style('fill', 'none')

      chart.exit().remove();
      return chart;
    }
    lineFunc(flatData, 'jg-r', 'normal_r', .35)
    lineFunc(flatData, 'jg-rall', 'normal_rall', .65)

    selection.selectAll('.jg-year-stat-point')
      .classed({'jg-hidden':false})
      .filter(function(d) { return d.team !== selectedTeam.key})
      .classed({'jg-hidden':true})

    return selection
  }

  function drawBrushYearStat(selection) {
    yearStatBrush =  d3.svg.brush()
      .x(x)
      .extent(x.domain().map(function(d){return x(d)}))
      .on('brush', brushed)

    function brushed() {
      var extent0 = yearStatBrush.extent(),
          extent1;
      var roundedPos = function(pos) { // 718 -> 733
        var minDist = Number.POSITIVE_INFINITY, minIndex = -1;
        var range = x.range()
        range.push(range[range.length-1]+x.rangeBand())
        range.forEach(function(d,i){
          var dist = Math.abs(d-pos) ;
          if (dist< minDist) {
            minDist = dist;
            minIndex = i;
          }
        })
        return x.range()[minIndex];
      }
      // if dragging, preserve the width of the extent
      if (d3.event.mode === "move") {
        var d0 = roundedPos(extent0[0]),
            d1 = d0+Math.ceil((extent0[1] - extent0[0])/x.rangeBand()) * x.rangeBand();
        extent1 = [d0, d1];
      }
      // otherwise, if resizing, round both dates
      else {
        extent1 = extent0.map(roundedPos);
        // if empty when rounded, use floor & ceil instead
        if (extent1[0] >= extent1[1]) {
          extent1[1] += x.rangeBand()//d3.time.day.ceil(extent0[1]);
        }
      }

      var domain = turnRangeToExtent(extent1);
      if (curYearExtent[0] !== domain[0] || curYearExtent[1] !== domain[1]) {
        curYearExtent = domain
        var avgData = getAverageData(teamCoachData, curYearExtent);
        svgTeamStat.call(drawAvgCol, avgData);
      }
      d3.select(this).call(yearStatBrush.extent(extent1));
    }
    selection.append("g")
      .attr("class", "jg-year-stat-brush")
      .call(yearStatBrush)
    .selectAll("rect")
      .attr("height", attrs.yearStatHeight);
    return selection;
  }

  function turnRangeToExtent(extent) {
    var domain = extent.map(function(d){
      return x.domain().filter(function(dd) { return d==x(dd) })
    });
    domain = d3.merge(domain);
    if (domain.length < 2) domain.push(2015);

    return domain;
  }

  function getAverageData(targetData, yearExtent) {
    return targetData.map(function(d) {
      var totalR = totalRall = 0;
      d.values.forEach(function(dd) { //team
        dd.values.forEach(function(ddd) { //coach
          ddd.forEach(function(dddd) {
            if (typeof dddd === 'object' && dddd.hasOwnProperty('normal_r')
              && dddd.year >=yearExtent[0] && dddd.year < yearExtent[1]) {
              totalR += dddd.normal_r;
              totalRall += dddd.normal_rall;
            }
          })
        })
      })

      var avgR = totalR/(yearExtent[1] - yearExtent[0] );
      var avgRall = totalRall/(yearExtent[1] - yearExtent[0]);
      return [{'key':d.key, 'normal_r':avgR, 'normal_rall':avgRall }]
    })
  }


  function tableInit(svg) {
    var xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(0)
      .tickFormat(function(d) {
          return d3.format('02d')(d%100) + "'"
        })
      .orient("top")

    svg.append("g")
    .attr("class", "jg-x jg-axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);

    var table = svg.append('g')
    .attr('class', 'jg-table')
    .attr('transform', d3.svg.transform().translate(function() {return [0,margin.top]})) //margin.left

    var row = d3.kblHistoryRow()
      .width(x.rangeBand())
      .height(y.rangeBand())
      .x(x)
      .thetaR(thetaR)
      .thetaRall(thetaRall)
      .svg(svg)
      .teamMap(teamMap)
      .margin(margin)
      .isHidden(!d3.select('#jg-playoff').property('checked'))
    table.call(row)
    row.on('rowOver', function(d) {
      svgYearStat.call(drawLineYearly,d)
      //console.log(d);
    })
    row.on('colOver', function(col) {
      col.call(mouseOverColFunc);
    })
    row.on('colClick', function(col) {
      col.call(clickColFunc);
    })
  }



  function calNestedData(_data) {
    teamCoachData = nestFunc('final_team_code', 'first_coach_name')
      .entries(_data);
    coachTeamData = nestFunc('first_coach_name', 'final_team_code')
      .entries(_data);
  }

  function calRanks(_data) {
    var nestedR = d3.nest() // r_rank
      .key(function(d){return d.year})
      .sortValues(function(a,b) {return b.r - a.r})
      //.rollup(function(leaves){return leaves.map(function(d,i) {d.r_rank = i+1; return d;})})
      .entries(_data);
    nestedR.forEach(function(y) {
      y.values.forEach(function(d,i) {
        d.r_rank = i+1;
      })
    })

    var nestedRall = d3.nest() // r_rank
      .key(function(d){return d.year})
      .sortValues(function(a,b) {return a.rall - b.rall})
      //.rollup(function(leaves){return leaves.map(function(d,i) {d.rall_rank = i+1; return d;})})
      .entries(_data);

    nestedRall.forEach(function(y) {
      y.values.forEach(function(d,i) {
        d.rall_rank = i+1;
      })
    })
  }

  function selectCol(coachName, isOver) {
    isOver = isOver || false;
    var col = svg.select('.jg-table').selectAll('.jg-col');
    col.classed({'jg-mouseover':false, 'jg-hidden':false})
    var overed = col.filter(function(d) {return  d[0].first_coach_name === coachName})
      .classed({'jg-mouseover':isOver, 'jg-clicked':!isOver})
    col.filter(function() {
      return !(d3.select(this).classed('jg-mouseover')) && !(d3.select(this).classed('jg-clicked'))
    }).classed({'jg-hidden':true})
    var thisData = coachTeamData.filter(function(dd) {
      return dd.key == coachName;
    });
    var suppRow = d3.kblHistoryRow()
      .width(x.rangeBand())
      .height(y.rangeBand())
      .x(x)
      .isSupp(true)
      .thetaR(thetaR)
      .thetaRall(thetaRall)
      .svg(svgStack)
      .teamMap(teamMap)
      .margin(margin)
      .isHidden(!d3.select('#jg-playoff').property('checked'));
    thisData.forEach(function(d,i) {
      d.y = y.rangeBand()*(i+1)
    })
    svgStack.datum(thisData).call(suppRow);
  }

  function mouseOverColFunc(selection) {
    var d = selection.datum();
    var coachName = d[0].first_coach_name
    selectCol(coachName, true)
  }

  function clickColFunc(selection) {
    var duration = 400
    var d = selection.datum();
    if (selection.classed('jg-clicked')) {
      svg.selectAll('.jg-col').classed({'jg-mouseover':false})
      svg.selectAll('.jg-col').classed({'jg-clicked':false})
      //attrs.canvasHeight -= y.rangeBand();
      //svg.attr('height', attrs.canvasHeight);
    } else {
      var thisCoach =d[0].first_coach_name
      svg.selectAll('.jg-col').classed({'jg-clicked':false})
      var clicked = svg.selectAll('.jg-col.jg-mouseover')//.filter(function(d) {return d[0].first_coach_name === thisCoach})
        .classed({'jg-clicked':true})//, 'jg-mouseover':false})

      var suppRow = svgStack.selectAll('.jg-supp.jg-temp.jg-row')
      var exist = svgStack.selectAll('.jg-fixed.jg-row')
        .filter(function(d){return suppRow.datum().key == d.key})
      var existY = Number.POSITIVE_INFINITY;
      var existHeight = 0;
      var parentSvg = d3.select(svgStack.node().parentNode)

      if (exist.size()>0) {
        exist
        .classed({'jg-supp':false, 'jg-fixed':false, 'jg-removing':true, 'jg-fixed':false})
        .each(function(d) {
          existY = d.targetY;
          existHeight = d3.select(this).classed('jg-selected') ?
            (d3.select(this).classed('jg-mouseover')? y.rangeBand():y.rangeBand()*2.25) : 0;
          d.targetY = y.rangeBand();
        })
        .transition().duration(duration)
        .style('opacity', 0)
        .each('end', function(){
            d3.select(this).remove()
        })
        attrs.stackHeight = parseInt(parentSvg.attr('height')) - existHeight;
      } else {
        attrs.stackHeight = parseInt(parentSvg.attr('height')) + y.rangeBand();
      }

      parentSvg.transition()
        .duration(400)
        .attr('height', attrs.stackHeight);

      svgStack.selectAll('.jg-supp.jg-temp.jg-row')
        .classed({'jg-temp':false, 'jg-fixed':true})
        .selectAll('.jg-col').classed({'jg-mouseover':false})
      var fixed = svgStack.selectAll('.jg-supp.jg-fixed')
        .each(function(d) {
          var pos = d3.transform(d3.select(this).attr('transform')).translate
          if (!('targetY' in d)) d.targetY = pos[1];
          if(d.targetY <= existY) {
            d.targetY += y.rangeBand();
          } else {
            d.targetY = d.targetY - existHeight;
          }
          d3.select(this).transition().duration(duration)
            .attr('transform', d3.svg.transform().translate([pos[0], d.targetY]));
        })
    }
  }/// end of clickColFunc;


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

  exports.data = function(_data) {
    dataInit(_data);
    return {team:teamCoachData, coach:coachTeamData}
  }

  d3.rebind(exports, dispatch, 'on');
  return exports;
}
