/**
 * @license
 * Copyright 2015 Google Inc. All Rights Reserved.
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
  name: 'JavaSource',
  package: 'foam.util',

  documentation: function() {/* Generates Java source code from a FOAM
    model. Add a template for each model, named by CONSTANTIZED_MODEL_ID.
  */},

  methods: {
    generate: function(obj) {
      var key = constantize(obj.model_.id);
      return ( this[key] && this[key].call(obj) ) || "";
    }

  },

  templates: [
     {
       model_: 'Template',
       name: 'MODEL',
       description: 'Java Source',
       template: "// Generated by FOAM, do not modify.\u000a// Version <%= this.version %>\u000a<%\u000a  var className       = this.javaClassName;\u000a  var parentClassName = this.extendsModel ? this.extendsModel : 'FObject';\u000a\u000a  if ( GLOBAL[parentClassName] && GLOBAL[parentClassName].abstract ) parentClassName = 'Abstract' + parentClassName;\u000a\u000a%>\u000a<% if ( this.package ) { %>\\\u000apackage <%= this.package %>;\u000a\u000a<% } %>\\\u000aimport foam.core.*;\u000a\u000apublic<%= this.abstract ? ' abstract' : '' %> class <%= className %>\u000a   extends <%= parentClassName %>\u000a{\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a   public final static Property <%= constantize(prop.name) %> = new Abstract<%= prop.javaType.capitalize() %>Property() {\u000a     public String getName() { return \"<%= prop.name %>_\"; }\u000a     public String getLabel() { return \"<%= prop.label %>\"; }\u000a     public Object get(Object o) { return ((<%= this.name %>) o).get<%= prop.name.capitalize() %>(); }\u000a     public void set(Object o, Object v) { ((<%= this.name %>) o).set<%= prop.name.capitalize() %>(toNative(v)); }\u000a     public int compare(Object o1, Object o2) { return compareValues(((<%= this.name%>)o1).<%= prop.name %>_, ((<%= this.name%>)o2).<%= prop.name %>_); }\u000a   };\u000a   <% } %>\u000a\u000a   final static Model model__ = new AbstractModel(new Property[] {<% for ( var key in this.properties ) { var prop = this.properties[key]; %> <%= constantize(prop.name) %>,<% } %> }) {\u000a     public String getName() { return \"<%= this.name %>\"; }\u000a     public String getLabel() { return \"<%= this.label %>\"; }\u000a     public Property id() { return <%= this.ids.length ? constantize(this.ids[0]) : 'null' %>; }\u000a   };\u000a\u000a   public Model model() {\u000a     return model__;\u000a   }\u000a   public static Model MODEL() {\u000a     return model__;\u000a   }\u000a\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a   private <%= prop.javaType %> <%= prop.name %>_;   <% } %>\u000a\u000a   public <%= className %>()\u000a   {\u000a   }\u000a<% if ( this.properties.length ) { %> \u000a   public <%= className %>(<% for ( var key in this.properties ) { var prop = this.properties[key]; %><%= prop.javaType, ' ', prop.name, key < this.properties.length-1 ? ', ': '' %><% } %>)\u000a   {   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a      <%= prop.name %>_ = <%= prop.name %>;   <% } %>\u000a   }\u000a<% } %>\u000a\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a   public <%= prop.javaType %> get<%= prop.name.capitalize() %>() {\u000a       return <%= prop.name %>_;\u000a   };\u000a   public void set<%= prop.name.capitalize() %>(<%= prop.javaType, ' ', prop.name %>) {\u000a       <%= prop.name %>_ = <%= prop.name %>;\u000a   };\u000a   <% } %>\u000a\u000a   public int hashCode() { \u000a      int hash = 1;\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a      hash = hash * 31 + hash(<%= prop.name %>_);   <% } %>\u000a\u000a      return hash;\u000a   }\u000a\u000a   public int compareTo(Object obj) {\u000a      if ( obj == this ) return 0;\u000a      if ( obj == null ) return 1;\u000a\u000a      <%= this.name %> other = (<%= this.name %>) obj;\u000a \u000a      int cmp;\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\u000a      if ( ( cmp = compare(get<%= prop.name.capitalize() %>(), other.get<%= prop.name.capitalize() %>()) ) != 0 ) return cmp;   <% } %>\u000a\u000a      return 0;\u000a   }\u000a\u000a   public StringBuilder append(StringBuilder b) {\u000a      return b\u000a   <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\\\u000a      .append(\"<%= prop.name %>=\").append(get<%= prop.name.capitalize() %>())<%= key < this.properties.length-1 ? '.append(\", \")' : '' %> \u000a   <% } %>      ;\u000a   }\u000a\u000a   public Object fclone() {\u000a      <%= this.name %> c = new <%= this.name %>();\u000a      <% for ( var key in this.properties ) { var prop = this.properties[key]; %>\\\u000ac.set<%= prop.name.capitalize() %>(get<%= prop.name.capitalize() %>());\u000a      <% } %>\\\u000areturn c;\u000a   }\u000a\u000a}"
     },
  ]


 });