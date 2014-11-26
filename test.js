var runner = require("./runner");

var options = {
    modules: ["Main"],
    main: "Main"
};

runner.run("Main.purs", {
  modules: ["Main"],
  main: "Main"
});
