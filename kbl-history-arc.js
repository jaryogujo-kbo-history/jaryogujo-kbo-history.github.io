d3.kblHistoryArc = function () {
  var attrs = {
    isSupp : false,
    width : 20,
    height : 20,
    isAvg : false,
    maxRank :9,
    thetaR : null,
    thetaRall : null
  }

  var lineX = d3.scale.ordinal(), lineY = d3.scale.ordinal()
  var radius;

  var exports = function (_selection) {
    lineX.domain(d3.range(1,attrs.maxRank+1))
      .rangePoints([0,attrs.width])
    lineY.domain(d3.range(1,maxRank+1))
      .rangePoints([0,attrs.height])
    radus = attrs.width*.45;
    _selection.forEach(function(_data) {

      d3.select(this).call(drawRankArc)
    });
  }


  function drawRankArc(col, isAvg) {
    var isAvg = attrs.isAvg;
    if (!isAvg) {
      var rank = col.selectAll('.jg-rank-text')
          .data(function(d){return d;})
        .enter().append('g')
        .attr('class', 'jg-rank-text')
        .attr('transform', d3.svg.transform().translate(function(d,i){
          return [i*attrs.width, 0]
        }))
      rank.append('text')
        .attr('dx', '.175em')
        .attr('dy', '.9em')
        .text(function(d) {return d.rank}) //FIXME : 나중에 고침
    }

    var clock = col.selectAll('.jg-rank-clock')
        .data(function(d){return d;})

    clock.enter().append('g')
      .attr('class', 'jg-rank-clock')
      .attr('transform', d3.svg.transform().translate(function(d,i) {return [i*attrs.width, 0]}))
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


  function drawRankLine(col) {
    var line = col.selectAll('.jg-rank-line')
        .data(function(d){return d;})

      line.enter().append('g')
      .attr('class', 'jg-rank-line')
      .attr('transform', d3.svg.transform().translate(function(d,i) {return [i*attrs.width, 0]}))

    var drawLine = function(selection, key, className) {
      line.append('line')
        .attr('class', 'jg-rank-'+className)
        .attr('x1', function(d){return lineX(d[key])})
        .attr('x2', function(d){return lineX(d[key])})
        .attr('y1', 0)
        .attr('y2', attrs.height)
      line.append('line')
        .attr('class', 'jg-rank-'+className)
        .attr('y1', function(d){return lineY(d[key])})
        .attr('y2', function(d){return lineY(d[key])})
        .attr('x1', 0)
        .attr('x2', attrs.width)
      return selection
    }

    line.call(drawLine, 'rall_rank', 'rall')
      .call(drawLine, 'r_rank', 'r')
      .call(drawLine, 'rank', 'wa')
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
        return (key=='normal_r' ? thetaR(d[key]) :thetaRall(d[key]) ) * (180/Math.PI) -90;
      }))

    return selection;
  }
  function drawBackArc(selection) {
    var arc = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(thetaR.range()[0])
      .endAngle(thetaR.range()[1]);
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
          return [attrs.width*.5, attrs.height*.5]
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



  return exports;
}
