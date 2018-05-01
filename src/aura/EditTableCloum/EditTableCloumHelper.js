({
	editedValue : function(component,value,allfix) {
        var updEvent = $A.get("e.c:fieldEdit");
        updEvent.setParams({
            "sObjectId" : component.get("v.sObjectId"),
            "apiName" : component.get("v.apiName"),
            "value" : value,
            "fixOther" : allfix
        }).fire();
	}
})