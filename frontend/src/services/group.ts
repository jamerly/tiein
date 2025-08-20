import { HttpService } from "./api"; 
import type {PagableResponse } from "./api";
export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const fetchGroups = async ( page?: number, pageSize?: number): Promise<PagableResponse<Group>> => {
    return await HttpService.getPagable<Group>(`/mcp/groups`, page, pageSize)
}

export const createGroup = async (groupName: string): Promise<Group> => {
    const response = await HttpService.post<Group>(`/mcp/groups`, { name: groupName });
    return response;
}

export const updateGroup = async (id: number, groupName: string): Promise<Group> => {
    const response = await HttpService.put<Group>(`/mcp/groups/${id}`, { id: id, name: groupName });
    return response;
}

export const deleteGroup = async (id: number): Promise<void> => {
    await HttpService.delete<void>(`/mcp/groups/${id}`);
}