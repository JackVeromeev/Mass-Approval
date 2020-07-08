import {api, LightningElement, track} from 'lwc';
import {Utils} from 'c/utils';
import getObject from '@salesforce/apex/MassApprovalController.getFullInformationAboutObject';
import getAllUsers from '@salesforce/apex/MassApprovalController.getAllUsers';
import {actions as getActions, columns as getColumns} from "./approvals_table.js";
import getAllApprovalProcesses from '@salesforce/apex/MassApprovalController.getAllApprovalProcesses';
import createCustomSettingRecords from
        '@salesforce/apex/MassApprovalController.createCustomSettingRecords';
import getCustomSettingRecord from '@salesforce/apex/MassApprovalController.getCustomSettingRecord';
import titleObject from '@salesforce/label/c.object_approval_process';
import getNameObject from '@salesforce/apex/MassApprovalController.getNameObjectCustomSettingRecords';

export default class ApprovalsFullInfo extends LightningElement {

    showSpinner;
    objectApiName;
    objectLabelName;
    information;
    @track options;
    @track columns;
    @track data;
    isShowSelectedFieldsModal;
    isShowCommentModal;
    isShowReassignModal;
    isShowFullObjectField;
    isRecallAction;
    isFullInfoComponentView;
    users;
    additionalFields;
    disableActions;
    sortedBy;
    sortedDirection;
    nameButton;
    objectId;
    objectType;
    selected;
    valuesColumnsLabel;
    userId;
    label;
    userTool;
    customSettingInformationName;
    @api height;


    @api
    get fullInfo() {
        return this.information;
    }

    set fullInfo(element) {
        this.information = element;
        this.getInit();
    }

    constructor() {
        super();
        this.options = [];
        this.userTool = [];
        this.showSpinner = false;
        this.isShowSelectedFieldsModal = false;
        this.isShowCommentModal = false;
        this.isShowReassignModal = false;
        this.isShowFullObjectField = false;
        this.isRecallAction = false;
        this.isFullInfoComponentView = false;
        this.objectApiName = '';
        this.objectLabelName = '';
        this.disableActions = true;
        this.users = [];
        this.columns = [];
        this.additionalFields = [];
        this.sortDirection = 'asc';
        this.nameButton = '';
        this.objectId = '';
        this.objectType = '';
        this.userId = '';
        this.selected = [];
        this.valuesColumnsLabel = [];
        this.label = {titleObject};
    }

    getInit() {
        this.getCustomSettingInfo();
        this.showSpinner = true;
        this.userTool = this.information.userTool;
        this.objectApiName = this.information.objectName;
        this.objectLabelName = this.information.objectLabelName;
        this.isRecallAction = this.information.isRecall;
        this.userId = this.information.userId;
        this.getAllWorkUsers();
        this.handleRenderAfterActions();
        this.selected = [];
        this.disableActions = true;
    }

    getDataInfo(information) {
        let result, approversInfo;
        this.showSpinner = true;
        for (let info of information) {
            if (this.objectApiName === info.sObjName) {
                result = JSON.parse(info.jsonProcesses);
                approversInfo = JSON.parse(info.idNameApprovers);
            }
        }
        if (result === undefined && approversInfo === undefined) {
            const selectedEvent = new CustomEvent("closetablefullinfo", {
                detail: false
            });
            this.dispatchEvent(selectedEvent);
            this.showSpinner = false;
            return;
        }
        let preparedApproval = [];
        let listObjects = [];
        for (let i = 0; i < result.length; i++) {
            let preparedApprovals = {};
            if (result[i].ProcessInstance.TargetObject.Type === this.objectApiName) {
                listObjects.push(result[i].ProcessInstance.TargetObjectId);
                preparedApprovals.processName = result[i].ProcessInstance.ProcessDefinition.Name;
                preparedApprovals.statusProc = result[i].ProcessInstance.Status;
                preparedApprovals.desc = result[i].ProcessInstance.ProcessDefinition.Description;
                for (let approversInfoElement in approversInfo) {
                    if (approversInfoElement === result[i].ActorId) {
                        preparedApprovals.actorName = approversInfo[approversInfoElement];
                        preparedApprovals.actorId = result[i].ActorId;
                    }
                }
                preparedApprovals.objectType = result[i].ProcessInstance.TargetObject.Type;
                preparedApprovals.objectId = result[i].ProcessInstance.TargetObjectId;
                preparedApprovals.idObject = `/${result[i].ProcessInstance.TargetObjectId}`;
                preparedApprovals.approvalId = result[i].Id;
                preparedApprovals.processInstanceId = result[i].ProcessInstanceId;
                preparedApproval.push(preparedApprovals);
            }
        }
        this.getAllObjectFields(listObjects);
        this.data = preparedApproval;
    }

    /*Start Sorted*/
    sortData(fieldName, sortDirection) {
        let data = this.data;
        let key = (a) => a[fieldName];
        let reverse = sortDirection === 'asc' ? 1 : -1;
        data.sort((a, b) => {
            let valueA = key(a) ? key(a).toLowerCase() : '';
            let valueB = key(b) ? key(b).toLowerCase() : '';
            return reverse * ((valueA > valueB) - (valueB > valueA));
        });
        this.data = [...data];
    }

