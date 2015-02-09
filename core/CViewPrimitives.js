/**
 * @license
 * Copyright 2014 Google Inc. All Rights Reserved.
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
  package: 'foam.graphics',
  name: 'AnimatedXTrait',
  
  properties: [
     {
      name: 'x',
      install: Movement.createAnimatedPropertyInstallFn(500, Movement.ease(1, 1))

    },
  ],
   
 });
CLASS({
  package: 'foam.graphics',
  name: 'AnimatedYTrait',
  
  properties: [
     {
      name: 'y',
      install: Movement.createAnimatedPropertyInstallFn(500, Movement.ease(1, 1))

    },
  ],
   
 });



CLASS({
  package: 'foam.graphics',
  name: 'AnimatedWidthTrait',
  
  properties: [
    {
      name: 'width',
      install: Movement.createAnimatedPropertyInstallFn(500, Movement.ease(1, 1))

    }
  ],
   
 });
CLASS({
  package: 'foam.graphics',
  name: 'AnimatedHeightTrait',
  
  properties: [
    {
      name: 'height',
      install: Movement.createAnimatedPropertyInstallFn(500, Movement.ease(1, 1))

    }
  ],
   
 });
 


CLASS({
  package: 'foam.graphics',
  name: 'AnimatedAlphaTrait',
  
  properties: [
    {
      name: 'height',
      install: Movement.createAnimatedPropertyInstallFn(500, Movement.ease(0.2, 0.2))
    }
  ],
   
 });


CLASS({
  package: 'foam.graphics',
  name: 'LinearLayout',
  extendsModel: 'foam.graphics.CView',

  traits: [
    'layout.LinearLayoutTrait',
    'layout.LayoutItemHorizontalTrait',
    'layout.LayoutItemVerticalTrait'
  ],
 
  documentation: function() {/* A $$DOC{ref:'foam.graphics.CView'} based
    linear layout. Use to lay out CView child items that include the 
    $$DOC{ref:'layout.LayoutItemHorizontalTrait'}
    $$DOC{ref:'layout.LayoutItemVerticalTrait'} or
    traits depending on layout orientation.
  */},
  
  methods: {
    init: function() {
      this.SUPER();

      var self = this;
      // if we change size, redo internal layout
       this.X.dynamic(
         function() { self.width; self.height; },
         this.performLayout); // TODO: don't react to orientation-independent one
    },

    addChild: function(child) { /* Adds a child $$DOC{ref:'foam.graphics.CView'} to the scene
                                   under this. Add our listener for child constraint
                                   changes. */
      this.SUPER(child);

      // listen for changes to child layout constraints
      if (child.horizontalConstraints) {
        child.horizontalConstraints.subscribe(['constraintChange'], this.performLayout);
      }
      if (child.verticalConstraints) {
        child.verticalConstraints.subscribe(['constraintChange'], this.performLayout);
      }
    },

    removeChild: function(child) { /* Removes a child $$DOC{ref:'foam.graphics.CView'} from the scene. */
      // unlisten
      if (child.horizontalConstraints) {
        child.horizontalConstraints.unsubscribe(['constraintChange'], this.performLayout);
      }
      if (child.verticalConstraints) {
        child.verticalConstraints.unsubscribe(['constraintChange'], this.performLayout);
      }

      this.SUPER(child);
    },
    
    paintSelf: function() {
      /* To reduce the number of potential re-layout operations, only calculate
      a dirty layout when painting. A property change will cause a repaint,
      to $$DOC{ref:'layout.LinearLayoutTrait.layoutDirty'} changing to true will
      cause a repaint. */
      this.SUPER();
      
      // only calculate layout on paint
      if ( this.layoutDirty ) {
//console.log("calculateLayout ", this.$UID);
        this.calculateLayout();
        
//console.log("  layout dirty? ", this.layoutDirty);
      }
      
      // Enable to debug layout
//       var c = this.canvas;
//       if ( c ) {
//         c.rect(0,0,this.width,this.height);
//         c.stroke();
//       }
      }
  }
});


