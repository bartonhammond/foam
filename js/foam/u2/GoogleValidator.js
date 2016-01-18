/**
 * @license
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

CLASS({
  package: 'foam.u2',
  name: 'GoogleValidator',
  extends: 'DefaultValidator',

  documentation: 'Standard Google Element validator, which is stricter than the default.',

  constants: [
    DEFAULT_DISALLOWED_NODE_NAMES = {
      META: true,
      TEMPLATE: true,
      SCRIPT: true,
      STYLE: true,
    }
  ],

  properties: [
    {
      name: 'disallowedNodeNames',
      defaultValueFn: function() { return this.DEFAULT_DISALLOWED_NODE_NAMES; }
    }
  ],

  methods: [
    function validateNodeName(name) {
      if ( this.disallowedNodeNames[name] ) return false;
    }
  ]
});
