d3.kblHistory = function module () {
  var attrs = {
    canvasWidth : 820,
    canvasHeight : 360,
    tableHeight : 360,
    yearStatHeight : 60,
    isTeamMode : true,
    blockColExtent : [],
  };//end of attributes
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
  var svg, svgYearStat, svgStack, svgTeamStat;
  var teamCoachData, coachTeamData, suppData=[];
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
        var menuDiv = d3.select(this).append('div')
          .attr('class', 'jg-menu')
          .call(menuInit)
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

        attrs.stackHeight = y.rangeBand()*3;
        svgStack = stackDiv.append('svg')
          .attr('class','jg-svg-stack')
          .attr('width', width + margin.left + margin.right)
          .attr('height', attrs.stackHeight)
          .append('g')
          .attr('class', 'jg-stack')
          .attr('transform', d3.svg.transform().translate([0, margin.top/2]));

      }
      svgYearStat.call(svgYearStatInit);
      svgTeamStat.call(svgTeamStatInit);
      svg.call(tableInit);
      svgStack.call(svgStackInit);
    }); //end of each
  } // end of exports

  function menuInit(selection) {
    var coaches = coachTeamData.map(function(d){return d.key})
    coaches.splice(0,0, '--특정 감독 살펴보기--')
    var dropdown = selection.append('select')
      .attr('class', 'jg-select')

    var options = dropdown.selectAll('option')
        .data(coaches)
      .enter().append('option')
      .property(function(d){ return {'value':d}})
      .text(function(d){return d})

    dropdown.on('change', function() {
      var selectedIndex = d3.select(this).property('selectedIndex');
      if (selectedIndex==0) {

      } else {
        var d = options[0][selectedIndex].__data__;
        console.log(d)
      }

    })

    /*
    <select>
      <option value="volvo">Volvo</option>
      <option value="saab">Saab</option>
      <option value="opel">Opel</option>
      <option value="audi">Audi</option>
    </select>
    */
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

    var g = svg.append('g')
        .attr('class', 'jg-team-stat-line-g')
        .attr('transform', d3.svg.transform()
          .translate([(margin.left + attrs.canvasWidth - (avgData.length*x.rangeBand()*1.25))/2 ,margin.top/2])); //0
    g.call(drawAvgRows, avgData);

    return svg;
  }

  function drawAvgRows(selection, avgData) {
    var row = selection.selectAll('.jg-row-avg')
        .data(avgData)

    row.enter().append('g')
      .attr('class', 'jg-row-avg')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [x.rangeBand()*1.25*i, margin.top];
      }))
    row.selectAll('text')
        .data(function(d) { return d})
      .enter().append('text')
      .attr('text-anchor', 'middle')
      .attr('x', x.rangeBand()/2)
      .text(function(d){return teamMap.get(d.key)})
    row.call(drawRankArc, true);
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
        svgTeamStat.call(drawAvgRows, avgData);
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
          //d3.format('d'))
        })
      .orient("top")

    svg.append("g")
    .attr("class", "jg-x jg-axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);

    var table = svg.append('g')
    .attr('class', 'jg-table')
    .attr('transform', d3.svg.transform().translate(function() {return [0,margin.top]})) //margin.left

    table.call(drawRows)
  }


  function drawRows(table) {

    var row = table.selectAll('g.jg-row')
      .data(function(d) {return d}, function(d) { return d.key}) // => team level
    .enter().append('g')
    .attr('class', 'jg-row')
    .attr('transform', d3.svg.transform().translate(function(d) {
      d.y = y(d.key);
      return [0, d.y]
    }))
    .on('mouseenter', function(d){
      svgYearStat.call(drawLineYearly, d)
    })

    //.on('mouseover')
    curYearExtent = turnRangeToExtent(yearStatBrush.extent());
    //row.call(drawAvg, curYearExtent);
    row.call(drawLabel);
    row.call(drawCols);
  }


  function drawLabel(row, isSupp) {
    var label = row.selectAll('.jg-label')
        .data(function(d) {return [d]})
      .enter().append('g')
      .attr('class','jg-label')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [0, 0]
      }))
      .on('mouseenter', function(d) {
        var thisRow = d3.select(d3.select(this).node().parentNode);
        if (!thisRow.classed('jg-selected')) {
          addBottomRow(thisRow, true);
        }
      })
      .on('mouseleave', function(d) {
        var thisRow = d3.select(d3.select(this).node().parentNode);
        if (thisRow.classed('jg-selected')&&thisRow.classed('jg-mouseover')) {
          addBottomRow(thisRow, true);
        }
      })
      .on('click', function() {
        var thisRow = d3.select(d3.select(this).node().parentNode);
        addBottomRow(thisRow);
      })
   if (!isSupp) {
     label.append('image')
        .attr('xlink:href', function(d) {
          return 'image/team/' + d.key + '.png'
        })
        .attr('width', '37')
        .attr('height', '29')
        //<image xlink:href="/files/2917/fxlogo.png" x="0" y="0" height="100" width="100" />
   }

   label.append('text')
      .attr('text-anchor', 'end')
      .attr('x', margin.left*.95)
      .attr('y', y.rangeBand()*.5)
      //.attr('y', function(d){return y.rangeBand()*.5  }) //+ margin.top
      .attr('dy', '.35em')
      .text(function(d) {return (!isSupp ? teamMap.get(d.key): d.key)})

  }

  function addBottomRow(thisRow,/*optional*/isOver) {
    isOver = isOver || false;
    var duration = 400;
    var appendHClicked = y.rangeBand()*2.25, appendHOvered = y.rangeBand() * 1;
    var appendH = isOver ? appendHOvered : appendHClicked;
    var isSupp = thisRow.classed('jg-supp')
    var thisSvg = isSupp ? svgStack : svg;
    //var thisRowPos = d3.transform(thisRow.attr('transform')).translate
    /*
    var getIndexOfRow = function(row) {
      var d = row.datum();
      var curIndex = 0;
      thisSvg.selectAll('.jg-row').each(function(dd,ii) {
        if (dd.key == d.key) curIndex  = ii;
      })
      return curIndex;
    }*/
    var moveUpDownFunc = function(selection, h) {
      selection.each(function(d){

        var pos = d3.transform(d3.select(this).attr('transform')).translate;
        if (!('targetY' in d)) d.targetY = pos[1];
        d.targetY += h;
        d3.select(this).transition().duration(duration)
          .attr('transform', d3.svg.transform().translate([pos[0], d.targetY]));
      })
    }
    var removeRowFunc = function(selection) {
      selection.each(function(d) {
        var thisRow = d3.select(this)
        var thisRowPos = d3.transform(d3.select(this).attr('transform')).translate;
        var wasOver = thisRow.classed('jg-mouseover');
        var appendHSelected = wasOver ? appendHOvered : appendHClicked;
        var underThisRows = thisSvg.selectAll('.jg-row').filter(function(r,i) {
          var pos = d3.transform(d3.select(this).attr('transform')).translate
          return pos[1] > thisRowPos[1]
        })
        // 사이에 있던 것들은 위로!
        underThisRows.call(moveUpDownFunc, -appendHSelected);
        if(isSupp) attrs.stackHeight -= appendHSelected
        else attrs.tableHeight -= appendHSelected
        thisRow.selectAll('.jg-bottom-row').transition()
          .duration(duration)
          .style('opacity', 0)
          .each('end', function(){
            d3.select(this).remove();
          })
        thisRow.classed({'jg-selected':false, 'jg-mouseover':false});
      })
    }

    var appendRowFunc = function(selection, wasOver) {
      selection.each(function(d) {
        var thisRow = d3.select(this)
        var thisRowPos = d3.transform(d3.select(this).attr('transform')).translate;
        var underThisRows = thisSvg.selectAll('.jg-row').filter(function(r,i) {
          var pos = d3.transform(d3.select(this).attr('transform')).translate
          return pos[1] > thisRowPos[1]
        })
        var appendHSelected = wasOver ? appendHOvered : 0;
        var finalAppendH = appendH-appendHSelected
        underThisRows.call(moveUpDownFunc, finalAppendH);
        if(isSupp) attrs.stackHeight += finalAppendH
        else attrs.tableHeight += finalAppendH
        thisRow.selectAll('.jg-bottom-row').transition()
          .duration(duration)
          .style('opacity', 0)
          .each('end', function(){
            d3.select(this).remove();
          })
        thisRow.classed({'jg-selected':true, 'jg-mouseover':isOver})
          .call(drawBottomRow, isSupp, isOver);
      })
    }
    var turnOnOffEmblem = function(selection) {
      selection.each(function(d) {
        var thisRow = d3.select(this)
        if (thisRow.classed('jg-selected')) {
          thisRow.selectAll('.jg-label > image')
            .attr('xlink:href', function(d) {
              return 'image/team/' + d.key + '_c.png'
            })
        } else {
          thisRow.selectAll('.jg-label > image')
            .attr('xlink:href', function(d) {
              return 'image/team/' + d.key + '.png'
            })
        }
      })
    }

    //var curIndex = getIndexOfRow(thisRow);
    var selectedRow = thisSvg.selectAll('.jg-row.jg-selected');
    if (selectedRow.size() > 0) { // 이미 존재 할 때
      //var selectedIndex = getIndexOfRow(selectedRow);
      // 중복 인 것
      var dupRows = selectedRow.filter(function(d) {
        return d.key === thisRow.datum().key;
      })
      // 중복 아닌 것
      var undupRows = selectedRow.filter(function(d) {
        return d.key !== thisRow.datum().key;
      })
      if (dupRows.size() <= 0 ) {
        thisRow.call(appendRowFunc)
          .call(turnOnOffEmblem);
      }

      if (isOver) {
        // 마우스 오버 였으면 클릭으로 바꾸기
        dupRows.filter(function() {
          return d3.select(this).classed('jg-mouseover')
        }).call(removeRowFunc)
        .call(turnOnOffEmblem)
      } else {
        // 클릭 된 거면 없애기
        dupRows.filter(function(){
          return !d3.select(this).classed('jg-mouseover')
        }).call(removeRowFunc)
        .call(turnOnOffEmblem)
        // 마우스 오버 였으면 클릭으로 바꾸기
        dupRows.filter(function() {
          return d3.select(this).classed('jg-mouseover')
        }).call(appendRowFunc, true)
        .call(turnOnOffEmblem)
        undupRows.filter(function() {
          return !d3.select(this).classed('jg-mouseover')
        }).call(removeRowFunc)
        .call(turnOnOffEmblem)
      }
      // 클릭 된 거면 그냥 놔두기
      // 클릭 안 된거면 마우스 오버는 없애기
      undupRows.filter(function() {
        return d3.select(this).classed('jg-mouseover')
      }).call(removeRowFunc)
      .call(turnOnOffEmblem)
    }  else { // 기존에 없을때
      // 새로 그리기
      thisRow.call(appendRowFunc)
      .call(turnOnOffEmblem);
    }

    d3.select(thisSvg.node().parentNode).transition()
      .duration(400).attr('height', (isSupp? attrs.stackHeight : attrs.tableHeight))
  }

  function drawBottomRow(selection, isSupp, isOver) {
    var d= selection.datum();
    var values = []
    var duration = 400;
    d.values.forEach(function(curData) {
      var key = curData.key
      curData.values.forEach(function(coachValues) {
        var normal_r = d3.mean(coachValues, function(d){return d.normal_r})
        var normal_rall = d3.mean(coachValues, function(d){return d.normal_rall})
        values.push({key:key, from:coachValues[0].year, to:coachValues[coachValues.length-1].year, normal_r:normal_r, normal_rall:normal_rall})
      })
    })
    var bottomRow = selection.append('g')
      .attr('class', 'jg-bottom-row')
      .attr('transform', d3.svg.transform().translate([margin.left, y.rangeBand()]))

    bottomRow
      .style('opacity', 0)
      .transition().duration(duration)
      .style('opacity', 1)

    var bottomCol = bottomRow.selectAll('.jg-bottom-col')
        .data(values)
      .enter().append('g')
      .attr('transform', d3.svg.transform()
        .translate(
          function(d,i){return [x(d.from), y.rangeBand()*.025]}
        ))
    bottomCol.selectAll('.jg-line')
        .data(function(d){return isOver? [d]:[d,d]})
      .enter().append('line')
      .attr('class', 'jg-line')
      .attr('x1', function(d){return x.rangeBand()*.1})
      .attr('y1', function(d,i){return i*(y.rangeBand()*2)})
      .attr('x2', function(d){return (d.to-d.from)*x.rangeBand()+x.rangeBand()*.9})
      .attr('y2', function(d,i){return i*(y.rangeBand()*2)})
    if (!isOver) {
      var clock = bottomCol.append('g')
        .attr('class', 'jg-rank-clock')
        .attr('transform', d3.svg.transform().translate(function(d){
          return [(x(d.to)-x(d.from))*.5, y.rangeBand()*.85]
        }))
      clock.call(drawBackArc)
        .call(drawArc)
        .call(drawHand, 'normal_r', 'r')
        .call(drawHand, 'normal_rall', 'rall');
    }

    bottomCol.append('text')
      .attr('class', 'jg-coach-name')
      .attr('text-anchor', 'middle')
      .attr('x', function(d){
        d.x = (d.to-d.from+1)*x.rangeBand()*.5
        return d.x
      })
      .attr('y', function(d){return y.rangeBand()*.45})//(isOver? y.rangeBand()*.6:y.rangeBand()*1.6)})
      .selectAll('tspan')
        .data(function(d){
          if(d.to-d.from==0 && (isSupp ? teamMap.get(d.key) : d.key).length >= 3) {
            return [{x:d.x, key:d.key[0]+'—'}, {x:d.x, key:d.key.substring(1)}]
          } else {
            return [{x:d.x, key:d.key}]
          }
        })
      .enter().append('tspan')
      .attr('x', function(d){return d.x})//.attr('dx', function(d,i){return '-22px'})
      .attr('dy', function(d,i){return i+'em'})
      .text(function(d){return isSupp ? teamMap.get(d.key) : d.key})
    return selection;
  }

  function drawCols(row, isSupp) {
    isSupp = isSupp || false;
    var col = row.selectAll('g.jg-col')
      .data(function (d) {
        //if(isSupp) return d.values
        return d.values.reduce(function(pre, cur){ return pre.concat(cur.values)}, [])
      })
    .enter().append('g')
    .sort(function(a,b) {
      return a[0].year - b[0].year
    })
    .attr('class', 'jg-col')
    .attr('transform', d3.svg.transform().translate(function(d) {
      var dx = x(d[0].year) + margin.left;
      //d.x = x(d[0].year) + margin.left;
      return [dx, 0]
    }))

    if(!isSupp) {
      col.on('mouseenter', function(d,i) {
          d3.select(this).call(mouseOverColFunc);
          var thisRow = d3.select(d3.select(this).node().parentNode);
          if (!thisRow.classed('jg-selected')) {
            addBottomRow(thisRow, true);
          }
        })
        .on('mouseleave', function() {
          col.classed({'jg-hidden':false, 'jg-mouseover':false})
        })
        .on('click', function(d,i) {
          var thisRow = d3.select(d3.select(this).node().parentNode);
          if (thisRow.classed('jg-selected')&&thisRow.classed('jg-mouseover')) {
            addBottomRow(thisRow);
          }
          d3.select(this).call(clickColFunc);
        })
    }

    col.append('rect')
    .attr('class', 'jg-col-block')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', function(d) {
      var dwidth = d.length * x.rangeBand();
      //d.width = d.length * x.rangeBand();
      return dwidth//x(d[d.length-1].year+1) - x(d[0].year);
    })
    .attr('height', y.rangeBand())


    col.call(drawRankArc)
    //col.call(drawRankLine);
  }


  function drawRankLine(col) {
    var max_rank = 9;
    var lineX = d3.scale.ordinal()
      .domain(d3.range(1,max_rank+1))
      .rangePoints([0,x.rangeBand()])
    var lineY = d3.scale.ordinal()
      .domain(d3.range(1,max_rank+1))
      .rangePoints([0,y.rangeBand()])

    var line = col.selectAll('.jg-rank-line')
        .data(function(d){return d;})

      line.enter().append('g')
      .attr('class', 'jg-rank-line')
      .attr('transform', d3.svg.transform().translate(function(d,i) {return [i*x.rangeBand(), 0]}))

    var drawLine = function(selection, key, className) {
      line.append('line')
        .attr('class', 'jg-rank-'+className)
        .attr('x1', function(d){return lineX(d[key])})
        .attr('x2', function(d){return lineX(d[key])})
        .attr('y1', 0)
        .attr('y2', y.rangeBand())
      line.append('line')
        .attr('class', 'jg-rank-'+className)
        .attr('y1', function(d){return lineY(d[key])})
        .attr('y2', function(d){return lineY(d[key])})
        .attr('x1', 0)
        .attr('x2', x.rangeBand())
    }

    line.call(drawLine, 'rall_rank', 'rall')
    line.call(drawLine, 'r_rank', 'r')
    line.call(drawLine, 'rank', 'wa')
  }

  function drawHand (selection, key, className) {
    var radius = x.rangeBand()*.45;
    var hand = selection.selectAll('.jg-rank-hand.jg-'+className)
        .data(function(d){return [d]})

    hand.enter().append('line')
      .attr('class','jg-rank-hand jg-'+className)

    hand.attr('x1', function() {
        return 0
      }).attr('y1', 0)
      .attr('x2', radius).attr('y2', 0)
      .attr('transform', d3.svg.transform().translate(function(){
            return [x.rangeBand()*.5, y.rangeBand()*.5]
          }))

      hand.transition().duration(600).attr('transform', d3.svg.transform().translate(function(){
            return [x.rangeBand()*.5, y.rangeBand()*.5]
          }).rotate(function(d) {
        return (key=='normal_r' ? thetaR(d[key]) :thetaRall(d[key]) ) * (180/Math.PI) -90;
      }))

    return selection;
  }
  function drawBackArc(selection) {
    var radius = x.rangeBand()*.45;

    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(thetaR.range()[0])
      .endAngle(thetaR.range()[1]);
    selection.append('path')
      .attr('class', 'jg-rank-arc jg-back')
      .attr('transform', d3.svg.transform().translate(function(){
          return [x.rangeBand()*.5, y.rangeBand()*.5]
        }))
      .attr('d', arc)
      //.style('fill', col.select('rect').style('fill'));
    return selection
  }

  function drawArc(selection) {
    var radius = x.rangeBand()*.45;

    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)//x.rangeBand()*.5)
      .startAngle(function(d){
        var r = thetaR(d.normal_r), rall= thetaRall(d.normal_rall)
        if (r <= rall) {
          return r
        } else {
          return rall
        }
      })
      .endAngle(function(d) {
        var r = thetaR(d.normal_r), rall= thetaRall(d.normal_rall)
        if (r <= rall) {
          return rall
        } else {
          return r
        }
      })

    var rankArc = selection.selectAll('.jg-rank-arc.jg-rank')
      .data(function(d){return [d]})

    rankArc.enter().append('path')
      .attr('transform', d3.svg.transform().translate(function(){
          return [x.rangeBand()*.5, y.rangeBand()*.5]
        }))

    rankArc.attr('class', function(d) {
      var r = thetaR(d.normal_r), rall= thetaRall(d.normal_rall)
      if (r <= rall) {
        return 'jg-rank-arc jg-rank jg-r'
      } else {
        return 'jg-rank-arc jg-rank jg-rall'
      }
    }).transition().duration(600).attr('d', arc)

    return selection

  }

  function drawRankArc(col, isAvg) {
    isAvg = isAvg || false;

    var max_rank = 9;
    var rankCol = d3.scale.linear()
      .domain([1,max_rank])
      .range(['#22cb00', '#fbfefa'])
      .interpolate(d3.interpolateRgb)

    var radius = x.rangeBand()*.45;/*d3.scale.ordinal()
      .domain(d3.range(1,max_rank+1))
      .rangePoints([x.rangeBand()*.45, x.rangeBand()*.45])*/

    if (!isAvg) {
      var rank = col.selectAll('.jg-rank-text')
          .data(function(d){return d;})
        .enter().append('g')
        .attr('class', 'jg-rank-text')
        .attr('transform', d3.svg.transform().translate(function(d,i){
          return [i*x.rangeBand(), 0]
        }))
      rank.append('text')
        .attr('dx', '.175em')
        .attr('dy', '.9em')
        .text(function(d) {return d.rank})
    }

    var clock = col.selectAll('.jg-rank-clock')
        .data(function(d){return d;})

    clock.enter().append('g')
      .attr('class', 'jg-rank-clock')
      .attr('transform', d3.svg.transform().translate(function(d,i) {return [i*x.rangeBand(), 0]}))
      .call(drawBackArc);

    clock.each(function(d,i) {
      var thisSelection = d3.select(this);
      if (d.normal_rall == d.normal_r ){
        if (d.normal_r !== 0) {
          thisSelection.call(drawHand, 'normal_r', 'dup')
        }
        thisSelection.selectAll('.jg-rank-arc.jg-rank').remove();
        thisSelection.selectAll('.jg-rank-hand.jg-r').remove();
        thisSelection.selectAll('.jg-rank-hand.jg-rall').remove();
      } else {
        thisSelection.call(drawArc)
        thisSelection.selectAll('.jg-rank-hand.jg-dup').remove(); //FIXME: 두개로 나눠지도로 수정.
        if (d.normal_r >= d.normal_rall) {
          thisSelection.call(drawHand, 'normal_rall', 'rall')
          thisSelection.call(drawHand, 'normal_r', 'r')
        } else {
          thisSelection.call(drawHand, 'normal_r', 'r')
          thisSelection.call(drawHand, 'normal_rall', 'rall')
        }

      }
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

  function mouseOverColFunc(selection) {
    var getTargetNameFromCol = function(d) {
      return  d[0].first_coach_name
    }
    var d = selection.datum();
    var targetName = getTargetNameFromCol(d);
    var col = svg.select('.jg-table').selectAll('.jg-col');
    col.classed({'jg-mouseover':false, 'jg-hidden':false})
    var overed = col.filter(function(d) {return getTargetNameFromCol(d) === targetName})
      .classed({'jg-mouseover':true})
    col.filter(function() {
      return !(d3.select(this).classed('jg-mouseover'))
    }).classed({'jg-hidden':true})

    var thisData = coachTeamData.filter(function(dd) {
      return dd.key == targetName;
    });
    //TODO :  mouseover 표시하기!
    var suppRow = svgStack.selectAll('.jg-supp.jg-temp.jg-row')
        .data(thisData, function(d){ return d.key})
    suppRow.enter().append('g')
      .classed({'jg-supp':true, 'jg-temp':true,'jg-row':true})
      .attr('transform', d3.svg.transform().translate(function(d) { return [0, y.rangeBand()] }))

    suppRow.exit().remove();

    suppRow.call(drawCols, true)
    suppRow.call(drawLabel, true)
    setTimeout(function(){
      suppRow.selectAll('.jg-col').classed({'jg-mouseover':true})
    }, 100)
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

      if (exist.size()>0) {
        exist.classed({'jg-supp':false, 'jg-fixed':false, 'jg-removing':true, 'jg-fixed':false})
        .transition().duration(duration)
        .style('opacity', 0)
        .each('end', function(){
            d3.select(this).remove()
        })
      }
      else {
        var parentSvg = d3.select(svgStack.node().parentNode)
        attrs.stackHeight += y.rangeBand();
        parentSvg.attr('height', attrs.stackHeight);
      }

      svgStack.selectAll('.jg-supp.jg-temp.jg-row')
        .classed({'jg-temp':false, 'jg-fixed':true})
        .selectAll('.jg-col').classed({'jg-mouseover':false})
      var size = svgStack.selectAll('.jg-fixed').size();
      svgStack.selectAll('.jg-supp.jg-fixed')
        .transition().duration(duration)
        .attr("transform", d3.svg.transform().translate(function(d,i) {
          var dy =  (y.rangeBand())+ ((size-i)*y.rangeBand());
          return [0,dy]
        }))
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

  return exports;
}
