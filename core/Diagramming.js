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
  name: 'DiagramItemTrait',
  package: 'diagram',

  documentation: function() {/* This trait adds a $$DOC{ref:'.globalX'} and $$DOC{ref:'.globalY'}
          that track the item's position relative to the canvas. It is designed to work with
           $$DOC{ref:'foam.graphics.CView'} or anything else with an x, y and parent 
          (with $$DOC{ref:'.'}).</p>
          <p>Note that for the coordinate transformation to work, you must apply this trait to 
          all items in the parent/child chain. Everything in a diagram should inherit $$DOC{ref:'.'}. */},

  ids: [ 'id' ],
          
  properties: [
    {
      name: 'id',
      getter: function() { return this.$UID; }
    },
    {
      model_: 'IntProperty',
      name: 'globalX',
      defaultValue: 0,
      documentation: function() {/* The x position of the item, in canvas coordinates. */}
    },
    {
      model_: 'IntProperty',
      name: 'globalY',
      defaultValue: 0,
      documentation: function() {/* The y position of the item, in canvas coordinates. */}
    },
    {
      name: 'dynamicListeners_',
      hidden: true
    },
    {
      name: 'isLinkBlocking',
      model_: 'BooleanProperty',
      defaultValue: false,
      documentation: function() {/* If true, this item will register itself with the 
        root as a link routing blocking item. Links will attempt to avoid overlapping
        this item when routing. 
      */},
    }
  ],
  
  methods: {
    init: function() { /* Sets up a listener on inherited $$DOC{ref:'foam.graphics.CView.parent'}. */
      this.SUPER();
      
      Events.dynamic(
        function() { this.parent; }.bind(this),
        function() {
          if (this.dynamicListeners_ && this.dynamicListeners_.destroy) {
            this.dynamicListeners_.destroy();
          }
          this.dynamicListeners_ = Events.dynamic(function() { 
            this.globalX = this.parent.globalX + this.x;
            this.globalY = this.parent.globalY + this.y;
          }.bind(this))
        }.bind(this)
      ); 
    },
    
    addLinkBlocker: function(item) {
      /* Called by child when added to a parent, to report that it can block
      link routing. */
      // Only do something if the item can actually block links
      if ( item.isLinkBlocking ) {
        // if we can block links, we've already reported it and as the
        // child's container we should cover the child's rect already.
        if ( ! this.isLinkBlocking ) {
          this.parent && this.parent.addLinkBlocker && this.parent.addLinkBlocker(item); 
        }
      }
    },
    removeLinkBlocker: function(item) {
      /* Called by child when removed from a parent, to report that it can 
      no longer block link routing. */
      // Removing something that isn't there won't hurt, so ignore the checks
      this.parent && this.parent.removeLinkBlocker && this.parent.removeLinkBlocker(item); 
    },
    
    addChild: function(child) {
      /* Overridden to call $$DOC{ref:'addLinkBlocker'} if appropriate */
      this.SUPER(child);     
      this.addLinkBlocker(child);
      child.scanForLinkBlockers && child.scanForLinkBlockers();
    },
    removeChild: function(child) {
      /* Overridden to call $$DOC{ref:'removeLinkBlocker'} if appropriate */
      this.removeLinkBlocker(child);
      this.SUPER(child);
    },
    
    getDiagramRoot: function() {
      /* Find the root element of the diagram. */
      return (this.parent && this.parent.getDiagramRoot) ? this.parent.getDiagramRoot() : null;
    },
    
    scanForLinkBlockers: function() {
      /* Recursively scan all children and have them report link blockers. */
      if ( ! this.isLinkBlocking ) {
        this.children.forEach(function(c) {
          this.addLinkBlocker(c);
          c.scanForLinkBlockers && c.scanForLinkBlockers();
        }.bind(this));
      }
    }
  }
  
});


