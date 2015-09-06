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
      .attr('id', function(d,i){return 'jg-'+d.mode+'-'+i})
      .html(function(d){
        var chunks = d.title.split(' ')
        if (chunks.length > 0) {
          return '<span>' + chunks[0] + ' ' + '</span>' + chunks.slice(1).join(' ')
        }
        else return d.title
      })


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
