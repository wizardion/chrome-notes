// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"), require("../markdown/markdown"), require("../../addon/mode/overlay"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror", "../markdown/markdown", "../../addon/mode/overlay"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function (CodeMirror) {
  "use strict";

  CodeMirror.defineMode("mymode", function (config, parserConfig) {
    var mymodeOverlay = {
      token: function (stream, state) {
        if (stream.match("{")) {
          while ((ch = stream.next()) != null)
            if (ch == "}") break;
          return "mymode";
        }
        while (stream.next() != null && !stream.match("{", false)) { }
        return null;
      }
    };
    return CodeMirror.overlayParser(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mymodeOverlay);
  });

});
