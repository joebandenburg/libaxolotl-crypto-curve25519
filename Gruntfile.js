"use strict";

var util = require("util");
var child_process = require("child_process");

module.exports = function(grunt) {
    grunt.loadNpmTasks("grunt-mocha-test");

    grunt.initConfig({
        emcc: {
            all: {
                src: [
                    "src/curve25519-donna.c",
                    "src/ed25519/*.c",
                    "src/ed25519/additions/*.c",
                    "src/ed25519/sha512/sha2big.c"
                ],
                dest: "curve25519.js",
                includePaths: [
                    "src/ed25519",
                    "src/ed25519/nacl_includes",
                    "src/ed25519/additions",
                    "src/ed25519/sha512"
                ],
                preFile: "src/prefix.js",
                postFile: "src/suffix.js",
                methods: [
                    "curve25519_donna",
                    "curve25519_sign",
                    "curve25519_verify",
                    "crypto_sign_ed25519_ref10_ge_scalarmult_base",
                    "sph_sha512_init",
                    "malloc",
                    "free"
                ]
            }
        },
        mochaTest: {
            unitTests: {
                src: ["test/**/*.js"]
            }
        }
    });

    grunt.registerMultiTask("emcc", "Compile the C libraries with emscripten.", function() {
        var callback = this.async();
        var outfile = this.data.dest;

        var exported_functions = this.data.methods.map(function(name) {
            return "'_" + name + "'";
        });
        var sourceFiles = grunt.file.expand(this.data.src);
        var flags = [
            "-O2",
            //"-g",
            "--memory-init-file 0",
            "-Qunused-arguments",
            "-o",  outfile,
            "-s", "EXPORTED_FUNCTIONS=\"[" + exported_functions.join(",") + "]\""];
        flags = flags.concat(this.data.includePaths.map(function(include) {
            return "-I" + include;
        }));

        if (this.data.preFile) {
            flags.push("--pre-js");
            flags.push(this.data.preFile);
        }

        if (this.data.postFile) {
            flags.push("--post-js");
            flags.push(this.data.postFile);
        }

        var command = [].concat("emcc", sourceFiles, flags).join(" ");
        grunt.log.writeln("Compiling via emscripten to " + outfile);

        var exitCode = 0;
        grunt.verbose.subhead(command);
        grunt.verbose.writeln(util.format("Expecting exit code %d", exitCode));

        var child = child_process.exec(command);
        child.stdout.on("data", function (d) { grunt.log.write(d); });
        child.stderr.on("data", function (d) { grunt.log.error(d); });
        child.on("exit", function(code) {
            if (code !== exitCode) {
                grunt.log.error(util.format("Exited with code: %d.", code));
                return callback(false);
            }

            grunt.verbose.ok(util.format("Exited with code: %d.", code));
            callback(true);
        });
    });

    grunt.registerTask("build", ["emcc"]);
    grunt.registerTask("test", ["mochaTest"]);
    grunt.registerTask("default", ["build", "test"]);
};
