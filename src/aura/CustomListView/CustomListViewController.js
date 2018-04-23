({
    /*
     * 初期処理
     */
	doInit : function(component, event, helper) {
        //Viewのリスト取得
		var action = component.get("c.getListViews");
        action.setParams({
            "sObjectType" : component.get("v.sObjectType")
        });
        action.setCallback(this, function(a) {
            if(a.getState() === "SUCCESS"){
                //対象オブジェクトのビュー情報を取得
                component.set("v.ListViews",a.getReturnValue());
                var views = a.getReturnValue();
                var opt = [];
                for( var i=0; i<views.length; i++ ) {
                    var addData = {class : "optionClass",label : views[i].Name,value : views[i].Id};
                    opt.push(addData);
                }
                //SelectBoxにセット
                component.find("listViewsSelect").set("v.options", opt);
                //一覧のヘッダ情報取得
                helper.getListHeader(component);
                //一覧のレコード情報取得
                helper.getRecords(component,helper,views[0].Id);
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
    /*
     * ビューの変更時
     */
    ,changeView : function(component, event, helper) {
        var val = component.find("listViewsSelect").get("v.value");
        helper.getRecords(component,helper,val);
    }
    /*
     * クリックヘッダ
     */
    ,clickHeader : function(component, event, helper){
        var target = event.target;
        if(target.tagName==null) return;
        var clm;
        if(target.tagName=="A"){
         	clm = "sort"+ target.rel;   
        }
        //iconを一度すべて非表示
        var clms = component.get("v.ListHeaderApi");
        for(var idx in clms){
            var iconhide = document.getElementById("sort"+idx);
            $A.util.addClass(iconhide, 'slds-hide');
        }
        //クリックしたヘッダのiconを表示
        var icon = document.getElementById(clm);
		$A.util.removeClass(icon, 'slds-hide');
        var sorted = component.get("v.sorticon");
        var sort;
        if(sorted==="utility:arrowdown"){
            component.set("v.sorticon","utility:arrowup");
            sort = "desc";
        }else{
            component.set("v.sorticon","utility:arrowdown");
            sort = "asc";
        }
        //sort処理
        helper.sortData(component,helper,clms[target.rel],sort);
    }
    /*
     * Todoボタン押下
     * ※独立したコンポーネントにしてもいいと思います。今回は直接処理記載。
     */
    ,clickTodoBtn : function(component, event, helper) {
        var target = event.target;
        if(target.tagName==null) return;
        if(target.tagName=="BUTTON"){
            target = target.firstElementChild;
        }
        if(target.tagName=="A"){
            var recId = target.rel;
            var createRecordEvent = $A.get("e.force:createRecord");
            createRecordEvent.setParams({
                "entityApiName": "Task",
                "defaultFieldValues": {
                    "WhatId":recId
                }
            });
            createRecordEvent.fire();
        }
    }
    /*
     * 商談ボタン押下
     * ※独立したコンポーネントにしてもいいと思います。今回は直接処理記載。
     */
    ,clickOppBtn : function(component, event, helper) {
        var target = event.target;
        if(target.tagName==null) return;
        if(target.tagName=="BUTTON"){
            target = target.firstElementChild;
        }
        if(target.tagName=="A"){
            var recId = target.rel;
            var createRecordEvent = $A.get("e.force:createRecord");
            createRecordEvent.setParams({
                "entityApiName": "Opportunity",
                "defaultFieldValues": {
                    "AccountId":recId
                }
            });
            createRecordEvent.fire();
        }
    }
    /*
     * 新規ボタン押下
     * ※独立したコンポーネントにしてもいいと思います。今回は直接処理記載。
     */
    ,createData : function(component, event, helper) {
        var createRecordEvent = $A.get("e.force:createRecord");
        createRecordEvent.setParams({
             "entityApiName": component.get("v.sObjectType")
        });
        createRecordEvent.fire();
    },
    /*
     * ページャー機能：次へ
     */
    Next : function(component, event, helper) {
        var end = component.get("v.end");
        var start = component.get("v.start");
        var pageSize = component.get("v.pageSize");
        var paginationList = [];
        var now = component.get("v.nowPage");
        var cnt = 0;
        var rec = component.get("v.ListData");
        var clms = component.get("v.ObjectColumn");
        for(var i=end+1; i<end+pageSize+1; i++){
            if(rec.length > end){
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
                cnt++;
            }
        }
        start = start + cnt;
        end = end + cnt;
        component.set("v.start",start);
        component.set("v.end",end);
        component.set("v.nowPage",now+1);
        component.set('v.mapShow', paginationList);
    },
    /*
     * ページャー機能：前へ
     */    
    Previous : function(component, event, helper) {
        var rec = component.get("v.ListData");
        var end = component.get("v.end");
        var start = component.get("v.start");
        var pageSize = component.get("v.pageSize");
        var now = component.get("v.nowPage");
        var paginationList = [];
        var cnt = 0;
        var clms = component.get("v.ObjectColumn");
        for(var i= start-pageSize; i < start ; i++){
            if(i > -1){
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
                cnt++;
            }else{
                start++;
            }
        }
        start = start - cnt;
        end = end - cnt;
        component.set("v.start",start);
        component.set("v.end",end);
        component.set("v.nowPage",now-1);
        component.set('v.mapShow', paginationList);
    }
})