CLASS({
  package: 'foam.graphics',
  name: 'LockToPreferredLayout',
  extendsModel: 'foam.graphics.CView',

  documentation: function() {/*
      A simple layout for items not already in a layout. It will take the preferred
      size of its child and set the width and height of itself to match.
    */},
  
  properties: [
    {
      name: 'layoutDirty',
      model_: 'BooleanProperty',
      defaultValue: true,
      hidden: true
    }
  ],
    
  methods: {
    addChild: function(child) { /* Adds a child $$DOC{ref:'foam.graphics.CView'} to the scene
                                   under this. Add our listener for child constraint
                                   changes. */
      this.SUPER(child);

      // listen for changes to child layout constraints
      if (child.horizontalConstraints) {
        child.horizontalConstraints.subscribe(['constraintChange'], this.performLayout);
      }
      if (child.verticalConstraints) {
        child.verticalConstraints.subscribe(['constraintChange'], this.performLayout);
      }
    },

    removeChild: function(child) { /* Removes a child $$DOC{ref:'foam.graphics.CView'} from the scene. */
      // unlisten
      if (child.horizontalConstraints) {
        child.horizontalConstraints.unsubscribe(['constraintChange'], this.performLayout);
      }
      if (child.verticalConstraints) {
        child.verticalConstraints.unsubscribe(['constraintChange'], this.performLayout);
      }

      this.SUPER(child);
    },

    paintSelf: function() {
      /* To reduce the number of potential re-layout operations, only calculate
      a dirty layout when painting. A property change will cause a repaint,
      to $$DOC{ref:'layout.LinearLayoutTrait.layoutDirty'} changing to true will
      cause a repaint. */
      this.SUPER();
      
      // only calculate layout on paint
      if ( this.layoutDirty ) {
        this.calculateLayout();
      }
    },
    
    calculateLayout: function() {
      /* Locks our size to the child's preferred size. */
      this.layoutDirty = false;
      
      if (this.children[0]) {
        if (this.children[0].horizontalConstraints) {
          this.width =  this.children[0].horizontalConstraints.preferred;
          this.children[0].width = this.width;
        }
        if (this.children[0].verticalConstraints) {
          this.height = this.children[0].verticalConstraints.preferred;
          this.children[0].height = this.height;
        }
      }
    }

  },
  listeners: [
    {
      name: 'performLayout',
      //isFramed: true,
      code: function() {
        this.layoutDirty = true;
      }
    }
  ]

});


CLASS({
  package: 'foam.graphics',
  name: 'Margin',
  extendsModel: 'foam.graphics.CView',
  traits: [
    'layout.MarginTrait',
    'layout.LayoutItemHorizontalTrait',
    'layout.LayoutItemVerticalTrait'
  ],
  documentation: function() {/* A container that places a margin around
    a single child item. The layout constraints of the child are adjusted
    by the margin amount, and any size changes to the $$DOC{ref:'foam.graphics.Margin'}
    container are relayed to the child.
  */},
});


CLASS({
  package: 'foam.graphics',
  name:  'BorderTrait',
  documentation: function() {/* Add $$DOC{ref:'.'} to a CView to paint
                              a rectangular border around your item. */},

  properties: [
    {
      name:  'border',
      label: 'Border Color',
      type:  'String',
      defaultValue: undefined
    },
    {
      name:  'borderWidth',
      type:  'int',
      defaultValue: 1,
      documentation: function() {/*
        The width to draw the border, straddling the item's edge. A width of 1
        will draw the item's rect exactly, a width of 2 will expand past the item's
        edge by 1 pixel (depending on canvas scaling).</p>
        <p>Note that a transparent border is still respected when drawing the
        background. A default border of 1 will leave a 1 pixel transparent area around
        the background fill, as if a border were to be drawn there. This can be
        useful in situations when you want to fill inside a border that has been
        drawn by an item underneath this item.
      */}
    },
    {
      name: 'background',
      defaultValue: 'rgba(0,0,0,0)'
    }
  ],

  methods: {
    paintSelf: function() { /* make sure to call <code>this.SUPER();</code> in
                                your BorderTrait model's $$DOC{ref:'.paintSelf'}. */
      this.SUPER();

      var c = this.canvas;
      c.save();

      c.globalAlpha = this.alpha;

      if ( this.background ) {
        c.fillStyle = this.background;

        c.beginPath();
        var hbw = this.borderWidth/2;
        c.rect(hbw, hbw, this.width-this.borderWidth, this.height-this.borderWidth);
        c.closePath();
        c.fill();
      }

      if ( this.border ) {
        c.lineWidth = this.borderWidth;
        c.strokeStyle = this.border;
        c.beginPath();
        c.rect(0, 0, this.width, this.height);
        c.closePath();
        c.stroke();
      }

      c.restore();
    }
  }
});


CLASS({
  package: 'foam.graphics',
  name:  'SimpleRectangle',
  extendsModel: 'foam.graphics.CView',
  documentation: function() {/* A $$DOC{ref:'foam.graphics.CView'} rectangle with no layout capability. */},

  traits: [ 'foam.graphics.BorderTrait' ]
});


CLASS({
  package: 'foam.graphics',
  name: 'Rectangle',
  extendsModel: 'foam.graphics.SimpleRectangle',
  traits: [ 'layout.LayoutItemHorizontalTrait', 'layout.LayoutItemVerticalTrait' ],
  documentation: function() {/* A $$DOC{ref:'foam.graphics.CView'} rectangle that can be laid out. */}
});


