import {api, LightningElement} from 'lwc';
import fields from '@salesforce/label/c.fields_required';

export default class DualListBoxCmp extends LightningElement {

    @api objectApiName;
    @api options;
    @api values;
    showGetSelectedFields = true;
    selectedField = [];
    fieldsElements = [];
    label = {fields};

    closeModal() {
        const selectedEvent = new CustomEvent("closemodal", {
            detail: {closedModal: false, action: false}
        });
        this.dispatchEvent(selectedEvent);
    }

    getSelectedFields() {
        for (let fieldsElement of this.fieldsElements) {
            if (fieldsElement.includes('.')) {
                let elements = fieldsElement.split('.');
                this.selectedField.push({
                    label: fieldsElement,
                    fieldName: elements[0] + 'IdRef',
                    type: 'url',
                    typeAttributes: {
                        label: {
                            fieldName: fieldsElement
                        },
                        target: '_blank',
                    },
                    sortable: true,
                });
            } else {
                for (let option of this.options) {
                    if (fieldsElement === option.value) {
                        this.selectedField.push({
                            label: fieldsElement,
                            fieldName: fieldsElement,
                            type: option.type,
                            sortable: true,
                        });
                        break;
                    }
                }
            }
        }
        const selectedEvent = new CustomEvent("sendfield", {
            detail: this.selectedField
        });
        this.dispatchEvent(selectedEvent);
    }

    handleChange(event) {
        this.fieldsElements = event.detail.value;
        this.showGetSelectedFields = false;
    }
}