({
	doInit : function(component, event, helper) {
        component.set("v.oldvalue",component.get("v.value"));
        var fieldType = component.get("v.fieldType");
        if(fieldType==="PICKLIST"){
            var opt = [];
            var piclist = component.get("v.piclistLabel");
            var piclistval = component.get("v.piclistValue");
            var value = component.get("v.value");
            var lstLbl = piclist.split(','); 
            var lstVal = piclistval.split(',');
            var empty = {label : "" ,value : ""};
            opt.push(empty);
            for( var i=0; i<lstLbl.length; i++ ) {
                var addData;
                if(value===lstVal[i]){
                    addData = {label : lstLbl[i],value : lstVal[i],selected: true};
                }else{
                    addData = {label : lstLbl[i],value : lstVal[i]};
                } 
                opt.push(addData);
            }
            component.set('v.options', opt);
            //component.find("inpSelect").set("v.options", opt);
        }
	},
    CancelEdit  : function(component, event, helper) {
        helper.editedValue(component,component.get("v.oldvalue"),false);
    },
    FixEdit  : function(component, event, helper) {
    	var fieldType = component.get("v.fieldType");
        var value;
        if(fieldType==="PICKLIST"){
        	value = component.find("inpSelect").get("v.value");
        }else{
            value = component.get("v.value");
        }
		helper.editedValue(component,value,component.find("chkFix").get("v.checked"));        
    },
    onblurInput  : function(component, event, helper) {
        var selectRow = component.get("v.selectRec");
        if(selectRow===0){
            var fieldType = component.get("v.fieldType");
            var value;
            if(fieldType==="PICKLIST"){
                value = component.find("inpSelect").get("v.value");
            }else{
                value = component.get("v.value");
            }
			helper.editedValue(component,value);
        }
    }
})