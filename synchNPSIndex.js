// require https://www.npmjs.com/package/openwhisk client library
var openwhisk = require('openwhisk');
var request = require('request');

/*
 * Action applies Cloudant database changes to a Simple-Search-Service 
 * (https://github.com/ibm-cds-labs/simple-search-service).
 */
function main(params) {

	// check input
	if(! isValidInput(params))
 	{
		return ({ok:true, response: 'Ignored payload: ' + JSON.stringify(params)});
	}

	// Simple-search-service instance API request URL
	var sss_request_url = 'https://nps-cloudplatform-simple-search-service.mybluemix.net/row';
	var sss_request_options = {
		url: sss_request_url,
		auth: {
   			user: 'username',
    		pass: 'password'
  		}  		
	};

	return new Promise(function(resolve, reject) {
		if(! params.deleted) {
			// document was inserted/updated; fetch and update SSS index
			var ow = openwhisk();
			ow.actions.invoke({actionName: 'npsCloudant/read',
				               blocking: true,
		                       params: {
		                       	id: params.id, 
		                       	includeDoc: true
		                       }})
			.then(function(body) {
				if(params.changes[0].rev.startsWith('1-')) {
					// first document revision - this is an INSERT operation
					sss_request_options.method = 'POST';	
				}
				else {
					// n-th document revision - this is an UPDATE operation
					sss_request_options.method = 'PUT';
					return reject({ok:false, err: 'Index updates are not supported.'});
					// TODO: To support updates we need to generate the appropriate search
					// document id
					// sss_request_options.url = sss_request_options.url + '/'	+ 'TBD';
				}
				
				// asemble payload
				sss_request_options.form = {
					offering: body.response.result.data.offering_id || 'undefined',
					score: body.response.result.data.score || 0,
					tags: body.response.result.data.tags || [],
					comment: body.response.result.data.comment || ''
				};
			   	request(sss_request_options, 
			   			function(err, response, body) {
	   						if((err) || (JSON.parse(body).hasOwnProperty('error'))){
	   							var msg = err || body;
			   					return reject({ok: false, err: 'Error updating SSS index: ' + msg});				
			   				}
							return resolve({ok:true, response:body});
			   	});	
			})
			.catch(function(err) {
				// error; document could not be fetched
				reject({ok:false, err: 'Error fetching document ' + params.id + ': ' + err});
			});  		
 	 	}
	  	else {
  			// document was deleted; remove from index
			sss_request_options.method = 'DELETE';
			return reject({ok:false, err: 'Index deletes are not supported.'});
			// TODO: To support updates we need to generate the appropriate search
			// document id
			sss_request_options.url = sss_request_options.url + '/' + 'TBD';
	   			request(sss_request_options, 
	   				function(err, response, body) {
	   					if((err) || (JSON.parse(body).hasOwnProperty('error'))){
	   						var msg = err || body;
		   					return reject({ok: false, err: 'Error removing doc from SSS index: ' + msg});				
		   				}
						return resolve({ok:true, response:body});
	   		});  		
  		}
  	});
}

/**
 * Determines whether action input can be processed.
 */
function isValidInput(params) {
	return((params) && 
	      (params.hasOwnProperty('id')) &&
	      (Array.isArray(params.changes)) &&
	      (params.changes.length > 0) &&
	      (params.changes[0].hasOwnProperty('rev')) && 
	      (! params.id.startsWith('_design/')));
}

