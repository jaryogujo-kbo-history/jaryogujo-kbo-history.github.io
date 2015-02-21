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
    canvasHeight : 600,
    isTeamMode : true
  };//end of attributes
  var margin = {top:10, right : 20, bottom : 10, left : 20}
  var x= d3.scale.ordinal().rangeRoundBands([0, attrs.width])
  var y= d3.scale.ordinal().rangeRoundBands([0, attrs.height])
  var svg;
  /*
  width : 800px;
  height : 600px;
  */
  var exports = function (_selection) {
    _selection.each(function(_data) {
      d3.select(this).style('width', attrs.canvasWidth+'px').style('height', attrs.canvasHeight+'px')

      var width = attrs.canvasWidth - margin.left - margin.right;
      var height =  attrs.canvasHeight - margin.top - margin.bottom;
      var yearExtent = d3.extent(_data, function(d) {return d.year})
      var nestedByTeam = nestFunc('final_team_code', 'first_coach_name')
      .entries(_data);
      var nestedByCoach = nestFunc('first_coach_name', 'final_team_code')
      .entries(_data);

      x.domain(d3.range(yearExtent[0], yearExtent[1]))
      y.domain(nestedByTeam.map(function(d) {return d.key}))

      if (!svg) {
        svg = _selection.selectAll('svg.jg-svg')
          .data([_data])
        .enter().append('svg')
        .attr('class','jg-svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', d3.svg.transform().translate(function() {return [margin.left, margin.top]}))
      }

    }); //end of each
  } // end of exports

  function svgInit(svg) {

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
