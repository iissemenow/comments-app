'use strict';

const
	fCount = require( './config/config' ).forkCount,
	cluster = require( 'cluster' );

/* Форки (количество настраивается в конфиге). Распараллеливание запросов. */
if ( cluster.isMaster ) {
	for ( let i = 0; i < fCount; i++ )
		cluster.fork();
	cluster.on('exit', ( worker, code, signal ) => {
		console.log( `Процесс ${worker.process.pid} прибит` );
		setTimeout(function() {
			cluster.fork();
		}, 2000);
	});
} else {
	let app = require( './route/route' ).app;
}