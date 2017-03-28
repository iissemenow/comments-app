'use strict';

let
	mongoose = require( 'mongoose' ),
	Schema = mongoose.Schema,
	async = require('asyncawait/async'),
	await = require('asyncawait/await'),
	Models = [];
const
	config = require( './../config/config' ).mongoose,
	crypto = require( 'crypto' ),
	bodyParser = require( 'body-parser' ).urlencoded({extended: false}),
	uuidV1 = require('uuid/v1');

	mongoose.Promise = global.Promise;

/* Базовый класс модели. */
class model {

	/* В конструкторе и деструкторе подключение к базе и отключение от нее, соответственно. */
	constructor() {
		mongoose.connect( 'mongodb://' + config.host + ':' + config.port + '/' + config.dbName );
	}

	destructor() {
		mongoose.disconnect();
	}

	/* Основной конструктор запросов к базе. Принимает:
		1. Тип запроса (api) в качестве названия коллекции.
		2. req, res.
		3. Метод и данные для обработки. */
	createModel( api, req, res, method = null, data = null ) {
		
		// Зная api подключаем нужный файл коллекции и получаем схему.
		let apiFile = api;
		let self = this;
		if ( api == 'register' || api == 'login' ) apiFile = 'users';
		let localModel = new ( require( './collections/' + apiFile ) );
		let createSchema = localModel.getSchema( Schema );

		// Заворачиваем любой ответ в промис
		return async (function(){
			// Специализированные запросы (регистрация и проч.)
			if ( api == 'register' ) {
				return await ( self.register( createSchema, req, res ) );
			}
			if ( api == 'login' ) {
				return await ( self.login( createSchema, req, res ) );
			}

			/* Общие запросы (method = post/get/put/delete, data = данные для операции)
				Для обработки вызывается соответствующий метод класса model */
			if ( method ) return await ( self[ method ]( createSchema, api, data ) );
		})();		
	}

	/* Получение схемы коллекции */
	getModel( name, createSchema ) {
		if ( !Models[ name ] )
			Models[ name ] = mongoose.model( name, createSchema );
		return Models[ name ];
	}

	/* Регистрация нового юзера */
	register( createSchema, req, res ) {
		let login = req.body.login;
		let password = req.body.password;
		let self = this;
		createSchema.methods.encryptPassword = function( password ) {
			return crypto
					.createHmac( 'sha1', this.salt )
					.update( password )
					.digest( 'hex' );
		}
		createSchema.virtual( 'password' )
			.set( function( password ) {
				this._plainPassword = password;
				this.salt = Math.random() + '';
				this.hashedPassword = this.encryptPassword( password );
			});
			// .get(function() { return this._plainPassword; });
		/* Метод проверки:
		createSchema.methods.checkPassword = function( password ) {
			return this.encryptPassword( password ) === this.hashedPassword;
		}*/
		let User = this.getModel( "users", createSchema );
		let user = new User({
			username: login,
			password: password,
			comments: [],
			commentsCount: 0
		});
		return async (function() {
			let doub = await ( self.createModel( 'users', null, null, 'get', [ { 'username': login } ] ) );
			if ( doub.length ) return false;
			let query = await ( user.save() );
			return await ( self.login( createSchema, req, res ) );
		})();
	}

	/* Авторизация юзера */
	login( createSchema, req, res ) {
		let User = this.getModel( "users", createSchema );
		return async ( function(){
			let query = await ( User.findOne({ 'username': req.body.login }).exec() );
			if ( query ) {
				let hashedPassword = crypto
										.createHmac( 'sha1', query.salt )
										.update( req.body.password )
										.digest( 'hex' );
				query = await ( User.findOne({ 'hashedPassword': hashedPassword }).exec() );
			}
			if ( query ) query = true;
			return query;
		})();
	}

	/* Простые методы работы с базой: */

	post( createSchema, api, data ) {
		let postModel = this.getModel( api, createSchema );
		let postmodel = new postModel( data );
		return async ( function(){
			return await ( postmodel.save() );
		})();
	}

	delete( createSchema, api, data ) {
		let deleteModel = this.getModel( api, createSchema );
		return async ( function(){
			return await ( deleteModel.deleteMany( data ).exec() );
		})();
	}

	get( createSchema, api, data ) {
		let getModel = this.getModel( api, createSchema );
		return async ( function(){
			return await ( getModel.find( ...data ).exec() );
		})();
	}

	put( createSchema, api, data ) {
		let putModel = this.getModel( api, createSchema );
		return async ( function(){
			return await ( putModel.update( ...data ).exec() );
		})();
	}

	/* Сложные запросы: */

	aggregate( createSchema, api, data ) {
		let aggModel = this.getModel( api, createSchema );
		return async ( function(){
			return await ( aggModel.aggregate( ...data ).exec() );
		})();
	}

	/* Подсчитывает максимальный уровень вложенности для данного комментария */

	maxDepth( commentsArr, thisId ) {
		let maxD = 0;
		let parents = [ thisId ];
		let childrens = [];
		do {
			childrens = [];
			commentsArr.forEach( function( item ){
				if ( item.comments.parentId && !!~parents.indexOf( (item.comments.parentId).toString() ) ) 
					childrens.push( (item.comments._id).toString() );
			});
			parents = childrens;
			maxD++;
		} while( childrens.length > 0 );
		return maxD;
	}

	/* Перегоняем массив объектов в дерево */

	recurseTree( treeArr, arrDepth ) {
        // Собираем всех "бездетных", т.е. нижние слои
        let noParent = treeArr.filter( function( item1 ){
            return ( item1.comments.parentId && treeArr.filter( function( item2 ){
                return item2.comments.parentId == item1.comments._id;
            }).length === 0);
        });
        // Добавляем "бездетных" к их родителям, а самих удаляем из основного массива
        noParent.map( function( item1 ){
            treeArr.map( function( item2 ){
                if ( item2.comments._id == item1.comments.parentId ) {
                    if ( !item2.children ) item2.children = [];
                    if ( !item2.comments.parentId ) item2.arrDepth = arrDepth;
                    item2.children.push( item1 );
                }
            });
            treeArr.map( function( item2, i ){
                if ( item2.comments._id == item1.comments._id ) delete treeArr[ i ];
            });
        });
        // Чистим null'ы
        treeArr = treeArr.filter( function( e ) {
            return typeof e !== 'undefined';
        });
        arrDepth++;
        // Если "бездетные" есть, то запускаем еще раз
        if ( noParent.length !== 0 ) treeArr = this.recurseTree( treeArr, arrDepth );
        return treeArr;
	}

}

module.exports = model;