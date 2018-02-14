# CSC519-HW1.2

* mainDO.js - nodejs script to create/setup Digital Ocean instance
	* CHANGE - the ssh_key id passed in when creating a droplet is now an environment variable and no longer hardcoded.
* mainAWS.js - nodejs script to create/setup AWS instance
* playbookDO.yml - ansible playbook to configure Digital Ocean instance to run Coffeemaker
* playbookAWS.yml - ansible playbook to configure AWS to run Coffeemaker

1. Define idempotency. Give two examples of an idempotent operation and non-idempotent operation.  
A. Idempotency is the concept that a certain operation can be called multiple times without changing the result.
   One example of idempotency is calling a GET HTTP request that returns a list of images available on Digital Ocean. Multiple
   calls should still give the same result. Second example of idempotency is a maven build. Successive calls of maven
   build should simply keep rebuilding the project and not cause variations (unless the project is changed).
   One example of a non-idempotent operation is calling a DELETE HTTP request that deletes a particular instance. Successive
   calls should fail since the instance has already been deleted by the first call. Second example of a non-idempotent
   operation is when using ssh-keygen to generate ssh keys. Successive calls will create new keys each time.

2. Describe several issues related to management of your inventory.  
A. The main issues faced during management of my inventory was creating a standard way for storing all the ssh keys, 
   API tokens, Access IDs, passwords and other sensitive information. For this homework I simply kept all these in the
   main homework directory I had created. However, this method can be inefficient on the large scale and would require
   a proper standard that defines where the appropriate data files are stored and how they can be accessed by ansible and/or
   other scripts.

3. Describe two configuration models. What are disadvantages and advantages of each model?  
A. The two models are push and pull. In the push model, the main central server pushes configuration and software to the 
   individual servers. In the pull model, the individual servers contact the central server, download and manage the
   configuration themselves. The advantage of the push model is that it's easier to manage; for example, the central server 
   can determine in which order to configure the individual servers. The disadvantage of the push model is that the central
   server needs to keep a connection to every individual server and this can leads to problems with performance and scalability.
   The advantage of the pull model is that the individual servers can register and configure themselves without intervention
   from the master. The disadvantage of the pull model is that it can be more complex and there isn't a good way to ensure
   the sequence of configuration among the individual servers. 

4. What are some of the consquences of not having proper configuration management?  
A. Getting a project to run in different environments may become much more difficult. Changes in project may become tougher
   to diagnose. Code changes may not be merged/integrated properly, causing constant conflicts and build failures. 

Screencast - https://youtu.be/VspxdeGcDKs