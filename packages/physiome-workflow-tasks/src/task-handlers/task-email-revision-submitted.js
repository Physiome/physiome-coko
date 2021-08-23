const TaskSendEmail = require('./util-task-send-email');
const logger = require('workflow-utils/logger-with-prefix')('PhysiomeWorkflowTasks/Email-ManuscriptRevisionSubmitted');
const config = require('config');
const EditorsMailingListAddress = config.get('workflow-send-email.editorsMailingListAddress');

class TaskSendRevisionSubmissionEmail extends TaskSendEmail {

    constructor(logger) {
        super('manuscript-revision-submitted-author', logger);
    }

    async formatEmailSubject(submission) {
        return `revisions to submission ${submission.manuscriptId}`;
    }
}

class TaskSendRevisionSubmissionListEmail extends TaskSendEmail {

    constructor(logger) {
        super('manuscript-revision-submitted-editor-list', logger);
    }

    async formatEmailSubject(submission) {
        return `revisions to submission ${submission.manuscriptId} ready for review`;
    }

    async submissionToRecipient(submission) {
        return {
            displayName: 'Physiome Editors',
            email: EditorsMailingListAddress
        };
    }

    skipTaskWithoutSendingEmail() {
        return !EditorsMailingListAddress;
    }
}

module.exports = function _setupEmailRevisionSubmissionTask(client) {

    const externalTaskName = 'revision-submitted-email';
    const emailtask1 = new TaskSendRevisionSubmissionEmail(logger);
    const emailtask2 = new TaskSendRevisionSubmissionListEmail(logger);

    client.subscribe(externalTaskName, async ({ task, taskService }) => {
        return Promise.all([
            emailtask1.processTask(task, taskService),
            emailtask2.processTask(task, taskService)
        ]);
    });
};
