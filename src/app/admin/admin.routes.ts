import { Routes } from '@angular/router';
import { adminGuard } from './admin.guard';
export default [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'questions',
        loadComponent: () =>
          import('./questions.page').then((m) => m.AdminQuestionsPage),
      },
      {
        path: 'questions/new',
        loadComponent: () =>
          import('./question-editor.page').then((m) => m.QuestionEditorPage),
      },
      {
        path: 'questions/:questionId',
        loadComponent: () =>
          import('./question-editor.page').then((m) => m.QuestionEditorPage),
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./import.page').then((m) => m.AdminImportPage),
      },
      {
        path: 'review',
        loadComponent: () =>
          import('./review.page').then((m) => m.AdminReviewPage),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./reports.page').then((m) => m.AdminReportsPage),
      },
    ],
  },
] satisfies Routes;
