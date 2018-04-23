({
    /*
     * データ取得
     *  IN  @ component ：component情報
     *      @ helper : helper情報
     *      @ viewid ： フィルタ情報
     */
	getRecords : function(component,helper,viewid) {
		var action = component.get("c.getListViewData");
        $A.util.removeClass(component.find('spinner'), 'slds-hide');
        component.set("v.cnt",0);
        component.set("v.allPage",0);
        component.set("v.nowPage",0);
        component.set("v.warning",false);
        component.set("v.err",false);
        //カラム情報
        var clmStr = component.get("v.ObjectColumnStr");
		var clms = [];
        if(clmStr===null || clmStr === undefined){
            clms = component.get("v.ObjectColumn");
        }else{
            var clmStrs = clmStr.split(','); 
            clms = clmStrs;
            component.set("v.ObjectColumn",clms);
        }		        
        action.setParams({
            "sObjectType" : component.get("v.sObjectType"),
            "clms" : clms,
            "viewId" : viewid
        });
        action.setCallback(this, function(a) {
            if(a.getState() === "SUCCESS"){
                var rec = a.getReturnValue();
				helper.setMapShow(component,rec,helper);
                if(rec.length >= 2000){
                    component.set("v.warning",true);
                    //ここのメッセージは変えてください。
                    component.set("v.warnMsg","2000件のデータが検索されました。検索条件を変更して対象を絞ってください。");
                }
                $A.util.addClass(component.find('spinner'), 'slds-hide');
            }else if(a.getState() === "ERROR"){
                 component.set("v.err",true);
                 var errors = action.getError();
                 if (errors) {
                     if (errors[0] && errors[0].message) 
                         component.set("v.errMsg",errors[0].pageErrors[0].message);
                 }
            }
        });
        $A.enqueueAction(action); 
	},
    /*
     * 形式変換
     * Salesforce提供API　$A.localizationServiceを利用
     *  IN  @ str ：文字列
     */
    formatDate: function(str){
        if($A.util.isEmpty(str)) return str;
        if(isNaN(str)){
            if(str.match(/^\d{4}\-\d{2}\-\d{2}$/)){
                //日付形式
                return $A.localizationService.formatDate(str, "YYYY/MM/DD");
            }else if(str.match(/^\d{4}\-\d{2}\-\d{2}\T\d{2}\:\d{2}\:\d{2}\.\d{3}\Z$/)){
                //日時形式
                return $A.localizationService.formatDateTime(str, "YYYY/MM/DD hh:mm:ss");
            }
    	}
    	return str;
	},
    /*
     * 配列ソート
     *  IN  @ component ：component情報
     *      @ helper : helper情報
     *      @ sortclm ： ソート対象のカラム名
     * 		@ sort : 降順、昇順(asc,desc)
     */
    sortData : function(component,helper,sortclm,sort){
        var datalist = component.get("v.ListData");
        if(sort==="asc"){
            datalist.sort(function(a,b){
               if(a[sortclm]===null || a[sortclm] === undefined) return 1;
               if(b[sortclm]===null || b[sortclm] === undefined) return -1;
                if(!isFinite(a[sortclm])&&!isFinite(b[sortclm])){
                   if(a[sortclm]<b[sortclm]) return -1;
                   if(a[sortclm]>b[sortclm]) return 1;
                }else{
                    return a[sortclm] -b[sortclm];
                }
               return 0;
            });
        }else{
             datalist.sort(function(a,b){
               if(a[sortclm]===null || a[sortclm] === undefined) return 1;
               if(b[sortclm]===null || b[sortclm] === undefined) return -1;
               if(!isFinite(a[sortclm])&&!isFinite(b[sortclm])){
                   if(a[sortclm]>b[sortclm]) return -1;
                   if(a[sortclm]<b[sortclm]) return 1;
               }else{
                  return b[sortclm] -a[sortclm];
               }
               return 0;
            });           
        }
        component.set("v.ListData",datalist);
        helper.setMapShow(component,datalist,helper);
    },
    /*
     * 取得データの表示配列セット
     * 可変に表示するため連想配列化する。
     *  IN  @ component ：component情報
     *      @ helper : helper情報
     *      @ rec ： Apexより取得したデータ(sObject型)
     */
    setMapShow : function(component,rec,helper) {
		var pageSize = component.get("v.pageSize");
        component.set("v.cnt",rec.length);
		component.set("v.ListData", rec);
		component.set("v.start",0);
		component.set("v.nowPage",1);
		component.set("v.end",pageSize-1);
		component.set("v.allPage",Math.ceil(rec.length/pageSize));
		var paginationList = [];
		var clms = component.get("v.ObjectColumn");
		for(var i=0; i< pageSize; i++){
		    if(rec[i]!=null){
		        var rArr = []
                for(var key of clms){
                    if(key!="Id" && key!="id" && key!="ID"
                       && key!="Name" && key!="name" && key!="NAME")
                        rArr.push(helper.formatDate(rec[i][key]));
                }
		        paginationList.push({
		        	key:rec[i].Id,
                    Name:rec[i].Name,
		            value:rArr
		        });
		    }
		}
		component.set('v.mapShow', paginationList);        
    },
	/*
	 *  一覧の表示ヘッダカラム
     *  IN  @ component ：component情報
	 */
    getListHeader : function(component) {
        var clmStr = component.get("v.ObjectColumnStr");
		var clms = [];
        if(clmStr===null || clmStr === undefined){
            clms = component.get("v.ObjectColumn");
        }else{
            var clmStrs = clmStr.split(','); 
            clms = clmStrs;
            component.set("v.ObjectColumn",clms);
        }	
        var action = component.get("c.getClmLabel");
        action.setParams({
            "sObjectType" : component.get("v.sObjectType"),
            "clms" : clms
        });
        action.setCallback(this, function(a) {
            if(a.getState() === "SUCCESS"){
                var rec = a.getReturnValue();
                var label=[];
                var api=[];
                //Mapから取得
                for ( var key in rec ) {
                    label.push(rec[key]);
                    api.push(key);
                }
                component.set("v.ListHeader",label);
                component.set("v.ListHeaderApi",api);
            }else if(a.getState() === "ERROR"){
                 component.set("v.err",true);
                 var errors = action.getError();
                 if (errors) {
                     if (errors[0] && errors[0].message) 
                         component.set("v.errMsg",errors[0].pageErrors[0].message);
                 }
            }
        });
        $A.enqueueAction(action); 
    }
})