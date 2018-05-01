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
     * InnerClass
     * 項目情報
     */
    public class FieldInfo{
        @AuraEnabled
        public string apiName;
        @AuraEnabled
        public string LabelName;
        @AuraEnabled
        public string fieldType;
        @AuraEnabled
        public boolean isUpdate;
        @AuraEnabled
        public integer length;
        @AuraEnabled
        public string piclistLabel;
        @AuraEnabled
        public string piclistValue;        
        public FieldInfo(){
            apiName = '';
            LabelName = '';
            fieldType = '';
            isUpdate = false;
            length=0;
            piclistLabel='';
			piclistValue='';                
        }
    }
    /*
     * カラムのラベル情報取得
     * IN  @ sObjectType ：対象オブジェクトのAPI名
     *     @ clms ：表示指定の項目API名
     * OUT @ List<FieldInfo>　：Field情報配列
     */
    @AuraEnabled
    public static List<FieldInfo> getClmLabel(string sObjectType,List<string> clms){
        List<FieldInfo>  lstFieldInfo = new List<FieldInfo> ();
        //スキーマ情報から対象オブジェクト情報を取得
        Schema.SObjectType sObjType = (Schema.SObjectType) Schema.getGlobalDescribe().get(sObjectType);
        Map<String, Schema.SObjectField> fieldmap = sObjType.getDescribe().fields.getMap();
        for(string f : clms){
            //Id項目は不要
            if(f!='id' && f!='Id' && f!='ID'){
                FieldInfo fi = new FieldInfo();
                try{
                    Schema.SObjectField field = (Schema.SObjectField) fieldmap.get(f);
                    Schema.DescribeFieldResult fr = field.getDescribe();
                    fi.apiName=fr.getName();
                    fi.labelName = fr.getLabel();
                    fi.isUpdate = isfieldUpdate(fr.isUpdateable(),fr.getType());
                    fi.fieldType = getFieldTypeStr(fr.getType());
                    fi.length = fr.getLength();
                    
                    if(fr.getType()==Schema.DisplayType.PICKLIST){
                        integer i = 0;
                        for(Schema.PicklistEntry p : fr.getPicklistValues()){
                            if(i==0){
                                fi.piclistLabel = p.getLabel();
                                fi.piclistValue = p.getValue();
                            }else{
                                fi.piclistLabel += ','+p.getLabel();
                                fi.piclistValue += ','+p.getValue();                                
                            }
                            i++;
                        }
                    }                  
                }catch(exception ex){
                    //リレーション項目はラベル値をカラム名とします。
                    //数式を作成して表示することをお勧めします。
                    fi.apiName=f;
                    fi.labelName = f;
                    fi.isUpdate = false;
                }
                system.debug(fi);
                lstFieldInfo.Add(fi);
            }
        }
        return lstFieldInfo;
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
    @AuraEnabled
	public static void updListViews(List<sObject> lstUpd){
        if(!lstUpd.isEmpty()) update lstUpd;
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
    /*
     * 型項目をテキスト変換(出力、入力時に使用する)
     * 数値：NUMBER
     * 金額：CURRENCY
     * 日付：DATE
     * 日時：DATETIME
     * チェックボックス：BOOLEAN
     * テキストエリア：TEXTAREA
     * その他：STRING
     */
    private static string getFieldTypeStr(Schema.DisplayType ft){
        string fts = 'STRING';
        if(ft == Schema.DisplayType.ADDRESS){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.ANYTYPE){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.BASE64){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.BOOLEAN){
            fts = 'BOOLEAN';
        }
        else if(ft == Schema.DisplayType.COMBOBOX){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.COMPLEXVALUE){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.CURRENCY){
            fts = 'CURRENCY';
        }
        else if(ft == Schema.DisplayType.DATACATEGORYGROUPREFERENCE){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.DATE){
            fts = 'DATE';
        }
        else if(ft == Schema.DisplayType.DATETIME){
            fts = 'DATETIME';
        }
        else if(ft == Schema.DisplayType.DOUBLE){
            fts = 'NUMBER';
        }
        else if(ft == Schema.DisplayType.EMAIL){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.ENCRYPTEDSTRING){
            fts = 'STRING';
        }  
        else if(ft == Schema.DisplayType.ID){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.INTEGER){
            fts = 'NUMBER';
        }
        else if(ft == Schema.DisplayType.JSON){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.LOCATION){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.MULTIPICKLIST){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.PERCENT){
            fts = 'NUMBER';
        }
        else if(ft == Schema.DisplayType.PHONE){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.PICKLIST){
            fts = 'PICKLIST';
        }
        else if(ft == Schema.DisplayType.REFERENCE){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.SOBJECT){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.STRING){
            fts = 'STRING';
        }
        else if(ft == Schema.DisplayType.TEXTAREA){
            fts = 'TEXTAREA';
        }
        else if(ft == Schema.DisplayType.URL){
            fts = 'STRING';
        }
        return fts;
    }
    /*
     * 編集可能項目を限定する。
     */
    private static boolean isfieldUpdate(boolean enableUpdate,Schema.DisplayType ft){
        if(!enableUpdate) return false;
		if(ft == Schema.DisplayType.BASE64
          ||ft == Schema.DisplayType.COMBOBOX
          ||ft == Schema.DisplayType.COMPLEXVALUE
          ||ft == Schema.DisplayType.DATACATEGORYGROUPREFERENCE
          ||ft == Schema.DisplayType.ENCRYPTEDSTRING
          ||ft == Schema.DisplayType.ID
          ||ft == Schema.DisplayType.JSON
          ||ft == Schema.DisplayType.LOCATION
          ||ft == Schema.DisplayType.MULTIPICKLIST
          ||ft == Schema.DisplayType.REFERENCE //仕様上参照項目は使用できない
          ||ft == Schema.DisplayType.SOBJECT
          )
        {
        	return false;
        }
        return enableUpdate;
    }
}