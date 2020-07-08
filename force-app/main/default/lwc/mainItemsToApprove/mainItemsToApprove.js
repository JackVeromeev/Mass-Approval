import {LightningElement, track} from 'lwc';
import {Utils} from 'c/utils';
import getAllProcessesPreview from '@salesforce/apex/MassApprovalController.getAllProcessesPreview';
import getAllUsers from '@salesforce/apex/MassApprovalController.getAllUsers';
import getNameObject
    from '@salesforce/apex/MassApprovalController.getNameObjectCustomSettingRecords';
import {NavigationMixin} from 'lightning/navigation';
import labels from "./mainItemsToApproveLable";

export default class MainItemsToApprove extends NavigationMixin(LightningElement) {

    @track data;
    users;
    disableActions;
    nameButton;
    isShowCommentModal;
    isShowReassignModal;
    isShowActions;
    isManyObjects;
    isDontHaveApprovalProcesses;
    chooseElement;
    selected;
    labels = labels;

    constructor() {
        super();
        this.data = [];
        this.users = [];
        this.isShowCommentModal = false;
        this.isShowReassignModal = false;
        this.disableActions = true;
        this.isManyObjects = false;
        this.nameButton = '';
        this.chooseElement = [];
        this.selected = [];
        this.isShowActions = false;
        this.isDontHaveApprovalProcesses = false;
    }

    connectedCallback() {
        this.getAllProcess();
    }

    getAllProcess() {
        getAllProcessesPreview()
            .then(response => {
                this.selected = [];
                if (response === '') {
                    this.isDontHaveApprovalProcesses = true;
                    return;
                }
                let resultInfo = JSON.parse(response);
                this.getCustomSettingInfo(resultInfo);
                this.getAllWorkUsers();
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    updateCurrentInfo(resultInfo, resultInformation) {
        let preparedApprovals = {};
        let approvers = JSON.parse(resultInfo.idNameApprovers);
        let objects = JSON.parse(resultInfo.objects);
        if (objects === null) return;
        let processes = JSON.parse(resultInfo.process);
        preparedApprovals.objectId = objects.Id;
        preparedApprovals.actorId = processes.ActorId;
        preparedApprovals.actorName = approvers[processes.ActorId];
        preparedApprovals.objectType = objects.attributes.type;
        preparedApprovals.approvalId = processes.Id;
        preparedApprovals.createdDate = processes.CreatedDate;
        preparedApprovals.processName = processes.ProcessInstance.ProcessDefinition.Name;
        for (let info of resultInformation) {
            if (info.Name === objects.attributes.type) {
                let attribute = info.ma_vrp__Fields__c;
                preparedApprovals.nameObject = objects[attribute];
                break;
            }
        }
        return preparedApprovals;
    }

    getCustomSettingInfo(resultInfo) {
        getNameObject()
            .then(response => {
                if (response === '') {
                    let message = 'Please, ask you administrator to update your custom settings!';
                    Utils.show('WARNING!', message, Utils.TYPE.WARNING);
                }
                let preparedApproval = [];
                let resultInformation = JSON.parse(response);
                for (let element of resultInfo) {
                    preparedApproval.push(this.updateCurrentInfo(element, resultInformation));
                }
                preparedApproval.sort((a, b) => (a.createdDate < b.createdDate) ? 1 : -1);
                preparedApproval = preparedApproval.filter(function( element ) {
                    return element !== undefined;
                });
                preparedApproval.length = (preparedApproval.length > 5) ? 5 : preparedApproval.length;
                this.data = [...preparedApproval];
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    getAllWorkUsers() {
        getAllUsers({objApiName: ''})
            .then(result => {
                this.users = [];
                for (let i = 0; i < result.length; i++) {
                    this.users.push({
                        "label": result[i].Name,
                        "value": result[i].Id
                    });
                }
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    handleChooseAction(event) {
        let result = event.detail;
        let isChosen = result.option;
        let information = result.process;
        if (isChosen) {
            this.disableActions = false;
            this.chooseElement = [...this.chooseElement, information];
        } else {
            this.chooseElement = this.chooseElement.filter(function (el) {
                return el.objectId !== information.objectId;
            });
        }
        if (this.chooseElement.length === 0) {
            this.disableActions = true;
        }
    }

    handleAction(event) {
        let element = event.detail;
        if (element.nameButton === 'Approve') {
            this.nameButton = element.nameButton;
            this.selected.push(element.current);
            this.isShowCommentModal = true;
        } else if (element.nameButton === 'Reject') {
            this.nameButton = element.nameButton;
            this.selected.push(element.current);
            this.isShowCommentModal = true;
        } else {
            this.selected.push(element.current);
            this.isShowReassignModal = true;
        }
    }

    handleApprove() {
        this.selected = [...this.chooseElement];
        this.nameButton = 'Approve';
        this.isShowCommentModal = true;
    }

    handleReject() {
        this.selected = [...this.chooseElement];
        this.nameButton = 'Reject';
        this.isShowCommentModal = true;
    }

    handleReassign() {
        this.selected = [...this.chooseElement];
        this.isShowReassignModal = true;
    }

    handleCloseActions(event) {
        let result = event.detail;
        this.isShowCommentModal = result.closedModal;
        if (result.action) {
            this.disableActions = result.action;
            this.chooseElement = [];
        }
        this.getAllProcess();
    }

    handleCloseReassign(event) {
        let result = event.detail;
        this.isShowReassignModal = result.closedModal;
        this.getAllProcess();
    }

    handleRedirect(event) {
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate]({
            type: "standard__navItemPage",
            attributes: {
                apiName: "ma_vrp__Mass_Approvals"
            },
        });
    }
}