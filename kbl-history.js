d3.kblHistoryArc = function () {
  var attrs = {
    isSupp : false,
    isBottom: false,
    width : 20,
    height : 20,
    isAvg : false,
    maxRank :9,
    thetaR : null,
    thetaRall : null,
    isHidden : true,
    isLegend : false
  }

  var lineX = d3.scale.ordinal(), lineY = d3.scale.ordinal()
  var radius;

  var exports = function (_selection) { // _selection = col;
    radius = attrs.width * .45;
    lineX.domain(d3.range(1,attrs.maxRank+1))
      .rangePoints([0,attrs.width])
    lineY.domain(d3.range(1,attrs.maxRank+1))
      .rangePoints([0,attrs.height])
    radus = attrs.width*.45;
    _selection.call(drawRankArc);
  }


  function drawRankArc(col) {
    var isAvg = attrs.isAvg;

    if (!isAvg) {
      var rank = col.selectAll('.jg-rank-text')
          .data(function(d){return d;})
        .enter().append('g')
        .attr('class', 'jg-rank-text' + (attrs.isHidden? ' jg-hidden' : ''))
        .each(function(d) {
          d3.select(this).classed({'playoff': (d.playoff==1),
          'korean-season':(d.champion>0),
          'champion':(d.champion==1)})
        })
        .attr('transform', d3.svg.transform().translate(function(d,i){
          return [i*attrs.width, 0]
        }))

      rank.filter(function(){
        return d3.select(this).classed('korean-season') || attrs.isLegend
      }).append('text')
        .attr('class', 'jg-star')
        .attr('text-anchor', 'middle')
        .attr('dy', function(){return attrs.isLegend? 0:'.35em'})
        .text(function(d){return d.champion ==1 || attrs.isLegend ? '●':'○'} )

      rank.append('text')
        .attr('class', 'jg-number')
        .attr('dx', '.175em')
        .attr('dy', '.9em')
        .text(function(d) {return d.season_rank}) //FIXME : 나중에 고침
    }


    var clock = col.selectAll('.jg-rank-clock')
        .data(function(d){return d;})


    clock.enter().append('g')
      .attr('class', 'jg-rank-clock')
      .attr('transform', d3.svg.transform().translate(function(d,i) {return [i*attrs.width, 0]}))
      .call(drawBackArc);
    if (attrs.isLegend) {
      clock.call(drawLegend);
    }

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

  function drawLegend (selection) {
    var arc = d3.svg.arc()
      .innerRadius(radius*1.25)
      .outerRadius(radius*1.25)
      .startAngle(attrs.thetaR.range()[0])
      .endAngle(attrs.thetaR.range()[1]);

    selection.append('path')
      .attr('class', 'jg-legend-back')
      .attr('transform', d3.svg.transform().translate(function(){
          return [attrs.width*.5, attrs.height*.5]
        }))
      .attr('d', arc)

    selection.append("text")
      .attr('class', 'jg-legend-arrow')
      .attr('transform', d3.svg.transform().rotate(180))
      .attr('x', -attrs.width/2)
      .attr('dy', '.71em')
      .text('➤')

    selection.append("text")
      .attr('class', 'jg-legend-rank')
      .attr('x', -attrs.width * .75)
      .attr('dy', '1em')
      .text('순위 ⸻')

    selection.selectAll('jg-legend-range')
      .data(['낮음 –', '높음'])
    .enter().append('text')
      .attr('class', 'jg-legend-range')
      .attr('x', function(d,i) {
        if (i==0) return '-2.5em';
        else return attrs.width/2;
      })
      .attr('y', function(d,i) {
        if (i==0) return attrs.height/2;
        else return '-1.35em';
      })
      .attr('dy', '.35em')
      .text(function(d){return d})

    selection.selectAll('jg-legend-index')
      .data(['수비력', '공격력'])
    .enter().append('text')
      .attr('class', function(d,i) {
        return 'jg-legend-index ' + (i==0 ? 'jg-rall' : 'jg-r')
      })
      .attr('x', attrs.width/2)
      .attr('dx', '2.75em')
      .attr('y', function(d,i) {
        return i==0 ? attrs.height*.05 : attrs.height*.95;
      })
      .attr('dy', '.35em')
      .text(function(d){return d})

    selection.selectAll('jg-legend-star')
      .data(['● 우승', '○ 준우승'])
    .enter().append('text')
      .attr('class', function(d,i) {
        return 'jg-hidden jg-legend-star ' + (i==0 ? 'champion' : 'korean-season')
      })
      .attr('x', attrs.width*1.5)
      .attr('dx', '-2em')
      .attr('y', function(d,i) {
        return -attrs.height + i*14;
      })
      .attr('dy', '-.71em')
      .text(function(d){return d})

    selection.append("text")
      .attr('class', 'jg-legend-title')
      .attr('x', -attrs.width * .75)
      .attr('y', -attrs.height)
      .attr('dy', '-.35em')
      .text('범례')

      //.style('fill', col.select('rect').style('fill'));
    return selection
  }


  function drawHand (selection, key, className) {
    var hand = selection.selectAll('.jg-rank-hand.jg-'+className)
        .data(function(d){return [d]})

    hand.enter().append('line')
      .attr('class','jg-rank-hand jg-'+className)

    hand.attr('x1', function() {
        return 0
      }).attr('y1', 0)
      .attr('x2', radius).attr('y2', 0)
      .attr('transform', d3.svg.transform().translate(function(){
            return [attrs.width*.5, attrs.height*.5]
          }))

      hand.transition().duration(600).attr('transform', d3.svg.transform().translate(function(){
            return [attrs.width*.5, attrs.height*.5]
          }).rotate(function(d) {
        return (key=='normal_r' ? attrs.thetaR(d[key]) :attrs.thetaRall(d[key]) ) * (180/Math.PI) -90;
      }))

    return selection;
  }
  function drawBackArc(selection) {

    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(attrs.thetaR.range()[0])
      .endAngle(attrs.thetaR.range()[1]);

    selection.append('path')
      .attr('class', 'jg-rank-arc jg-back')
      .attr('transform', d3.svg.transform().translate(function(){
          return [attrs.width*.5, attrs.height*.5]
        }))
      .attr('d', arc)
      //.style('fill', col.select('rect').style('fill'));
    return selection
  }

  function drawArc(selection) {
    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)//attrs.width*.5)
      .startAngle(function(d){
        var r = attrs.thetaR(d.normal_r), rall= attrs.thetaRall(d.normal_rall)
        if (r <= rall) {
          return r
        } else {
          return rall
        }
      })
      .endAngle(function(d) {
        var r = attrs.thetaR(d.normal_r), rall= attrs.thetaRall(d.normal_rall)
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
          return [attrs.width*.5, attrs.height*.5]
        }))

    rankArc.attr('class', function(d) {
      var r = attrs.thetaR(d.normal_r), rall= attrs.thetaRall(d.normal_rall)
      if (r <= rall) {
        return 'jg-rank-arc jg-rank jg-r'
      } else {
        return 'jg-rank-arc jg-rank jg-rall'
      }
    }).transition().duration(600).attr('d', arc)

    return selection

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

d3.kblHistoryArticle = function module () {
  var attrs = {
    canvasWidth : 820,
    canvasHeight : 100,
    rowHeight : 30
  }
  var margin = {top:20, right : 10, bottom : 10, left : 70};
  var width;
  var x = d3.scale.ordinal(),
    thetaR = d3.scale.linear().range([0, Math.PI*(3/2)]),
    thetaRall = d3.scale.linear().range([0, Math.PI*(3/2)]);
  var teamMap = d3.map({'OB':'OB','SS':'삼성','MB':'MBC',
    'HT':'해태','LT':'롯데','SM':'삼미','LG':'LG','DS':'두산','KA':'KIA',
    'BG':'빙그레','HH':'한화','SK':'SK','NS':'넥센','NC':'NC','SB':'쌍방울',
    'CB':'청보','TP':'태평양','HD':'현대'})
  var exports = function(_selection) {
    _selection.each(function(_data) {
      width = attrs.canvasWidth - margin.left - margin.right;
      x.rangeRoundBands([0, width])
        .domain(d3.range(1982, 2015));
      var normalRExtent = [-2.389, 2.215],
        normalRallExtent = [-2.006, 2.083];
      thetaRall.domain([d3.min([normalRExtent[0], normalRallExtent[0]]), d3.max([normalRExtent[1], normalRallExtent[1]])])
      thetaR.domain([thetaRall.domain()[1], thetaRall.domain()[0]]);
      d3.select(this).select('div.jg-coach').call(articleInit, 'coach');
      d3.select(this).select('div.jg-team').call(articleInit, 'team');
      //attrs.canvasHeight - margin.top - margin.bottom;
    })
  }
  function articleInit(selection,mode) {

    var section = selection.selectAll('.jg-section')
      .data(function(d){
        return d.article.filter(function(a){
          return a.mode === mode;
      })})
      .enter().append('div')
      .attr('class', 'jg-section')

    section.append('h2')
      .attr('class', 'jg-title')
      .html(function(d){return d.title})


    var svg = section.append('svg')
      .attr('width', attrs.canvasWidth)
      .attr('height', attrs.canvasHeight)
      .append('g')

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

    var figure = svg.selectAll('.jg-figure')
        .data(function(d){
          var out = findRowData(d.key, selection.datum().history[mode]);
          out.y = 0;
          return [[out]];
        })
        .enter().append('g')
        .attr('class', 'jg-figure')
        .attr('transform', d3.svg.transform().translate(function() {return [0,margin.top*2]}))

    var row = d3.kblHistoryRow()
      .width(x.rangeBand())
      .height(attrs.rowHeight)
      .x(x)
      .thetaR(thetaR)
      .thetaRall(thetaRall)
      .svg(svg)
      .teamMap(teamMap)
      .margin(margin)
      .isSupp(mode==='coach')
      .isHidden(false)
      .isArticle(true)

    figure.call(row)


    section.selectAll('.jg-paragraph')
      .data(function(d) {
        return d.desc.split("\n").filter(function(d){return d!==""})
      })
      .enter().append('div')
      .attr('class', 'jg-paragraph')
      .html(function(d){return d})
  }

  function findRowData(key, values) {
    for(var i = 0; i < values.length; i++) {
      if(values[i].key === key) {
        return values[i]
      }
    }
    return null;
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

d3.kblHistoryDataMng = function () {
  var exports = {},
    dispatch = d3.dispatch('dataReady', 'dataLoading'),
    data;

  exports.loadCsv = function(_path) {
    var loadCsv = d3.csv(_path);
    loadCsv.on('progress', function() {
      dispatch.dataLoading(d3.event.loaded);
    });
    return loadCsv;
  }

  exports.loadHistoryCsv = function(_path) {
    var loadCsv = exports.loadCsv(_path);
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

  exports.loadArticleCsv = function(_path) {
    var loadCsv = exports.loadCsv(_path);
    loadCsv.get(function(_err, _res) {
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

d3.kblHistoryRow = function module () {
  var attrs = {
    isSupp : false,
    isAvg : false,
    width : 20,
    height : 20,//y : null,
    x : null,
    thetaR : null,
    thetaRall : null,
    //y : 0,
    svg : null,
    teamMap : null,
    isInteractive : true,
    margin : null,
    isHidden : true,
    isArticle : false
  } //FIXME : 시작-마지막 연도 + 사이즈 되면 알아서 되도록
  var emblemPath = './image/team/'
  var dispatch = d3.dispatch("colOver", "colClick", 'rowOver')//, "rowOver", "rowClick"); // .hide .show
  var svgHeight;
  /*
  dispatch.load(value);
  */

  //디스패치 설정
  var exports = function(_selection) {
    svgHeight = +d3.select(attrs.svg.node().parentNode).attr('height')
    d3.select(attrs.svg.node().parentNode).attr('temp-height', svgHeight)
    _selection.each(function(_data) {
      // g 혹은 svg table이 this 라고 가정
      var row = d3.select(this)
        .selectAll( (attrs.isAvg ? '.jg-row-avg' : '.jg-row') + (attrs.isSupp ? '.jg-supp.jg-temp' : '') )// table.call
          .data(_data,  function(d) {return d.key})

      row.enter().append('g')
        .classed({'jg-supp':attrs.isSupp, 'jg-temp':attrs.isSupp,'jg-row':!attrs.isAvg, 'jg-row-avg':attrs.isAvg})//.attr('class', 'jg-row')
        .attr('transform', d3.svg.transform().translate(function(d) {
          return [0, d.y] //FIXME : 이미 높이가 결정되어 있어야함.
        }))
        .call(drawLabel)
        .call(drawCols)
        .on('mouseenter', function(d) {
          dispatch.rowOver(d);
        });

      row.exit().remove();

      if(attrs.isSupp && !attrs.isArticle) {
        setTimeout(function(){
          row.selectAll('.jg-col').classed({'jg-mouseover':true})
        }, 100)
      }
    })
  }

  function drawLabel(row) {
    var label = row.selectAll('.jg-label')
        .data(function(d) {return [d]})
      .enter().append('g')
      .attr('class','jg-label')
      .attr('transform', d3.svg.transform().translate(function(d,i) {
        return [0, 0]
      }))
    if (!attrs.isArticle) {
      label.on('mouseenter', function(d) {
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
    } else {
      label.each(function(){
        var thisRow = d3.select(d3.select(this).node().parentNode);
        addBottomRow(thisRow, false);
      })
    }


    if (!attrs.isSupp) {
     label.append('image')
        .attr('xlink:href', function(d) {
          return emblemPath + d.key + '@2x.png'
        })
        .attr('x', 4)
        .attr('y', 2)
        .attr('width', '27')
        .attr('height', '22')
    }

   label.append('text')
      .attr('text-anchor', 'end')
      .attr('x', attrs.margin.left*.95)
      .attr('y', attrs.height*.5)
      //.attr('y', function(d){return attrs.height*.5  }) //+ margin.top
      .attr('dy', '.35em')
      .text(function(d) {return (!attrs.isSupp ? attrs.teamMap.get(d.key): d.key)})
    return row
  }

  function addBottomRow(thisRow,/*optional*/isOver) {

    isOver = isOver || false;
    var duration = 400;
    var appendHClicked = attrs.height*2.25, appendHOvered = attrs.height * 1;
    var appendH = isOver ? appendHOvered : appendHClicked;
    var isSupp = attrs.isSupp////var isSupp = thisRow.classed('jg-supp')
    var thisSvg = attrs.svg
    if(attrs.isSupp) svgHeight = +d3.select(attrs.svg.node().parentNode).attr('temp-height')

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
        svgHeight -= appendHSelected

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
        svgHeight += finalAppendH

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
              return emblemPath + d.key + '_c@2x.png'
            })
        } else {
          thisRow.selectAll('.jg-label > image')
            .attr('xlink:href', function(d) {
              return emblemPath + d.key + '@2x.png'
            })
        }
      })
    }

    var selectedRow = thisSvg.selectAll('.jg-row.jg-selected');
    console.log(selectedRow.size());
    if (selectedRow.size() > 0 && !attrs.isArticle) { // 이미 존재 할 때
      //var selectedIndex = getIndexOfRow(selectedRow);
      // 중복 인 것
      var dupRows = selectedRow.filter(function(d) {
        //thisRow.
        return  d3.select(this).node() === thisRow.node()//d.key === thisRow.datum().key;
      })
      // 중복 아닌 것
      var undupRows = selectedRow.filter(function(d) {
        return  d3.select(this).node() !== thisRow.node()
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
    //if(attrs.isSupp) console.log(svgHeight);
    if(!attrs.isArticle) {
      d3.select(thisSvg.node().parentNode)
        .attr('temp-height', svgHeight)
        .transition()
        .duration(400).attr('height', svgHeight)
    }
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
      .attr('transform', d3.svg.transform().translate([attrs.margin.left, attrs.height]))

    bottomRow
      .style('opacity', 0)
      .transition().duration(duration)
      .style('opacity', 1)

    var bottomCol = bottomRow.selectAll('.jg-bottom-col')
        .data(values)
      .enter().append('g')
      .attr('class', 'jg-bottom-col')
      .attr('transform', d3.svg.transform()
        .translate(
          function(d,i){return [attrs.x(d.from), attrs.height*.025]}
        ))
    bottomCol.selectAll('.jg-line')
        .data(function(d){return isOver? [d]:[d,d]})
      .enter().append('line')
      .attr('class', 'jg-line')
      .attr('x1', function(d){return attrs.width*.1})
      .attr('y1', function(d,i){return i*(attrs.height*2)})
      .attr('x2', function(d){return (d.to-d.from)*attrs.width+attrs.width*.9})
      .attr('y2', function(d,i){return i*(attrs.height*2)})
    if (!isOver) {
      var arc = d3.kblHistoryArc()
        .isAvg(true)
        .width(attrs.width)
        .height(attrs.height)
        .thetaR(attrs.thetaR)
        .thetaRall(attrs.thetaRall)
        .isHidden(attrs.isHidden)

      var clock = bottomCol.selectAll('.jg-bottom-clock')
          .data(function(d){return [[d]]})
        .enter().append('g')
        .attr('class', 'jg-bottom-clock')
        .attr('transform', d3.svg.transform().translate(function(d){
          return [(attrs.x(d[0].to)-attrs.x(d[0].from))*.5, attrs.height*.85]
        }))

        clock.call(arc)
    }

    bottomCol.append('text')
      .attr('class', 'jg-coach-name')
      .attr('text-anchor', 'middle')
      .attr('x', function(d){
        d.x = (d.to-d.from+1)*attrs.width*.5
        return d.x
      })
      .attr('y', function(d){return attrs.height*.45})//(isOver? attrs.height*.6:attrs.height*1.6)})
      .selectAll('tspan')
        .data(function(d){
          if(d.to-d.from==0 && (isSupp ? attrs.teamMap.get(d.key) : d.key).length >= 3) {
            return [{x:d.x, key:d.key[0]+'—'}, {x:d.x, key:d.key.substring(1)}]
          } else {
            return [{x:d.x, key:d.key}]
          }
        })
      .enter().append('tspan')
      .attr('x', function(d){return d.x})//.attr('dx', function(d,i){return '-22px'})
      .attr('dy', function(d,i){return i+'em'})
      .text(function(d){return isSupp ? attrs.teamMap.get(d.key) : d.key})
    return selection;
  }

  function drawCols(row) {
    isSupp = attrs.isSupp;
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
      var dx = attrs.x(d[0].year) + attrs.margin.left; // FIXME : x 안쓰고 시작할 수 있도록??
      //d.x = x(d[0].year) + margin.left;
      return [dx, 0]
    }))

    if(!isSupp) {
      col.on('mouseenter', function(d,i) {
        dispatch.colOver(d3.select(this)); //TODO : 클릭할 때 매니저 클래스에서 이벤트 액션 정의 d3.select(this).call(mouseOverColFunc);
        var thisRow = d3.select(d3.select(this).node().parentNode);
        if (!thisRow.classed('jg-selected')) {
          addBottomRow(thisRow, true);
        }
      }).on('mouseleave', function() {
        col.classed({'jg-hidden':false, 'jg-mouseover':false})
      }).on('click', function(d,i) {
        dispatch.colClick(d3.select(this)); //TODO : 클릭할 때 매니저 클래스에서 이벤트 액션 정의 d3.select(this).call(clickColFunc);
        var thisRow = d3.select(d3.select(this).node().parentNode);
        if (thisRow.classed('jg-selected')&&thisRow.classed('jg-mouseover')) {
          addBottomRow(thisRow);
        }
      })
    }

    col.append('rect')
    .attr('class', 'jg-col-block')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', function(d) {
      var dwidth = d.length * attrs.width;
      //d.width = d.length * attrs.width;
      return dwidth//x(d[d.length-1].year+1) - x(d[0].year);
    })
    .attr('height', attrs.height)

    var arc = d3.kblHistoryArc()
      .isSupp(attrs.isSupp)
      .isAvg(attrs.isAvg)
      .width(attrs.width)
      .height(attrs.height)
      .thetaR(attrs.thetaR)
      .thetaRall(attrs.thetaRall)
      .isHidden(attrs.isHidden)

    col.call(arc);
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
  d3.rebind(exports, dispatch, 'on')
  return exports;
}

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
        legendDiv.selectAll('.jg-rank-text.playoff, .jg-legend-star')
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
        legendDiv.selectAll('.jg-rank-text.playoff, .jg-legend-star')
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
