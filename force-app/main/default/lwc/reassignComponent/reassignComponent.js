import {api, LightningElement} from 'lwc';
import custom_css from '@salesforce/resourceUrl/styleToComment';
import {loadStyle} from 'lightning/platformResourceLoader';
import {Utils} from 'c/utils';
import doReassignRecords from '@salesforce/apex/MassApprovalController.doReassignRecords';
import title from '@salesforce/label/c.reassign_title';

export default class ReassignComponent extends LightningElement {

    @api users;
    @api selectedObjects;
    @api height;
    @api mobileDevice;
    value;
    showReassignButton = true;
    label = {title};

    connectedCallback() {
        loadStyle(this, custom_css)
            .then(() => {
            });
    }

    get style() {
        if (this.mobileDevice) {
            const listOfProperties = [
                'top:' + this.height + 'px'
            ];
            return listOfProperties.join(';');
        }
        return '';
    }

    closeModal(action) {
        let actionDo = (typeof action !== 'object');
        const selectedEvent = new CustomEvent("closemodal", {
            detail: {closedModal: false, action: actionDo, name: 'reassign'}
        });
        this.dispatchEvent(selectedEvent);
    }

    handleChange(event) {
        this.value = event.target.value;
        this.showReassignButton = false;
    }

    doReassign() {
        let approvalIds = [];
        for (let selectedObject of this.selectedObjects) {
            approvalIds.push(selectedObject.approvalId);
        }
        doReassignRecords({
            actorId: this.value,
            idProcesses: JSON.stringify(approvalIds)
        })
            .then(() => {
                let message = 'Approval processes reassign!';
                Utils.show('SUCCESS!', message, Utils.TYPE.SUCCESS);
                this.closeModal(true);
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
                this.closeModal(true);
            });
    }
}