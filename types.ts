
export enum BlockType {
  INPUT = 'INPUT',
  ESCAPE = 'ESCAPE',
  UNESCAPE = 'UNESCAPE',
  PARSE_JSON = 'PARSE_JSON',
  SELECT_FIELD = 'SELECT_FIELD',
  SPLIT = 'SPLIT',
  TRANSFORM_UPPERCASE = 'TRANSFORM_UPPERCASE',
  TRANSFORM_LOWERCASE = 'TRANSFORM_LOWERCASE',
  JSON_STRINGIFY = 'JSON_STRINGIFY',
  MINIFY = 'MINIFY',
  PARSE_XML = 'PARSE_XML'
}

export type TransformResult = {
  data: any;
  error?: string;
  type: 'string' | 'object' | 'array' | 'number' | 'boolean' | 'null';
};

export interface BlockInstance {
  id: string;
  type: BlockType;
  config: any;
  output: TransformResult;
  isIsolated?: boolean;
  isPinned?: boolean;
}

export interface PipelineState {
  initialInput: string;
  blocks: BlockInstance[];
}

export interface SavedOperation extends PipelineState {
  id: string;
  name: string;
  createdAt: number;
}

export interface HistoryItem {
  initialInput: string;
  blocks: BlockInstance[];
}
