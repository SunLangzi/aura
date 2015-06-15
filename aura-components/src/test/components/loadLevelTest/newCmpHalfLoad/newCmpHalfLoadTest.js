/*
 * Copyright (C) 2013 salesforce.com, inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
({
	//in setUp, we create the receiver component, push it to body
    setUp: function(cmp) {
        var receiverCmp = "markup://"+cmp.get("v.receiverCmp");
        var receiverCmpAuraId = cmp.get("v.receiverCmpAuraId");
        var config = {
            componentDef:receiverCmp,
            localId:receiverCmpAuraId
        };
        this.pushNewCmpToBody(cmp, config, true);
    },
    
    pushNewCmpToBody : function(cmp, config, replaceBody) {
        $A.componentService.newComponentAsync(
                this,
                function(newCmp){
                    var body = cmp.get("v.body");
                    if(replaceBody) {
                        body = [newCmp];
                    } else {
                        body.push(newCmp);
                    }
                    cmp.set("v.body", body);
                    cmp.index(config.localId, newCmp.getGlobalId());
                },
                config
            );
    },
    
    waitForReceiverCmpCreated : function(cmp) {
        $A.test.addWaitForWithFailureMessage(true, 
                function() { 
                    var receiverCmp = cmp.find("receiverCmp"); 
                    return (receiverCmp !== undefined); }, 
                "Waiting for receiver component being created failed"
            );
    },
    
    /**
     * ask receiverCmp(newCmpWithValueProvider) to create a new component(displayMap) whose definition is not available 
     * at the client. This definition would be fetched from the server by a server action
     * kill receiverCmp BEFORE the request is send. 
     * 
     * NOTE: displayMap.cmp has attributes refer to receiverCmp's attribute(v.stringAttribute) twice, 
     * once we kill newCmpWithValueProvider, it will error out during encoding actions for request
     */
    testCmpCreatedByFetchingMapFromServer:{
        attributes:{ 
            receiverCmp: "loadLevelTest:newCmpWithValueProvider",
            receiverCmpAuraId: "receiverCmp",
            controllerFuncToCreateCmp: "c.createCmpWithMapValuePropRefValueFromServer"
        },
        test:[ function(cmp) {
            //$A.test.setTestTimeout(6000000);//for stepping through
            this.waitForReceiverCmpCreated(cmp);
        },
        function(cmp){
            var receiverCmp = cmp.find("receiverCmp");

            var actionToCreateNewCmp = receiverCmp.get(cmp.get("v.controllerFuncToCreateCmp"));
            
            var cb_handle;
            var destroy_done = false;
            // watch for _any_ action.
            var preSendCallback = function(receiverCmp, actions) {
                var i;
                var action = undefined;
                for (i = 0; i < actions.length; i++) {
                    if (actions[i].getDef().name === "getComponent" && 
                    		actions[i].getParams().name === "markup://loadLevelTest:displayMap") {
                        action = actions[i];
                        break;
                    }
                }
                if (action) {
                	receiverCmp.destroy();
                    $A.test.removePrePostSendCallback(cb_handle);
                    $A.test.addWaitForWithFailureMessage(true, 
                    		function() { return $A.test.areActionsComplete([action]); },
                    		"Action "+action.getDef()+" didn't finish");
                    destroy_done = true;
                    var errmsg = "Invalid component tried calling function [get] with arguments [v.stringAttribute], markup://loadLevelTest:newCmpWithValueProvider";
                	$A.test.expectAuraError(errmsg);
                	$A.test.expectAuraError(errmsg);
                }
            };
            cb_handle = $A.test.addPrePostSendCallback(undefined, preSendCallback.bind(this, receiverCmp), undefined );
            $A.test.addWaitFor(true, function() { return destroy_done; });

            //now run the action
            actionToCreateNewCmp.runDeprecated();//c.createCmpByFetchingDefFromServer
        }
        ]
    }
})
