module.exports = function (grunt) {
    grunt.initConfig({
        "pkg": grunt.file.readJSON("package.json"),
        "meta": {
            "GameStartrPath": "GameStartr",
            "deployPath": "dist"
        },
        "copy": {
            "default": {
                "files": [{
                    "expand": true,
                    "src": "Sounds/**",
                    "dest": "<%= meta.deployPath %>"
                }, {
                    "expand": true,
                    "src": "Theme/**",
                    "dest": "<%= meta.deployPath %>"
                }, {
                    "expand": true,
                    "src": "Fonts/**",
                    "dest": "<%= meta.deployPath %>"
                }, {
                    "src": "README.md",
                    "dest": "<%= meta.deployPath %>/README.md"
                }, {
                    "src": "LICENSE.txt",
                    "dest": "<%= meta.deployPath %>/LICENSE.txt"
                }]
            }
        },
        "concat": {
            "dist": {
                "src": [
                    "<%= meta.GameStartrPath %>/EightBittr/*.js",
                    "<%= meta.GameStartrPath %>/GameStartr.js",
                    "<%= meta.GameStartrPath %>/AudioPlayr/*.js",
                    "<%= meta.GameStartrPath %>/ChangeLinr/*.js",
                    "<%= meta.GameStartrPath %>/FPSAnalyzr/*.js",
                    "<%= meta.GameStartrPath %>/GamesRunnr/*.js",
                    "<%= meta.GameStartrPath %>/GroupHoldr/*.js",
                    "<%= meta.GameStartrPath %>/InputWritr/*.js",
                    "<%= meta.GameStartrPath %>/LevelEditr/*.js",
                    "<%= meta.GameStartrPath %>/MapsCreatr/*.js",
                    "<%= meta.GameStartrPath %>/MapsHandlr/*.js",
                    "<%= meta.GameStartrPath %>/ModAttachr/*.js",
                    "<%= meta.GameStartrPath %>/NumberMakr/*.js",
                    "<%= meta.GameStartrPath %>/ObjectMakr/*.js",
                    "<%= meta.GameStartrPath %>/PixelDrawr/*.js",
                    "<%= meta.GameStartrPath %>/PixelRendr/*.js",
                    "<%= meta.GameStartrPath %>/QuadsKeepr/*.js",
                    "<%= meta.GameStartrPath %>/StatsHoldr/*.js",
                    "<%= meta.GameStartrPath %>/StringFilr/*.js",
                    "<%= meta.GameStartrPath %>/ThingHittr/*.js",
                    "<%= meta.GameStartrPath %>/TimeHandlr/*.js",
                    "<%= meta.GameStartrPath %>/UserWrappr/*.js",
                    "<%= meta.GameStartrPath %>/WorldSeedr/*.js",
                    "FullScreenMario.js",
                    "settings/*.js"
                ],
                "dest": "<%= meta.deployPath %>/<%= pkg.name %>.js"
            }
        },
        "uglify": {
            "options": {
                "compress": {}
            },
            "dist": {
                "files": {
                    "<%= meta.deployPath %>/<%= pkg.name %>.min.js": ["<%= meta.deployPath %>/<%= pkg.name %>.js"],
                    "<%= meta.deployPath %>/index.min.js": ["index.js"]
                }
            }
        },
        "cssmin": {
            "target": {
                "files": {
                    "<%= meta.deployPath %>/index.min.css": ["index.css"]
                }
            }
        },
        "processhtml": {
            "dist": {
                "files": {
                    "<%= meta.deployPath %>/index.html": ["index.html"]
                }
            }
        },
        "htmlmin": {
            "dist": {
                "options": {
                    "removeComments": true,
                    "collapseWhitespace": true,
                    "minifyURLs": true
                },
                "files": {
                    "<%= meta.deployPath %>/index.html": ["<%= meta.deployPath %>/index.html"]
                }
            }
        },
        "clean": {
            "js": ["<%= meta.deployPath %>/<%= pkg.name %>.js"]
        },
        "zip": {
            "using-cwd": {
                "cwd": "<%= meta.deployPath %>/",
                "src": ["**"],
                "dest": "<%= pkg.name %>-v<%= pkg.version %>.zip"
            }
        },
        "mocha_phantomjs": {
            "all": ["tests.html"]
        }
    });

    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-processhtml");
    grunt.loadNpmTasks("grunt-contrib-htmlmin");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-zip");
    grunt.loadNpmTasks("grunt-mocha-phantomjs");
    grunt.registerTask("default", [
        "copy", "concat", "uglify", "cssmin", "processhtml", "htmlmin", "clean", "zip", "mocha_phantomjs"
    ]);
};
