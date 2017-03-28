'use strict';

class commentsCollections {

	getSchema(Schema) {
		let schema = new Schema({
			title: {
				type: String,
				required: true
			},
			text: {
				type: String,
				required: true
			},
			parentId: {
				type: String
			}
		});
		return schema;
	}
}

module.exports = commentsCollections;