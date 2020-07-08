import {api, LightningElement, track} from 'lwc';
import {Utils} from 'c/utils';
import getAllApprovalProcesses from '@salesforce/apex/MassApprovalController.getAllApprovalProcesses';
import empty_approval_process from '@salesforce/label/c.Empty_approval_process';

export default class ApprovalsTable extends LightningElement {

    @track data = [];
    indexChoose;
    isHaveProcesses = true;
    empty = empty_approval_process;

    @api
    approvalProcess(isRerenderMainTable) {
        if (isRerenderMainTable) {
            this.getApprovalProcess();
        }
    }

    connectedCallback() {
        this.getApprovalProcess();
    }

    getApprovalProcess() {
        getAllApprovalProcesses()
            .then(result => {
                this.isHaveProcesses = (JSON.stringify(result) !== "[]");
                if (this.isHaveProcesses) {
                    this.data = [...JSON.parse(JSON.stringify(result))];
                }
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    get columns() {
        return [
            {
                label: 'ITEMS TO APPROVE',
                title: 'ITEMS TO APPROVE',
                fieldName: 'sObjName'
            },
            {
                label: 'NUMBER OF PENDING RECORDS',
                title: 'NUMBER OF PENDING RECORDS',
                fieldName: 'recordIds'
            }
        ];
    }

    get tableInformation() {
        return this.data.map(item => {
            return {
                Id: item.Id,
                columns: [
                    {ind: 0, value: item.sObjLabel, link: true, apiLabel: item.sObjName},
                    {ind: 1, value: item.numb}
                ]
            }
        });
    }

    handleApprovalsOnObjects(event) {
        const selectedEvent = new CustomEvent("approvalinfo", {
            detail: this.getCurrentInformation(event)
        });
        this.dispatchEvent(selectedEvent);
    }

    getCurrentInformation(event) {
        if (this.indexChoose !== event.currentTarget.getAttribute("data-index")) {
            if (this.indexChoose !== undefined) {
                this.template.querySelector('[data-id="' + this.indexChoose + '"]').className = 'inActiveRow';
            }
            this.indexChoose = event.currentTarget.getAttribute("data-index");
            let selector = this.template.querySelector('[data-id="' + this.indexChoose + '"]');
            if (selector) {
                this.template.querySelector('[data-id="' + this.indexChoose + '"]').className = 'activeRow';
            }
        }

        let fullInfo;
        let objName = event.currentTarget.getAttribute("data-sobjname");
        for (let element of JSON.parse(JSON.stringify(this.data))) {
            if (objName === element.sObjName) {
                fullInfo = {
                    objectLabelName: element.sObjLabel,
                    objectName: element.sObjName,
                    isRecall: element.isRecall,
                    userId: element.userId,
                    userTool: element.userTool
                };
                break;
            }
        }
        return fullInfo;
    }
}