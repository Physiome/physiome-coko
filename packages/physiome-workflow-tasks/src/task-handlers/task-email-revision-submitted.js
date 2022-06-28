const { EmailTemplate } = require('component-workflow-send-email');
const TaskSendEmail = require('./util-task-send-email');
const logger = require('workflow-utils/logger-with-prefix')('PhysiomeWorkflowTasks/Email-ManuscriptRevisionSubmitted');
const config = require('config');
const EditorsMailingListAddress = config.get('workflow-send-email.editorsMailingListAddress');

class TaskSendRevisionSubmissionEmail extends TaskSendEmail {

    constructor(logger) {
        super(null, logger);
        this.toSubmitterTemplate = new EmailTemplate('manuscript-revision-submitted-author');
        this.toEditorListTemplate = new EmailTemplate('manuscript-revision-submitted-editor-list');
    }

    toSubmitter(submission) {
        const subject = `revisions to submission ${submission.manuscriptId}`;
        const recipient = submission.submitter;
        const text = this.toSubmitterTemplate.template({
            user: recipient,
            ...this.baseTemplateData(submission)
        });
        return {
            subject,
            recipientName: recipient.displayName,
            recipientEmail: recipient.email,
            text: text,
        };
    }

    toEditorMailingList(submission) {
        const subject = `revisions to submission ${submission.manuscriptId} ready for review`;
        const recipient = {
            displayName: 'Physiome Editors',
            email: EditorsMailingListAddress
        };
        const text = this.toEditorListTemplate.template({
            user: recipient,
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
        result.push(this.toSubmitter(submission));
        if (!!EditorsMailingListAddress) {
            result.push(this.toEditorMailingList(submission));
        }
        return result;
    }

}

module.exports = function _setupEmailRevisionSubmissionTask(client) {
    const externalTaskName = 'revision-submitted-email';
    const task = new TaskSendRevisionSubmissionEmail(logger);
    task.configure(client, externalTaskName);
};
