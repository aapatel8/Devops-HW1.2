// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');

var sleep   = require("sleep");

var exec = require('ssh-exec');

var fs = require('fs');

// Set the region 
AWS.config.update({region: 'us-east-1'});

// Create EC2 service object
var ec2 = new AWS.EC2({apiVersion: '2016-11-15'});

var params = {
	ImageId: 'ami-94382bee',
	InstanceType: 't2.micro',
	MinCount: 1,
	MaxCount: 1,
	KeyName: "DevOps"
};

var instanceId = "";

// Create the instance
ec2.runInstances(params, function(err, data) {
	if (err) {
		console.log("Could not create instance", err);
		return;
	}
	console.log(data);
	instanceId = data.Instances[0].InstanceId;
	console.log("Created instance", instanceId);

	// Add tags to the instance
	params = {Resources: [instanceId], Tags: [
	{
		Key: 'Name',
		Value: 'DevOps Example'

	}
	]};
	ec2.createTags(params, function(err) {
		console.log("Tagging instance", err ? "failure" : "success");
	});
});

setTimeout(callGetInstanceInfo, 40000);

function callGetInstanceInfo() {
	console.log("Checking instance", instanceId);
	var params = {
		Filters: [
		{
			Name: "instance-id", 
			Values: [
			instanceId
			]
		}
	  ]
	};
	ec2.describeInstances(params, function(err, data) {
	   if (err) 
		console.log(err, err.stack); // an error occurred
	   else
	   	console.log(data);
	   var ip = data.Reservations[0].Instances[0].PublicDnsName;

	   exec('sudo apt-get update && sudo apt-get -y install python', {
		  user: 'ubuntu',
		  host: ip,
		  key: fs.readFileSync('/Users/akshitpatel/.ssh/DevOps.pem'),
		  readyTimeout: 99999
		}, function (err, stdout, stderr) {
		  console.log(err, stdout, stderr)
		}).pipe(process.stdout);

		var logger = fs.createWriteStream('inventory', {
		  flags: 'w'
		});

		logger.write("[main]\n" + ip + " ansible_ssh_user=ubuntu " + "ansible_ssh_private_key_file=/Users/akshitpatel/.ssh/DevOps.pem\n");

		logger.end();

		console.log("Everything worked!");
	});
}