module.exports = function (grunt) {
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    uglify: {
      t1: {
        files: {
          "dest/db.min.js": ["./Public/Javascript/database.js"],
        },
      },
    },
  });
};
