const WebSocket = require("ws");
const fs = require("fs");
const stream = require("stream");
const crypto = require("crypto");

module.exports.server = {
	start:function( config ){
		this.port;
		this.file;
		this.loadConfig( config );
		console.log("Server Starting on port:"+this.port);
		this.Wss = new WebSocket.Server({port:this.port});
		this.Wss.on("connection", ( connection )=>{
			console.log("new connection");
			connection.send( encrypt(JSON.stringify({"type":"welcome"})) );
			connection.on("message", ( chunk )=>{
				let chunk1 = decrypt( chunk );
				console.log("[SERVER][RECEIVED]"+chunk+"\n\r[DECRYPTED]"+chunk1 );
				if( isJson( chunk1 ) == true ){
					let array = JSON.parse( chunk1 );
					if( array.type == 'welcome' || !array.needfile == null ){
						let read = fs.createReadStream(array.needfile);
						read.on("data", ( data )=>{
							connection.send( encrypt(JSON.stringify({"type":"filedata", "data": data.toString("hex")})) );
						});
						read.on("end", ()=>{
							connection.send( encrypt(JSON.stringify({"type":"filedataend"})) );
						});
					}
				}
			});
		});
	},
	loadConfig:function( config ){
		if( "port" in config ){
			this.port = config.port;
		} else {
			console.log("missing port");
			process.exit();
		}
		if( "file" in config ){
			this.file = config.file;
		}
	}
}
module.exports.client = {
	start:function( config ){
		this.port;
		this.server;
		this.dataCache = [];
		this.loadConfig( config );
		console.log("connecting to "+this.server+":"+this.port);
		this.ws = new WebSocket("ws://"+this.server+":"+this.port);
		this.ws.on("open", ()=>{});
		this.ws.on("message", ( chunk )=>{
			let chunk1 = decrypt( chunk );
			console.log("[CLIENT][RECEIVED]"+chunk+"\n\r[DECRYPTED]"+chunk1 );
			if( isJson( chunk1 ) == true ){
				let array = JSON.parse( chunk1 );
				if( array.type == 'welcome' ){
					//this.ws.send( encrypt(JSON.stringify({"type":"welcome","needfile":"./android-studio-ide-182.5264788-windows32.zip"})) );
					this.ws.send( encrypt(JSON.stringify({"type":"welcome","needfile":"./1280x720.mp4"})) );
				} else if( array.type == 'filedata'){
					if(array.data){
						this.dataCache.push( Buffer.from(array.data,"hex") );
					}
				} else if( array.type == 'filedataend'){
					fs.writeFileSync("./test.mp4", Buffer.concat( this.dataCache ) );
					this.dataCache = [];
					console.log(this.dataCache);
					process.exit();
				}
			}
		});
	},
	loadConfig:function( config ){
		if( "port" in config ){
			this.port = config.port;
		} else {
			console.log("missing port");
			process.exit();
		}
		if( "server" in config ){
			this.server = config.server;
		} else {
			process.exit();
		}
	}
}
encrypt = (data)=>{
	var cipher = crypto.createCipher('aes-256-cbc', "TESTING ENCRYPTION".toString("hex"));
	var crypted = cipher.update(data, 'utf-8', 'hex');
	crypted += cipher.final('hex');
	return crypted;
}
decrypt = (data)=>{
	var decipher = crypto.createDecipher('aes-256-cbc', "TESTING ENCRYPTION".toString("hex"));
	try{
		var decrypted = decipher.update(data, 'hex', 'utf-8');
		decrypted += decipher.final('utf-8');
		return decrypted;
	}catch( error ){
		return "decrypt error";
	}
}


isJson = ( data )=>{
	try{
		JSON.parse( data );
	}catch( error ){
		return false;
	}
	return true;
}