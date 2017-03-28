'use strict';

process.env.NODE_ENV = 'test';

const
    assert = require( 'assert' ),
    request = require( 'supertest' ),
    route = require( './../route/route' );
let
	app = route.app,
	model = route.model,
	async = require( 'asyncawait/async' ),
	await = require( 'asyncawait/await' );


console.log( '	' );
console.log( '	' );
console.log( '	' );
console.log( '		*** Тест приложения ***' );
console.log( '		Старт' );
console.log( '	' );

describe( 'Тестирование API', () => {

	let cookie = [];

	it( "GET:'/' Главная страница" , function( done ){

		console.log( ' ' );
		request( app )
			.get( '/' )
			.expect( 200 )
			.end( done );

	});

	it( "GET:'/users' Попытка войти без авторизации (отказ)" , function( done ){

		request( app )
			.get( '/users' )
			.expect( '{"err":1,"message":"Отсутствует авторизация"}' )
			.expect( 401 )
			.end( done );

	});

	it( "POST:'/register' Регистрация (с авторизацией)" , function( done ){

		request( app )
			.post( '/register' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send( { 'login': 'admin', 'password': '123456' } )
			.expect( '{"err":0}' )
			.expect( 200 )
			.end( function( err, res ) {
				cookie = res.header['set-cookie'][0];
				done();
			});

	});

	it( "GET:'/users' Неправильный токен" , function( done ){

		request( app )
			.get( '/users' )
			.set( 'Cookie', '777' )
			.expect( 401 )
			.end( function( err, res ) {
				done();
			});

	});

	it( "GET:'/users' Попытка войти с авторизацией по токену" , function( done ){

		request( app )
			.get( '/users' )
			.set( 'Cookie', cookie )
			.expect( 200 )
			.end( done );

	});

	it( "PUT:'/logout' Деавторизация" , function( done ){

		request( app )
			.put( '/logout' )
			.set( 'Cookie', cookie )
			.expect( 401 )
			.end( done );

	});

	it( "POST:'/register' Попытка повторной регистрации с тем же логином" , function( done ){

		request( app )
			.post( '/register' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send( { 'login': 'admin', 'password': '1234567' } )
			.expect( '{"err":1,"message":"Отсутствует авторизация"}' )
			.expect( 401 )
			.end( done );

	});

	it( "POST:'/login' Попытка авторизации с неправильным ключом" , function( done ){

		request( app )
			.post( '/login' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send( { 'login': 'admin', 'password': '1234567' } )
			.expect( '{"err":1,"message":"Отсутствует авторизация"}' )
			.expect( 401 )
			.end( done );

	});

	it( "POST:'/login' Авторизация" , function( done ){

		request( app )
			.post( '/login' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send( { 'login': 'admin', 'password': '123456' } )
			.expect( '{"err":0}' )
			.expect( 200 )
			.end( function( err, res ) {
				cookie = res.header['set-cookie'][0];
				done();
			});

	});

	it( "POST:'/comments' Сохранение комментария" , function( done ){

		console.log( ' ' );
		request( app )
			.post( '/comments' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.send( { 'login': 'admin', 'title': 'Заголовок 1', 'text': 'Некий пробный текст' } )
			.expect( '{"n":1,"nModified":1,"ok":1}' )
			.expect( 200 )
			.end( done );

	});

	it( "POST:'/register' Регистрация нового пользователя с комментарием" , function( done ){

		request( app )
			.post( '/register' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.send( { 'login': 'admin2', 'password': '654321' } )
			.expect( '{"err":0}' )
			.expect( 200 )
			.end( function( err, res ) {
				cookie = res.header['set-cookie'][0];
				request( app )
					.post( '/comments' )
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.set( 'Cookie', cookie )
					.send( { 'login': 'admin2', 'title': 'Заголовок 2.1', 'text': 'Новый комментарий' } )
					.expect( '{"n":1,"nModified":1,"ok":1}' )
					.expect( 200 )
					.end( done );
			});

	});

	let comments;
	it( "GET:'/comments' Получение списка комментариев" , function( done ){

		request( app )
			.get( '/comments' )
			.set( 'Cookie', cookie )
			.expect( 200 )
			.end( function( err, res ) {
				comments = res.body;
				if (res.body.length == 2) done();
			});

	});

	let commId;
	it( "POST:'/comments' Добавление вложенных комментариев" , function( done ){

		let ind = 1;
		if ( comments[ ind ].username != 'admin2' ) ind = 0;
		commId = comments[ ind ].comments._id;
		request( app )
			.post( '/comments' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.timeout( { 'deadline': 3000 } )
			.send( { 'login': 'admin2', 'title': 'Заголовок 2.2', 'text': 'Новый комментарий 2', 'parentId': commId } )
			.expect( '{"n":1,"nModified":1,"ok":1}' )
			.expect( 200 )
			.end( function( err, res ) {
				request( app )
					.get( '/comments' )
					.set( 'Cookie', cookie )
					.expect( 200 )
					.end( function( err, res ) {
						comments = res.body;
						let ind = 0;
						if ( comments[ ind ].username != 'admin2' ) ind = 1;
						if ( comments[ ind ].comments._id == commId ) ind = 2;
						commId = comments[ ind ].comments._id;
						request( app )
							.post( '/comments' )
							.set('Content-Type', 'application/x-www-form-urlencoded')
							.set( 'Cookie', cookie )
							.send( { 'login': 'admin2', 'title': 'Заголовок 2.3', 'text': 'Новый комментарий 3', 'parentId': commId } )
							.expect( '{"n":1,"nModified":1,"ok":1}' )
							.expect( 200 )
							.end( function( err, res ) {
								comments = res.body;
								done()
							});
					});
			});

	});

	it( "GET:'/comments/tree' Получение дерева комментариев (с уровнем вложенности)" , function( done ){

		request( app )
			.get( '/comments/tree' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.expect( 200 )
			.end( function( err, res ) {
				comments = res.body;
				let ind = 1;
				if ( comments[ ind ].username != 'admin2' ) ind = 0;
				if ( comments[ ind ].arrDepth == 3 ) done();
			});

	});

	it( "GET:'/users' Получение всех пользователей с комментариями (массив)" , function( done ){

		console.log( ' ' );
		request( app )
			.get( '/users' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.expect( 200 )
			.end( function( err, res ) {
				if ( res.body.length == 2 ) done();
			});

	});

	it( "GET:'/users/comments-count' Получение отсортированных пользователей с количеством комментариев" , function( done ){

		request( app )
			.get( '/users/comments-count' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.expect( 200 )
			.end( function( err, res ) {
				let users = res.body;
				if ( users[ 0 ].username == 'admin2' && users[ 0 ].count == 3 ) done();
			});

	});

	it( "GET:'/some-path' Проверка на 404" , function( done ){

		console.log( ' ' );
		request( app )
			.get( '/some-path' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.expect( 404 )
			.end( done );

	});

	it( "DELETE:'/users/:login' Удаление пользователей (с деавторизацией)" , function( done ){

		request( app )
			.delete( '/users/admin' )
			.set('Content-Type', 'application/x-www-form-urlencoded')
			.set( 'Cookie', cookie )
			.expect( 401 )
			.end( function( err, res ) {
				request( app )
					.delete( '/users/admin2' )
					.set('Content-Type', 'application/x-www-form-urlencoded')
					.set( 'Cookie', cookie )
					.expect( 401 )
					.end( done );
			});
		console.log( ' ' );

	});

});

describe( 'Тестирование модели', () => {

	let
		data,
		result;
	it( "Добавление в базу (POST)" , function( done ){

		console.log( ' ' );
		let expires = new Date( Date.now() - 3600000 );
		data = {
			'username': 'admin3',
			'hashedPassword': 'fff',
			'salt': '777' ,
			'comments': [],
			'commentsCount': 0,
			'token': {
				'token': 'abc-def-ghi',
				'expires': expires
			}
		};
		async ( function() {
			result = await ( model.createModel( 'users', null, null, 'post', data ) );
			if ( result.username == 'admin3' ) done();
		})();

	});

	it( "Изменение в базе (PUT)" , function( done ){

		data = [
			{ 'username': 'admin3' },
			{ 'commentsCount': 1 }
		];
		async ( function() {
			result = await ( model.createModel( 'users', null, null, 'put', data ) );
			if ( result.nModified == 1 ) done();
		})();

	});

	it( "Изменение в базе (AGGREGATE)" , function( done ){

		data = [
			{ '$match': { 'username': 'admin3' } },
			{ '$project': { 'count': { '$sum': { '$add': [ '$commentsCount', 3 ] } } } }
		];
		async ( function() {
			result = await ( model.createModel( 'users', null, null, 'aggregate', data ) );
			if ( result[ 0 ].count == 4 ) done();
		})();

	});

	it( "Получение из базы (GET)" , function( done ){

		data = [
			{ 'username': 'admin3' }
		];
		async ( function() {
			result = await ( model.createModel( 'users', null, null, 'get', data ) );
			if ( result[ 0 ].commentsCount == 1 ) done();
		})();

	});

	it( "Удаление из базы (DELETE)" , function( done ){

		data = {
			'username': 'admin3'
		};
		async ( function() {
			result = await ( model.createModel( 'users', null, null, 'delete', data ) );
			if ( result ) done();
		})();

	});

	it( "Рассчет уровня вложенности" , function( done ){

		console.log( ' ' );
		data = [
			{ 'comments': { '_id': '1' } },
			{ 'comments': { '_id': '2', 'parentId': '1' } },
			{ 'comments': { '_id': '3', 'parentId': '1' } },
			{ 'comments': { '_id': '4', 'parentId': '2' } },
			{ 'comments': { '_id': '5', 'parentId': '3' } },
			{ 'comments': { '_id': '6', 'parentId': '4' } },
			{ 'comments': { '_id': '7', 'parentId': '5' } },
		];
		let maxDepth = model.maxDepth( data, '1' );
		if ( maxDepth == 4 ) done();

	});

	it( "Построение дерева" , function( done ){

		data = [
			{ 'comments': { '_id': '1' } },
			{ 'comments': { '_id': '2', 'parentId': '1' } },
			{ 'comments': { '_id': '3', 'parentId': '1' } },
			{ 'comments': { '_id': '4', 'parentId': '2' } },
			{ 'comments': { '_id': '5', 'parentId': '3' } },
			{ 'comments': { '_id': '6', 'parentId': '4' } },
			{ 'comments': { '_id': '7', 'parentId': '5' } },
		];
		let depth = model.recurseTree( data, 2 );
		if ( depth[ 0 ].arrDepth == 4 && depth[ 0 ].children[ 0 ].children[ 0 ].children.lehgth == 1 ) done();
		done();

	});


});