const { BaseModel } = require('component-model');
const { Comment } = require('./comment');

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
        return {
            comment: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Comment,
                join: {
                    from: `${this.tableName}.commentId`,
                    to: `${Comment.tableName}.id`
                }
            }
        };
    }

    // Required for relation resolution
    static get relationFieldNames() {
        return ['comment'];
    }

    // Required for relation resolution
    static get belongsToOneRelationFields() {
        return [
            {
                field: {
                    field: 'comment',
                    type: 'Comment',
                    joinField: 'commentId',
                    model: Comment
                },
                join: 'authorId'
            }
        ];
    }

    static get defaultEager () {
        return 'comment';
    }

}

exports.model = exports.SubmissionComment = SubmissionComment;
