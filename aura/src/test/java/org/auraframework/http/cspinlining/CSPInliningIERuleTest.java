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
package org.auraframework.http.cspinlining;

import org.auraframework.def.ApplicationDef;
import org.auraframework.def.DefDescriptor;
import org.auraframework.service.CSPInliningService;
import org.auraframework.system.AuraContext;
import org.auraframework.system.Client;
import org.junit.Test;

import static org.auraframework.service.CSPInliningService.InlineScriptMode.NONCE;
import static org.auraframework.service.CSPInliningService.InlineScriptMode.UNSUPPORTED;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

public class CSPInliningIERuleTest {
    @Test
    public void testIsRelevantNoAppDescriptor(){
        AuraContext context = mock(AuraContext.class);
        CSPInliningCriteria criteria = new CSPInliningCriteria(context);
        CSPInliningIERule target = new CSPInliningIERule();

        criteria.setMode(NONCE);

        boolean expected = true;
        boolean actual = target.isRelevant(criteria);

        assertEquals("CSPInliningIERule should not have been relevant since it wasnt already unsupported", expected, actual);
    }

    @Test
    public void testIsRelevantAlreadyUnsafeInline(){
        AuraContext context = mock(AuraContext.class);
        CSPInliningIERule target = new CSPInliningIERule();
        CSPInliningCriteria criteria = new CSPInliningCriteria(context);

        criteria.setMode(UNSUPPORTED);

        boolean expected = false;
        boolean actual = target.isRelevant(criteria);

        assertEquals("CSPInliningIERule should not have been relevant as it is already unsupported", expected, actual);
    }

    @Test
    public void testProcess() throws Exception{
        AuraContext context = mock(AuraContext.class);
        CSPInliningIERule target = new CSPInliningIERule();
        Client client = mock(Client.class);

        when(context.getClient()).thenReturn(client);
        when(client.getType()).thenReturn(Client.Type.IE11);

        CSPInliningCriteria criteria = new CSPInliningCriteria(context);
        criteria.setMode(NONCE);

        target.process(criteria);

        CSPInliningService.InlineScriptMode expected = UNSUPPORTED;
        CSPInliningService.InlineScriptMode actual = criteria.getMode();

        assertEquals("CSPInliningIERule should have set mode to UNSUPPORTED given that IE was detected", expected, actual);
    }

    @Test
    public void testProcessNotIE() throws Exception{
        AuraContext context = mock(AuraContext.class);
        CSPInliningIERule target = new CSPInliningIERule();
        Client client = mock(Client.class);

        when(context.getClient()).thenReturn(client);
        when(client.getType()).thenReturn(Client.Type.FIREFOX);

        CSPInliningCriteria criteria = new CSPInliningCriteria(context);
        criteria.setMode(NONCE);

        target.process(criteria);

        CSPInliningService.InlineScriptMode notExpected = UNSUPPORTED;
        CSPInliningService.InlineScriptMode actual = criteria.getMode();

        assertNotEquals("CSPInliningIERule should have set mode to UNSUPPORTED given that IE was detected", notExpected, actual);
    }

    interface ApplicationDefDescriptor extends DefDescriptor<ApplicationDef>{}
}
