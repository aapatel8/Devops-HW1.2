var needle = require("needle");
var os   = require("os");

var sleep   = require("sleep");

var exec = require('ssh-exec');

var fs = require('fs');

var config = {};
config.token = process.env.DOTOKEN;
console.log("Your token is:", config.token);

var headers =
{
	'Content-Type':'application/json',
	Authorization: 'Bearer ' + config.token
};

// Documentation for needle:
// https://github.com/tomas/needle

var client =
{
	createDroplet: function (dropletName, region, imageName, onResponse)
	{
		var data = 
		{
			"name": dropletName,
			"region":region,
			"size":"512mb",
			"image":imageName,
			// Id to ssh_key already associated with account.
			"ssh_keys":[18020481],
			//"ssh_keys":null,
			"backups":false,
			"ipv6":false,
			"user_data":null,
			"private_networking":null
		};

		console.log("Attempting to create: "+ JSON.stringify(data) );

		needle.post("https://api.digitalocean.com/v2/droplets", data, {headers:headers,json:true}, onResponse );
	},

	getDropletInfo: function(dropletId, onResponse)
	{
		needle.get("https://api.digitalocean.com/v2/droplets/" + dropletId, {headers:headers}, onResponse)
	}
};

var name = "aapatel8"+os.hostname();
var region = "nyc3"; // Fill one in from #1
var image = "ubuntu-16-04-x64"; // Fill one in from #2
var dropletId = "";
client.createDroplet(name, region, image, function(err, resp, body)
{
	console.log(body);
	// StatusCode 202 - Means server accepted request.
	if(!err && resp.statusCode == 202)
	{
		//console.log( JSON.stringify( body, null, 3 ) );
		dropletId = body["droplet"]["id"];
		console.log("Droplet id is " + dropletId);
	}
});

var ip = "";

setTimeout(callGetDropletInfo, 20000);

function callGetDropletInfo() {
	client.getDropletInfo(dropletId, function(error, response) {
		//ip = response["networks"][""]
		//console.log(JSON.stringify(response.body));
		ip = response.body["droplet"]["networks"]["v4"][0]["ip_address"];
		console.log("IP address is " + ip);

		sleep.sleep(30);

		const sftpConfig = {
		    host: ip,
		    port: '22',
		    username: 'root',
		    privateKey: fs.readFileSync('/Users/akshitpatel/.ssh/id_rsa'),
		    readyTimeout: 99999
		};

		var Client = require('ssh2-sftp-client');
		var sftp = new Client();

		sftp.connect(sftpConfig).then(() => {
		    return sftp.mkdir('/root/' + 'templates', true);
		}).
		then(() => {
			return sftp.put('/Users/akshitpatel/.ssh/id_rsa', 
			    	'/root/id_rsa');	
		}).
		then(() => {
			return sftp.put('/Users/akshitpatel/Desktop/School/CSC519/HW1.2/templates/.profile', 
			    	'/root/.profile');	
		}).
		then(() => {
			exec('chmod 600 id_rsa && sudo apt-get update && sudo apt-get -y install python', {
			  user: 'root',
			  host: ip,
			}, function (err, stdout, stderr) {
			  console.log(err, stdout, stderr)
			}).pipe(process.stdout);

			var logger = fs.createWriteStream('inventory', {
			  flags: 'w' // 'a' means appending (old data will be preserved)
			});

			logger.write("[main]\n" + ip + " ansible_ssh_user=root " + "ansible_ssh_private_key_file=/Users/akshitpatel/.ssh/id_rsa\n");

			logger.end();

			console.log("Everything worked!");
			return sftp.end();
		}).
		catch((err) => {
		    console.log(err, 'catch error');
		});
	});
}
