d3.kblHistoryRow = function module () {
  var attrs = {
    y : null,
    x : null,
    svg : null
  } //FIXME : 시작-마지막 연도 + 사이즈 되면 알아서 되도록

  var dispatch = d3.dispatch("over", "click"); // .hide .show
  /*
  dispatch.load(value);
  */

  //디스패치 설정
  var exports = function(_selection) {
    _selection.each(function(_data) {
      d3.select(this)
        .call(drawLabel);
        .call(drawCols)
    })
  }

  function draw(selection) {
    /* 테이블에서 전달되는 방식
    var row = table.selectAll('g.jg-row')
      .data(function(d) {return d}, function(d) { return d.key}) // => team level
    .enter().append('g')
    .attr('class', 'jg-row')
    .attr('transform', d3.svg.transform().translate(function(d) {
      d.y = y(d.key);
      return [0, d.y]
    }))
    selection.on('mouseenter', function(d){
      //FIXME : 위에 연동 되도록svgYearStat.call(drawLineYearly, d)
    })
    */
    //.on('mouseover')
    //curYearExtent = turnRangeToExtent(yearStatBrush.extent());
    //row.call(drawAvg, curYearExtent);
    //selection;
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

    function selectCol(coachName) {
      var col = svg.select('.jg-table').selectAll('.jg-col');
      col.classed({'jg-mouseover':false, 'jg-hidden':false})
      var overed = col.filter(function(d) {return  d[0].first_coach_name === coachName})
        .classed({'jg-mouseover':true})
      col.filter(function() {
        return !(d3.select(this).classed('jg-mouseover'))
      }).classed({'jg-hidden':true})
      var thisData = coachTeamData.filter(function(dd) {
        return dd.key == coachName;
      });
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

    function mouseOverColFunc(selection) {
      var d = selection.datum();
      var coachName = d[0].first_coach_name
      selectCol(coachName)
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

  //그리기

  //이벤트 동작

  //bind
  //

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
