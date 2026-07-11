import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { LoginPage } from './auth/login.page';
import { FriendsPage } from './auth/friends.page';
import { MultiplayerBattlePage } from './multiplayer/pages/multiplayer-battle.page';
import { MatchLobbyPage } from './multiplayer/pages/match-lobby.page';
import { MatchPlayPage } from './multiplayer/pages/match-play.page';
import { MatchResultPage } from './multiplayer/pages/match-result.page';
import { MultiplayerHomePage } from './multiplayer/pages/multiplayer-home.page';
import { QuickMatchSearchPage } from './multiplayer/pages/quick-match-search.page';
import { MatchBoardPage } from './multiplayer/pages/match-board.page';
import { BibleReadyPage } from './pages/bible-ready.page';
import { DailyQuestPage } from './pages/daily-quest.page';
import { FeaturePage } from './pages/feature.page';
import { LaunchPage } from './pages/launch.page';
import { QuizModePage } from './pages/quiz-mode.page';
import { SettingsPage } from './settings/settings.page';
import { MatchesPage } from './friend-battle/matches.page';
import { ProfilePage } from './auth/profile.page';

export const routes: Routes = [
  { path: '', component: LaunchPage, pathMatch: 'full' },
  { path: 'login', component: LoginPage, data: { mode: 'login' } },
  { path: 'register', component: LoginPage, data: { mode: 'register' } },
  {
    path: 'multiplayer/board/:id',
    component: MatchBoardPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'multiplayer',
    component: MultiplayerHomePage,
    canActivate: [AuthGuard],
  },
  { path: 'friends', component: FriendsPage, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [AuthGuard] },
  { path: 'matches', component: MatchesPage, canActivate: [AuthGuard] },
  {
    path: 'multiplayer/lobby/:id',
    component: MatchLobbyPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'multiplayer/play/:id',
    component: MatchPlayPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'multiplayer/result/:id',
    component: MatchResultPage,
    canActivate: [AuthGuard],
  },
  {
    path: 'multiplayer/quick-match',
    component: QuickMatchSearchPage,
    canActivate: [AuthGuard],
  },
  { path: 'settings', component: SettingsPage, canActivate: [AuthGuard] },
  { path: 'bible-ready', component: BibleReadyPage, canActivate: [AuthGuard] },
  {
    path: 'multiplayer-battle',
    component: MultiplayerBattlePage,
    canActivate: [AuthGuard],
  },
  {
    path: 'battle-history',
    component: FeaturePage,
    canActivate: [AuthGuard],
    data: {
      title: 'Battle History',
      subtitle: 'Review your past battles and stats.',
      background: 'multiplayer-page.png',
    },
  },
  { path: 'daily-quest', component: DailyQuestPage, canActivate: [AuthGuard] },
  {
    path: 'journey-mode',
    component: FeaturePage,
    canActivate: [AuthGuard],
    data: {
      title: 'Journey Mode',
      subtitle: 'Explore the Bible from Genesis to Revelation.',
      background: 'home-page.png',
    },
  },
  { path: 'quiz-mode', component: QuizModePage, canActivate: [AuthGuard] },
  {
    path: 'achievements',
    component: FeaturePage,
    canActivate: [AuthGuard],
    data: {
      title: 'Achievements',
      subtitle: 'Unlock badges, earn XP, and grow your legacy.',
      background: 'achievements-page.png',
    },
  },
];
