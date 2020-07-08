@IsTest
private class MassApprovalControllerTest {

    @TestSetup
    private static void setup() {
        List<Account> accs = new List<Account>{
            new Account(Name = 'account1'),
            new Account(Name = 'account2')
        };
        insert accs;
        Contact cont = new Contact(FirstName = 'fn', LastName = 'ln');
        insert cont;
        List<Approval.ProcessSubmitRequest> submits = new List<Approval.ProcessSubmitRequest>();
        for (Account acc : accs) {
            Approval.ProcessSubmitRequest submitRequest = new Approval.ProcessSubmitRequest();
            submitRequest.setObjectId(acc.Id);
            submitRequest.setSubmitterId(UserInfo.getUserId());
            submitRequest.setNextApproverIds(new List<Id>{
                UserInfo.getUserId()
            });
            submitRequest.setProcessDefinitionNameOrId(null);
            submitRequest.setSkipEntryCriteria(true);
            submits.add(submitRequest);
        }
        Approval.ProcessSubmitRequest submitRequest = new Approval.ProcessSubmitRequest();
        submitRequest.setObjectId(cont.Id);
        submitRequest.setSubmitterId(UserInfo.getUserId());
        submitRequest.setNextApproverIds(new List<Id>{
            UserInfo.getUserId()
        });
        submitRequest.setProcessDefinitionNameOrId(null);
        submitRequest.setSkipEntryCriteria(true);
        submits.add(submitRequest);
        List<Approval.ProcessResult> submitResults = new List<Approval.ProcessResult>();
        if (!submits.isEmpty()) {
            submitResults = Approval.process(submits, false);
        }
    }

    @IsTest
    private static void getAllApprovalProcessesTest() {
        Test.startTest();
        List<MassApprovalController.InitTableItem> initTableItems = MassApprovalController.getAllApprovalProcesses();
        Test.stopTest();
        System.assertEquals(2, initTableItems.size());
    }

    @IsTest
    private static void getApprovalProcessesTest() {
        Test.startTest();
        String resultElement = MassApprovalController.getAllProcessesPreview();
        Test.stopTest();
        System.assertNotEquals(null, JSON.deserialize(resultElement, List<MassApprovalController.InitShowElement>.class));
    }