CLASS({
  name: 'DiagramRootTrait',
  package: 'diagram',
  
  requires: [ 'MDAO', 'diagram.DiagramItemTrait' ],
  
  documentation: function() {/*
      Apply this trait to the model you wish to use as the root
      element of your diagram. It adds support for link routing.
    */}, 

  properties: [
    {
      name: 'linkBlockerDAO',
      model_: 'DAOProperty',
      factory: function() {
        return this.MDAO.create({model:this.DiagramItemTrait, autoIndex:true});
      }
    }
  ],
  
  methods: {
    addLinkBlocker: function(item) {
      /* Called by child when added to a parent, to report that it can block
      link routing. */
      if ( item.isLinkBlocking ) {
        this.linkBlockerDAO.put(item);
      }
    },

    removeLinkBlocker: function(item) {
      /* Called by child when removed from a parent, to report that it can 
      no longer block link routing. */
      this.linkBlockerDAO.remove(item);
    },
    
    getDiagramRoot: function() {
      return this;
    },
    
    scanForLinkBlockers: function() {
      /* In this base case we can clear out the exisiting DAO of blockers,
      since we will regenerate it anyway. */
      this.linkBlockerDAO.removeAll();
      this.SUPER();
    }

  }
  
});

CLASS({
  name: 'ParentageListener',
  documentation: "Tracks changes in a parent chain and runs bind/unbind functions as parents enter or leave.",
  package: 'diagram',
  
  properties: [
    {
      name: 'data',
      preSet: function(old,nu) {
        // new data, so clean out all old parents
        if (this.boundParents_) this.removeParents(this.boundParents_);
        return nu;
      },
      postSet: function() { 
        // bind parents, add listeners for parent changes
        this.updateChain();
      },
    },
    {
      name: 'bindFn',
      type: 'Function',
      preSet: function(old,nu) {  
        if (nu && this.boundParents_) {
          this.boundParents_.map(nu); // we have items we're attached to, but didn't run bindFn on!
        }
        return nu;
      },      
    },
    {
      name: 'unbindFn',
      type: 'Function',
    },
    {
      name: 'boundParents_',
      hidden: true,
      documentation: "The items we have bound to, for later cleanup",
      //factory: function() { return []; }
    }
  ],
  methods: {
    removeParents: function(pList) {
      pList.clone().forEach(function(p) {
        p.parent$.removeListener(this.updateChain);
        if (this.unbindFn) this.unbindFn(p);
        this.boundParents_.remove(p);
        // don't recurse here since we already know exactly what we've bound to,
        //  and parentage may have changed
      }.bind(this));
    },
    addParent: function(p) {
      if (this.boundParents_.indexOf(p) === -1) { // we don't already have it
        if (this.bindFn) this.bindFn(p);
        p.parent$.addListener(this.updateChain);
        this.boundParents_.push(p);
        
        // recurse on parents of p
        if (p.parent) this.addParent(p.parent);
      }
    }
  },
  listeners: [
    {
      name: 'updateChain',
      isFramed: true,
      code: function() {
        if (!this.boundParents_) this.boundParents_ = [].clone();
        // brute force: remove all, redo parent chain
        this.removeParents(this.boundParents_);
        this.addParent(this.data);
      }
    }
  ]
  
});

