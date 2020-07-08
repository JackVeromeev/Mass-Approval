import {LightningElement, api} from 'lwc';
import {NavigationMixin} from "lightning/navigation";

export default class CurrentInfoProcess extends NavigationMixin(LightningElement) {

    @api info;
    @api isMobilePhone;

    handleRedirectToObject(event) {
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.info.objectId,
                objectApiName: this.info.objectType,
                actionName: 'view'
            },
        });
    }
}