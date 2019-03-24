const app = require(__dirname+"/methods.js");
app.server.start({"port":7632,"file":"./1280x720.mp4"});
app.client.start({"server":"localhost","port":7632,"file":"./1280x720.mp4"});