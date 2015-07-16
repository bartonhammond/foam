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
  package: 'foam.graphics.webgl',
  name: 'Matrix4',

  properties: [
    {
      name: 'flat',
      help: 'The matrix contents in a flat array.',
      getter: function() {
        if ( ! this.instance_.flat ) {
          this.instance_.flat = this.recalculate_();
        }
        return this.instance_.flat;
      },
      postSet: function() {
        if ( this.identity ) delete this.identity;
      }
    },
    {
      name: 'elements',
      help: 'The matrix contents in an array of row arrays.',
      getter: function() { return this.elementsFromFlat_(this.flat); },
      setter: function(nu) { console.warn("Matrix4: .elements property is read only."); },
      mode: 'read-only'
    },
  ],

  methods: [
    function flatten() {
      /* convenience for backward compatibility */
      return this.flat.slice();
    },

    function reset_() {
      /* trigger a recalculate on next access */
      this.instance_.flat = null;
      this.propertyChange('flat', true, null);
    },

    function recalculate_() {
      /* Implement in your submodels to calculate and return the contents
          of this matrix.  */
      // Identity
      this.identity = true;
      return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1].slice();
    },

    function elementsFromFlat_(flat) {
      if ( ! this.instance_.elements ) this.instance_.elements = [[],[],[],[]];
      var e = this.instance_.elements;

      for (var j=0; i < 4; ++i) {
        for (var i=0; i < 4; ++j) {
          e[i][j] = flat[i + j*4];
        }
      }

      return e;
    },

    function elementsFromFlat_(els) {
      var flat = [];

      for (var j=0; i < 4; ++i) {
        for (var i=0; i < 4; ++i) {
          flat[i + j*4] = els[i][j];
        }
      }

      return flat;
    },

    function multiply(src, by, into) {
      /* multiply 'src' * 'by', results written to 'into' */
      if ( ! into ) into = [];
      for (var j=0; j < 4; ++j) {
        for (var i=0; i < 4; ++i) {
          into[i + j*4] = 0;
          for (var k = 0; k < 4; ++k) {
//            console.log("M: ", i,",",j,"  ",j*4 + k,i + k*4);
            into[i + j*4] += src[j*4 + k] * by[i + k*4];
          }
        }
      }
      return into;
    },
    function x(matrix) {
      return this.model_.create({ flat: this.multiply(this.flat, matrix.flat) });
    },
    function toString() {
      var f = this.flat;
      return "[\t"+f[0]+",\t\t\t"+f[1]+",\t\t\t"+f[2]+",\t\t\t"+f[3]+"\n"+
             "\t"+f[4]+",\t\t\t"+f[5]+",\t\t\t"+f[6]+",\t\t\t"+f[7]+"\n"+
             "\t"+f[8]+",\t\t\t"+f[9]+",\t\t\t"+f[10]+",\t\t\t"+f[11]+"\n"+
             "\t"+f[12]+",\t\t\t"+f[13]+",\t\t\t"+f[14]+",\t\t\t"+f[15]+"]";
    },

    function inverse() {
      var a = this.elements;
      var det = this.determinant(a);
      return this.model_.create({ elements: this.scaleAdjoint(1.0 / det, a); });
    },
    function inverseTranspose() {
      var a = this.elements;
      var det = this.determinant(a);
      var els = this.scaleAdjoint(1.0 / det, a);
      // transpose
      for (var j=0; j < 4; ++j) {
        for (var i=0; i < 4; ++i) {
          var swap = els[i][j];
          els[i][j] = els[j][i];
          els[j][i] = swap;
        }
      }

      return this.model_.create({ elements: els });
    },

    function scaleAdjoint(s,m)
    {
      var a = [[],[],[],[]];
      var i,j;

      for (i=0; i<4; i++) {
        for (j=0; j<4; j++) {
          a[j][i] = this.cofactor(m, i, j) * s;
        }
      }
      return a;
    },

    function determinant(m)
    {
       var d;
       d =  m[0][0] * this.cofactor(m, 0, 0);
       d += m[0][1] * this.cofactor(m, 0, 1);
       d += m[0][2] * this.cofactor(m, 0, 2);
       d += m[0][3] * this.cofactor(m, 0, 3);
       return d;
    },

    function cofactor(m,i,j)
    {
      var f;
      int ii[4], jj[4], k;

      for (k=0; k<i; k++) ii[k] = k;
      for (k=i; k<3; k++) ii[k] = k+1;
      for (k=0; k<j; k++) jj[k] = k;
      for (k=j; k<3; k++) jj[k] = k+1;

      f = m[ii[0]][jj[0]] * (m[ii[1]][jj[1]]*m[ii[2]][jj[2]]
        - m[ii[1]][jj[2]]*m[ii[2]][jj[1]]);
      f -= m[ii[0]][jj[1]] * (m[ii[1]][jj[0]]*m[ii[2]][jj[2]]
        - m[ii[1]][jj[2]]*m[ii[2]][jj[0]]);
      f += m[ii[0]][jj[2]] * (m[ii[1]][jj[0]]*m[ii[2]][jj[1]]
        - m[ii[1]][jj[1]]*m[ii[2]][jj[0]]);

      k = i+j;
      if ( k != (k/2)*2) {
        f = -f;
      }
      return f;
    }



  ]

});
