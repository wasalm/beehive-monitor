//node --expose-gc ./test-audio.js
let Cl = require("./lib/audio.js");
let obj = new Cl();

setInterval(async () => {
	console.log(await obj.getSample(0.1));
	global.gc();
},1000);