CLASS({
  name: 'LinkPoint',
  package: 'diagram',
  //extendsModel: 'foam.graphics.Point', // screws up ids

//  requires: ['diagram.ParentageListener as ParentageListener'],

  ids: ['owner','name','side'],

  documentation: function() {/* Represents one attachment point for a link.
    The point tracks the owner to keep updated on changes to its global
    canvas position.
  */},
  
  properties: [
    {
      name: 'side',
      type: 'String',
      defaultValue: 'right', // left, top, bottom, right
      //postSet: function() { this.updatePosition(); },
      
      documentation: function() {/* The side of the owner this link point
        projects from: left, top, bottom, or right. 
      */},
    },
    {
      name: 'name',
      type: 'String',
      
      documentation: function() {/* An optional name for the link. */},
    },
    {
      name: 'owner',
      preSet: function(old,nu) { this.unbindPositioning(); return nu; },
      postSet: function() { this.bindPositioning(); },
      
      documentation: function() {/* The object the link point is attached to. */},
    },
    {
      model_: 'IntProperty',
      name: 'x',
      defaultValue: 0,
      documentation: function() {/* The global-coordinate x position of the link
        point. 
      */},
    },
    {
      model_: 'IntProperty',
      name: 'y',
      defaultValue: 0,
      documentation: function() {/* The global-coordinate y position of the link
        point. 
      */},
    },
    {
      name: 'dynamicListeners_',
      hidden: true
    }
  ],
  
  methods: {
    bindPositioning: function() {
      /* Set up listeners to track the owner's position and size changes. */
      if (!this.owner || !this.positioningFunctionX || !this.positioningFunctionY) 
        return;
      
      this.dynamicListeners_ = Events.dynamic(
        function() { 
          this.owner.width; this.owner.height; this.owner.globalX; this.owner.globalY;
          this.side;
         }.bind(this),
         function() { 
           this.updatePosition();
          }.bind(this)
       );
    },
    unbindPositioning: function() {
      /* Unbind the listeners from any previous owner. */
      if (this.dynamicListeners_ && this.dynamicListeners_.destroy) {
        this.dynamicListeners_.destroy();
      }
    },
    
    offsetBy: function(amount) {
      /* Return this point offset by the given amount, in the direction that this
      link point projects from its owner. */
      if(this.side === 'top') {
        return { x: this.x, y: this.y - amount };
      } else
      if(this.side === 'bottom') {
        return { x: this.x, y: this.y + amount };
      } else
      if(this.side === 'left') {
        return { x: this.x - amount, y: this.y };
      } else           
      if(this.side === 'right') {
        return { x: this.x + amount, y: this.y };
      }             
    }
  },
  
  listeners: [
    {
      name: 'updatePosition',
      //isFramed: true,
      code: function() {
        this.x = this.positioningFunctionX(this.owner.globalX);
        this.y = this.positioningFunctionY(this.owner.globalY);
      }
    },
    {
      name: 'positioningFunctionX',
      documentation: function() {/* The function to position this point inside the $$DOC{ref:'.owner'}.
            Parameters (self, this.owner) are passed in to avoid binding confusion with <code>this</code>. 
            The default implementation positions the point based on $$DOC{ref:'.side'}. */},
      code: function(x) {
        if(this.side === 'top') {
          return x + (this.owner.width / 2);
        } else
        if(this.side === 'bottom') {
          return x + (this.owner.width / 2);
        } else
        if(this.side === 'left') {
          return x;
        } else           
        if(this.side === 'right') {
          return x + (this.owner.width);
        }                          
      },
      
    },
    {
      name: 'positioningFunctionY',
      documentation: function() {/* The function to position this point inside the $$DOC{ref:'.owner'}.
            Parameters (this, this.owner) are passed in to avoid binding confusion with <code>this</code>. 
            The default implementation positions the point based on $$DOC{ref:'.side'}. */},
      code: function(y) {
        if(this.side === 'top') {
          return y;
        } else
        if(this.side === 'bottom') {
          return y + (this.owner.height);
        } else
        if(this.side === 'left') {
          return y + (this.owner.height/2);
        } else           
        if(this.side === 'right') {
          return y + (this.owner.height/2);
        }
                          
      },
      
    },
  ]
});

CLASS({
  name: 'LinearLayout',
  package: 'diagram',
   
  extendsModel: 'foam.graphics.LinearLayout',
  traits: ['diagram.DiagramItemTrait' ],
  
  documentation: function() {/* Overridden from 
    $$DOC{ref:'foam.graphics.LinearLayout'} to support diagrams
    through $$DOC{ref:'diagram.DiagramItemTrait'}.
  */},
  
});


CLASS({
  name: 'Margin',
  package: 'diagram',
  extendsModel: 'foam.graphics.Margin',
  traits: ['diagram.DiagramItemTrait'],

  documentation: function() {/* Overridden from 
    $$DOC{ref:'foam.graphics.Margin'} to support diagrams
    through $$DOC{ref:'diagram.DiagramItemTrait'}.
  */},
});

