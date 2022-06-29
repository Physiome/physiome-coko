const { EmailTemplate } = require('component-workflow-send-email');
const { Identity } = require('component-workflow-model/shared-model/identity');
const TaskSendEmail = require('./util-task-send-email');
const logger = require('workflow-utils/logger-with-prefix')('PhysiomeWorkflowTasks/Email-AssignCurator');
const config = require('config');
const EditorsMailingListAddress = config.get('workflow-send-email.editorsMailingListAddress');

class TaskAssignCuratorEmail extends TaskSendEmail {

    constructor(logger) {
        super(null, logger);
        this.assignCuratorTemplate = new EmailTemplate('assign-curator');
    }

    async toCurator(submission) {
        const subject = `Please review submission ${submission.manuscriptId}`;
        const recipient = await Identity.find(submission.curatorId).catch((e) => null);
        const text = this.assignCuratorTemplate.template({
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
        result.push(await this.toCurator(submission));
        return result;
    }

}

module.exports = function _setupEmailAssignCuratorTask(client) {
    const externalTaskName = 'assign-curator-email';
    const task = new TaskAssignCuratorEmail(logger);
    task.configure(client, externalTaskName);
};
