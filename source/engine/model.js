
const math          = require('mathjs');
const stats         = require('./stats');
const combos        = require('./combos');

const _weights      = Symbol('weights');
const _Xaugmented   = Symbol('Xaugmented');
const _terms        = Symbol('terms');
const _exponents    = Symbol('exponents');
const _multipliers  = Symbol('multipliers');
const _headers      = Symbol('headers');
const _X            = Symbol('X');
const _y            = Symbol('y');

class Model {

  constructor(X, y, terms=null, headers=null) {
    this[_X] = X;
    this[_y] = y;
    this[_headers] = headers;

    this[_terms] = terms || [];
    this[_Xaugmented] = X;
    this[_weights] = [];

    if (terms != null) {
      this.compute();
    }
    /* maybe get rid of these, since there is no need to compute them now v
    this[_exponents] = exponents;
    this[_multipliers] = multipliers;
    this[_terms] = combos.generateTerms(X.size()[1], exponents, multipliers);
    this[_Xaugmented] = combos.createPolyMatrix(this[_terms], X);
    this[_weights] = stats.lstsq(this[_Xaugmented], y);
     */
  }

  weight(i) {
    return this[_weights][i];
  }

  term(i) {
    return this[_terms][i];
  }

  addTerm(term, recompute=true) {
    var size = math.size(term);

    if (size.length !== 1 && size[0] !== 2) {
      throw new DimensionError(size, [2], '!=');
    }

    var found = this[_terms].find((existingTerm) => {
      return existingTerm[0] === term[0] && existingTerm[1] === term[1];
    });

    if (found) {
      return this[_terms];
    }

    this[_terms].push(term);

    if (recompute) {
      this[_Xaugmented] = combos.createPolyMatrix(this[_terms], this[_X]);
      this[_weights] = stats.lstsq(this[_Xaugmented], this[_y]);
    }
    return this[_terms];
  }

  removeTerm(termToRemove, recompute=true) {
    this[_terms] = this[_terms].filter((term) => {
      return !!math.sum(math.not(math.equal(term, termToRemove)));
    });

    if (recompute) {
      this[_Xaugmented] = combos.createPolyMatrix(this[_terms], this[_X]);
      this[_weights] = stats.lstsq(this[_Xaugmented], this[_y]);
    }
    return this[_terms];
  }

  compute() {
    this[_Xaugmented] = combos.createPolyMatrix(this[_terms], this[_X]);
    this[_weights] = stats.lstsq(this[_Xaugmented], this[_y]);
  }

  row(i) {
    var cols = this[_data].size()[1];
    return this[_data].subset(math.index(i, math.range(0, cols)));
  }

  col(i) {
    var rows = this[_data].size()[0];
    return this[_data].subset(math.index(math.range(0, rows), i));
  }

  predict(vector) {
    vector = math.matrix([vector]);
    var augmentedVector = combos.createPolyMatrix(this[_terms], vector);
    return math.dot(this[_weights], math.squeeze(augmentedVector));
  }

  get data() {
    return this[_Xaugmented];
  }

  get weights() {
    return this[_weights];
  }

  get terms() {
    return this[_terms];
  }

  toJSON() {
    return {
      headers     : this[_headers],
      weights     : this[_weights].toArray(),
      terms       : this[_terms]
    };
  }

}

module.exports = Model;

