import {LightningElement, api} from 'lwc';
import custom_css from '@salesforce/resourceUrl/styleToComment';
import {loadStyle} from 'lightning/platformResourceLoader';
import {Utils} from "c/utils";
import doApproveReject from '@salesforce/apex/MassApprovalController.doActions';
import commentTitle from '@salesforce/label/c.comment_title';

export default class CommentComponent extends LightningElement {

    @api nameAction;
    @api selectedObjects;
    @api height;
    @api mobileDevice;
    showActionButton = true;
    comment = '';
    label = {commentTitle};

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
            detail: {closedModal: false, action: actionDo}
        });
        this.dispatchEvent(selectedEvent);
    }

    changeValues() {
        this.comment = this.template.querySelector('lightning-textarea').value;
        this.showActionButton = (this.comment === '');
    }

    handleComment() {
        let approvalIds = [];
        for (let selectedObject of this.selectedObjects) {
            approvalIds.push(selectedObject.approvalId);
        }

        doApproveReject({
            actionType: this.nameAction,
            comment: this.comment,
            idProcesses: JSON.stringify(approvalIds)
        })
            .then(() => {
                let message = 'Approval processes ' + this.nameAction + '!';
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