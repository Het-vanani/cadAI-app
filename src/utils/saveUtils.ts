import { CanvasState, Project } from '../types';

const AUTOSAVE_KEY = 'cadai_autosave';
const PROJECT_VERSION = '1.0';

export interface AutosaveData {
  canvasState: CanvasState;
  projectName?: string;
}

// ── Save project as a downloadable .cadai JSON file ──
export const saveProjectToFile = (state: CanvasState, projectName = 'Untitled Project'): void => {
  const project: Project = {
    id: `proj_${Date.now()}`,
    name: projectName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    canvasState: state,
  };

  const json = JSON.stringify({ version: PROJECT_VERSION, project }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName}.cadai`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ── Load a .cadai project file chosen by the user ──
export const loadProjectFromFile = (
  onLoad: (project: Project) => void,
  onError?: (msg: string) => void
): void => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.cadai,.json';

  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string);

        // Support both wrapped format and direct project format
        const project: Project = raw.project ?? raw;

        if (!project.canvasState || !project.canvasState.layers) {
          throw new Error('Invalid project file format.');
        }

        onLoad(project);
      } catch (err: any) {
        onError?.(err.message || 'Failed to load project file.');
      }
    };
    reader.readAsText(file);
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

// ── Autosave to localStorage every time canvas changes ──
export const autosaveToLocalStorage = (state: CanvasState, projectName = 'Untitled Project'): void => {
  try {
    const data = JSON.stringify({
      version: PROJECT_VERSION,
      savedAt: new Date().toISOString(),
      projectName,
      canvasState: state,
    });
    localStorage.setItem(AUTOSAVE_KEY, data);
  } catch {
    // localStorage can fail if storage is full — silently ignore
  }
};

// ── Load the last autosaved session on app start ──
export const loadAutosave = (): AutosaveData | null => {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return {
      canvasState: data.canvasState ?? null,
      projectName: data.projectName ?? 'Untitled Project',
    };
  } catch {
    return null;
  }
};

// ── Clear autosave (e.g. when starting a new project) ──
export const clearAutosave = (): void => {
  localStorage.removeItem(AUTOSAVE_KEY);
};