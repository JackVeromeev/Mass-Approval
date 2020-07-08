import {ShowToastEvent} from "lightning/platformShowToastEvent";

export class Utils {

    static TYPE = {
        INFO    : 'info',
        ERROR   : 'error',
        SUCCESS : 'success',
        WARNING : 'warning'
    };

    static show = (title, message, variant) => {
        dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant,
            })
        );
    };
}

export default Utils;