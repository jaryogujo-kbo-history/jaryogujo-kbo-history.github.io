module.exports = function (grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dev: {
        files: {
          'kbl-history.js': [
            'js/*.js',
          ],
          'lib.js': [
            'bower_components/jquery/dist/jquery.min.js',
            'bower_components/d3/d3.min.js',
            'bower_components/d3-transform/src/d3-transform.js'
          ],
          "index.css" : [
            'css/kbl-history-prefix.css',
            'bower_components/normalize.css/normalize.css',
            'css/kbl-history.css'
          ]
        }
      }
    }, //end of concat
    connect: {
        dev: {
          options:{
            livereload : true
          }
        }
    }, //end of http-server
    watch : {
      dev: {
        files: ['*.html'],
        tasks: []
      },
      scripts: {
        files: ['js/*'],
        tasks: ['concat:dev'],
        options: {
                livereload: true
        }
      },
      styles: {
        files: ['css/*'],
        tasks: ['concat:dev']
      }
    }//end of watch
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('dev', ['concat:dev', 'connect:dev', 'watch']);
};
