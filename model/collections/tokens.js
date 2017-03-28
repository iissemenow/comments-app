'use strict';

class tokensCollections {

	getSchema(Schema) {
		let schema = new Schema({
			token: {
				type: String,
				required: true
			},
			expires: {
				type: Date,
				required: true
			}
		});
		return schema;
	}
}

module.exports = tokensCollections;