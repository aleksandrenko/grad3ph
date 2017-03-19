import DataManager from '../DataManager';
import PROPERTY_TYPES from '../enums/PROPERTY_TYPES';

const TextTypes = [PROPERTY_TYPES.STRING, PROPERTY_TYPES.URL, PROPERTY_TYPES.EMAIL, PROPERTY_TYPES.PASSWORD];

const generateGraphQLSchema = (nodeToRenderTo) => {
  const nodes = DataManager.getAllNodes();
  const edges = DataManager.getAllEdges();

  const customTypes = `
# Datetime scalar description
scalar Datetime

# Email scalar description
scalar Email

# Url scalar description
scalar Url

# Password scalar description
scalar Password

input GeoPointInput {
  lat: Float!
  lng: Float!
}

# GeoPoint description
type GeoPoint {
  lat: Float!
  lng: Float!
}

interface Node {
  id: ID!
}

interface Edge {
  id: ID!
  node: Node
}

interface Connection {
  nodes: [Node]
  edges: [Edge]
  pageInfo: PageInfo
  totalCount: Int!
}

# page info object - an object to hold the paging and cursors information. github like
type PageInfo {
  endCursor: String
  hasNextPage: String
  hasPreviousPage: String
  startCursor: String
}
`;

  String.prototype.toCamelCase = function () {
    return this.replace(/\b(\w+)/g, function (m, p) {
      return p[0].toUpperCase() + p.substr(1).toLowerCase();
    });
  };

  const _getName = (e, suffix) => `${e.startNode.label.toCamelCase()}${e.label.toCamelCase()}${e.endNode.label.toCamelCase()}${suffix}`;

  /**
   * @param {object} p
   * @returns {string}
   * @private
   */
  const _getPropertySpec = (p) => {
    const suffix = TextTypes.indexOf(p.type) !== -1 ? ' length' : '';
    let propertyDescription = `#${p.description}`;

    if (p.defaultValue) {
      propertyDescription += `; default: ${p.defaultValue}`;
    }

    if (p.limitMin) {
      propertyDescription += `; min${suffix}: ${p.limitMin}`;
    }

    if (p.limitMax) {
      propertyDescription += `; max${suffix}: ${p.limitMax}`;
    }

    const propertySpec = `
  ${propertyDescription}
  ${p.key}: ${p.type}${p.isRequired ? '!' : ''}
`;

    return propertySpec;
  };

  /**
   *
   * @param {object} n
   * @returns {string}
   * @private
   */
  const _getNodeSpec = (n) => {
    const edges = DataManager.getEdgesForStartNode(n.id);

    const description = `# node description`;
    const properties = n.properties.map(_getPropertySpec).join('');
    const inputProperties = n.properties.filter((p) => !p.isAutoGenerated).map(_getPropertySpec).join('');

    const connections = edges.map((e) => `
  ${e.label}: ${_getName(e, 'Connection')}`).join('');

    const nodeSpec = `
${description}
type ${n.label.toCamelCase()} implements Node {
  ${properties}
  ${connections}
}`;

    const nodeInputSpec = `
#input for ${n.label.toCamelCase()}
input ${n.label.toCamelCase()}Input {
  ${inputProperties}
}`;

    return `${nodeSpec}
${nodeInputSpec}`;
  };

  /**
   *
   * @param e
   * @private
   */
  const _getEdge = (e) => {
    const description = `# edge description`;
    const properties = e.properties.map(_getPropertySpec).join('');

    return `
type ${_getName(e, 'Edge')} implements Edge {
  node: ${e.endNode.label.toCamelCase()}
  ${properties}
}`;
  };

  const _getConnection = (e) => {
    const description = `# connection description`;

    return `
type ${_getName(e, 'Connection')} implements Connection {
  nodes: [${e.startNode.label.toCamelCase()}]
  edges: [${_getName(e, 'Edge')}]
  pageInfo: PageInfo
  totalCount: Int!
}
`;
  };

  const _getNodeMutation = (n) => {
    const label = n.label.toCamelCase();
    const edges = DataManager.getEdgesForStartNode(n.id);

    const edgesConnections = edges.map((e) => {
      const schema = `${_getName(e, '')}(${e.startNode.label.toCamelCase()}Id: ID!, ${e.endNode.label.toCamelCase()}: ID!):${_getName(e, 'Connection')}`;

      return `
  add${schema}
  remove${schema}
`;
    });

    return `
  create${label}(${label}:${label}Input): ${label}
  update${label}(${label}:${label}Input, id: ID!): ${label}
  delete${label}(id: ID!):${label}
  ${edgesConnections.join('')}
`;
  };

  const nodeTypes = nodes.map(_getNodeSpec).join('\n');
  const edgesType = edges.map(_getEdge).join('\n');
  const connectionsType = edges.map(_getConnection).join('\n');
  const nodeMutations = nodes.map(_getNodeMutation).join('\n');

  const schemaEntries = nodes.map((n) => `
  ${n.label}s(id:[ID]):[${n.label.toCamelCase()}]`).join('');

  const generatedGraphlQlSchema = `
${customTypes}
${nodeTypes}
${edgesType}
${connectionsType}

# the schema allows the following query:
type Query {
  nodes(id:[ID]): [Node]
  ${schemaEntries}
}

type Mutation {
  ${nodeMutations}
}

schema {
  query: Query
  mutation: Mutation
}
`;

  nodeToRenderTo.innerHTML = (generatedGraphlQlSchema.replace(/\n\n/g, '\n').trim());
};

export default generateGraphQLSchema;