const TaskSendEmail = require('./util-task-send-email');
const logger = require('workflow-utils/logger-with-prefix')('PhysiomeWorkflowTasks/Email-InitialSubmission');
const config = require('config');
const EditorsMailingListAddress = config.get('workflow-send-email.editorsMailingListAddress');

class TaskSendInitialSubmissionEmail extends TaskSendEmail {

    constructor(logger) {
        super('manuscript-initial-submission-author', logger);
    }

    async formatEmailSubject(submission) {
        return `submission ${submission.manuscriptId}`;
    }
}

class TaskSendInitialSubmissionListEmail extends TaskSendEmail {

    constructor(logger) {
        super('manuscript-submitted-editor-list', logger);
    }

    async formatEmailSubject(submission) {
        return `submission ${submission.manuscriptId} ready for review`;
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

module.exports = function _setupEmailInitialSubmissionTask(client) {

    const externalTaskName = 'initial-submission-email';
    const emailtask1 = new TaskSendInitialSubmissionEmail(logger);
    const emailtask2 = new TaskSendInitialSubmissionListEmail(logger);

    client.subscribe(externalTaskName, async ({ task, taskService }) => {
        return Promise.all([
            emailtask1.processTask(task, taskService),
            emailtask2.processTask(task, taskService)
        ]);
    });
};
