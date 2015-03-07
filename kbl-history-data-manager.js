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
