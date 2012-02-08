sigma.classes.Graph = function() {
  var self = this;
  sigma.classes.EventDispatcher.call(self);

  empty();

  function addNode(id, params) {
    if (self.nodesIndex[id]) {
      throw new Error('Node "' + id + '" already exists.');
    }

    params = params || {};
    var n = {
      'x': 0,
      'y': 0,
      'size': 1,
      'degree': 0,
      'displayX': 0,
      'displayY': 0,
      'displaySize': 1,
      'label': id.toString(),
      'id': id.toString(),
      'attr': {}
    };

    for (var k in params) {
      switch (k) {
        case 'x':
        case 'y':
        case 'size':
          n[k] = +params[k];
          break;
        case 'color':
          n[k] = params[k];
          break;
        case 'label':
          n[k] = params[k];
          break;
        default:
          n['attr'][k] = params[k];
      }
    }

    self.nodes.push(n);
    self.nodesIndex[id.toString()] = n;

    return self;
  };

  function dropNode(v) {
    var a = (v instanceof Array ? v : [v]) || [];

    a.forEach(function(id) {
      if (self.nodesIndex[id]) {
        // TODO
        // Make self better
        var index = null;
        self.nodes.some(function(n, i) {
          if (n['id'] == id) {
            index = i;
            return true;
          }
          return false;
        });

        index != null && self.nodes.splice(index, 1);
        delete self.nodesIndex[id];

        var edgesToRemove = [];
        self.edges = self.edges.filter(function(e) {
          if (e['source']['id'] == id || e['target']['id'] == id) {
            delete self.edgesIndex[e['id']];
            return false;
          }
          return true;
        });
      }else {
        sigma.debug('Node "' + id + '" does not exist.');
      }
    });

    return self;
  };

  function addEdge(id, source, target, params) {
    if (self.edgesIndex[id]) {
      throw new Error('Edge "' + id + '" already exists.');
    }

    if (!self.nodesIndex[source]) {
      var s = 'Edge\'s source "' + source + '" does not exist yet.';
      throw new Error(s);
    }

    if (!self.nodesIndex[target]) {
      var s = 'Edge\'s target "' + target + '" does not exist yet.';
      throw new Error(s);
    }

    params = params || {};
    var e = {
      'source': self.nodesIndex[source],
      'target': self.nodesIndex[target],
      'size': 1,
      'weight': 1,
      'displaySize': 0.5,
      'label': id.toString(),
      'id': id.toString(),
      'attr': {}
    };
    e['source']['degree']++;
    e['target']['degree']++;

    for (var k in params) {
      switch (k) {
        case 'size':
          e[k] = +params[k];
          break;
        case 'color':
          e[k] = params[k].toString();
          break;
        case 'type':
          e[k] = params[k].toString();
          break;
        case 'label':
          e[k] = params[k];
          break;
        default:
          e['attr'][k] = params[k];
      }
    }

    self.edges.push(e);
    self.edgesIndex[id.toString()] = e;

    return self;
  };

  function dropEdge(v) {
    var a = (v instanceof Array ? v : [v]) || [];

    a.forEach(function(id) {
      if (self.edgesIndex[id]) {
        // TODO
        // Make self better
        var index = null;
        self.edges.some(function(n, i) {
          if (n['id'] == id) {
            index = i;
            return true;
          }
          return false;
        });

        index != null && self.edges.splice(index, 1);
        delete self.edgesIndex[id];
      }else {
        sigma.debug('Edge "' + id + '" does not exist.');
      }
    });

    return self;
  };

  function empty() {
    self.nodes = [];
    self.nodesIndex = {};
    self.edges = [];
    self.edgesIndex = {};

    return self;
  };

  function rescale(w, h, sMin, sMax, tMin, tMax) {
    var weightMax = 0, sizeMax = 0;

    self.nodes.forEach(function(node) {
      sizeMax = Math.max(node['size'], sizeMax);
    });

    self.edges.forEach(function(edge) {
      weightMax = Math.max(edge['size'], weightMax);
    });

    if (sizeMax == 0) {
      return;
    }

    if (weightMax == 0) {
      return;
    }

    // Recenter the nodes:
    var xMin, xMax, yMin, yMax;
    self.nodes.forEach(function(node) {
      xMax = Math.max(node['x'], xMax || node['x']);
      xMin = Math.min(node['x'], xMin || node['x']);
      yMax = Math.max(node['y'], yMax || node['y']);
      yMin = Math.min(node['y'], yMin || node['y']);
    });

    var scale = Math.min(0.9 * w / (xMax - xMin),
                         0.9 * h / (yMax - yMin));

    // Size homothetic parameters:
    var a, b;
    if (!sMax && !sMin) {
      a = 1;
      b = 0;
    }else if (sMax == sMin) {
      a = 0;
      b = sMax;
    }else {
      a = (sMax - sMin) / sizeMax;
      b = sMin;
    }

    var c, d;
    if (!tMax && !tMin) {
      c = 1;
      d = 0;
    }else if (tMax == tMin) {
      c = 0;
      d = tMin;
    }else {
      c = (tMax - tMin) / weightMax;
      d = tMin;
    }

    // Rescale the nodes:
    self.nodes.forEach(function(node) {
      node['displaySize'] = node['size'] * a + b;

      if (!node['isFixed']) {
        node['displayX'] = (node['x'] - (xMax + xMin) / 2) * scale + w / 2;
        node['displayY'] = (node['y'] - (yMax + yMin) / 2) * scale + h / 2;
      }
    });

    self.edges.forEach(function(edge) {
      edge['displaySize'] = edge['size'] * c + d;
    });
  };

  function translate(sceneX, sceneY, ratio, pow) {
    var sizeRatio = Math.pow(ratio, pow || 1 / 2);

    self.nodes.forEach(function(node) {
      if (!node['isFixed']) {
        node['displayX'] = node['displayX'] * ratio + sceneX;
        node['displayY'] = node['displayY'] * ratio + sceneY;
      }

      node['displaySize'] = node['displaySize'] * sizeRatio;
    });
  };

  self.addNode = addNode;
  self.addEdge = addEdge;
  self.dropNode = dropNode;
  self.dropEdge = dropEdge;

  self.empty = empty;
  self.rescale = rescale;
  self.translate = translate;
};
