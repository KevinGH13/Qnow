export type ProjectStatus = 'active' | 'paused' | 'closed';
export type EventStatus = 'scheduled' | 'completed';
export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'in_progress' | 'done';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
  description: string | null;
}

export interface Tag {
  id: string;
  name: string;
  _count?: { decisions: number };
}

export interface Decision {
  id: string;
  eventId: string;
  text: string;
  date: string;
  createdAt: string;
  tags: { tag: Tag }[];
  event?: { id: string; title: string };
}

export interface Task {
  id: string;
  projectId: string;
  eventId: string | null;
  text: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: string;
  event?: { id: string; title: string } | null;
}

export interface EventSummary {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  date: string;
  status: EventStatus;
  createdAt: string;
  participants: { person: Person }[];
  _count?: { decisions: number; tasks: number };
}

export interface EventDetail extends EventSummary {
  decisions: Decision[];
  tasks: Task[];
}

export interface Team {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  members: { person: Person }[];
}

/** A person as listed for a project: `project` is null when they have no link to it yet. */
export interface PersonInProject extends Person {
  project: {
    teams: { id: string; name: string }[];
    meetingCount: number;
    lastMeetingAt: string | null;
    nextMeetingAt: string | null;
  } | null;
}

export interface PersonProfile extends Person {
  teams: { id: string; name: string }[];
  meetings: { id: string; title: string; date: string; status: EventStatus }[];
  decisions: Decision[];
}
