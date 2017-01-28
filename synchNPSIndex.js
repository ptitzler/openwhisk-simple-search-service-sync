// require https://www.npmjs.com/package/openwhisk client library
var openwhisk = require('openwhisk');
var request = require('request');

function main(params) {

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
				sss_request_options.method = 'POST';
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
			// TODO lookup document ID
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
