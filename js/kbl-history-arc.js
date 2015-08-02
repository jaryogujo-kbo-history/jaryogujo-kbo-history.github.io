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
        return d3.select(this).classed('korean-season')
      }).append('text')
        .attr('class', 'jg-star')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .text(function(d){return d.champion ==1 ? '●':'○'} )

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
        return 'jg-legend-star ' + (i==0 ? 'champion' : 'korean-season')
      })
      .attr('x', attrs.width*1.5)
      .attr('dx', '-2em')
      .attr('y', function(d,i) {
        return -attrs.height + i*12;
      })
      .attr('dy', '-1.35em')
      .text(function(d){return d})

    selection.append("text")
      .attr('class', 'jg-legend-title')
      .attr('x', -attrs.width * .75)
      .attr('y', -attrs.height)
      .attr('dy', '-.71em')
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
