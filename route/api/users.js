'use strict';

let
	async = require('asyncawait/async'),
	await = require('asyncawait/await');

class usersApi {

	constructor( app, model, files ) {
		this.requestParse( app, model, files );
	}

	requestParse( app, model, files ) {

		// Получение всех пользователей с количеством комментариев и сортировкой
		app.get( '/users/comments-count', async (function( req, res ) {
			let usersList = await ( model.createModel( 'users', null, null, 'aggregate', [
					{ '$project': { 'username': true, 'count': { '$size': '$comments.text' } } },
					{ '$sort': { 'count': -1 } }
				] ) );
			res.json( usersList );
		}));

		// Получение всех юзеров (с их комментариями, без сортировки)
		app.get( '/users', async (function( req, res ) {
			let usersList = await ( model.createModel( 'users', null, null, 'get', [ {} ] ) );
			res.json( usersList );
		}));

		// Передача инициативы по цепочке
		if ( files.length ) new (require( './' + files.pop() ))( app, model, files );

		// 404
		app.use( function( req, res, next ) {
			res.status(404).send();
		});

	}

}

module.exports = usersApi;