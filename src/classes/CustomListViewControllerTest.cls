/*
 * 拡張リストビューコントローラー テストコード
 */
@isTest
public class CustomListViewControllerTest {
	@testSetup
    private static void setup(){
        List<Account> lstacc = new List<Account>();
        integer i = 0;
        while(i<=2001){
            lstacc.add (new Account (Name = 'test'+i.format(),Phone='090-'+i.format()));
            i++;
        }
        insert lstacc;
    }
    private static testmethod void UnitTest(){
        Test.startTest();
        
        //1.ListViewの取得
        List<ListView> lstView = CustomListViewController.getListViews('Account');
        //View情報が取得できること
        system.assertNotEquals(lstView.size(), 0);
        //2.カラム取得
        List<string> lstClm = new List<string>();
        lstClm.Add('Id');
        lstClm.Add('Name');
        lstClm.Add('Phone');
        lstClm.Add('Type');
        lstClm.Add('ParentId');
        lstClm.Add('Description');
        lstClm.Add('LastActivityDate');
        lstClm.Add('AnnualRevenue');
        lstClm.Add('Owner.Name');
        list<CustomListViewController.FieldInfo> listFI = new list<CustomListViewController.FieldInfo>();
        listFI = CustomListViewController.getClmLabel('Account', lstClm);
        Map<string,string> mapLbl = new Map<string,string>();
        for(CustomListViewController.FieldInfo f : listFI){
            mapLbl.put(f.apiName,f.labelName);
        }
        for(string key : lstClm){
            if(key.equals('Id')){
                //Idは対象外
                system.assert(!mapLbl.containsKey(key));
            }else if(key.equals('Owner.Name')){
                //リレーション項目はclmと同じ内容であること
                system.assertequals(mapLbl.get(key),'Owner.Name');
            }else{
                //カラム名に対するラベル名が取得されること
                system.assert(!string.isBlank(mapLbl.get(key)));
            }
            
        }
        //3.データ取得
        id viewId = null;
        for(listview r : lstView){
            if(r.developerName.equals('AllAccounts')){
                viewId = r.Id;
            }
        }
        list<sObject> lstObj = CustomListViewController.getListViewData('Account',lstClm,viewId);
        //2000件までのデータが取得されている。
        system.assertEquals(lstObj.size(),2000);
        //4.データ更新
        list<sObject> lstUpd = new list<sObject>();
        lstUpd.Add(lstObj[0]);
		CustomListViewController.updListViews(lstUpd);
        test.stopTest();
    }
}