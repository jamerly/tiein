import { HttpService } from './api';
import { type Group } from './group';
import type { PagableResponse } from './api';
import { v4 as uuidv4 } from 'uuid';

export enum ToolType {
  HTTP = 'HTTP',
  GROOVY = 'GROOVY',
}

export interface Tool {
  id: number;
  name: string;
  type: ToolType;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  httpUrl?: string;
  httpHeaders?: string;
  httpBody?: string;
  group?: Group; // Use Group type for group
  groovyScript?: string;
  description?: string | undefined;
  inputSchemaJson?: string;
  outputSchemaJson?: string;
  isProxy?: boolean;
  groupId?: number;
  groupName?: string;
  workerId?: number;
}

export interface ToolsResponse extends PagableResponse<Tool> {}

export interface Parameter {
  id: string;
  name: string;
  type: 'string' | 'integer' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  defaultValue?: string | number | boolean;
  enum?: string;
}

export const fetchTools = async (pageNumber: number, pageSize: number): Promise<ToolsResponse> => {
  const response = await HttpService.getPagable<Tool>(`/mcp/tools`, pageNumber, pageSize);
  return response;
};

export const createTool = async (toolData: Omit<Tool, 'id' | 'groupName'>): Promise<Tool> => {
  const response = await HttpService.post<Tool>('/mcp/tools', toolData);
  return response;
};

export const updateTool = async (id: number, toolData: Omit<Tool, 'id' | 'groupName'>): Promise<Tool> => {
  const response = await HttpService.put<Tool>(`/mcp/tools/${id}`, toolData);
  return response;
};

export const deleteTool = async (id: number): Promise<void> => {
  await HttpService.delete<void>(`/mcp/tools/${id}`);
};

// Helper to convert JSON Schema to Parameter[]
export const jsonSchemaToParameters = (schemaJson?: string): Parameter[] => {
  if (!schemaJson) return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
  try {
    const schema = JSON.parse(schemaJson);
    if (schema.type !== 'object' || !schema.properties) {
      console.warn("Schema is not a valid object schema:", schema);
      return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
    }
    const parameters: Parameter[] = [];
    const required = new Set(schema.required || []);

    for (const key in schema.properties) {
      const prop = schema.properties[key];
      parameters.push({
        id: uuidv4(),
        name: key,
        type: prop.type || 'string',
        description: prop.description || '',
        required: required.has(key),
        defaultValue: prop.default !== undefined ? String(prop.default) : undefined,
        enum: prop.enum ? prop.enum.join(', ') : undefined,
      });
    }
    return parameters.length > 0 ? parameters : [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
  } catch (e) {
    console.error("Failed to parse JSON schema:", e);
    return [{ id: uuidv4(), name: '', type: 'string', description: '', required: false, enum: '' }];
  }
};

// Helper to convert Parameter[] to JSON Schema
export const parametersToJsonSchema = (parameters: Parameter[]): string | undefined => {
  const properties: { [key: string]: any } = {};
  const required: string[] = [];

  parameters.forEach(param => {
    if (param.name.trim() === '') return; // Skip empty parameter names

    properties[param.name] = {
      type: param.type,
      description: param.description,
    };
    if (param.defaultValue !== undefined && param.defaultValue !== '') {
      // Attempt to parse default value based on type
      let parsedDefault: any = param.defaultValue;
      if (param.type === 'integer') parsedDefault = parseInt(String(param.defaultValue));
      else if (param.type === 'boolean') parsedDefault = (String(param.defaultValue).toLowerCase() === 'true');
      // Add more type handling if needed
      properties[param.name].default = parsedDefault;
    }
    if (param.enum && param.enum.trim() !== '') {
      properties[param.name].enum = param.enum.split(',').map(s => s.trim());
    }
    if (param.required) {
      required.push(param.name);
    }
  });

  if (Object.keys(properties).length === 0) {
    return undefined; // No parameters, return undefined schema
  }

  const schema = {
    type: 'object',
    properties: properties,
    required: required,
  };
  return JSON.stringify(schema, null, 2);
};

export const fetchToolById = async (id: number): Promise<Tool> => {
  const response = await HttpService.get<Tool>(`/mcp/tools/${id}`);
  return response;
};

export const fetchToolsByGroupId = async (groupId: number): Promise<Tool[]> => {
  const response = await HttpService.get<Tool[]>(`/mcp/tools/by-group/${groupId}`);
  return response;
};