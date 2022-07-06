const { BaseModel } = require('component-model');
const { Identity } = require('./identity');

const { resolveUserForContext, userIdentityIdForContext } = require('../shared-helpers/access');

class Comment extends BaseModel {

    static get tableName() {
        return 'comment';
    }

    static get schema() {
        return {
            type: 'object',
            properties: {
                id: { type: ['integer'] },
                author_id: { type: ['string', 'null'], format: 'uuid'},
                comment_body: { type: ['string', 'null'] },
            }
        };
    }

    static get relationMappings() {

        return {
            author: {
                relation: BaseModel.BelongsToOneRelation,
                modelClass: Identity,
                join: {
                    from: `${this.tableName}.author_id`,
                    to: `${Identity.tableName}.id`
                }
            }
        };
    }

    // Required for relation resolution
    static get relationFieldNames() {
        return ['author'];
    }

    // Required for relation resolution
    static get belongsToOneRelationFields() {
        return [
            {
                field: {
                    field: 'author',
                    type: 'Identity',
                    joinField: 'author_id',
                    model: Identity
                },
                join: 'author_id'
            }
        ];
    }

    static get defaultEager () {
        return 'author';
    }

}

exports.model = exports.Comment = Comment;


exports.resolvers = {

    Mutation: {

        commentOnSubmission: async function(_, {input:{comment_body}}, context) {
            const author_id = userIdentityIdForContext(context);
            const currentDateTime = new Date().toISOString();
            const comment = new Comment({
                created: currentDateTime,
                updated: currentDateTime,
                author_id: author_id,
                comment_body: comment_body
            });

            await comment.save();
            return comment;
        }
    }

};
