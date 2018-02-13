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
	ImageId: 'ami-94382bee', // amzn-ami-2011.09.1.x86_64-ebs
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

// callGetInstanceInfo();

function callGetInstanceInfo() {
	console.log("Checking instance", instanceId);
	var params = {
		// Attribute: "instanceType", 
		// InstanceId: "i-0bc3e77a8417bc56d"
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
	   	//console.log(data.Reservations[0].Instances[0].PublicIpAddress); // successful response
	   var ip = data.Reservations[0].Instances[0].PublicDnsName;
	   // var ip = "ec2-34-228-15-209.compute-1.amazonaws.com";

	   const sftpConfig = {
		    host: ip,
		    port: '22',
		    username: 'ubuntu',
		    privateKey: fs.readFileSync('/Users/akshitpatel/.ssh/DevOps.pem'),
		    readyTimeout: 99999
		};

	   	var Client = require('ssh2-sftp-client');
		var sftp = new Client();

		sftp.connect(sftpConfig).then(() => {
		    return sftp.mkdir('/home/ubuntu/' + 'templates', true);
		}).
		then(() => {
			return sftp.put('/Users/akshitpatel/.ssh/id_rsa', 
			    	'/home/ubuntu/id_rsa');	
		}).
		then(() => {
			return sftp.put('/Users/akshitpatel/Desktop/School/CSC519/HW1.2/templates/.profile', 
			    	'/home/ubuntu/.profile');	
		}).
		then(() => {
			exec('chmod 600 id_rsa && sudo apt-get update && sudo apt-get -y install python', {
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
			return sftp.end();
		}).
		catch((err) => {
		    console.log(err, 'catch error');
		});
	});
}