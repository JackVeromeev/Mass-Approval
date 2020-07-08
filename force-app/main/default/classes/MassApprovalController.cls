public with sharing class MassApprovalController {

    private final static Boolean RECALL_ACTION = OpenRecallButton__c.getInstance(UserInfo.getUserId()).Allow_recall__c;
    private final static Set<String> USER_MULTILOOKUP_FIELDS = new Set<String>{
        'CreatedById', 'LastModifiedById', 'ConvertedAccountId', 'ConvertedContactId',
        'BillToContactId', 'ShipToContactId', 'ConvertedOpportunityId', 'ExternalDataSourceId',
        'CompanySignedId', 'CustomerSignedId', 'ActivatedById', 'CampaignMemberRecordTypeId',
        'CompanyAuthorizedById', 'CustomerAuthorizedById'
    };

    @AuraEnabled
    public static List<InitTableItem> getAllApprovalProcesses() {
        Boolean isUserUseMobile = false;
        if (UserInfo.getUiThemeDisplayed() == 'Theme4t' || UserInfo.getUiTheme() == 'Theme4t') {
            isUserUseMobile = true;
        }

        List<InitTableItem> initTableItems = new List<InitTableItem>();
        List<Id> listGroup = new List<Id>();
        for (GroupMember gm : [SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :UserInfo.getUserId()]) {
            listGroup.add(gm.GroupId);
        }
        List<Id> listQueue = new List<Id>();
        for (GroupMember gm : [SELECT GroupId FROM GroupMember WHERE UserOrGroupId IN :listGroup]) {
            listQueue.add(gm.GroupId);
        }
        List<Id> bigList = new List<Id>();
        bigList.addAll(listGroup);
        bigList.addAll(listQueue);
        bigList.add(UserInfo.getUserId());
        Map<Id, User> delegateUserById = new Map<Id, User>([SELECT Id FROM User WHERE DelegatedApproverId = :UserInfo.getUserId()]);
        bigList.addAll(delegateUserById.keySet());

        List<PermissionSet> perms = [
            SELECT
                Id, (
                SELECT Id, AssigneeId, PermissionSetId
                FROM Assignments
                WHERE AssigneeId = :UserInfo.getUserId()
            )
            FROM PermissionSet
        ];
        List<Id> permIds = new List<Id>();
        for (PermissionSet p : perms) {
            if (p.Assignments.size() > 0) {
                permIds.add(p.Id);
            }
        }

        List<ObjectPermissions> ops = [
            SELECT SobjectType, PermissionsModifyAllRecords
            FROM ObjectPermissions
            WHERE ParentId IN :permIds AND PermissionsModifyAllRecords = TRUE
        ];
        List<String> modifyAllSobjectTypes = new List<String>();
        for (ObjectPermissions op : ops) {
            modifyAllSobjectTypes.add(op.SobjectType);
        }

        List<ProcessInstanceWorkitem> workitems = [
            SELECT Id, ActorId, ProcessInstanceId, ProcessInstance.Status,
                ProcessInstance.TargetObjectId, ProcessInstance.TargetObject.Type,
                ProcessInstance.ProcessDefinition.Name, ProcessInstance.ProcessDefinition.Description
            FROM ProcessInstanceWorkitem
            WHERE ProcessInstance.Status = 'Pending'
            AND (ActorId IN :bigList OR ProcessInstance.TargetObject.Type IN :modifyAllSobjectTypes)
        ];

        Map<String, String> idNameApprovers = new Map<String, String>();
        Set<String> actorsIds = new Set<String>();
        for (ProcessInstanceWorkitem processInstanceWorkitem : workitems) {
            actorsIds.add(processInstanceWorkitem.ActorId);
        }

        for (User user : [SELECT Id, Name FROM User WHERE Id IN :actorsIds]) {
            idNameApprovers.put(user.Id, user.Name);
        }

        for (Group groupElement : [SELECT Id, Name FROM Group WHERE Id IN :actorsIds]) {
            idNameApprovers.put(groupElement.Id, groupElement.Name);
        }

        List<Id> delegatedIds = new List<Id>();
        Map<String, List<String>> mapMyMap = new Map<String, List<String>>();
        for (ProcessInstanceWorkitem item : workitems) {
            if (delegateUserById.keySet().contains(item.ActorId)) {
                delegatedIds.add(item.ProcessInstance.TargetObjectId);
            }
            if (item.ProcessInstance.TargetObjectId.getSobjectType().getDescribe().isAccessible()) {
                if (mapMyMap.keySet().contains(item.ProcessInstance.TargetObject.Type)) {
                    mapMyMap.get(item.ProcessInstance.TargetObject.Type).addAll(new List<String>{
                        item.ProcessInstance.ProcessDefinition.Description
                    });
                } else {
                    mapMyMap.put(item.ProcessInstance.TargetObject.Type, new List<String>{
                        item.ProcessInstance.ProcessDefinition.Description
                    });
                    mapMyMap.get(item.ProcessInstance.TargetObject.Type).addAll(new List<String>{
                        item.ProcessInstance.ProcessDefinition.Description
                    });
                }
            }
        }

        String userId = UserInfo.getUserId();

        for (String objApiName : mapMyMap.keySet()) {
            List<String> valuesList = new List<String>();
            valuesList.addAll(mapMyMap.get(objApiName));
            List<String> recordIds = new List<String>();
            for (Integer i = 1; i < valuesList.size(); i++) {
                recordIds.add(valuesList[i]);
            }
            String objLabel = Schema.getGlobalDescribe().get(objApiName).getDescribe().getLabel();
            initTableItems.add(
                new InitTableItem(
                    isUserUseMobile,
                    userId,
                    RECALL_ACTION,
                    objApiName,
                    objLabel,
                    String.valueOf(recordIds.size()),
                    JSON.serialize(recordIds),
                    JSON.serialize(idNameApprovers),
                    JSON.serialize(workitems),
                    delegatedIds
                )
            );
        }
        return initTableItems;
    }

    @AuraEnabled
    public static List<String> getFullInformationAboutObject(String objApiName, List<String> recordIds) {
        if (objApiName == 'Opportunity') {
            USER_MULTILOOKUP_FIELDS.add('ContactId');
        }
        Map<Id, SObject> objRecords = new Map<Id, SObject>();
        Map<String, String> fieldsForQuery = new Map<String, String>();
        List<String> resultElements = new List<String>();
        if (!String.isBlank(objApiName)
            && Schema.getGlobalDescribe().keySet().contains(objApiName.toLowerCase())
            && Schema.getGlobalDescribe().get(objApiName).getDescribe().isAccessible()
            ) {
            List<String> referenceFields = new List<String>();
            Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe().get(objApiName).getDescribe().fields.getMap();
            for (String field : objectFields.keySet()) {
                if (objectFields.get(field).getDescribe().isAccessible()) {
                    Schema.DescribeFieldResult dfield = objectFields.get(field).getDescribe();
                    if (!USER_MULTILOOKUP_FIELDS.contains(String.valueOf(dfield.getName()))) {
                        fieldsForQuery.put(String.valueOf(dfield.getName()), String.valueOf(dfield.getType()));
                        List<SObjectType> checkList = objectFields.get(field).getDescribe().getReferenceTo();
                        if (!checkList.isEmpty() && String.valueOf(checkList.get(0)) != objApiName) {
                            if (String.valueOf(dfield.getName()) != 'OwnerId') {
                                Map<String, SObjectField> parentObj = checkList.get(0).getDescribe().fields.getMap();
                                for (SObjectField str : parentObj.values()) {
                                    if (str.getDescribe().isNameField()) {
                                        if (String.valueOf(dfield.getName()).contains('__c')) {
                                            String referenceResult = String.valueOf(dfield.getName()).removeEnd('__c');
                                            fieldsForQuery.put(referenceResult + '__r.' + str.getDescribe().getName(), 'text');
                                            referenceFields.add(referenceResult + '__r.' + str.getDescribe().getName());
                                        } else {
                                            fieldsForQuery.put(checkList.get(0) + '.' + str.getDescribe().getName(), 'text');
                                            referenceFields.add(checkList.get(0) + '.' + str.getDescribe().getName());
                                        }
                                    }
                                }
                            } else {
                                fieldsForQuery.put('Owner.Name', 'text');
                                referenceFields.add('Owner.Name');
                            }
                        }
                    }
                }
            }
            resultElements.add(JSON.serialize(fieldsForQuery));
            if (!fieldsForQuery.isEmpty()) {
                String query = 'SELECT';
                for (String str : fieldsForQuery.keySet()) {
                    query = query + ' ' + str + ',';
                }
                query = query.removeEnd(',');
                query = query + ' FROM ' + objApiName + ' WHERE Id IN :recordIds';
                objRecords = new Map<Id, SObject>(Database.query(query));
            }
            resultElements.add(JSON.serialize(objRecords));
            resultElements.add(JSON.serialize(referenceFields));
        } else {
            AuraHandledException ex = new AuraHandledException('You don\'t have permission to work with object.');
            throw ex;
        }
        return resultElements;
    }

    @AuraEnabled
    public static List<User> getAllUsers(String objApiName) {
        List<ObjectPermissions> ops = new List<ObjectPermissions>();
        if (objApiName != '') {
            ops = [
                SELECT SobjectType, PermissionsRead, ParentId
                FROM ObjectPermissions
                WHERE PermissionsRead = TRUE AND SobjectType = :objApiName
            ];
        } else {
            ops = [
                SELECT SobjectType, PermissionsRead, ParentId
                FROM ObjectPermissions
                WHERE PermissionsRead = TRUE
            ];
        }

        List<Id> parentIds = new List<Id>();
        for (ObjectPermissions op : ops) {
            parentIds.add(op.ParentId);
        }

        List<PermissionSet> perms = [
            SELECT
                Id, ProfileId, (
                SELECT Id, AssigneeId, PermissionSetId
                FROM Assignments
            )
            FROM PermissionSet
            WHERE Id IN :parentIds
        ];

        List<String> assigneeIds = new List<String>();
        for (PermissionSet perm : perms) {
            assigneeIds.add(perm.ProfileId);
            for (PermissionSetAssignment item : perm.Assignments) {
                assigneeIds.add(item.AssigneeId);
            }
        }

        List<User> users = [
            SELECT Id, Name, ProfileId
            FROM User
            WHERE IsActive = TRUE AND (Id IN :assigneeIds OR ProfileId IN :assigneeIds)
        ];

        if (users.isEmpty()) {
            AuraHandledException ex = new AuraHandledException('No available users to reassign');
            throw ex;
        }
        return users;
    }

    @AuraEnabled
    public static String getAllProcessesPreview() {
        List<InitShowElement> initsElements = new List<InitShowElement>();
        List<Id> listGroup = new List<Id>();
        for (GroupMember gm : [SELECT GroupId FROM GroupMember WHERE UserOrGroupId = :UserInfo.getUserId()]) {
            listGroup.add(gm.GroupId);
        }
        List<Id> listQueue = new List<Id>();
        for (GroupMember gm : [SELECT GroupId FROM GroupMember WHERE UserOrGroupId IN :listGroup]) {
            listQueue.add(gm.GroupId);
        }
        List<Id> bigList = new List<Id>();
        bigList.addAll(listGroup);
        bigList.addAll(listQueue);
        bigList.add(UserInfo.getUserId());
        Map<Id, User> delegateUserById = new Map<Id, User>([SELECT Id FROM User WHERE DelegatedApproverId = :UserInfo.getUserId()]);
        bigList.addAll(delegateUserById.keySet());

        List<PermissionSet> perms = [
            SELECT
                Id, (
                SELECT Id, AssigneeId, PermissionSetId
                FROM Assignments
                WHERE AssigneeId = :UserInfo.getUserId()
            )
            FROM PermissionSet
        ];

        List<Id> permIds = new List<Id>();
        for (PermissionSet p : perms) {
            if (p.Assignments.size() > 0) {
                permIds.add(p.Id);
            }
        }

        List<ObjectPermissions> ops = [
            SELECT SobjectType, PermissionsModifyAllRecords
            FROM ObjectPermissions
            WHERE ParentId IN :permIds AND PermissionsModifyAllRecords = TRUE
        ];
        List<String> modifyAllSobjectTypes = new List<String>();
        for (ObjectPermissions op : ops) {
            modifyAllSobjectTypes.add(op.SobjectType);
        }

        List<ProcessInstanceWorkitem> workitems = [
            SELECT Id, ActorId, ProcessInstanceId, ProcessInstance.Status,
                ProcessInstance.TargetObjectId, ProcessInstance.TargetObject.Type, CreatedDate,
                ProcessInstance.ProcessDefinition.Name, ProcessInstance.ProcessDefinition.Description
            FROM ProcessInstanceWorkitem
            WHERE ProcessInstance.Status = 'Pending'
            AND (ActorId IN :bigList OR ProcessInstance.TargetObject.Type IN :modifyAllSobjectTypes)
        ];


        Map<String, String> idNameApprovers = new Map<String, String>();
        Map<String, List<String>> idObjectApprovers = new Map<String, List<String>>();
        Set<String> actorsIds = new Set<String>();
        for (ProcessInstanceWorkitem processInstanceWorkitem : workitems) {
            actorsIds.add(processInstanceWorkitem.ActorId);
            if (idObjectApprovers.containsKey(processInstanceWorkitem.ProcessInstance.TargetObject.Type)) {
                idObjectApprovers.get(processInstanceWorkitem.ProcessInstance.TargetObject.Type)
                    .add(processInstanceWorkitem.ProcessInstance.TargetObjectId);
            } else {
                idObjectApprovers.put(processInstanceWorkitem.ProcessInstance.TargetObject.Type,
                    new List<String>{
                        processInstanceWorkitem.ProcessInstance.TargetObjectId
                    });
            }
        }

        for (User user : [SELECT Id, Name FROM User WHERE Id IN :actorsIds]) {
            idNameApprovers.put(user.Id, user.Name);
        }

        for (Group groupElement : [SELECT Id, Name FROM Group WHERE Id IN :actorsIds]) {
            idNameApprovers.put(groupElement.Id, groupElement.Name);
        }

        Map<Id, SObject> objRecords = new Map<Id, SObject>();
        List<String> storageSOQL = new List<String>();
        for (String objectName : idObjectApprovers.keySet()) {
            if (!String.isBlank(objectName)
                && Schema.getGlobalDescribe().keySet().contains(objectName.toLowerCase())
                && Schema.getGlobalDescribe().get(objectName).getDescribe().isAccessible()
                ) {
                Map<String, Schema.SObjectField> objectFields = Schema.getGlobalDescribe().get(objectName).getDescribe().fields.getMap();
                List<String> fieldsObjects = new List<String>();
                for (String field : objectFields.keySet()) {
                    if (objectFields.get(field).getDescribe().isAccessible()) {
                        fieldsObjects.add(objectFields.get(field).getDescribe().getName());
                    }
                }
                Set<String> recordIds = new Set<String>();
                for (String objectId : idObjectApprovers.keySet()) {
                    recordIds.addAll(idObjectApprovers.get(objectId));
                }
                String query = 'SELECT';
                if (!fieldsObjects.isEmpty()) {
                    for (String field : fieldsObjects) {
                        query = query + ' ' + field + ',';
                    }
                    query = query.removeEnd(',');
                    query = query + ' FROM ' + objectName + ' WHERE Id IN :recordIds';
                }
                storageSOQL.add(query);
            }
        }

        try {
            if (storageSOQL.size() > 5) {
                for (Integer i = 0; i < 5; i++) {
                    Map<Id, SObject> resultQuery = new Map<Id, SObject>(Database.query(storageSOQL[i]));
                    objRecords.putAll(resultQuery);
                }
            } else {
                for (String query : storageSOQL) {
                    Map<Id, SObject> resultQuery = new Map<Id, SObject>(Database.query(query));
                    objRecords.putAll(resultQuery);
                }
            }
        } catch (Exception ex) {
            ex = new AuraHandledException('Operation has failed. Check your permissions.');
            throw ex;
        }

        String result = '';
        if (objRecords.size() != 0) {
            for (ProcessInstanceWorkitem processInstanceWorkitem : workitems) {
                initsElements.add(
                    new InitShowElement(
                        JSON.serialize(objRecords.get(processInstanceWorkitem.ProcessInstance.TargetObjectId)),
                        JSON.serialize(idNameApprovers),
                        JSON.serialize(processInstanceWorkitem)
                    )
                );
            }
            result = JSON.serialize(initsElements);
        }
        return result;
    }

    @AuraEnabled
    public static void doReassignRecords(String actorId, String idProcesses) {
        try {
            List<String> idApprovalProcesses = (List<String>) JSON.deserialize(idProcesses, List<String>.class);
            List<ProcessInstanceWorkitem> processes = new List<ProcessInstanceWorkitem>();
            for (Integer i = 0; i < idApprovalProcesses.size(); i++) {
                processes.add(new ProcessInstanceWorkitem(Id = idApprovalProcesses[i], ActorId = actorId));
            }
            Database.update(processes, false);
        } catch (Exception ex) {
            ex = new AuraHandledException('Operation has failed. Check your permissions.');
            throw ex;
        }
    }

    @AuraEnabled
    public static void doActions(String actionType, String comment, String idProcesses) {
        try {
            List<Approval.ProcessWorkitemRequest> actions = new List<Approval.ProcessWorkitemRequest>();
            List<String> idApprovalProcesses = (List<String>) JSON.deserialize(idProcesses, List<String>.class);
            for (String processId : idApprovalProcesses) {
                Approval.ProcessWorkitemRequest req = new Approval.ProcessWorkitemRequest();
                actionType = (actionType == 'Recall') ? 'Removed' : actionType;
                req.setAction(actionType);
                req.setWorkitemId(processId);
                if (!String.isBlank(comment)) {
                    req.setComments(comment);
                }
                actions.add(req);
            }
            Approval.process(actions, false);
        } catch (Exception ex) {
            ex = new AuraHandledException('Operation has failed. Check your permissions.');
            throw ex;
        }
    }

    @AuraEnabled
    public static void createCustomSettingRecords(String labelObjectName, String objectName, String userId, String fieldName) {
        try {
            if (labelObjectName.length() > 32) {
                Integer countCharacters = labelObjectName.length() - 32;
                String underName = objectName.left(objectName.length() - countCharacters);
                labelObjectName = underName + '_' + userId;
            }
            Default_Column_Field__c resultField = Default_Column_Field__c.getValues(labelObjectName);
            if (resultField == null) {
                Default_Column_Field__c newDefaultColumnField = new Default_Column_Field__c(
                    Name = labelObjectName,
                    UserId__c = userId,
                    Table_Field_Name__c = fieldName,
                    Label__c = labelObjectName
                );
                insert newDefaultColumnField;
            } else {
                resultField.Table_Field_Name__c = fieldName;
                update resultField;
            }
        } catch (Exception ex) {
            ex = new AuraHandledException('Create custom setting records has failed. Check your permissions.');
            throw ex;
        }
    }

    @AuraEnabled
    public static String getCustomSettingRecord(String labelObjectName, String objectName, String userId) {
        try {
            if (labelObjectName.length() > 32) {
                Integer countCharacters = labelObjectName.length() - 32;
                String underName = objectName.left(objectName.length() - countCharacters);
                labelObjectName = underName + '_' + userId;
            }
            Default_Column_Field__c resultField = Default_Column_Field__c.getValues(labelObjectName);
            if (resultField == null) {
                String defaultNameLabel = objectName + '_Default';
                resultField = Default_Column_Field__c.getValues(defaultNameLabel);
            }
            return resultField.Table_Field_Name__c;
        } catch (Exception ex) {
            ex = new AuraHandledException('Please, check you custom settings. You should have default fields on object.');
            throw ex;
        }
    }

    @AuraEnabled
    public static String getNameObjectCustomSettingRecords() {
        List<Default_Name_Obj__c> code = Default_Name_Obj__c.getAll().values();
        return (code.size() == 0) ? '' : JSON.serialize(code);
    }

    public class InitTableItem {
        @AuraEnabled
        public Boolean userTool { get; set; }
        @AuraEnabled
        public String userId { get; set; }
        @AuraEnabled
        public Boolean isRecall { get; set; }
        @AuraEnabled
        public String sObjName { get; set; }
        @AuraEnabled
        public String sObjLabel { get; set; }
        @AuraEnabled
        public String numb { get; set; }
        @AuraEnabled
        public String recordIds { get; set; }
        @AuraEnabled
        public String idNameApprovers { get; set; }
        @AuraEnabled
        public String jsonProcesses { get; set; }
        @AuraEnabled
        public List<Id> delegatedIds { get; set; }

        public InitTableItem(Boolean userTool, String userId, Boolean isRecall,
            String sObjName, String sObjLabel, String numb,
            String recordIds, String idNameApprovers,
            String jsonProcesses, List<Id> delegatedIds) {
            this.userTool = userTool;
            this.userId = userId;
            this.isRecall = isRecall;
            this.sObjName = sObjName;
            this.sObjLabel = sObjLabel;
            this.numb = numb;
            this.recordIds = recordIds;
            this.idNameApprovers = idNameApprovers;
            this.jsonProcesses = jsonProcesses;
            this.delegatedIds = delegatedIds;
        }
    }

    public class InitShowElement {
        @AuraEnabled
        public String objects { get; set; }
        @AuraEnabled
        public String idNameApprovers { get; set; }
        @AuraEnabled
        public String process { get; set; }

        public InitShowElement(String objects, String idNameApprovers, String process) {
            this.objects = objects;
            this.idNameApprovers = idNameApprovers;
            this.process = process;
        }
    }
}