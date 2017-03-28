'use strict';

let
	async = require('asyncawait/async'),
	await = require('asyncawait/await');
const fs = require("fs");

class allApi {

	constructor( app, model ) {
		let dir = fs.readdirSync( __dirname, 'utf8' );
		let files = dir.filter(( el ) => {
			return ( el != 'all.js' );
		});

		// Передача инициативы по цепочке
		new (require( './' + files.pop() ))( app, model, files );
	}

}

module.exports = allApi;