var mqtt = require('mqtt')
var request = require('request')
var devices = [];

var client  = mqtt.connect({
	host: 'wifi.h2popo.com',
	port: 8083,
	username: 'wopin',
	password: 'wopinH2popo'		
})

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
}

function postDrinkEvent(message, dformat) {
	var formdata = {
		uuid: message.toString(),
		drinkTime: dformat.toString()
	}
	var options = { method: 'POST',
	  url: 'http://wifi.h2popo.com:8081/users/drink',
	  headers: 
	   { 'content-type': 'application/x-www-form-urlencoded' },
	  form: formdata};

	request(options, function (error, response, body) {
	  if (error) { console.log(error) }
	  console.log(body)
	});
}
 
client.on('connect', function () {
  console.log("connected")
  client.subscribe('drink', function (err) {
    if (!err) {
    	console.log("Open a drink water channel")
    }
  })
})
 
client.on('message', function (topic, message) {
	var d = new Date
	dformat = [d.getFullYear().padLeft(),
               (d.getMonth()+1).padLeft(),
               d.getDate().padLeft()].join('-') +' ' +
              [d.getHours().padLeft(),
               d.getMinutes().padLeft()].join(':');
    var uuid = message.toString().substring(0,18)
    var drink_count = "";
    if (message.toString().length == 22){
        drink_count = message.toString().substring(19,21);
    } else if (message.toString().length == 23)
    {   
        drink_count = message.toString().substring(19,22);
    }
    var total_drink_count = parseInt(drink_count)
    console.log(dformat.toString() + " Receive some message " + topic + " "  + uuid + " " + total_drink_count);
    var unix = Math.round(+new Date()/1000);
    if (devices[message.toString()] != undefined) {
    	var prevDrinkTime = devices[message.toString()]
    	var diff = unix - prevDrinkTime
    	console.log(dformat.toString() + " DrinkTime Diff : " + diff + " id: " + uuid)
    	if (total_drink_count > 60) {
            total_drink_count = 60
      }
      for (var i = 0; i <= total_drink_count; i++) {
        if (diff > 5 * 60 * (i+1)) {
            devices[uuid] = unix;
            postDrinkEvent(uuid,  dformat)
        }
      }
    } else {
    	devices[uuid] = unix;
    	postDrinkEvent(uuid,  dformat)
    }
})
