
import { TransformResult } from '../types';

export const getResultType = (val: any): TransformResult['type'] => {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  return typeof val as TransformResult['type'];
};

export const escapeText = (text: string, mode: 'html' | 'uri' = 'html'): string => {
  if (mode === 'uri') return encodeURIComponent(text);
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const unescapeText = (text: string, mode: 'html' | 'uri' = 'html'): string => {
  if (mode === 'uri') return decodeURIComponent(text);
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return doc.documentElement.textContent || '';
};

export const selectField = (obj: any, path: string): any => {
  if (!obj) return undefined;
  // Convert path a.b.c[0] to a.b.c.0
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = normalizedPath.split('.');
  
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
};

export const transform = (type: string, input: any, config: any): TransformResult => {
  try {
    let result: any;
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input, null, 2);

    switch (type) {
      case 'ESCAPE':
        result = escapeText(inputStr, config.mode || 'html');
        break;
      case 'UNESCAPE':
        result = unescapeText(inputStr, config.mode || 'html');
        break;
      case 'PARSE_JSON':
        result = JSON.parse(inputStr);
        break;
      case 'SELECT_FIELD':
        result = selectField(input, config.path || '');
        break;
      case 'SPLIT':
        result = inputStr.split(config.separator || '');
        break;
      case 'TRANSFORM_CASE':
        result = config.mode === 'upper' ? inputStr.toUpperCase() : inputStr.toLowerCase();
        break;
      default:
        result = input;
    }

    return {
      data: result,
      type: getResultType(result)
    };
  } catch (err: any) {
    return {
      data: null,
      error: err.message,
      type: 'null'
    };
  }
};
