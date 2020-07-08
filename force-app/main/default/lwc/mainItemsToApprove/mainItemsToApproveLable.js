import approveElement from '@salesforce/label/c.Approve';
import reassignElement from '@salesforce/label/c.Reassign';
import rejectElement from '@salesforce/label/c.Reject';
import title_home_element from '@salesforce/label/c.title_home_element';
import view_all from '@salesforce/label/c.View_All';
import empty_approval_process from '@salesforce/label/c.Empty_approval_process';

const approve = approveElement;
const reassign = reassignElement;
const reject = rejectElement;
const title = title_home_element;
const viewAll = view_all;
const empty = empty_approval_process;

export default {
    approve,
    reassign,
    reject,
    title,
    viewAll,
    empty
}