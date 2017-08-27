module.exports = function(grunt) {
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: ['*.js'],
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            files: [
                    'Gruntfile.js',
                    '.jshintrc',
                    '*.js',
                    '*.json']
                    //'unit-tests/*.js']//,
                    //'e2e-tests/*.js']
        },
        watch: {
            js: {
                files: ['<%= jshint.files %>'],
                tasks: ['jshint']
            },
            options: {
                spawn: false,
                livereload: true
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['watch', 'jshint']);
};