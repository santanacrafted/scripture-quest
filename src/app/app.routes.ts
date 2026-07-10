import { Routes } from '@angular/router';
import { LoginPage } from './auth/login.page';
import { RegisterPage } from './auth/register.page';
import { FriendsPage } from './auth/friends.page';
import { MultiplayerBattlePage } from './multiplayer/pages/multiplayer-battle.page';
import { MatchLobbyPage } from './multiplayer/pages/match-lobby.page';
import { MatchPlayPage } from './multiplayer/pages/match-play.page';
import { MatchResultPage } from './multiplayer/pages/match-result.page';
import { MultiplayerHomePage } from './multiplayer/pages/multiplayer-home.page';
import { BibleReadyPage } from './pages/bible-ready.page';
import { DailyQuestPage } from './pages/daily-quest.page';
import { FeaturePage } from './pages/feature.page';
import { QuizModePage } from './pages/quiz-mode.page';
import { SettingsPage } from './settings/settings.page';

export const routes: Routes = [
  { path: '', redirectTo: 'multiplayer', pathMatch: 'full' },
  { path: 'login', component: LoginPage },
  { path: 'register', component: RegisterPage },
  { path: 'multiplayer', component: MultiplayerHomePage },
  { path: 'friends', component: FriendsPage },
  { path: 'multiplayer/lobby/:id', component: MatchLobbyPage },
  { path: 'multiplayer/play/:id', component: MatchPlayPage },
  { path: 'multiplayer/result/:id', component: MatchResultPage },
  { path: 'settings', component: SettingsPage },
  { path: 'bible-ready', component: BibleReadyPage },
  { path: 'multiplayer-battle', component: MultiplayerBattlePage },
  {
    path: 'battle-history',
    component: FeaturePage,
    data: {
      title: 'Battle History',
      subtitle: 'Review your past battles and stats.',
      background: 'multiplayer-page.png',
    },
  },
  { path: 'daily-quest', component: DailyQuestPage },
  {
    path: 'journey-mode',
    component: FeaturePage,
    data: {
      title: 'Journey Mode',
      subtitle: 'Explore the Bible from Genesis to Revelation.',
      background: 'home-page.png',
    },
  },
  { path: 'quiz-mode', component: QuizModePage },
  {
    path: 'achievements',
    component: FeaturePage,
    data: {
      title: 'Achievements',
      subtitle: 'Unlock badges, earn XP, and grow your legacy.',
      background: 'achievements-page.png',
    },
  },
];
