'use strict';

let
	async = require( 'asyncawait/async' ),
	await = require( 'asyncawait/await' );
const
	port = require( './../config/config' ).port,
	express = require( 'express' ),
	bodyParser = require( 'body-parser' ).urlencoded( { extended: false } ),
	cookieParser = require( 'cookie-parser' )(),
	uuidV1 = require( 'uuid/v1' ),
	app = express(),
	model = new (require( './../model/model' ));

/* Основной роутер. */
class route {

	/* В конструкторе класса при вызове:
		1. Подключаем парсеры запросов и куков.
		2. Запускаем сервер на прослушивание порта.
		3. Когда он запустился, дергаем метод requestParse() (непосредственно, маршрутизация) */
	constructor() {
		let self = this;
		app.use( cookieParser );
		app.use( bodyParser );
		app.listen( port, function(){
			self.requestParse();
		});
	}

	getApp() {
		return app;
	}

	getModel() {
		return model;
	}

	requestParse() {

		console.log( 'Сервер слушает вас...' );
		if (process.env.NODE_ENV == 'test') console.log( '	' );
		let self = this;

		/* Чисто технические, необязательные запросы, не относящиеся к API.
			Выводят html. В дальнейшем могут быть удалены или изменены.
			Домашняя страница содержит описание API и формы для пробных запросов.
			Вторая страница - с выводом сообщения (редирект при отсутствии авторизации). */
		app.get('/', function(req, res) {
			require( './../view/home.js' )(res);
		});

		/* API: */

		/* Выделенные запросы: регистрация, авторизация, выход, удаление юзера */
		// Регистрация
		app.post( '/register', async ( function( req, res ) {
			let itsOk = await ( model.createModel( 'register', req, res ) );
			if ( itsOk ) self.createToken( req, res );
			else self.autError( res );
		}));
		// Авторизация
		app.post( '/login', async ( function( req, res ) {
			let itsOk = await ( model.createModel( 'login', req, res ) );
			if ( itsOk ) self.createToken( req, res );
			else self.autError( res );
		}));
		// ...и так далее
		app.put( '/logout', function( req, res ) {
			self.deleteToken( req, res );
		});
		app.delete( '/users/:login', async ( function( req, res ) {
			let data = { 'username': req.params.login };
			let inf = await ( model.createModel( 'users', null, null, 'delete', data ) );
			self.deleteToken( req, res );
		}));

		// Проверка токена...
		app.use( async ( function( req, res, next ) {
			let auth = true;
			let token = req.cookies.token;
			if ( !token ) auth = false;
			else {
				let currentDate = new Date( Date.now() + 1 );
				let data = [{ 'token': token, 'expires': { '$lte': currentDate } }, {}, {}];
				let dbToken = await ( model.createModel( 'tokens', null, null, 'get', data ) );
				if ( !dbToken ) auth = false;
				else self.updateToken( req, res );
			}
			if ( auth ) next();
			else {
				self.deleteToken( req, res );
				// Возможно - редирект на главную:
				// res.redirect('/');
			}
		}));

		// Распределение остальных API
		new (require( './api/all' ))( app, model );

	}

	/* Ошибка авторизации */
	autError( res ) {
		res.status(401).send({'err': 1, 'message': 'Отсутствует авторизация'});
	}

	/* Обновление токена */
	updateToken( req, res ) {
		let token = req.cookies.token;
		let expires = new Date( Date.now() + 3600000 );
		res.cookie( 'token', token, { expires: expires } );
		if ( token ) {
			async ( function(){
				let login = await ( model.createModel( 'users', null, null, 'get', [ { 'token.token': token } ] ) );
					if ( login.length != 0 ) {
					login = login[0].username;
					let expires = new Date( Date.now() + 3600000 );
					let data = [ { 'username': login }, { 'token.token': token, 'token.expires': expires } ];
					await ( model.createModel( 'users', null, null, 'put', data ) );
				}
			})();
		}
	}

	/* Выдача токена */
	createToken( req, res ) {
		let token = uuidV1();
		let expires = new Date( Date.now() + 3600000 );
		res.cookie('token', token, { expires: expires });
		let data = [ { 'username': req.body.login }, { 'token.token': token, 'token.expires': expires } ];
		async ( function(){
			await ( model.createModel( 'users', null, null, 'put', data ) );
		})();
		res.send({'err': 0});
	}

	/* Удаление токена */
	deleteToken( req, res ) {
		let token = req.cookies.token;
		if ( token ) {
			res.clearCookie('token');
			async ( function(){
				let login = await ( model.createModel( 'users', null, null, 'get', [ { 'token.token': token } ] ) );
				if ( login.length != 0 ) {
					login = login[0].username;
					let expires = new Date( Date.now() - 3600000 );
					let data = [ { 'username': login }, { 'token.token': null, 'token.expires': expires } ];
					await ( model.createModel( 'users', null, null, 'put', data ) );
				}
			})();
		}
		this.autError( res );
	}

}

let Route = new route();

module.exports.app = Route.getApp();

module.exports.model = Route.getModel();