CLASS({
  name: 'LockToPreferredLayout',
  package: 'diagram',
  extendsModel: 'foam.graphics.LockToPreferredLayout',
  traits: ['diagram.DiagramItemTrait'],
  
  documentation: function() {/* Overridden from 
    $$DOC{ref:'foam.graphics.LockToPreferredLayout'} to support diagrams
    through $$DOC{ref:'diagram.DiagramItemTrait'}.
  */},
});

CLASS({
  name: 'AutoSizeDiagramRoot',
  package: 'diagram',
  extendsModel: 'foam.graphics.LockToPreferredLayout',
  traits: ['diagram.DiagramItemTrait', 'diagram.DiagramRootTrait'],

  documentation: function() {/* Use a $$DOC{ref:'diagram.AutoSizeDiagramRoot'}
    as the root node of your diagram, to provide the shared structure necessary for 
    link routing and to automatically size your canvas. 
    Use $$DOC{ref:'diagram.DiagramRootTrait'} to create your own
    specialized root type. 
  */},
});

CLASS({
  name: 'DiagramRoot',
  package: 'diagram',
  extendsModel: 'foam.graphics.CView',
  traits: ['diagram.DiagramItemTrait', 'diagram.DiagramRootTrait'],
  
  documentation: function() {/* Use a $$DOC{ref:'diagram.DiagramRoot'} as the root
    node of your diagram, to provide the shared structure necessary for 
    link routing. Use $$DOC{ref:'diagram.DiagramRootTrait'} to create your own
    specialized root type. */},
});

CLASS({
  name: 'Block',
  package: 'diagram',
  
  requires: ['diagram.LinkPoint'],

  extendsModel: 'diagram.LinearLayout',
  traits: ['foam.graphics.BorderTrait'],

  
  documentation: function() {/*
    Represents one rectangular item. Typically used for a class or model representation.
    $$DOC{ref:'diagram.Block',usePlural:true} include link points in the middle of each
    edge, and will block other links from routing through them.
  */},
    
  properties: [
    {
      name: 'orientation',
      defaultValue: 'vertical'
    },
    {
      name: 'myLinkPoints',
      type: 'DAOProperty',
      factory: function() { return []; }
    },
    {
      name: 'alpha',
      defaultValue: 0
    },
    {
      name: 'isLinkBlocking',
      defaultValue: true
    },
    {
      name: 'width',
      install: Movement.createAnimatedPropertyInstallFn(200, Movement.easeOut(1))
    },
    {
      name: 'stretchy',
      defaultValue: false
    }
  ],

  methods: {
    init: function() {
      this.SUPER();

      this.addLinkPoints();
      
      this.alpha = 1;
    },
    addLinkPoints: function() {
      {
        // make four points at our edges
        var pt1 = this.LinkPoint.create({owner: this, name: 'blockTop', side: 'top'});
        this.myLinkPoints.push(pt1);
      }
      {
        var pt2 = this.LinkPoint.create({owner: this, name: 'blockBottom', side: 'bottom'});
        this.myLinkPoints.push(pt2);
      }
      {
        var pt3 = this.LinkPoint.create({owner: this, name: 'blockLeft', side: 'left'});
        this.myLinkPoints.push(pt3);
      }
      {
        var pt4 = this.LinkPoint.create({owner: this, name: 'blockRight', side: 'right'});
        this.myLinkPoints.push(pt4);
      }
    }
  }
});