CLASS({
  package: 'foam.graphics',
  name: 'Spacer',
  extendsModel: 'foam.graphics.CView',
  traits: [ 'layout.LayoutItemHorizontalTrait', 'layout.LayoutItemVerticalTrait' ],
  documentation: function() {/* A $$DOC{ref:'foam.graphics.CView'} layout spacer. No children
      or painting is supported. */},

  methods: {
    addChild: function() {/* Does nothing. */},
    removeChild: function() {/* Does nothing. */},
    paintSelf: function() {/* Does nothing. */},
    paint: function() {/* Does nothing. */},
    init: function() {
      this.SUPER();

      // change defaults
      this.horizontalConstraints.preferred = 0;
      this.verticalConstraints.preferred = 0;

      this.horizontalConstraints.stretchFactor$ = this.stretchFactor$;
      this.verticalConstraints.stretchFactor$ = this.stretchFactor$;

      // apply fixed settings if specified
      if (this.fixedWidth) this.fixedWidth = this.fixedWidth;
      if (this.fixedHeight) this.fixedHeight = this.fixedHeight;
    }
  },

  properties: [
    {
      name:  'fixedWidth',
      label: 'Fixed Width',
      type:  'String',
      defaultValue: '',
      help: "Optional shortcut to set a fixed width (integer or percent value).",
      documentation: "Optional shortcut to set a fixed width (integer or percent value).",
      postSet: function() {
        if (this.fixedWidth && this.horizontalConstraints) {
          this.horizontalConstraints.min = this.fixedWidth;
          this.horizontalConstraints.max = this.fixedWidth;
          this.horizontalConstraints.preferred = this.fixedWidth;
        }
      }
    },
    {
      name:  'fixedHeight',
      label: 'Fixed Height',
      type:  'ConstraintValue',
      defaultValue: '',
      help: "Optional shortcut to set a fixed height (integer or percent value).",
      documentation: "Optional shortcut to set a fixed width (integer or percent value).",
      postSet: function() {
        if (this.fixedHeight && this.verticalConstraints) {
          this.verticalConstraints.min = this.fixedHeight;
          this.verticalConstraints.max = this.fixedHeight;
          this.verticalConstraints.preferred = this.fixedHeight;
        }
      }
    },
    {
      name: 'stretchFactor',
      model_: 'IntProperty',
      defaultValue: 1
    }
  ]
});


CLASS({
  package: 'foam.graphics',
  name:  'Label',
  extendsModel: 'foam.graphics.CView',

  traits: [ 'layout.LayoutItemHorizontalTrait', 'layout.LayoutItemVerticalTrait' ],

  properties: [
    {
      name:  'textAlign',
      label: 'Text Alignment',
      type:  'String',
      defaultValue: 'left',
      help: 'Text alignment can be left, right, center, or the locale aware start and end.'
    },
    {
      name: 'text',
      aliases: 'data',
      type: 'String',
      defaultValue: ''
    },
    {
      name: 'font',
      type: 'String',
      defaultValue: "",
      help: "CSS-style font description string"
    },
    {
      name: 'background',
      defaultValue: 'rgba(0,0,0,0)'
    },
    {
      model_: 'IntProperty',
      name: 'padding',
      defaultValue: 5
    },
    {
      model_: 'BooleanProperty',
      name: 'isShrinkable',
      defaultValue: false,
      documentation: function() {/* Indicates if the minimum size constraint should
        be the same as the preferred size, preventing font shrinking. */}
    },
    {
      name: 'clipped',
      defaultValue: true     
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      Events.dynamic(
        function() { this.text; this.font; this.canvas; this.padding; }.bind(this),
        this.updatePreferred );

      this.updatePreferred();
    },

    paintSelf: function() {
      this.SUPER();

      var c = this.canvas;
      c.save();

      c.textBaseline = 'top';
      c.fillStyle = this.color;
      if (this.font) c.font = this.font;
      c.fillText(this.text, this.padding, this.padding, this.width-(this.padding*2));

      c.restore();
    }
  },

  listeners: [
    {
      name: 'updatePreferred',
      //isFramed: true,
      code: function() {
        var c = this.canvas;
        if (c) {
          // width of text
          c.save();
          if (this.font) c.font = this.font;
          this.horizontalConstraints.preferred = c.measureText(this.text).width + this.padding*2;
          c.restore();

          // if no shrink, lock minimum to preferred
          if ( ! this.isShrinkable )
            this.horizontalConstraints.min = this.horizontalConstraints.preferred;

          // height (this is not directly accessible... options include putting
          // a span into the DOM and getting font metrics from that, or just going
          // by raw font height setting (which is always pixels in a canvas)
          if ( ! this.font ) this.font = c.font;

          var height = parseInt(/[0-9]+(?=pt|px)/.exec(this.font) || 0);
          this.verticalConstraints.preferred = height + this.padding*2;

          // if no shrink, lock minimum to preferred
          if ( ! this.isShrinkable )
            this.verticalConstraints.min = this.verticalConstraints.preferred;
        }

      },
      
      documentation: function() {/* Calculates the preferred size of this 
        $$DOC{ref:'foam.graphics.Label'} based on the actual text and font. 
      */},
    }
  ]
});