import {api, LightningElement} from 'lwc';
import detail from '@salesforce/label/c.detail_modal';

export default class FullObjectField extends LightningElement {

    @api objectId;
    @api objectName;
    label = {detail};

    closeModal() {
        const selectedEvent = new CustomEvent("closemodal", {
            detail: {closedModal: false, action: false}
        });
        this.dispatchEvent(selectedEvent);
    }
}