    updateColumnSorting(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        this.sortData(this.sortedBy, this.sortedDirection);
    }
    /*End Sorted*/

    handleSelectedRows(event) {
        const selectedRows = event.detail.selectedRows;
        this.disableActions = selectedRows.length <= 0;
    }

    handleRowAction(event) {
        const actionName = event.detail.action.name;
        const row = event.detail.row;
        switch (actionName) {
            case 'approve':
                this.handleApprove(row, 'rowAction');
                break;
            case 'show_details':
                this.showRowDetails(row);
                break;
            case 'reject':
                this.handleReject(row, 'rowAction');
                break;
            case 'reassign':
                this.handleReassign(row, 'rowAction');
                break;
            case 'viewDetails':
                this.showDetailInformation(this.objectApiName, row);
                break;
            default:
        }
    }

    handleSelectedField(event) {
        this.additionalFields = event.detail;
        this.isShowSelectedFieldsModal = false;
        this.columns = [...getColumns];
        let columns = '';
        for (let additionalField of this.additionalFields) {
            columns += additionalField.label + ',';
            this.columns = [...this.columns, additionalField];
        }
        let fieldName = columns.substring(0, columns.length - 1);
        this.updateDefaultFieldUser(this.objectApiName, this.userId, fieldName);
        this.columns = [...this.columns, {
            type: 'action', typeAttributes: {rowActions: getActions},
        }];
        this.additionalFields = [];
    }

