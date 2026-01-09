
import { TransformResult } from '../types';

export const getResultType = (val: any): TransformResult['type'] => {
  if (val === null) return 'null';
  if (Array.isArray(val)) return 'array';
  const type = typeof val;
  if (type === 'string' || type === 'object' || type === 'number' || type === 'boolean') {
    return type as TransformResult['type'];
  }
  return 'null';
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
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const keys = normalizedPath.split('.');
  
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = current[key];
  }
  return current;
};

/**
 * A robust XML formatter that beautifies an XML string.
 * Refactored to handle multiline tags with closing symbols on new lines.
 */
const beautifyXml = (xmlString: string, indentSize: number = 4): string => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
  
  const parseError = xmlDoc.getElementsByTagName('parsererror');
  if (parseError.length > 0) {
    throw new Error('Invalid XML structure provided for parsing.');
  }

  const formatNode = (node: Node, level: number): string => {
    const indent = ' '.repeat(level * indentSize);
    let result = '';

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      result += `${indent}<${element.tagName}`;
      
      const attrs = Array.from(element.attributes);
      const namespaces = attrs.filter(a => a.name.startsWith('xmlns'));
      const others = attrs.filter(a => !a.name.startsWith('xmlns'));
      
      const isMultilineTag = namespaces.length > 1;

      if (isMultilineTag) {
        // Add standard attributes on the first line
        others.forEach(attr => {
          result += ` ${attr.name}="${attr.value}"`;
        });
        
        // Add each namespace on its own line
        const nsIndent = ' '.repeat((level + 1) * indentSize);
        namespaces.forEach(ns => {
          result += `\n${nsIndent}${ns.name}="${ns.value}"`;
        });
      } else {
        // Single line attributes
        attrs.forEach(attr => {
          result += ` ${attr.name}="${attr.value}"`;
        });
      }

      if (element.childNodes.length === 0) {
        // Closing tag
        if (isMultilineTag) {
          result += `\n${indent}/>\n`;
        } else {
          result += '/>\n';
        }
      } else {
        // Handle opening tag and children
        if (isMultilineTag) {
          result += `\n${indent}>`;
        } else {
          result += '>';
        }

        // Check if it's text-only content
        const isTextOnly = Array.from(element.childNodes).every(n => n.nodeType === Node.TEXT_NODE);
        const textContent = element.textContent?.trim();

        if (isTextOnly && textContent && !isMultilineTag) {
          // Simple one-liner for non-multiline tags with text
          result += `${textContent}</${element.tagName}>\n`;
        } else {
          // Multiline content
          result += '\n';
          element.childNodes.forEach(child => {
            const formatted = formatNode(child, level + 1);
            if (formatted) result += formatted;
          });
          result += `${indent}</${element.tagName}>\n`;
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        result += `${indent}${text}\n`;
      }
    } else if (node.nodeType === Node.COMMENT_NODE) {
      result += `${indent}<!--${node.textContent}-->\n`;
    } else if (node.nodeType === Node.DOCUMENT_NODE) {
      node.childNodes.forEach(child => {
        result += formatNode(child, level);
      });
    }

    return result;
  };

  return formatNode(xmlDoc, 0).trim();
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
      case 'TRANSFORM_UPPERCASE':
        result = inputStr.toUpperCase();
        break;
      case 'TRANSFORM_LOWERCASE':
        result = inputStr.toLowerCase();
        break;
      case 'JSON_STRINGIFY':
        // Ensure the result of JSON_STRINGIFY is always a string.
        // Removed 2-space indentation to output a compact string.
        const stringified = JSON.stringify(input);
        result = stringified !== undefined ? stringified : String(input);
        break;
      case 'MINIFY':
        if (typeof input === 'string') {
          try {
            const parsed = JSON.parse(input);
            result = JSON.stringify(parsed);
          } catch {
            result = input.replace(/\s+/g, ' ').trim();
          }
        } else {
          result = JSON.stringify(input);
        }
        break;
      case 'PARSE_XML':
        result = beautifyXml(inputStr, 4);
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
