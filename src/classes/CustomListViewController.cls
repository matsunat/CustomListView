/*
 * 拡張リストビューコントローラー
 * ※エラーハンドリングはわざと実装しておりません。（コンポーネント側で実装）
 * 独自のエラーハンドリング処理があれば追加してください。
 */
public with sharing class CustomListViewController {
    /*
     * リストビュー情報取得
     * IN  @ sObjectType ：対象オブジェクトのAPI名
     * OUT @  List<ListView>　：リストビュー配列
     */
    @AuraEnabled
	public static List<ListView> getListViews(string sObjectType){
        List<ListView> listviews = new List<ListView>();
        listviews = [SELECT Id, Name,developerName FROM ListView WHERE SobjectType = :sObjectType order by name ASC];
        return listviews;
    }
    /*
     * カラムのラベル情報取得
     * IN  @ sObjectType ：対象オブジェクトのAPI名
     *     @ clms ：表示指定の項目API名
     * OUT @   Map<String,String>　：API名,ラベルのMap配列
     */
    @AuraEnabled
    public static Map<String,String> getClmLabel(string sObjectType,List<string> clms){
        Map<String,String>  mapLabel = new Map<String,String> ();
        //スキーマ情報から対象オブジェクト情報を取得
        Schema.SObjectType sObjType = (Schema.SObjectType) Schema.getGlobalDescribe().get(sObjectType);
        Map<String, Schema.SObjectField> fieldmap = sObjType.getDescribe().fields.getMap();
        for(string f : clms){
            //Id項目は不要
            if(f!='id' && f!='Id' && f!='ID'){
                try{
                    Schema.SObjectField field = (Schema.SObjectField) fieldmap.get(f);
                    Schema.DescribeFieldResult fr = field.getDescribe();
                    mapLabel.put(fr.getName(),fr.getLabel());
                }catch(exception ex){
                    //リレーション項目はラベル値をカラム名とします。
                    //数式を作成して表示することをお勧めします。
                    mapLabel.put(f,f);
                }
            }
        }
        return mapLabel;
    }
    /*
     * リストデータ情報取得
     * IN  @ sObjectType ：対象オブジェクトのAPI名
     *     @ clms ：表示指定の項目API名
     *     @ ViewId ：絞り込みViewのID
     * OUT @ List<sObject>　：リストビューデータ
     */
    @AuraEnabled
    public static List<sObject> getListViewData(string sObjectType,List<string> clms,string viewId){
        List<sObject> lstObj = new List<sObject>();
        	//対象オブジェクトの標準コントローラーにアクセス
            ApexPages.StandardSetController ssc = new ApexPages.StandardSetController(
                database.getQueryLocator(getquery(sObjectType,clms))
            );
        	//1ページ取得数を最大化
			ssc.setPageSize(200);
            //指定ビューでフィルタリング
            ssc.setFilterID(viewId);
            boolean doLoop = true;
            integer cnt=0;
            while(doLoop){
                for(sObject rec : ( List<sObject> ) ssc.getRecords()) {
                    lstObj.add(rec);
                    cnt++;
                }
                //2000件読込むか最大数読込完了でブレイク
                if(!ssc.getHasNext() || cnt >=2000) break;
                ssc.next();
            }
        return lstObj;
    }
    /*
     * クエリ生成
     */
    private static string getquery(string sObjectType,List<string> clms){
        string q = 'select ';
        integer cnt = 0;
        for(string s : clms){
            if(cnt==0){
                q+= string.isEmpty(s)? '':+s;
            }else{
                q+= string.isEmpty(s)? '':','+s;
            }
            cnt++;
        }
        q+=' From ' + sObjectType + ' limit 1';
        system.debug(q);
        return q;
    }
}