import { NavigatorScreenParams } from '@react-navigation/native';
import { CalcId } from '../types';

export type HomeStackParamList = {
  Dashboard: undefined;
  MaterialCalculator: undefined;
  Calculator: { id: CalcId };
  QuickCalculator: undefined;
  TourDiary: undefined;
  /** `month` is a key like "2026-10" (see utils/month.ts). */
  TourDiaryMonth: { month: string };
  TourDiaryReport: { month: string };
  TourDiaryEntry: undefined;
  SitePhotos: undefined;
  /** `uri` is a photo already taken or picked; without it the screen asks for one. */
  SitePhotoAdd: { uri?: string } | undefined;
  Reports: undefined;
  Community: undefined;
  DesignStudio: undefined;
};

export type EstimationStackParamList = {
  EstimationHome: undefined;
  Valuation: undefined;
  /**
   * New work (creates a project + estimate), or with `projectId` adds an
   * estimate to that project, or with `estimateId` edits it. `workType`
   * pre-selects a template.
   */
  CreateWork: { workType?: string; projectId?: number; estimateId?: number } | undefined;
  Projects: undefined;
  ProjectDetail: { id: number };
  ProjectEdit: { id: number };
  EstimateDetail: { id: number };
  Rates: undefined;
  /** A material estimate saved on this phone from the calculators. */
  EstimationDetail: { id: string };
};

export type TabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Estimation: NavigatorScreenParams<EstimationStackParamList> | undefined;
  Alerts: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = AuthStackParamList & {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  EditProfile: undefined;
};
