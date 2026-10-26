// Exact default kinds observed by the owned Megaladata 7.4.2 column editor.
// Non-default kinds are readable, but the v1 writer cannot select them.
export const JAVASCRIPT_DECLARED_COLUMN_LIMIT=64;
export const JAVASCRIPT_DECLARED_TYPES=Object.freeze({
  boolean:Object.freeze({value:1,label:'Logical',kind:'Discrete'}),
  datetime:Object.freeze({value:2,label:'Date/Time',kind:'Continuous'}),
  real:Object.freeze({value:3,label:'Real',kind:'Continuous'}),
  integer:Object.freeze({value:4,label:'Integer',kind:'Continuous'}),
  string:Object.freeze({value:5,label:'String',kind:'Discrete'}),
});
