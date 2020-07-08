global with sharing class PostInstallClass implements InstallHandler {

    global void onInstall(InstallContext context) {
        if (context.previousVersion() == null) {
            List<ma_vrp__Default_Name_Obj__c> defaultNames = new List<ma_vrp__Default_Name_Obj__c>();
            List<ma_vrp__Default_Column_Field__c> defaultFields = new List<ma_vrp__Default_Column_Field__c>();

            Map<String, String> objectsAndFields = new Map<String, String>();
            objectsAndFields.put('Opportunity_Default', 'Name, StageName,Type,Account.Name,Amount');
            objectsAndFields.put('Contact_Default', 'Name,MobilePhone,Email,Account.Name');
            objectsAndFields.put('Case_Default', 'CaseNumber,Status,Subject,Description');
            objectsAndFields.put('Lead_Default', 'Name,LeadSource,Status,Email');
            objectsAndFields.put('Product2_Default', 'Name,ProductCode');
            objectsAndFields.put('Account_Default', 'Name,Phone');
            objectsAndFields.put('Contract_Default', 'ContractNumber,Status,Account.Name');
            objectsAndFields.put('Campaign_Default', 'Name,Status,Type');
            objectsAndFields.put('Order_Default', 'Name,Type,Status,Account.Name,TotalAmount');

            for (String objectName : objectsAndFields.keySet()) {
                defaultNames.add(
                        new ma_vrp__Default_Name_Obj__c(
                                Name = objectName.split('_')[0],
                                ma_vrp__Fields__c = objectsAndFields.get(objectName).split(',')[0]
                        )
                );
                defaultFields.add(
                        new ma_vrp__Default_Column_Field__c(
                                Name = objectName,
                                ma_vrp__Table_Field_Name__c = objectsAndFields.get(objectName),
                                ma_vrp__Label__c = objectName
                        )
                );
            }

            insert defaultFields;
            insert defaultNames;
        }
    }
}