    @IsTest
    private static void getAllUsersTest() {
        String objApiName = 'Account';
        Test.startTest();
        Map<Id, User> users = new Map<Id, User>(MassApprovalController.getAllUsers(objApiName));
        List<PermissionSet> perms = [
            SELECT
                Id, (
                SELECT Id
                FROM Assignments
                WHERE AssigneeId IN :users.keySet()
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
            SELECT Id
            FROM ObjectPermissions
            WHERE ParentId IN :permIds
            AND PermissionsRead = TRUE
            AND SobjectType = :objApiName
        ];
        Test.stopTest();
        System.assertEquals(users.size(), ops.size() - 2);
    }

    @IsTest
    private static void doActionTest() {
        List<String> listElements = new List<String>();
        for (ProcessInstanceWorkitem processItem : [SELECT Id FROM ProcessInstanceWorkitem]) {
            listElements.add(processItem.Id);
        }
        Test.startTest();
        MassApprovalController.doActions('Approve', 'comment', JSON.serialize(listElements));
        Test.stopTest();
        List<String> resultElements = new List<String>();
        for (ProcessInstanceWorkitem processItem : [SELECT Id FROM ProcessInstanceWorkitem]) {
            resultElements.add(processItem.Id);
        }
        System.assertNotEquals(listElements.size(), resultElements.size());
    }

    @IsTest
    private static void doReassignRecordsTest() {
        List<String> listElements = new List<String>();
        for (ProcessInstanceWorkitem processItem : [SELECT Id FROM ProcessInstanceWorkitem]) {
            listElements.add(processItem.Id);
        }
        Test.startTest();
        MassApprovalController.doReassignRecords(UserInfo.getUserId(), JSON.serialize(listElements));
        Test.stopTest();
        List<String> resultElements = new List<String>();
        for (ProcessInstanceWorkitem processItem : [SELECT Id FROM ProcessInstanceWorkitem]) {
            resultElements.add(processItem.Id);
        }
        System.assertEquals(listElements.size(), resultElements.size());
    }

    @IsTest
    private static void whenRetrieveFullInfoAboutObject() {
        String IdContact = [SELECT Id FROM Contact LIMIT 1].Id;
        Test.startTest();
        List<String> result = MassApprovalController.getFullInformationAboutObject('Contact', new List<String>{
            IdContact
        });
        Test.stopTest();
        System.assertNotEquals(0, result.size());
    }

    @IsTest
    private static void whenOtherUserTryToGetInfo() {
        String uniqueUserName = 'standarduser' +
            Datetime.now().getTime() + '@testorg.com';
        Profile p = [
            SELECT Id
            FROM Profile
            WHERE Name = 'Force.com - Free User'
        ];
        User user = new User(Alias = 'standt', Email = 'standarduser@testorg.com',
            EmailEncodingKey = 'UTF-8', LastName = 'Testing', LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US', ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            Username = uniqueUserName);
        String IdContact = [SELECT Id FROM Contact LIMIT 1].Id;
        try {
            System.runAs(user) {
                Test.startTest();
                MassApprovalController.getFullInformationAboutObject('Contact', new List<String>{
                    IdContact
                });
                Test.stopTest();
            }
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void getAllApprovalProcessesTestDoesNotWork() {
        try {
            Test.startTest();
            MassApprovalController.getAllApprovalProcesses();
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void getAllUsersTestDoesNotWork() {
        try {
            Test.startTest();
            MassApprovalController.getAllUsers(null);
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void doActionsTestDoesNotWork() {
        try {
            List<String> resultItems = new List<String>();
            resultItems.add('');
            Test.startTest();
            MassApprovalController.doActions('', '', JSON.serialize(resultItems));
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenReassignDoNotWork() {
        try {
            Test.startTest();
            MassApprovalController.doReassignRecords('00120000200000000A',
                JSON.serialize(new List<String>{
                    ''
                })
            );
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenActionDoNotWork() {
        try {
            Test.startTest();
            MassApprovalController.doActions(null, null, null);
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenOtherUserTryToGetAllApprovalProcesses() {
        String uniqueUserName = 'standarduser' +
            Datetime.now().getTime() + '@testorg.com';
        Profile p = [
            SELECT Id
            FROM Profile
            WHERE Name = 'Force.com - Free User'
        ];
        User user = new User(Alias = 'standt', Email = 'standarduser@testorg.com',
            EmailEncodingKey = 'UTF-8', LastName = 'Testing', LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US', ProfileId = p.Id,
            TimeZoneSidKey = 'America/Los_Angeles',
            Username = uniqueUserName);
        try {
            System.runAs(user) {
                Test.startTest();
                MassApprovalController.getAllApprovalProcesses();
                Test.stopTest();
            }
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenCanNotWorkWithCustomSettingRecord() {
        try {
            Test.startTest();
            MassApprovalController.createCustomSettingRecords(null, null, null, null);
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenCanNotGetCustomSettingRecord() {
        try {
            Test.startTest();
            MassApprovalController.getCustomSettingRecord(null, null, null);
            Test.stopTest();
        } catch (AuraHandledException ex) {
            System.debug(ex.getMessage());
        }
    }

    @IsTest
    private static void whenGetNameObjectCustomSettingRecords() {
        Test.startTest();
        String result = MassApprovalController.getNameObjectCustomSettingRecords();
        Test.stopTest();
        System.assertEquals('', result);
    }

    @IsTest
    private static void whenCreateCustomSettingRecord() {
        Test.startTest();
        MassApprovalController.createCustomSettingRecords(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W',
            'Name, Fax'
        );
        String fields = MassApprovalController.getCustomSettingRecord(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W'
        );
        Test.stopTest();
        System.assertEquals('Name, Fax', fields);
    }

    @IsTest
    private static void whenUpdateCustomSettingRecord() {
        Test.startTest();
        MassApprovalController.createCustomSettingRecords(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W',
            'Name, Fax'
        );
        MassApprovalController.createCustomSettingRecords(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W',
            'Name, Fax, Phone'
        );
        String fields = MassApprovalController.getCustomSettingRecord(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W'
        );
        Test.stopTest();
        System.assertEquals('Name, Fax, Phone', fields);
    }

    @IsTest
    private static void whenCreateLongNameCustomSettingRecord() {
        Test.startTest();
        MassApprovalController.createCustomSettingRecords(
            'Test_approval_process__c_00500000000000000W',
            'Test_approval_process__c',
            '00500000000000000W',
            'Name'
        );
        String fields = MassApprovalController.getCustomSettingRecord(
            'Test_approval_process__c_00500000000000000W',
            'Test_approval_process__c',
            '00500000000000000W'
        );
        Test.stopTest();
        System.assertEquals('Name', fields);
    }

    @IsTest
    private static void whenWorkWithDefaultCustomSettingRecord() {
        Test.startTest();
        MassApprovalController.createCustomSettingRecords(
            'Account_Default',
            'Account',
            null,
            'Name'
        );
        String fields = MassApprovalController.getCustomSettingRecord(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W'
        );
        Test.stopTest();
        System.assertEquals('Name', fields);
    }

    @IsTest
    private static void whenTestPostInstallClass() {
        PostInstallClass postInstall = new PostInstallClass();
        Test.testInstall(postInstall, null);
        Test.testInstall(postInstall, new Version(1,0), true);
        String fields = MassApprovalController.getCustomSettingRecord(
            'Account_00500000000000000W',
            'Account',
            '00500000000000000W'
        );
        System.assertEquals('Name,Phone', fields);
    }
}