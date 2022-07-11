const { BaseModel } = require('component-model');

/*
XXX if only the helpers genearted by the DSL would also provide server-
side only model linkages...
*/

class SubmissionComment extends BaseModel {

    static get tableName() {
        return 'submission-comments';
    }

    static get schema() {
        return {
            type: 'object',
            properties: {
                submission_id: { type: ['string'], format: 'uuid' },
                comment_id: { type: ['integer'] },
            }
        };
    }

    $beforeInsert() {
        // do nothing
    }

    static get relationMappings() {
        return {}
    }

    // Required for relation resolution
    static get relationFieldNames() {
        return [];
    }

    // Required for relation resolution
    static get belongsToOneRelationFields() {
        return [];
    }

    static get defaultEager () {
        return null;
    }

}

exports.model = exports.SubmissionComment = SubmissionComment;
