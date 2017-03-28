'use strict';

let
	async = require('asyncawait/async'),
	await = require('asyncawait/await');

class commentsApi {

	constructor( app, model, files ) {
		this.requestParse( app, model, files );
	}

	requestParse( app, model, files ) {

		// Добавление комментария
		app.post( '/comments', async (function( req, res ) {
			let data = [ { 'username': req.body.login } ];
			data.push( {
				'$inc': {
					'commentsCount': 1
				},
				'$push': {
					'comments': {
						'title': req.body.title,
						'text': req.body.text
					}
				}
			} );
			if ( req.body.parentId ) {
				data[ 1 ][ '$push' ][ 'comments' ][ 'parentId' ] = req.body.parentId;
			}
			let newComment = await ( model.createModel( 'users', null, null, 'put', data ) );
			res.json( newComment );
		}));

		// Получение списка комментариев в виде массива
		app.get( '/comments', async (function( req, res ) {
			let commentsList = await ( model.createModel( 'users', null, null, 'aggregate', [
					{ '$unwind': { 'path': '$comments' } }
				] ) );
			commentsList.forEach( function( item ){
				if ( !item.comments.parentId ) item.arrDepth = model.maxDepth( commentsList, item.comments._id.toString() );
			});
			res.json( commentsList );
		}));

		// Получение списка комментариев в виде дерева
		app.get( '/comments/tree', async (function( req, res ) {
			let commentsList = await ( model.createModel( 'users', null, null, 'aggregate', [
					{ '$unwind': { 'path': '$comments' } }
				] ) );
			commentsList = model.recurseTree( commentsList, 2 );
			commentsList.forEach( function( item ){
				if ( !item.arrDepth ) item.arrDepth = 1;
			});
			res.json( commentsList );
		}));

		// Передача инициативы по цепочке
		if ( files.length ) new (require( './' + files.pop() ))( app, model, files );

		// 404
		app.use( function( req, res, next ) {
			res.status(404).send();
		});

	}

}

module.exports = commentsApi;