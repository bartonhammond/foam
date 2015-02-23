CLASS({
  package: 'foam.flow',
  name: 'CodeSample',
  extendsModel: 'View',

  properties: [
    {
      // model_: 'FunctionProperty',
      name: 'code',
      preSet: function(_, txt) { return txt.trim(); },
      postSet: function(_, txt) {
        var fn = eval('(function() {\n'    + txt + '\n})');
        
        this.output = fn();
      }
    },
    {
      name: 'output'
    }
  ],

  methods: {
    /** Allow inner to be optional when defined using HTML. **/
    fromElement: function(e) {
      var children = e.children;
      if ( children.length == 1 && children[0].nodeName === 'code' ) {
        return this.SUPER(e);
      }

      this.code = e.innerHTML;
      return this;
    }
  },

  templates: [
    function CSS() {/*
      .flow-code-sample, .flow-code-sample-output{
         border: 1px solid gray;
         padding: 8px;
         margin: 18px 0;
         width: 600px;
      }
    */},
    function toHTML() {/*
      <blockquote>
      <div class="flow-code-sample">
        %%code
      </div>
      Output:
      <div class="flow-code-sample-output">
        %%output
      </div>
      </blockquote>
    */}
  ]
});
