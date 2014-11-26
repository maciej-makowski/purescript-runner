var runner = require("./runner");

var options = {
    modules: ["Main"],
    main: "Main"
};

runner.run("Main.purs", options, function (err, PS) {
    if(err) {
        return console.error(err);
    }
});