    getAllObjectFields(recordIds) {
        getObject({objApiName: this.objectApiName, recordIds: recordIds})
            .then(response => {
                this.options = [];
                for (let resultElement in JSON.parse(response[0])) {
                    switch (JSON.parse(response[0])[resultElement]) {
                        case 'PHONE':
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'phone'
                            });
                            break;
                        case 'EMAIL':
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'email'
                            });
                            break;
                        case 'DATETIME':
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'date'
                            });
                            break;
                        case 'DATE':
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'date-local'
                            });
                            break;
                        case 'CURRENCY':
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'currency'
                            });
                            break;
                        default:
                            this.options.push({
                                "label": resultElement,
                                "value": resultElement,
                                "type": 'text'
                            });
                            break;
                    }
                }
                for (let recordId of recordIds) {
                    let preparedApproval = [];
                    let fullInfoObject = JSON.parse(response[1])[recordId];
                    for (let referenceField of JSON.parse(response[2])) {
                        let elementRef = referenceField.split('.')[0] + 'IdRef';
                        let currentElement = referenceField.split('.')[0] + 'Id';
                        if (fullInfoObject[referenceField.split('.')[0]] !== undefined) {
                            preparedApproval[referenceField] = fullInfoObject[referenceField.split('.')[0]][referenceField.split('.')[1]];
                            preparedApproval[elementRef] = `/${fullInfoObject[currentElement]}`;
                        }
                    }
                    for (let elementCustom of this.customSettingInformationName) {
                        if (fullInfoObject.attributes.type === elementCustom.objectName) {
                            preparedApproval.nameObject = fullInfoObject[elementCustom.field];
                        }
                    }
                    for (let datum of this.data) {
                        if (datum.objectId === recordId) {
                            Object.assign(datum, fullInfoObject);
                            Object.assign(datum, preparedApproval);
                        }
                    }
                }
                this.data = [...this.data];
                this.getAllDefaultFieldUser(this.objectApiName, this.userId);
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    getCustomSettingInfo() {
        getNameObject()
            .then(response => {
                if (response === '') {
                    let message = 'Please, ask you administrator to update you custom settings!';
                    Utils.show('WARNING!', message, Utils.TYPE.WARNING);
                }
                this.customSettingInformationName = [];
                let resultResponse = JSON.parse(response);
                let customElements = [];
                for (let result of resultResponse) {
                    let customElement = {};
                    customElement.objectName = result.Name;
                    customElement.field = result.ma_vrp__Fields__c;
                    customElements.push(customElement);
                }
                this.customSettingInformationName = [...customElements];
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    getAllWorkUsers() {
        getAllUsers({objApiName: this.objectApiName})
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

    handleRenderAfterActions() {
        getAllApprovalProcesses()
            .then(response => {
                this.getDataInfo(response);
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    updateDefaultFieldUser(objectName, userId, fieldName) {
        let labelCustomSetting = objectName + '_' + userId;
        createCustomSettingRecords({
            labelObjectName: labelCustomSetting,
            objectName: objectName,
            userId: userId,
            fieldName: fieldName
        })
            .then(() => {
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    getAllDefaultFieldUser(objectName, userId) {
        let labelCustomSetting = objectName + '_' + userId;
        getCustomSettingRecord({
            labelObjectName: labelCustomSetting,
            objectName: objectName,
            userId: userId
        })
            .then(response => {
                this.columns = [...getColumns];
                let columnsName = response.split(',');
                for (let columnName of columnsName) {
                    if (columnName.includes('.')) {
                        let elements = columnName.split('.');
                        this.columns.push({
                            label: columnName,
                            fieldName: elements[0] + 'IdRef',
                            type: 'url',
                            typeAttributes: {
                                label: {
                                    fieldName: columnName
                                },
                                target: '_blank',
                            },
                            sortable: true,
                        });
                    } else {
                        for (let option of this.options) {
                            if (columnName === option.value) {
                                this.columns.push({
                                    label: columnName,
                                    fieldName: columnName,
                                    type: option.type,
                                    sortable: true,
                                });
                                break;
                            }
                        }
                    }
                }
                this.columns = [...this.columns, {
                    type: 'action', typeAttributes: {rowActions: getActions},
                }];
                if (this.isFullInfoComponentView) {
                    this.closeFullInfoComponent();
                }
                this.showSpinner = false;
            })
            .catch(error => {
                let message = error.message ? error.message : error.body.message;
                Utils.show('ERROR!', message, Utils.TYPE.ERROR);
            });
    }

    getSelectedAllRows(row, variant) {
        let result = [];
        if (variant !== undefined) {
            result.push(row);
            return result;
        }
        return this.template.querySelector('lightning-datatable').getSelectedRows();
    }

    handleApprove(row, variant) {
        if (this.selected.length === 0) {
            this.selected = this.getSelectedAllRows(row, variant);
        }
        this.nameButton = 'Approve';
        this.isShowCommentModal = true;
    }

    handleReject(row, variant) {
        if (this.selected.length === 0) {
            this.selected = this.getSelectedAllRows(row, variant);
        }
        this.nameButton = 'Reject';
        this.isShowCommentModal = true;
    }

    handleReassign(row, variant) {
        if (this.selected.length === 0) {
            this.selected = this.getSelectedAllRows(row, variant);
        }
        this.isShowReassignModal = true;
    }

    handleRecall(row, variant) {
        if (this.selected.length === 0) {
            this.selected = this.getSelectedAllRows(row, variant);
        }
        this.nameButton = 'Recall';
        this.isShowCommentModal = true;
    }

    showRowDetails(row) {
        let result = JSON.parse(JSON.stringify(row));
        this.objectId = result.Id;
        this.objectType = result.attributes.type;
        this.isShowFullObjectField = true;
    }

    handleSelectField() {
        this.valuesColumnsLabel = [];
        if (this.columns.length > 5) {
            for (let i = 3; i < this.columns.length - 1; i++) {
                this.valuesColumnsLabel.push(this.columns[i].label);
            }
        }
        this.isShowSelectedFieldsModal = true;
    }

    handleCloseModal(event) {
        let result = event.detail;
        this.isShowCommentModal = result.closedModal;
        this.isShowReassignModal = result.closedModal;
        this.isShowSelectedFieldsModal = result.closedModal;
        this.isShowFullObjectField = result.closedModal;
        if (result.name !== 'reassign' && !this.userTool) {
            this.selected = [];
        }
        if (result.action) {
            if (result.name !== 'reassign') {
                this.disableActions = result.action;
            }
            if (!this.userTool) {
                this.selected = [];
            }
            this.closeFullInfoComponent();
            this.rerenderMainTable();
            this.handleRenderAfterActions();
        }
    }

    closeFullInfoComponent() {
        const selectedEvent = new CustomEvent("closedetail", {
            detail: false
        });
        this.dispatchEvent(selectedEvent);
    }

    rerenderMainTable() {
        const selectedEvent = new CustomEvent("rerendertable", {
            detail: true
        });
        this.dispatchEvent(selectedEvent);
    }

    showDetailInformation(objectApiName, row) {
        const selectedEvent = new CustomEvent("showinfo", {
            detail: {
                objectApiName: objectApiName,
                row: row,
                showInfo: true,
                objectLabelName: this.objectLabelName
            }
        });
        this.dispatchEvent(selectedEvent);
    }

    @api
    actionFromDetailPage(button, chosenProcess, closeFullInfoElement) {
        this.isFullInfoComponentView = closeFullInfoElement;
        this.selected = [];
        if (button === 'Approve') {
            this.selected.push(chosenProcess);
            this.nameButton = 'Approve';
            this.isShowCommentModal = true;
        } else if (button === 'Reject') {
            this.selected.push(chosenProcess);
            this.nameButton = 'Reject';
            this.isShowCommentModal = true;
        } else {
            this.selected.push(chosenProcess);
            this.isShowReassignModal = true;
        }
    }

    handleChooseAction(event) {
        let result = event.detail;
        let isChosen = result.option;
        let information = result.process;
        if (isChosen) {
            this.disableActions = false;
            this.selected = [...this.selected, information];
        } else {
            this.selected = this.selected.filter(function (el) {
                return el.objectId !== information.objectId;
            });
        }
        if (this.selected.length === 0) {
            this.disableActions = true;
        }
    }
}