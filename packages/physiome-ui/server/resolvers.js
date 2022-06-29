const WorkflowModel = require('component-workflow-model/model');
const { Submission } = WorkflowModel.models;
const { Identity } = require('component-workflow-model/shared-model/identity');

const { resolveUserForContext } = require('component-workflow-model/shared-helpers/access');
const { AuthorizationError, NotFoundError } = require('@pubsweet/errors');
const { pubsubManager } = require("pubsweet-server");

const AclRule = require('client-workflow-model/AclRule');
const AclActions = AclRule.Actions;

const logger = require('workflow-utils/logger-with-prefix')('physiome-ui/server');
const config = require('config');
const AdminORCIDIdentities = config.get('identity.adminIdentities');


module.exports = {

    Mutation: {

        claimSubmission: async (instance, { id:submissionId, adminId:adminId }, context, info) => {

            if(!submissionId) {
                return false;
            }

            let query = Identity.query();
            const result = await query.select(
                ['id', 'identityId', 'displayName']
            ).whereIn('identityId', AdminORCIDIdentities);

            const [submission, user] = await Promise.all([
                Submission.find(submissionId),
                resolveUserForContext(context)
            ]);

            if(!submission) {
                logger.error(`claim submission - unable to resolve submission (id = ${submissionId})`);
                return new NotFoundError(`Unable to find submission for curator modification.`);
            }

            if(!user) {
                logger.error(`claim submission - unable to resolve user for grqphql context`);
                return new Error(`Logged in user required to modify submission curator.`);
            }

            const { access, accessMatch } = submission.checkUserAccess(user, AclActions.Write);
            if(!access || !accessMatch) {
                logger.info(`claim submission - no access or access match for write action`);
                return new AuthorizationError(`Modification of submission curator not allowed.`);
            }

            const { allowedFields = [] } = accessMatch;
            if(allowedFields.indexOf('curator') === -1) {
                logger.info(`claim submission - no access to curator field`);
                return new AuthorizationError(`Modification of submission curator not allowed.`);
            }

            if(!adminId) {
                adminId = user.id;
            }
            submission.curatorId = adminId;
            await submission.save();
            await submission.publishWasModified();

            return true;
        },

        unclaimSubmission: async (instance, { id:submissionId }, context, info) => {

            if(!submissionId) {
                return false;
            }

            const [submission, user] = await Promise.all([
                Submission.find(submissionId),
                resolveUserForContext(context)
            ]);

            if(!submission) {
                logger.error(`unclaim submission - unable to resolve submission (id = ${submissionId})`);
                return new NotFoundError(`Unable to find submission for curator modification.`);
            }

            if(!user) {
                logger.error(`unclaim submission - unable to resolve user for grqphql context`);
                return new Error(`Logged in user required to modify submission curator.`);
            }

            const { access, accessMatch } = submission.checkUserAccess(user, AclActions.Write);
            if(!access || !accessMatch) {
                logger.info(`unclaim submission - no access or access match for write action`);
                return new AuthorizationError(`Modification of submission curator not allowed.`);
            }

            const { allowedFields = [] } = accessMatch;
            if(allowedFields.indexOf('curator') === -1) {
                logger.info(`unclaim submission - no access to curator field`);
                return new AuthorizationError(`Modification of submission curator not allowed.`);
            }

            if(submission.curatorId === user.id) {
                submission.curatorId = null;
                await submission.save();
                await submission.publishWasModified();
            }

            return true;
        },

        restartRejectedSubmission: async (instance, { id:submissionId }, context, info) => {

            if(!submissionId) {
                return false;
            }

            const [submission, user] = await Promise.all([
                Submission.find(submissionId),
                resolveUserForContext(context)
            ]);

            if(!submission) {
                return new NotFoundError(`Unable to find submission for curator modification.`);
            }

            if(!user) {
                return new Error(`Logged in user required to modify submission curator.`);
            }

            const isAdmin = (user.finalisedAccessGroups || []).indexOf('administrator') !== -1;
            if(!isAdmin) {
                return new AuthorizationError(`Restarting rejected submission restricted to administrators only.`);
            }

            const { access, accessMatch } = submission.checkUserAccess(user, AclActions.Task);
            if(!access || !accessMatch) {
                return new AuthorizationError(`Restarting rejected submission not allowed.`);
            }

            if(submission.phase !== "reject") {
                logger.warn(`unable to resume rejected submission as phase isn't currently marked as being rejected {submissionId = ${submissionId}`);
                return false;
            }

            submission.phase = "submitted";
            await submission.save();

            return !!(await submission.restartWorkflow("StartEvent_ResumeRejected"));
        },

        republishSubmission: async (instance, { id:submissionId }, context, info) => {

            if(!submissionId) {
                return false;
            }

            const [submission, user] = await Promise.all([
                Submission.find(submissionId),
                resolveUserForContext(context)
            ]);

            if(!submission) {
                return new NotFoundError(`Unable to find submission for republishing.`);
            }

            if(!user) {
                return new Error(`Logged in user required to republish submission.`);
            }

            const isAdmin = (user.finalisedAccessGroups || []).indexOf('administrator') !== -1;
            if(!isAdmin) {
                return new AuthorizationError(`Republishing submission restricted to administrators only.`);
            }

            const { access, accessMatch } = submission.checkUserAccess(user, AclActions.Task);
            if(!access || !accessMatch) {
                return new AuthorizationError(`Republishing submission not allowed.`);
            }

            if(submission.phase !== "published") {
                logger.warn(`unable to republish submission as phase isn't currently marked as being published {submissionId = ${submissionId}`);
                return false;
            }

            submission.phase = "publish";
            await submission.save();

            return !!(await submission.restartWorkflow("StartEvent_RepublishArticle"));
        }
    },

    Subscription: {

        publishedSubmission: {
            subscribe: async (_, vars, context) => {
                const pubSub = await pubsubManager.getPubsub();
                return pubSub.asyncIterator(`Submission.published`);
            }
        }
    },

    Query: {
        getAdminIdentities: async (instance, vars, context, info) => {
            const user = await resolveUserForContext(context);
            if(!user) {
                return new Error(`Logged in user required to query for admins`);
            }
            const isAdmin = (user.finalisedAccessGroups || []).indexOf('administrator') !== -1;
            if(!isAdmin) {
                return new AuthorizationError(`Only admin users may query for admins`);
            }

            let query = Identity.query();
            const result = await query.select(['id', 'displayName']).whereIn('identityId', AdminORCIDIdentities);
            return result.map((r) => {
                return {
                    identityId: r.id,
                    displayName: r.displayName,
                }
            });
        }
    }

};
