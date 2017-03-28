'use strict';

class usersCollections {

	getSchema( Schema ) {
		let CommentsSchema = new (require('./comments'))();
		let TokensSchema = new (require('./tokens'))();
		let commentsSchema = CommentsSchema.getSchema( Schema );
		let tokenSchema = TokensSchema.getSchema( Schema );
		let schema = new Schema({
			username: {
				type: String,
				unique: true,
				required: true
			},
			hashedPassword: {
				type: String,
				required: true
			},
			salt: {
				type: String,
				required: true
			},
			comments: {
				type: [commentsSchema]
			},
			commentsCount: {
				type: Number
			},
			token: {
				type: tokenSchema
			}
		});
		return schema;
	}
}

module.exports = usersCollections;