CLASS({
  name: 'Section',
  package: 'diagram',
  label: 'Section',

  requires: ['foam.graphics.Label as Label',
             'diagram.LinkPoint'],

  extendsModel: 'diagram.LinearLayout',
  traits: ['foam.graphics.BorderTrait'],

  properties: [
    {
      name: 'orientation',
      defaultValue: 'horizontal'
    },
    {
      name: 'title',
      type: 'String',
    },
    {
      name: 'titleFont',
      type: 'String',
      defaultValue: 'bold 14px Roboto'
    },
    {
      name: 'border',
      defaultValue: 'black'
    },
    {
      name: 'padding',
      defaultValue: 5
    },
    {
      name: 'myLinkPoints',
      type: 'DAOProperty',
      factory: function() { return []; }
    },
    {
      name: 'clipping',
      defaultValue: true
    },
    {
      name: 'stretchy',
      defaultValue: false
    }

  ],

  methods: {
    init: function() {
      this.SUPER();

      this.addChild(this.Label.create({
        text$: this.title$,
        font$: this.titleFont$,
        color$: this.color$,
        padding$: this.padding$
      }));
      this.verticalConstraints.max$ = this.verticalConstraints.preferred$Pix$;

      this.addLinkPoints();
    },
    // TODO: account for movement that changes our parent but not our x,y,width,height
    addLinkPoints: function() {
      {
        var pt3 = this.LinkPoint.create({owner: this, name: 'sectionLeft', side:'left'});
        this.myLinkPoints.push(pt3);
      }
      {
        var pt4 = this.LinkPoint.create({owner: this, name: 'sectionRight', side:'right'});
        this.myLinkPoints.push(pt4);
      }
    }

  }


});

CLASS({
  name: 'SectionGroup',
  package: 'diagram',
  label: 'Section Group',

  requires: ['diagram.Section'],
  
  extendsModel: 'diagram.Block',
  
  documentation: function() {/*
      A group of $$DOC{ref:'diagram.Section',usePlural:true}, with a heading.
      Typically placed inside $$DOC{ref:'diagram.Block',usePlural:true}.
    */},
  
  properties: [
    {
      name: 'orientation',
      defaultValue: 'vertical',
      documentation: function() {/* Force layout to vertical. */},
    },
    {
      name: 'titleSection',
      type: 'diagram.Section',
      documentation: function() {/* The $$DOC{ref:'diagram.Section'} created
        to display the title text.
      */},
    },
    {
      name: 'title',
      type: 'String',
      documentation: function() {/* The title of the group. */},
    },
    {
      name: 'titleFont',
      type: 'String',
      defaultValue: 'bold 14px Roboto',
      documentation: function() {/* The font to use to display the title. */},
    },
    {
      name: 'titleColor',
      type: 'String',
      defaultValue: 'black',
      documentation: function() {/* The color to use to display the title. */},
    },
    {
      name: 'titleBackground',
      type: 'String',
      documentation: function() {/* The background color to use to display the title. */},
    },
    {
      name: 'titleBorder',
      type: 'String',
      documentation: function() {/* The border color to use to display the title. */},
    },
    {
      name: 'titleBorderWidth',
      type: 'String',
      documentation: function() {/* The border width to use to display the title. */},
    },
    {
      name: 'clipping',
      defaultValue: true,
      documentation: function() {/* Force clipping to true to contain children. */},
    },
    {
      name: 'width',
      install: null,
      documentation: function() {/* Disables animation, if set in $$DOC{ref:'diagram.Block'}.  */},
    }
  ],
  
  methods: {
    init: function() {
      this.SUPER();
      this.construct();
    },
    construct: function() {
      /* Sets up the title section if not already there. */
      if (!this.titleSection) {
        this.titleSection = this.Section.create({title$: this.title$, titleFont$: this.titleFont$, 
                                color$: this.titleColor$, background$: this.titleBackground$, border$: this.titleBorder$,
                                borderWidth$: this.titleBorderWidth$  });
        this.myLinkPoints$ = this.titleSection.myLinkPoints$;
      }
      this.addChild(this.titleSection);
    },
    addLinkPoints: function() {
      /* No points to add... we just use our title section's points. */
    }

  }


});




