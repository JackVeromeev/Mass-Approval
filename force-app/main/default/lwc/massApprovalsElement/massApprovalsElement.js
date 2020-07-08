import {LightningElement} from 'lwc';
import {NavigationMixin} from "lightning/navigation";

export default class MassApprovalsElement extends NavigationMixin(LightningElement) {

    approvalInfo = '';
    isOpenFullInfo = false;
    isShowInformation = false;
    objectId;
    objectApiName;
    objectLabelName;
    fullInfo;
    height = 0;

    handleApprovalInfo(event) {
        this.checkSizeOfComponent();
        this.approvalInfo = event.detail;
        this.isOpenFullInfo = true;
        this.isShowInformation = false;
    }

    handleShowInformation(event) {
        let result = event.detail;
        this.fullInfo = result.row;
        this.objectApiName = result.objectApiName;
        this.objectLabelName = result.objectLabelName;
        this.objectId = result.row.objectId;
        this.isShowInformation = result.showInfo;
    }

    closeFullInfoTable(event) {
        event.preventDefault();
        event.stopPropagation();
        this[NavigationMixin.Navigate]({
            type: "standard__navItemPage",
            attributes: {
                apiName: "ma_vrp__Mass_Approvals"
            },
        });
    }

    handleCloseModal(event) {
        this.isShowInformation = event.detail;
    }

    handleAction(event) {
        let nameOfAction = event.detail;
        if (nameOfAction.nameButton === 'Reassign') {
            this.template.querySelector("c-approvals-full-info")
                .actionFromDetailPage(nameOfAction.nameButton, this.fullInfo, false);
        } else {
            this.template.querySelector("c-approvals-full-info")
                .actionFromDetailPage(nameOfAction.nameButton, this.fullInfo, true);
        }
    }

    handleRerenderAction(event) {
        let isRerenderMainTable = event.detail;
        this.template.querySelector("c-approvals-table").approvalProcess(isRerenderMainTable);
    }

    checkSizeOfComponent() {
        let approvalTableElement = this.template.querySelector("c-approvals-table");
        let positionInfo = approvalTableElement.getBoundingClientRect();
        this.height = positionInfo.height;
    }
}