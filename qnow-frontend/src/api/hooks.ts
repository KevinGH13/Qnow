import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, qs } from './client';
import type {
  Decision,
  EventDetail,
  EventStatus,
  EventSummary,
  Person,
  PersonInProject,
  PersonProfile,
  Priority,
  Project,
  Tag,
  Task,
  TaskStatus,
  Team,
} from './types';

export const keys = {
  projects: ['projects'] as const,
  events: (projectId?: string, status?: EventStatus) => ['events', projectId, status] as const,
  event: (id: string) => ['event', id] as const,
  tasks: (projectId?: string) => ['tasks', projectId] as const,
  people: (search?: string) => ['people', search ?? ''] as const,
  projectPeople: (projectId?: string) => ['people', 'project', projectId] as const,
  person: (id: string, projectId?: string) => ['person', id, projectId] as const,
  teams: (projectId?: string) => ['teams', projectId] as const,
  decisions: (projectId?: string) => ['decisions', projectId] as const,
  tags: ['tags'] as const,
};

/** Every write can affect timeline, tasks and "last active project", so refresh them together. */
function useRefreshAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all(
      ['projects', 'events', 'event', 'tasks', 'tags', 'people', 'person', 'teams', 'decisions'].map((k) =>
        qc.invalidateQueries({ queryKey: [k] }),
      ),
    );
}

// ─── Queries ──────────────────────────────────────────────

export const useProjects = () =>
  useQuery({ queryKey: keys.projects, queryFn: () => api.get<Project[]>('/projects') });

export const useEvents = (projectId: string | undefined, status?: EventStatus) =>
  useQuery({
    queryKey: keys.events(projectId, status),
    queryFn: () => api.get<EventSummary[]>(`/events${qs({ projectId, status })}`),
    enabled: !!projectId,
  });

export const useEvent = (id: string) =>
  useQuery({ queryKey: keys.event(id), queryFn: () => api.get<EventDetail>(`/events/${id}`) });

export const useTasks = (projectId: string | undefined) =>
  useQuery({
    queryKey: keys.tasks(projectId),
    queryFn: () => api.get<Task[]>(`/tasks${qs({ projectId })}`),
    enabled: !!projectId,
  });

export const usePeople = (search?: string) =>
  useQuery({
    queryKey: keys.people(search),
    queryFn: () => api.get<Person[]>(`/people${qs({ search })}`),
  });

export const useProjectPeople = (projectId: string | undefined) =>
  useQuery({
    queryKey: keys.projectPeople(projectId),
    queryFn: () => api.get<PersonInProject[]>(`/people${qs({ projectId })}`),
    enabled: !!projectId,
  });

export const usePerson = (id: string | null, projectId: string | undefined) =>
  useQuery({
    queryKey: keys.person(id ?? '', projectId),
    queryFn: () => api.get<PersonProfile>(`/people/${id}${qs({ projectId })}`),
    enabled: !!id && !!projectId,
  });

export const useTeams = (projectId: string | undefined) =>
  useQuery({
    queryKey: keys.teams(projectId),
    queryFn: () => api.get<Team[]>(`/teams${qs({ projectId })}`),
    enabled: !!projectId,
  });

export const useDecisions = (projectId: string | undefined) =>
  useQuery({
    queryKey: keys.decisions(projectId),
    queryFn: () => api.get<Decision[]>(`/decisions${qs({ projectId })}`),
    enabled: !!projectId,
  });

export const useTags = () => useQuery({ queryKey: keys.tags, queryFn: () => api.get<Tag[]>('/tags') });

// ─── Mutations ────────────────────────────────────────────

function useWrite<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: fn, onSuccess: refresh });
}

export const useCreateProject = () =>
  useWrite((body: { name: string; description?: string }) => api.post<Project>('/projects', body));

export const useCreateEvent = () =>
  useWrite((body: { projectId: string; title: string; date: string; description?: string; status?: EventStatus }) =>
    api.post<EventSummary>('/events', body),
  );

export const useUpdateEvent = () =>
  useWrite(
    ({ id, ...body }: { id: string; title?: string; description?: string; date?: string; status?: EventStatus }) =>
      api.patch<EventSummary>(`/events/${id}`, body),
  );

export const useDeleteEvent = () => useWrite((id: string) => api.delete(`/events/${id}`));

export const useAddParticipant = () =>
  useWrite(({ eventId, personId }: { eventId: string; personId: string }) =>
    api.post(`/events/${eventId}/participants/${personId}`),
  );

export const useRemoveParticipant = () =>
  useWrite(({ eventId, personId }: { eventId: string; personId: string }) =>
    api.delete(`/events/${eventId}/participants/${personId}`),
  );

export const useCreateDecision = () =>
  useWrite((body: { eventId: string; text: string; tags: string[]; date?: string }) => api.post<Decision>('/decisions', body));

export const useDeleteDecision = () => useWrite((id: string) => api.delete(`/decisions/${id}`));

export const useCreateTask = () =>
  useWrite((body: { projectId: string; text: string; priority: Priority; eventId?: string }) =>
    api.post<Task>('/tasks', body),
  );

export const useUpdateTask = () =>
  useWrite(({ id, ...body }: { id: string; text?: string; priority?: Priority; status?: TaskStatus }) =>
    api.patch<Task>(`/tasks/${id}`, body),
  );

export const useDeleteTask = () => useWrite((id: string) => api.delete(`/tasks/${id}`));

export const useCreatePerson = () =>
  useWrite((body: { name: string; email?: string; role?: string }) => api.post<Person>('/people', body));

export const useUpdatePerson = () =>
  useWrite(
    ({ id, ...body }: { id: string; name?: string; email?: string | null; role?: string | null; description?: string | null }) =>
      api.patch<Person>(`/people/${id}`, body),
  );

export const useDeletePerson = () => useWrite((id: string) => api.delete(`/people/${id}`));

export const useCreateTeam = () =>
  useWrite((body: { projectId: string; name: string; description?: string }) => api.post<Team>('/teams', body));

export const useUpdateTeam = () =>
  useWrite(({ id, ...body }: { id: string; name?: string; description?: string }) => api.patch<Team>(`/teams/${id}`, body));

export const useDeleteTeam = () => useWrite((id: string) => api.delete(`/teams/${id}`));

export const useAddTeamMember = () =>
  useWrite(({ teamId, personId }: { teamId: string; personId: string }) =>
    api.post(`/teams/${teamId}/members/${personId}`),
  );

export const useRemoveTeamMember = () =>
  useWrite(({ teamId, personId }: { teamId: string; personId: string }) =>
    api.delete(`/teams/${teamId}/members/${personId}`),
  );
