import {LightningElement, api} from 'lwc';
import title from '@salesforce/label/c.title_full_info';

export default class ShowObjectInfo extends LightningElement {

    @api objectId;
    @api objectName;
    @api objectLabelName;
    label = {title};

    closeModal() {
        const selectedEvent = new CustomEvent("closemodal", {
            detail: false
        });
        this.dispatchEvent(selectedEvent);
    }

    handleApprove() {
        const selectedEvent = new CustomEvent("handleapprove", {
            detail: {nameButton: 'Approve'}
        });
        this.dispatchEvent(selectedEvent);
    }

    handleReject() {
        const selectedEvent = new CustomEvent("handlereject", {
            detail: {nameButton: 'Reject'}
        });
        this.dispatchEvent(selectedEvent);
    }

    handleReassign() {
        const selectedEvent = new CustomEvent("handlereassign", {
            detail: {nameButton: 'Reassign'}
        });
        this.dispatchEvent(selectedEvent);
    }
}