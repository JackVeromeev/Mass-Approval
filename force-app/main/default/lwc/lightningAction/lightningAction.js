import {LightningElement, api} from 'lwc';
import labels from "./lightningActionLable";

export default class LightningAction extends LightningElement {

    @api current;
    @api isShowButtons;
    isShowActions = false;
    clickAction = 1;
    labels = labels;

    handleShowActions() {
        this.isShowActions = !this.isShowActions;
        this.clickAction++;
    }

    handleApprove() {
        this.nameButton = 'Approve';
        const selectedEvent = new CustomEvent("chosenaction", {
            detail: {nameButton: this.nameButton, current: this.current}
        });
        this.dispatchEvent(selectedEvent);
    }

    handleReject() {
        this.nameButton = 'Reject';
        const selectedEvent = new CustomEvent("chosenaction", {
            detail: {nameButton: this.nameButton, current: this.current}
        });
        this.dispatchEvent(selectedEvent);
    }

    handleReassign() {
        this.nameButton = 'Reassign';
        const selectedEvent = new CustomEvent("chosenaction", {
            detail: {nameButton: this.nameButton, current: this.current}
        });
        this.dispatchEvent(selectedEvent);
    }
}