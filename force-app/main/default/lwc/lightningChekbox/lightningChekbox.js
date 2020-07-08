import {LightningElement, api} from 'lwc';

export default class LightningChekbox extends LightningElement {

    @api current;
    @api index;
    value = '';
    resultChoose = [];

    handleChange(event) {
        let isChosen = false;
        this.value = event.detail.value;
        if (this.value[0] === 'choose') {
            isChosen = true;
        }
        this.resultChoose = this.current;
        let resultObject = {process: this.resultChoose, option: isChosen};
        const selectedEvent = new CustomEvent("chosenaction", {
            detail: resultObject
        });
        this.dispatchEvent(selectedEvent);
    }

    get options() {
        return [
            {label: '', value: 'choose'},
        ];
    }
}