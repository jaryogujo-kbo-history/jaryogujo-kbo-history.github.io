/*
TODO: 플레이오프 & 우승 표시
[x] TODO: 순위 -> parameter 사용
TODO: 팀별 평균 계산 <- 시간 변화에 따라 변동
TODO: 시즌용 라인 그래프 -> 팀별 득실점 평균 -> 편차 그리기기
TODO: 팀별  & 감독별 요약 정보 => 연속 감독 || 팀별 요약 챠트

*/


d3.kblHistory = function module () {
  var attrs = {
    canvasWidth : 820,
    canvasHeight : 360,
    tableHeight : 360,
    yearStatHeight : 60,
    isTeamMode : true,
    blockColExtent : [],
  };//end of attributes
  var modes =  ['team', 'coach'];
  var margin = {top:20, right : 10, bottom : 10, left : 70}
  var x = d3.scale.ordinal(), //FIXME: time.scale()로 교체?
    y=d3.scale.ordinal(), yearY=d3.scale.linear().rangeRound([0,attrs.yearStatHeight-margin.top]);
  var xAxis = d3.svg.axis()
    .tickSize(0)
    .tickFormat(function(d) {
        return d3.format('02d')(d%100) + "'"
        //d3.format('d'))
      })
    .orient("top")
  var wa = d3.scale.linear();
  var teamMap = d3.map({'OB':'OB','SS':'삼성','MB':'MBC',
    'HT':'해태','LT':'롯데','SM':'삼미','LG':'LG','DS':'두산','KA':'KIA',
    'BG':'빙그레','HH':'한화','SK':'SK','NS':'넥센','NC':'NC','SB':'쌍방울',
    'CB':'청보','TP':'태평양','HD':'현대'})
  var svg, svgYearStat;
  var curData, nestedByTeam, nestedByCoach, curMode = modes[0], suppData=[];
  var width, height;
  var color = d3.scale.category10();
  var thetaR = d3.scale.linear().range([0, Math.PI*(3/2)]),
    thetaRall = d3.scale.linear().range([0, Math.PI*(3/2)]);

  var yearStatBrush, curYearExtent, yearData;

  var exports = function (_selection) {
    _selection.each(function(_data) {
      d3.select(this).style('width', attrs.canvasWidth+'px')//.style('height', attrs.canvasHeight+'px')
      width = attrs.canvasWidth - margin.left - margin.right;
      height =  attrs.canvasHeight - margin.top - margin.bottom;
      dataInit(_data);
      if (!svg) {
        var yearStatDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-year-stat')
        svgYearStat = yearStatDiv.selectAll('jg-svg-year-stat')
          .data([yearData])
          .enter().append('svg')
          .attr('class','jg-svg')
          .attr('width', width + margin.left + margin.right)
          .attr('height', attrs.yearStatHeight)

        var tableDiv = d3.select(this).append('div')
          .attr('class', 'jg-div-table')
        svg = tableDiv.selectAll('svg.jg-svg')
          .data([curData])
        .enter().append('svg')
        .attr('class','jg-svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', attrs.canvasHeight)
      }
      svgYearStat.call(yearStatInit)
      svg.call(tableInit)
    }); //end of each
  } // end of exports

  function dataInit(_data) {
    var yearExtent = d3.extent(_data, function(d) {return d.year})
    var waExtent = d3.extent(_data, function(d) {return d.wa})
    var normalRExtent = d3.extent(_data, function(d){return d.normal_r})
    var normalRallExtent = d3.extent(_data, function(d){return d.normal_rall})
    thetaRall.domain([d3.min([normalRExtent[0], normalRallExtent[0]]), d3.max([normalRExtent[1], normalRallExtent[1]])])
    thetaR.domain([thetaRall.domain()[1], thetaRall.domain()[0]])

    calRanks(_data);
    calNestedData(_data);
    curData = (curMode===modes[0] ? nestedByTeam : nestedByCoach);
    x.rangeRoundBands([0, width])
      .domain(d3.range(yearExtent[0], yearExtent[1]+1))
    y.rangeRoundBands([0, height])
      .domain(curData.map(function(d) {return d.key}))
    xAxis.scale(x)
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
      yearY.domain([2.75, 7.25]); //[2.761904761904762, 7.175]
  }

  function yearStatInit(svg) {
    var g = svg.append('g')
      .attr('class', 'jg-year-stat')
      .attr('transform', d3.svg.transform().translate([margin.left, margin.top/2]));

    var col = g.selectAll('g.jg-year-stat-col')
        .data(function(d) { return d})
      .enter().append('g')
      .attr('class', 'jg-year-stat-col')
      .attr('transform', d3.svg.transform().translate(function(d) {
        return [x(d.key), 0]
      }));

    col.call(drawYearStatcol)
    g.call(drawBrushYearStat)
    return svg;
  }

  function drawYearStatcol(selection) {
    //var line //http://bl.ocks.org/mbostock/3894205
    //TODO: 유사 득점과 실점의 순위를 연결하는 scatter-plot을 그린다.
    // 득점 순위
    var radius = 2;
    var pointFunc = function(className, propertyName, xRatio) {
      return selection.selectAll('.'+className)
            .data(function(d){return d.values.teams.map(function(d){return {team:d.final_team_code, val:d[propertyName]}})})
          .enter().append('circle')
          .attr('class', className)
          .attr('cx', x.rangeBand()*xRatio)
          .attr('cy', function(d){return yearY(d.val)})
          .attr('r', radius);
    }
    var rPoint = pointFunc('jg-year-stat-r-point', 'r_per_game', .35)
    var rallPoint = pointFunc('jg-year-stat-rall-point', 'rall_per_game', .65)
    return selection;
  }

  function drawBrushYearStat(selection) {
    yearStatBrush =  d3.svg.brush()
      .x(x)
      .extent(x.domain().map(function(d){return x(d)}))
      .on('brush', brushed)

    function brushed() {
      var extent0 = yearStatBrush.extent(),
          extent1;
      var roundedPos = function(pos) {
        var minDist = Number.POSITIVE_INFINITY, minIndex = -1;
        x.range().forEach(function(d,i){
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
        var avgData = getAverageData(curData, curYearExtent);
        console.log(avgData);
        svg.call(drawAvgRows, avgData);
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

  function tableInit(svg) {
    svg.append("g")
    .attr("class", "x axis")
    .attr("transform", d3.svg.transform().translate([margin.left, margin.top]))
    .call(xAxis);

    var table = svg.append('g')
    .attr('class', 'jg-table')
    .attr('transform', d3.svg.transform().translate(function() {return [0,margin.top]})) //margin.left

    table.call(drawRows)
    curYearExtent = turnRangeToExtent(yearStatBrush.extent());
    var avgData = getAverageData(curData, curYearExtent);
    svg.call(drawAvgRows, avgData);
  }

  function drawAvgRows(selection, avgData) {
    var row = selection.selectAll('.jg-row-avg')
        .data(avgData)

    row.enter().append('g')
      .attr('class', 'jg-row-avg')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [margin.left*.15, i*y.rangeBand()+margin.top];
      }))
    row.call(drawRankArc, true);
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

    row.call(drawLabel);
    row.call(drawCols);
  }

  function drawLabel(row, isSupp) {

    row.selectAll('.jg-label')
        .data(function(d) {return [d]})
      .enter().append('text')
      .attr('class','jg-label')
      .attr('text-anchor', 'end')
      .attr('x', margin.left*.95)
      .attr('y', function(d){return y.rangeBand()*.5  }) //+ margin.top
      .attr('dy', '.35em')
      .text(function(d) {return (!isSupp ? teamMap.get(d.key): d.key)})
      .on('mouseenter', function(d) {
        svg.select('.jg-table').selectAll('.jg-col.jg-mouseover').classed({'jg-mouseover':false})
        svg.selectAll('.jg-link').remove();
        var targets = d.values.map(function(dd) {
          return dd.key
        })
        var linkDataArr = []
        targets.forEach(function(targetName,i) {
          var overed = svg.select('.jg-table').selectAll('.jg-col').filter(function(d) {return getTargetNameFromCol(d) === targetName})
          var linkData = [];
          overed.call(getLinkData, targetName, linkData);
          linkDataArr.push({key:targetName, values:linkData})
        })

        //drawDiagonals(linkDataArr);
      })
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
      var dx = x(d[0].year) + margin.left;
      //d.x = x(d[0].year) + margin.left;
      return [dx, 0]
    }))

    if(!isSupp) {
      col.on('mouseover', mouseOverColFunc)
        .on('mouseout', function() {
          col.classed({'jg-hidden':false, 'jg-mouseover':false})
        })
        .on('click', clickColFunc)
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


    col.call(drawRankArc);
    //col.call(drawRankLine);
  }

  function drawBars(col) {

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

  function drawRankArc(col, isAvg) {
    isAvg = isAvg || false;
    var max_rank = 9;
    var rankCol = d3.scale.linear()
      .domain([1,max_rank])
      .range(['#22cb00', '#fbfefa'])
      .interpolate(d3.interpolateRgb)

    var radius = x.rangeBand()*.45/*d3.scale.ordinal()
      .domain(d3.range(1,max_rank+1))
      .rangePoints([x.rangeBand()*.45, x.rangeBand()*.45])*/

    var drawHand = function(selection, key, className) {
      var hand = selection.selectAll('.jg-rank-hand.jg-rank-'+className)
          .data(function(d){return [d]})

      hand.enter().append('line')
        .attr('class','jg-rank-hand jg-rank-'+className)

      hand.attr('x1', function() {
          return 0
        }).attr('y1', 0)
        .attr('x2', radius).attr('y2', 0)
        .attr('transform', d3.svg.transform()
          .translate(function(){
              return [x.rangeBand()*.5, y.rangeBand()*.5]
            }).rotate(function(d) {
              return (key=='normal_r' ? thetaR(d[key]) :thetaRall(d[key]) ) * (180/Math.PI) -90;
            })
        )
    }
    var drawArc = function(selection) {
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
      }).attr('d', arc)
    }
    var drawBackArc = function(selection) {
      var arc = d3.svg.arc()
        .innerRadius(0)
        .outerRadius(radius)
        .startAngle(thetaR.range()[0])
        .endAngle(thetaR.range()[1]);
      selection.append('path')
        .attr('class', 'jg-rank-arc jg-rank-back')
        .attr('transform', d3.svg.transform().translate(function(){
            return [x.rangeBand()*.5, y.rangeBand()*.5]
          }))
        .attr('d', arc)
        //.style('fill', col.select('rect').style('fill'));
    }
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
      if (d.normal_rall == d.normal_r) {
        d3.select(this).call(drawHand, 'normal_r', 'dup')
        d3.select(this).selectAll('.jg-rank-r').remove();
        d3.select(this).selectAll('.jg-rank-rall').remove();
      } else {
        d3.select(this).call(drawArc)
        d3.select(this).selectAll('.jg-rank-dup').remove(); //FIXME: 두개로 나눠지도로 수정.
        d3.select(this).call(drawHand, 'normal_rall', 'rall')
        d3.select(this).call(drawHand, 'normal_r', 'r')
      }
    })
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

  function calNestedData(_data) {
    nestedByTeam = nestFunc('final_team_code', 'first_coach_name')
      .entries(_data);
    nestedByCoach = nestFunc('first_coach_name', 'final_team_code')
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

  function getLinkData(selectedCol, targetName, linkData) {
    selectedCol
      .each(function(d, i) {
        var thisCol = d3.select(this)
        var point = {}
        point.x = thisCol.datum().x;
        point.y = d3.select(thisCol.node().parentNode).datum().y;
        point.width = thisCol.datum().width;
        linkData.push(point);
      }) //end of each
  }

  function getTargetNameFromCol(d) {
    return (curMode == modes[0] ? d[0].first_coach_name : d[0].final_team_code)
  }


  function mouseOverColFunc(d,i) {
    var targetName = getTargetNameFromCol(d);
    var col = svg.select('.jg-table').selectAll('.jg-col');
    col.classed({'jg-mouseover':false, 'jg-hidden':false})
    var overed = col.filter(function(d) {return getTargetNameFromCol(d) === targetName})
      .classed({'jg-mouseover':true})
    col.filter(function() {
      return !(d3.select(this).classed('jg-mouseover'))
    }).classed({'jg-hidden':true})

    //var linkData = [];
    //overed.call(getLinkData, targetName, linkData);
    //drawDiagonals([{key:targetName, values:linkData}]);

    var suppRow = svg.selectAll('.jg-supp.jg-row')
      .data([{key:targetName, values:overed.data()}], function(d){ return d.key})

    suppRow.enter().append('g')
      .classed({'jg-supp':true, 'jg-row':true})
      .attr('transform', d3.svg.transform().translate(function(d) { return [0, attrs.tableHeight] }))

    suppRow.exit().remove();
    suppRow.call(drawCols, true)
    suppRow.call(drawLabel, true)
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

  function drawDiagonals(linkDataArr, isTotal) {
    linkDataArr.forEach(function(linkData) {
      linkData.values.sort(function(a,b) { return a.x - b.x;})
      linkData.values = linkData.values.reduce(function(pre,cur,i,arr) {
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
    })

    var diagonal = d3.svg.diagonal()
    .source(function(d) { return {"x":d.source.y, "y":d.source.x}; })
    .target(function(d) { return {"x":d.target.y, "y":d.target.x}; })
    .projection(function(d) { return [d.y, d.x]; });

    var links = svg.select('.jg-table')
      .selectAll('.jg-links')
        .data(linkDataArr, function(d){return d.key})

      links.enter().append('g')
      .attr('class', 'jg-links')
      .style('fill', function(d,i){return color(i)})
      .style('stroke', function(d,i){return color(i)})

      links.exit().remove();

    var linkPath = links.selectAll('.jg-link')
        .data(function(d){return d.values})

    linkPath.enter().append('path')
      .attr("class", "jg-link")
      .attr("d", diagonal);

    linkPath.exit().remove();

    var linkPoint = links.selectAll('circle.jg-link')
        .data(function(d){
          return d.values.reduce(function(pre, cur){
            pre.push({x:cur.source.x, y:cur.source.y})
            pre.push({x:cur.target.x, y:cur.target.y})
            return pre;
          }, [])
        })

    linkPoint.enter().append('circle')
      .attr("class", "jg-link")
      .attr('cx', function(d){return d.x})
      .attr('cy', function(d){return d.y})
      .attr('r', 4);
    linkPoint.exit().remove();
  }// end of drawDiagonals

  function drawRadioButton(selection) {
    var menu = selection.append('div')//d3.select(this).append('div')
      .attr('class', 'jg-menu')

    var radio = menu.selectAll('.jg-mode')
        .data(modes)
      .enter().append('input')
      .attr('class', 'jg-mode')
      .attr('type', 'radio')
      .attr('name', 'jg-mode')
      .property('value', function(d){return d})
      .property('checked', function(d,i) {return (i===0 ? true : false)})
      .on('click', function(d) {

      })
    return selection;
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

/*
d3.kblHistory.yearLine = function module() {

  var attrs = {
    canvasWidth : 820,
    canvasHeight : 120,
    extent : [1988, 2014],
    margin : {top:60, right : 10, bottom : 10, left : 70}
  };

  var svg;
  var width, height;
  var yearX;

  var exports = function(_selection) {
    _selection.forEach(function(_data) {
      width = attrs.
    });
  }

  function svgInit(svg) {
    svg = _selection.selectAll('.jg-year-line-svg')
      .data([curData])
    .enter().append('svg')
    .attr('class','jg-year-line-svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', attrs.canvasHeight)
  }

  function createAccessorFunc(_attr) {
    function accesor(val) {
      if(!arguments.length) return attrs[attr];
      attrs[_attr] = val;
      return exports;
    }
    return accesor;
  }

  for (var attr in attrs) {
    if(!exports[attr] && attrs.hasOwnProperty(attr) ) {
      exports[attr] = createAccessorFunc(attr);
    }
  }
  return exports;
}
*/
