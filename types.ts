
export enum BlockType {
  INPUT = 'INPUT',
  ESCAPE = 'ESCAPE',
  UNESCAPE = 'UNESCAPE',
  PARSE_JSON = 'PARSE_JSON',
  SELECT_FIELD = 'SELECT_FIELD',
  SPLIT = 'SPLIT',
  TRANSFORM_CASE = 'TRANSFORM_CASE',
  AI_PROCESS = 'AI_PROCESS'
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
