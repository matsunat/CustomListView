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
            "viewId" : viewid,
            "sortclm1": component.get("v.SortClm"),
            "sort1": component.get("v.Sort")
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
     * 編集キャンセル
     *  IN  @ component ：component情報
     *      @ helper : helper情報
     */
    cancelEditMode : function(component,helper) {
        var mapShow = component.get("v.mapShow");
        for ( var key in mapShow ) {
            var rec = mapShow[key].record;
            for(var i=0; i< rec.length; i++){
                rec[i].editmode = false;
                rec[i].value = rec[i].oldvalue;
                rec[i].edited = "";
            }
        }
        component.set("v.edited",false);
        component.set("v.mapShow",mapShow);
        component.set("v.err",false);
        $A.util.addClass(component.find('spinner'), 'slds-hide');
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
		var reverse = sort !== 'asc';
        datalist.sort(this.sortBy(sortclm, reverse));
        
        component.set("v.ListData",datalist);
        helper.setMapShow(component,datalist,helper);
    },
    sortBy: function (field, reverse, primer) {
        var key = primer ?
            function(x) {return primer(x[field])} :
        function(x) {return x[field]};
        reverse = !reverse ? 1 : -1;
        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    },
    /*
     * レコードセット
     */
    setMapShowRecord : function(component,rec,clms,i,clmInfo,paginationList,helper) {
        if(rec[i]!=null){
            var rArr = []
            var clmIndex = 0;
            for(var key of clms){
                if(key!="Id" && key!="id" && key!="ID"
                   && key!="Name" && key!="name" && key!="NAME"){
                    var isUpdate=false;
                    var fieldType;
                    var length;
                    var picLabel;
                    var picValue;
                    for(var j=0; j< clmInfo.length; j++){
                        if(key===clmInfo[j].key){
                            isUpdate = clmInfo[j].isUpdate;
                            fieldType = clmInfo[j].fieldType;
                            length = clmInfo[j].length;
                            picLabel = clmInfo[j].piclistLabel;
                            picValue = clmInfo[j].piclistValue;
                            break;
                        }
                    }
                    rArr.push({
                        "apiName":key,
                        "value":rec[i][key],
                        "oldvalue":rec[i][key],
                        "clmIndex" : clmIndex,
                        "isUpdate" : isUpdate,
                        "fieldType" : fieldType,
                        "length" : length,
                        "piclistLabel" : picLabel,
                        "piclistValue" : picValue,
                        "editmode":false,
                        "edited":""
                    });
                    clmIndex++;
                }
            }
            paginationList.push({
                key:rec[i].Id,
                Name:rec[i].Name,
                Selected:false,
                record:rArr
            });
        }        
        
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
        var clmInfo = component.get("v.mapClmInfo");
		for(var i=0; i< pageSize; i++){
			helper.setMapShowRecord(component,rec,clms,i,clmInfo,paginationList,helper);
		}
		component.set('v.mapShow', paginationList); 
        helper.setViewCnt(component,rec.length,1,pageSize);
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
                var clmInfo=[];
                //Mapから取得
                for ( var key in rec ) {
                    label.push(rec[key]['LabelName']);
                    api.push(rec[key]['apiName']);
                    //項目情報
                    clmInfo.push({
                        key:rec[key]['apiName'],
                        isUpdate : rec[key]['isUpdate'],
                        fieldType : rec[key]['fieldType'],
                        length : rec[key]['length'],
                        piclistLabel : rec[key]['piclistLabel'],
                        piclistValue : rec[key]['piclistValue']
                    });
                }
                component.set("v.ListHeader",label);
                component.set("v.ListHeaderApi",api);
                component.set("v.mapClmInfo",clmInfo);
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