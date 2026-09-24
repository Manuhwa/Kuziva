import { Assignment } from './types';

const STORAGE_KEY_ASSIGNMENTS = 'kuziva_assignments';
const STORAGE_KEY_RESULTS = 'kuziva_results';

export const storage = {
  getAssignments(): Assignment[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load assignments from localStorage:', error);
      return [];
    }
  },

  saveAssignment(assignment: Assignment) {
    const assignments = this.getAssignments();
    const existing = assignments.findIndex(a => a.id === assignment.id);
    if (existing >= 0) {
      assignments[existing] = assignment;
    } else {
      assignments.push(assignment);
    }
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
  },

  getAssignment(id: string): Assignment | undefined {
    return this.getAssignments().find(a => a.id === id);
  },

  deleteAssignment(id: string) {
    const assignments = this.getAssignments().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignments));
  },

  getResults() {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_RESULTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load results from localStorage:', error);
      return [];
    }
  },

  saveResult(result: any) {
    const results = this.getResults();
    results.push(result);
    localStorage.setItem(STORAGE_KEY_RESULTS, JSON.stringify(results));
  },

  getResult(id: string) {
    return this.getResults().find((r: any) => r.id === id);
  },

  getResultsForAssignment(assignmentId: string) {
    return this.getResults().filter((r: any) => r.assignmentId === assignmentId);
  }
};
