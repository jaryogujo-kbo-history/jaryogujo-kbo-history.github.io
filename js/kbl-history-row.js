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
    isHidden : true
  } //FIXME : 시작-마지막 연도 + 사이즈 되면 알아서 되도록
  var emblemPath = 'image/team/'
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
          .data(_data,  function(d) { return d.key})

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

      if(attrs.isSupp) {
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

    if (!attrs.isSupp) {
     label.append('image')
        .attr('xlink:href', function(d) {
          return emblemPath + d.key + '@2x.png'
        })
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
    //if(attrs.isSupp) console.log(svgHeight);
    d3.select(thisSvg.node().parentNode)
      .attr('temp-height', svgHeight)
      .transition()
      .duration(400).attr('height', svgHeight)
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
    //col.call(drawRankLine);
  }
  //그리기

  //이벤트 동작
  //exports.highlight = function (targetName) //외부에서 코치 이름 선택했을때 하이라이트
  //exports.addBottomRow(this, isOver)

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
  d3.rebind(exports, dispatch, 'on')
  return exports;
}
