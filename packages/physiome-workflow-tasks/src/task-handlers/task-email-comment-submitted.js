const { EmailTemplate } = require('component-workflow-send-email');
const { Identity } = require('component-workflow-model/shared-model/identity');
const TaskSendEmail = require('./util-task-send-email');
const logger = require('workflow-utils/logger-with-prefix')('PhysiomeWorkflowTasks/Email-CommentSubmitted');
const config = require('config');
const EditorsMailingListAddress = config.get('workflow-send-email.editorsMailingListAddress');

const ModelSubmissionComment = require('component-workflow-model/shared-model/submission-comment');
const SubmissionComment = ModelSubmissionComment.model;

class TaskCommentSubmittedEmail extends TaskSendEmail {

    constructor(logger) {
        super(null, logger);
        this.commentSubmittedTemplate = new EmailTemplate('submit-comment');
    }

    async toSubmitter(submission) {
        const subject = `New correspondence for submission ${submission.manuscriptId}`;
        const recipient = submission.submitter;
        const comment = await SubmissionComment.query().joinRelation('comment').select(
            ['comment.author_id', 'comment.comment_body as commentBody', 'comment.author_id as authorId']
        ).where('submission_id', submission.id).orderBy('created', 'desc').limit(1).first();
        const author = await Identity.find(comment.authorId);
        const text = this.commentSubmittedTemplate.template({
            user: recipient,
            comment_body: comment.commentBody,
            comment_author: author.displayName,
            ...this.baseTemplateData(submission)
        });
        return {
            subject,
            recipientName: recipient.displayName,
            recipientEmail: recipient.email,
            text: text,
        };
    }

    async submissionToEmailData(submission) {
        const result = [];
        result.push(await this.toSubmitter(submission));
        return result;
    }

}

module.exports = function _setupEmailCommentSubmittedTask(client) {
    const externalTaskName = 'comment-submitted';
    const task = new TaskCommentSubmittedEmail(logger);
    task.configure(client, externalTaskName);
};
