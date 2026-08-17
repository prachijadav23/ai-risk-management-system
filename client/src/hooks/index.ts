import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, unwrap } from '@/lib/api';
import type {
  Project,
  Employee,
  Task,
  DashboardData,
  CommandCenter,
  RiskResult,
  AllocationScore,
  Recommendation,
  ApiEnvelope,
} from '@/types';

/* ---------- Projects ---------- */
export function useProjects(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Project[]>>('/projects', { params });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useProject(id?: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => unwrap<Project>(api.get(`/projects/${id}`)),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Project>) => unwrap<Project>(api.post('/projects', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Project> }) =>
      unwrap<Project>(api.put(`/projects/${id}`, body)),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      qc.invalidateQueries({ queryKey: ['project', v.id] });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

/* ---------- Employees ---------- */
export function useEmployees(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<Employee[]>>('/employees', { params });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useEmployee(id?: string) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: () => unwrap<Employee>(api.get(`/employees/${id}`)),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Employee>) => unwrap<Employee>(api.post('/employees', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Employee> }) =>
      unwrap<Employee>(api.put(`/employees/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });
}

/* ---------- Tasks ---------- */
export function useBoard(project?: string) {
  return useQuery({
    queryKey: ['board', project],
    queryFn: () => unwrap<Record<string, Task[]>>(api.get('/tasks/board', { params: project ? { project } : {} })),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Task>) => unwrap<Task>(api.post('/tasks', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, order }: { id: string; status: string; order?: number }) =>
      unwrap<Task>(api.patch(`/tasks/${id}/move`, { status, order })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['board'] }),
  });
}

/* ---------- Analytics ---------- */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => unwrap<DashboardData>(api.get('/analytics/dashboard')),
  });
}
export function useDepartmentComparison() {
  return useQuery({
    queryKey: ['analytics', 'departments'],
    queryFn: () => unwrap<Array<{ department: string; projects: number; avgProgress: number; budget: number; spent: number }>>(api.get('/analytics/departments')),
  });
}
export function useTaskCompletion() {
  return useQuery({
    queryKey: ['analytics', 'task-completion'],
    queryFn: () => unwrap<Array<{ name: string; value: number }>>(api.get('/analytics/task-completion')),
  });
}
export function useEmployeeWorkload() {
  return useQuery({
    queryKey: ['analytics', 'workload'],
    queryFn: () => unwrap<Array<{ name: string; currentWorkload: number; performanceScore: number }>>(api.get('/analytics/employee-workload')),
  });
}

/* ---------- AI ---------- */
export function useCommandCenter() {
  return useQuery({
    queryKey: ['command-center'],
    queryFn: () => unwrap<CommandCenter>(api.get('/ai/command-center')),
  });
}

export function usePredict() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      unwrap<{ prediction: RiskResult; recommendations: unknown[] }>(api.post(`/ai/projects/${projectId}/predict`)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['command-center'] });
      qc.invalidateQueries({ queryKey: ['recommendations'] });
    },
  });
}

export function useAllocate() {
  return useMutation({
    mutationFn: ({ projectId, requiredSkills }: { projectId: string; requiredSkills?: string[] }) =>
      unwrap<{ requiredSkills: string[]; recommendations: AllocationScore[] }>(
        api.post(`/ai/projects/${projectId}/allocate`, { requiredSkills })
      ),
  });
}

export function useSimulate() {
  return useMutation({
    mutationFn: ({ projectId, overrides }: { projectId: string; overrides: Record<string, number> }) =>
      unwrap<{ before: RiskResult; after: RiskResult }>(api.post(`/ai/projects/${projectId}/simulate`, overrides)),
  });
}

export function useRecommendations(status?: string) {
  return useQuery({
    queryKey: ['recommendations', status],
    queryFn: () => unwrap<Recommendation[]>(api.get('/ai/recommendations', { params: status ? { status } : {} })),
  });
}

export function useResolveRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Accepted' | 'Rejected' }) =>
      unwrap<Recommendation>(api.patch(`/ai/recommendations/${id}`, { status })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  });
}

/* ---------- Users (Administrator only) ---------- */
export interface ManagedUser {
  _id: string;
  name: string;
  email: string;
  role: import('@/types').Role;
  isActive: boolean;
  employee?: { _id: string; name?: string; designation?: string } | string | null;
  createdAt?: string;
}

export function useUsers(params: Record<string, string | number> = {}) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const res = await api.get<ApiEnvelope<ManagedUser[]>>('/users', { params });
      return { items: res.data.data, meta: res.data.meta };
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      email: string;
      password: string;
      role: import('@/types').Role;
      employee?: string;
    }) => unwrap<ManagedUser>(api.post('/users', body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<{ name: string; role: import('@/types').Role; isActive: boolean }> }) =>
      unwrap<ManagedUser>(api.put(`/users/${id}`, body)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
