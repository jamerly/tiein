import { HttpService } from './api';
import type { PagableResponse } from './api';

export interface Worker {
  id: number;
  name: string;
  script: string;
}

export interface WorkersResponse extends PagableResponse<Worker> {}

const workerService = {
  getAllWorkers: async (pageNumber: number, pageSize: number): Promise<WorkersResponse> => {
    return await HttpService.getPagable<Worker>(`/mcp/workers`, pageNumber, pageSize);
  },

  getWorkerById: async (id: string): Promise<Worker> => {
    return await HttpService.get<Worker>(`/mcp/workers/${id}`);
  },

  createWorker: async (workerData: Omit<Worker, 'id'>): Promise<Worker> => {
    return await HttpService.post<Worker>('/mcp/workers', workerData);
  },

  updateWorker: async (workerData: Worker): Promise<Worker> => {
    return await HttpService.put<Worker>(`/mcp/workers/${workerData.id}`, workerData);
  },

  deleteWorker: async (id: string): Promise<void> => {
    await HttpService.delete<void>(`/mcp/workers/${id}`);
  },

  generateWorkerScript: async (prompt: string): Promise<string> => {
    return await HttpService.post<string>('/mcp/workers/generate-script', prompt);
  },
};

export default workerService;