CLASS({
  name: 'Link',
  package: 'diagram',

  extendsModel: 'foam.graphics.CView',

  properties: [
    {
      name: 'start',
      type: 'diagram.LinkPoint[]',
      documentation: function () {/* The potential starting points of the link. */},
      postSet: function (old, nu) {
        if (old) old.forEach(function (pt) {
          pt.removeListener(this.propagatePointChange);
        }.bind(this));
        if (nu) nu.forEach(function (pt) {
          pt.addListener(this.propagatePointChange);
        }.bind(this));
      }
    },
    {
      name: 'end',
      type: 'diagram.LinkPoint[]',
      documentation: function () {/* The potential ending points of the link. */},
      postSet: function (old, nu) {
        if (old) old.forEach(function (pt) {
          pt.removeListener(this.propagatePointChange);
        }.bind(this));
        if (nu) nu.forEach(function (pt) {
          pt.addListener(this.propagatePointChange);
        }.bind(this));
      }
    },
    {
      name: 'style',
      type: 'String',
      defaultValue: 'manhattan',
      documentation: function () {/* The connector style. Choose from manhattan. */},
    },
    {
      name: 'arrowLength',
      model_: 'IntProperty',
      defaultValue: 20,
      documentation: function() {/* The pixel length of the arrowhead. */},
    },
    {
      name: 'arrowStyle',
      type: 'String',
      defaultValue: 'association', // aggregation, composition, generalization, dependency
      documentation: function () {/* Arrow styles:
             <ul><li>association: no arrows</li>
                 <li>aggregation: hollow diamond at start</li>
                 <li>composition: filled diamond at start</li>
                 <li>generalization: hollow arrow at start</li>
                 <li>dependency: open arrow at end</li>
              </ul>*/},
    }

  ],

  listeners: [
    {
      name: 'propagatePointChange',
      code: function() {
        // fake a prop change so the canvas repaints TODO(jacksonic): replace this with a better notification system
        this.propertyChange('x', this.x, this.x+1);
      }
    }
  ],
  
  methods: {
    paintSelf: function()  {
      this.SUPER();

      var c = this.canvas;
      c.save();

      // get back to global coordinates
      if (this.parent.globalX && this.parent.globalY) {
        c.translate(-(this.parent.globalX + this.x), -(this.parent.globalY + this.y));
      }

      var H = 0;
      var V = 1;
      var sideDirs = { left: -1, right: 1, top: -1, bottom: 1 };
      var orientations = { left: H, right: H, top: V, bottom: V };

      var points = this.selectBestPoints(H,V,sideDirs,orientations, c);
      var s = points.start.offsetBy(this.arrowLength);
      var e = points.end.offsetBy(this.arrowLength);

      this.paintArrows(points, s, e);

      // draw connector
      if (this.style === 'manhattan')
      {        
        // hor/vert orientation of points
        var sOr = (points.start.side==='left' || points.start.side==='right')? H : V;
        var eOr = (points.end.side==='left' || points.end.side==='right')? H : V;
        
        var sDir = sideDirs[points.start.side];
        var eDir = sideDirs[points.end.side];
        
        // check if the ideal direction is no good
        if (sOr === H) {
          if ((sDir > 0 && s.x > e.x)
              || (sDir < 0 && s.x < e.x)) {
            sOr = V;
            sDir = 0;
          }
        } else if (sOr === V) {
          if ((sDir > 0 && s.y > e.y)
              || (sDir < 0 && s.y < e.y)) {
            sOr = H;
            sDir = 0;
          }
        }
        if (eOr === H) {
          if ((eDir > 0 && s.x < e.x)
              || (eDir < 0 && s.x > e.x)) {
            eOr = V;
            eDir = 0;
          }
        } else if (eOr === V) {
          if ((eDir > 0 && s.y < e.y)
              || (eDir < 0 && s.y > e.y)) {
            eOr = H;
            eDir = 0;
          }
        }
        
        // if we reset the direction, find the new one
        if (sDir === 0) {
          if (sOr === V) {
            sDir = e.y - s.y;
          } else  {
            sDir = e.x - s.x;
          }
          sDir = sDir / Math.abs(sDir); // normalize
        }
        if (eDir === 0) {
          if (eOr === V) {
            eDir = s.y - e.y;
          } else  {
            eDir = s.x - e.x;
          }
          eDir = eDir / Math.abs(eDir); // normalize
        }
                
        if (sOr !== eOr) { // corner
          c.moveTo(s.x, s.y);
          if (sOr===H) {
            c.lineTo(e.x, s.y); 
          } else {
            c.lineTo(s.x, e.y); 
          }
          
          c.moveTo(e.x, e.y);
          if (eOr===H) {
            c.lineTo(s.x, e.y); 
          } else {
            c.lineTo(e.x, s.y); 
          }
        } else { // center split
          c.moveTo(s.x, s.y);
          if (sOr===H) {
            var half = s.x + (e.x - s.x) / 2;
            c.lineTo(half, s.y);
            c.lineTo(half, e.y);
          } else {
            var half = s.y + (e.y - s.y) / 2;
            c.lineTo(s.x, half);
            c.lineTo(e.x, half);
          }
          c.lineTo(e.x, e.y);
        }
        
        c.stroke();
      }

      c.restore();
    },

    selectBestPoints: function(H,V,directions,orientations, canvas) {
      /* For each starting point, find the closest ending point.
        Take the smallest link distance. */
      var self = this;
      var BIG_VAL = 999999999;
      var smallest = BIG_VAL;
      var byDist = {};
      self.start.forEach(function(startP) {
        var start = startP.offsetBy(this.arrowLength);
        self.end.forEach(function(endP) {
          var end = endP.offsetBy(this.arrowLength);
          var dist = Math.abs(start.x - end.x) + Math.abs(start.y - end.y);
          var shortAxisOr = Math.abs(endP.x - startP.x) > Math.abs(endP.y - startP.y)? V : H;
          var shortAxisDist = shortAxisOr===H? Math.abs(end.x - start.x) : Math.abs(end.y - start.y);

          // pick smallest connector path whose points won't make a bad connector
          if (  ! this.isBannedConfiguration(startP, endP, start, end, H,V,directions,orientations, shortAxisOr, shortAxisDist)
             && ! this.isBlocked(startP, endP, start, end, canvas)) {
            // if we tie, try for the smallest short-axis (middle displacement)
            if (!byDist[dist] || byDist[dist].shortAxisDist > shortAxisDist) {
              if (dist < smallest) smallest = dist;
              byDist[dist] = { start: startP, end: endP, shortAxisDist: shortAxisDist };
            }
          }
        }.bind(this));
      }.bind(this));

      if (!byDist[smallest]) {
        // no good points, so return something
        return { start: self.start[0], end: self.end[0], shortAxisDist: 0 };
      }

      return byDist[smallest];
    },
    
    isBannedConfiguration: function(startP, endP, offsS, offsE, H,V,directions,orientations,shortAxisOr, shortAxisDist) {
      /* Returns true if the given set of points and directions produces a bad
      looking link. This can include protruding back into the owner, creating
      unecessary corners, or other problems. */
      var minimumPath = this.arrowLength*2;

      // don't allow points inside the other end's owner rect
      if (   this.isPointInsideItem(startP, endP.owner)
          || this.isPointInsideItem(endP, startP.owner)) return true;

      // Also check the case where we are just at the minimum path length, and make
      // sure the line isn't pushed through the other item
      var doubleOffsetS = startP.offsetBy(minimumPath);
      var doubleOffsetE = endP.offsetBy(minimumPath);
      if (   this.isPointInsideItem(doubleOffsetS, endP.owner)
          || this.isPointInsideItem(doubleOffsetE, startP.owner)) return true;

      var sOr = orientations[startP.side];
      var eOr = orientations[endP.side];
      var sDir = directions[startP.side];
      var eDir = directions[endP.side];

      var hDir = endP.x - startP.x;
      hDir /= -Math.abs(hDir);
      var vDir = endP.y - startP.y;
      vDir /= -Math.abs(vDir);

      dist = Math.abs(offsS.x - offsE.x) + Math.abs(offsS.y - offsE.y); // connector ends (after arrows)
      rawDist = Math.abs(startP.x - endP.x) + Math.abs(startP.y - endP.y); // link points

      if (sOr === eOr) {
        if (rawDist < minimumPath) {
          return sDir !== eDir;
        } else {
          if (shortAxisOr === sOr && sDir !== eDir) {
            return shortAxisDist < minimumPath;
          } else {
            return false; //sDir === eDir;
          }
        }
      } else {
        // corner
        return (sOr === H)? sDir !== hDir : sDir !== vDir
            && (eOr === H)? eDir !== hDir : eDir !== vDir;
      }
    },
    isBlocked: function(startP, endP, offsS, offsE, canvas) {
      /* Check whether any other blocking items are touching the bounding box
      of this configuration. */
     
      var boundX1 = Math.min(startP.x, endP.x, offsS.x, offsE.x);
      var boundY1 = Math.min(startP.y, endP.y, offsS.y, offsE.y);
      var boundX2 = Math.max(startP.x, endP.x, offsS.x, offsE.x);
      var boundY2 = Math.max(startP.y, endP.y, offsS.y, offsE.y);
      var pad = 2;
      var boundRect = { x1: boundX1+pad, x2: boundX2-pad, y1: boundY1+pad, y2: boundY2-pad }; 
      var self = this;
      // TODO(jacksonic): Implement a quad tree index, or some kind of range index
      var failed = false;
      var root = startP.owner.getDiagramRoot();
      if (root) {
        root.linkBlockerDAO.select({ put: function(blocker) {
            if ( ! failed && blocker !== startP.owner && blocker !== endP.owner ) {
              var blockRect = { x1: blocker.globalX, x2: blocker.globalX + blocker.width,
                                y1: blocker.globalY, y2: blocker.globalY + blocker.height };
              if (self.isIntersecting(boundRect, blockRect)) {
                failed = true;
              }
            }
        }});
      }
      return failed;
    },
    
    isPointInsideItem: function(point, item) {
      return point.x <= item.globalX+item.width
          && point.x >= item.globalX
          && point.y <= item.globalY+item.height
          && point.y >= item.globalY;
    },
    isIntersecting: function(rect1, rect2) {
      var isect = function(a,b) {
        return ((a.x1 > b.x1 && a.x1 < b.x2) || (a.x2 > b.x1 && a.x2 < b.x2))
            && ((a.y1 > b.y1 && a.y1 < b.y2) || (a.y2 > b.y1 && a.y2 < b.y2));       
      }
      return isect(rect1, rect2) || isect(rect2, rect1);
    },

    paintArrows: function(points, s, e) {
      // draw arrows
      var c = this.canvas;
      c.save();
      c.beginPath();

      // draw end line in all cases
      c.moveTo(points.end.x, points.end.y);
      c.lineTo(e.x,e.y);
      c.stroke();
      c.beginPath();

      if (this.arrowStyle === 'association') {
        c.moveTo(points.start.x, points.start.y);
        c.lineTo(s.x, s.y);        
        c.stroke();
        c.beginPath();
      } else {
        c.save();

        c.translate(points.start.x, points.start.y);
        if (points.start.side==='top') c.rotate(-Math.PI/2);
        if (points.start.side==='bottom') c.rotate(Math.PI/2);
        if (points.start.side==='left') c.rotate(Math.PI);
        
        c.moveTo(0,0);
        if (this.arrowStyle === 'aggregation' || this.arrowStyle === 'composition' ) {
          c.lineTo(this.arrowLength/2, -this.arrowLength/4);
          c.lineTo(this.arrowLength, 0);
          c.lineTo(this.arrowLength/2, this.arrowLength/4);
          c.lineTo(0,0);
          if (this.arrowStyle==='aggregation') {
            c.stroke();
            c.beginPath();
          } else {
            c.fillStyle = this.color;
            c.fill();
          }
        } else if (this.arrowStyle === 'generalization') {
          c.lineTo(this.arrowLength/1.2, -this.arrowLength/2);
          c.lineTo(this.arrowLength/1.2, this.arrowLength/2);
          c.lineTo(0,0);
          c.moveTo(this.arrowLength/1.2, 0);
          c.lineTo(this.arrowLength, 0)
          c.stroke();
          c.beginPath();
        }
        c.restore();
      }      
      c.restore();
    }

  }

});


