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
        var edited = component.get("v.edited");
        if(edited){
            if( window.confirm( "編集内容が保存されていません。リストビューを切り替えてよろしいですか？" )){
                component.set("v.edited",false);
            }else{
                return;
            }
        }
        var val = component.find("listViewsSelect").get("v.value");
        helper.getRecords(component,helper,val);
    }
    /*
     * クリックヘッダチェックボックス
     */
    ,clickHeaderChk : function(component, event, helper){
        var chk = component.get("v.allChk");
        var mapShow = component.get("v.mapShow");
        for ( var key in mapShow ) {
            mapShow[key].Selected = chk;
            var rec = mapShow[key].record;
            for(var i=0; i< rec.length; i++){
                rec[i].editmode = false;
            }
        }
        component.set("v.mapShow",mapShow);
    }
    ,clickRecordChk : function(component, event, helper){
        var mapShow = component.get("v.mapShow");
        for ( var key in mapShow ) {
            var rec = mapShow[key].record;
            for(var i=0; i< rec.length; i++){
                rec[i].editmode = false;
            }
        }
        component.set("v.mapShow",mapShow);
    }
    /*
     * クリックヘッダ
     */
    ,clickHeader : function(component, event, helper){
        var edited = component.get("v.edited");
        if(edited){
            if( window.confirm( "編集内容が保存されていません。ページを並び替えてよろしいですか？" )){
                component.set("v.edited",false);
            }else{
                return;
            }
        }
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
     * インライン編集
     */
    ,clickClm : function(component, event, helper) {
        var target = event.target;
        if(target.tagName===null || target.tagName === undefined) return;
        if(target.tagName!="TD"){
            //TDまでノードを上る
            while(true){
                target = target.parentNode;
                if(target.tagName==="TD") break;
            }
        }
        var apiName;
        var recKey;
        if(target.tagName==="TD"){
            var UlPram = target.getElementsByTagName('ul');
            if(UlPram.length>0){
                var listPram = UlPram[0].children;
                for (var i = 0; i < listPram.length; i++){
                    if(listPram[i].id==="recKey") recKey=listPram[i].innerHTML;
                    if(listPram[i].id==="apiName") apiName=listPram[i].innerHTML;
                }
            }
            var mapShow = component.get("v.mapShow");
            component.set("v.selectRec",0);
            var cnt = 0;
            for ( var key in mapShow ) {
                if(mapShow[key].Selected)cnt++;
                if(mapShow[key].key===recKey){
                    var rec = mapShow[key].record;
                    for(var i=0; i< rec.length; i++){
                        if(rec[i].apiName === apiName){
                            rec[i].editmode = true;
                            break;
                        }
                    }
                }else{
                    var rec = mapShow[key].record;
                    for(var i=0; i< rec.length; i++){
                         rec[i].editmode = false;
                    }
                }
            }
            //現在の値を保持
            component.set("v.selectRec",cnt);
            component.set("v.mapShow",mapShow);
        }
    }
    ,fieldEdit : function(component, event, helper) {
        var recKey = event.getParam("sObjectId");
        var apiName = event.getParam("apiName");
        var newValue = event.getParam("value");
        var fixOther = event.getParam("fixOther");
        var mapShow = component.get("v.mapShow");
        for ( var key in mapShow ) {
            var fix = false;
            if(mapShow[key].key===recKey){
                fix = true;
            }
            if(fixOther){
                if(mapShow[key].Selected) fix = true;
            }
            if(fix){
                var rec = mapShow[key].record;
                for(var i=0; i< rec.length; i++){
                    if(rec[i].apiName === apiName){
                        rec[i].value = newValue;
                        rec[i].editmode = false;
                        if(rec[i].oldvalue != newValue){
                            rec[i].edited = "slds-is-edited";
                            component.set("v.edited",true);
                        }else{
                            rec[i].edited = "";
                        }
                        break;
                    }
                }
            }
        }
        //現在の値を保持
        component.set("v.mapShow",mapShow);        
    }
    ,CancelEdit : function(component, event, helper){
        helper.cancelEditMode(component, event);
    }
    ,SaveEdit : function(component, event, helper){
        var ListData = component.get("v.ListData");
        var mapShow = component.get("v.mapShow");
        var upd =[];
        for ( var key in mapShow ) {
            var rec = mapShow[key].record;
            for(var i=0; i< ListData.length; i++){
                if(mapShow[key].key === ListData[i].Id){
                    var edit = false;
                    for(var j=0; j< rec.length; j++){
                        if(rec[j].edited==="slds-is-edited"){
                            if(rec[j].fieldType==="DATETIME"){
                                var str = rec[j].value;
                                if($A.util.isEmpty(str)){
                                    ListData[i][rec[j].apiName] = rec[j].value;
                                }else{
                                    if(str.match(/^\d{4}\-\d{2}\-\d{2}\T\d{2}\:\d{2}\$/)){
                                        ListData[i][rec[j].apiName] = rec[j].value+':00.000Z';
                                    }else if(str.match(/^\d{4}\-\d{2}\-\d{2}\T\d{2}\:\d{2}\:\d{2}\.\d{3}\Z$/)){
                                        ListData[i][rec[j].apiName] = rec[j].value;
                                    }
                                }
                            }else{
                                ListData[i][rec[j].apiName] = rec[j].value;
                            }
                            edit = true;
                        }
                    }
                    if(edit)upd.push(ListData[i]);
                }
            }
        }
        var action = component.get("c.updListViews");
        $A.util.removeClass(component.find('spinner'), 'slds-hide');
        action.setParams({
            "lstUpd" :  upd
        });
        action.setCallback(this, function(a) {
            if(a.getState() === "SUCCESS"){
                component.set("v.edited",false);
                for ( var key in mapShow ) {
                    var rec = mapShow[key].record;
                    for(var j=0; j< rec.length; j++){
                        rec[j].editmode = false;
                        rec[j].oldvalue = rec[j].value;
                        rec[j].edited = "";
                    }
                }
                component.set("v.mapShow",mapShow);
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
    }
    /*
     * レコードアクションイベント
     * 新規Todo、商談
     */
    ,recordAction : function(component, event, helper) {
		var selectValue = event.getParam("value");
        var values = selectValue.split(','); 
        if(values.length > 1){
            var createRecordEvent = $A.get("e.force:createRecord");
            if(values[0]==='todo'){
                createRecordEvent.setParams({
                    "entityApiName": "Task",
                    "defaultFieldValues": {
                        "WhatId":values[1]
                    }
                });
            }else if(values[0]==='opp'){
                createRecordEvent.setParams({
                    "entityApiName": "Opportunity",
                    "defaultFieldValues": {
                        "AccountId":values[1]
                    }
                });
            }
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
        var edited = component.get("v.edited");
        if(edited){
            if( window.confirm( "編集内容が保存されていません。ページを切り替えてよろしいですか？" )){
                component.set("v.edited",false);
            }else{
                return;
            }
        }
        var end = component.get("v.end");
        var start = component.get("v.start");
        var pageSize = component.get("v.pageSize");
        var paginationList = [];
        var now = component.get("v.nowPage");
        var cnt = 0;
        var rec = component.get("v.ListData");
        var clms = component.get("v.ObjectColumn");
        var clmInfo = component.get("v.mapClmInfo");
        for(var i=end+1; i<end+pageSize+1; i++){
            if(rec.length > end){
				helper.setMapShowRecord(component,rec,clms,i,clmInfo,paginationList,helper);
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
        var edited = component.get("v.edited");
        if(edited){
            if( window.confirm( "編集内容が保存されていません。ページを切り替えてよろしいですか？" )){
                component.set("v.edited",false);
            }else{
                return;
            }
        }
        var rec = component.get("v.ListData");
        var end = component.get("v.end");
        var start = component.get("v.start");
        var pageSize = component.get("v.pageSize");
        var now = component.get("v.nowPage");
        var paginationList = [];
        var cnt = 0;
        var clms = component.get("v.ObjectColumn");
        var clmInfo = component.get("v.mapClmInfo");
        for(var i= start-pageSize; i < start ; i++){
            if(i > -1){
				helper.setMapShowRecord(component,rec,clms,i,clmInfo,paginationList,helper);
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