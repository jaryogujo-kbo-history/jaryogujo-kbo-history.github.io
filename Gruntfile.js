module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dev: {
        files: {
          'index.js': [
            'bower_components/d3/d3.min.js',
            'bower_components/d3-transform/src/d3-transform.js',
            'js/*.js',
          ],
          "index.css" : [
            'bower_components/normalize.css/normalize.css',
            'css/kbl-history.css'
          ]
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('dev', ['concat:dev']);
};
