import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Screen, pathFor } from '@/web/navigation';
import Toast from '@/web/Toast';
import DialogHost from '@/web/DialogHost';
import AppLayout from '@/layout/AppLayout';

import LoginScreen from './assets/components/Auth/LoginScreen';
import SignupScreen from './assets/components/Auth/SignupScreen';
import AddSkillScreen from './assets/components/Worker/AddSkillScreen';
import UserDashboardScreen from './assets/components/Client/UserDashboardScreen';
import FindServiceScreen from './assets/components/Client/FindServiceScreen';
import FilterationScreen from './assets/components/Client/FilterationScreen';
import WorkerDetailScreen from './assets/components/Client/WorkerDetailScreen';
import WorkerDashboardScreen from './assets/components/Worker/WorkerDashboardScreen';
import InterviewSelectionScreen from './assets/components/Client/InterviewSelectionScreen';
import ActiveRequestsScreen from './assets/components/Worker/ActiveRequestsScreen';
import ActiveRequestScreen from './assets/components/Client/ActiveRequestScreen';
import AcceptedRequestScreen from './assets/components/Worker/AcceptedRequestScreen';
import JobConfirmationScreen from './assets/components/Worker/JobConfirmationScreen';
import WorkerDecisionScreen from './assets/components/Client/WorkerDecisionScreen';
import RatingAndReviewsScreen from './assets/components/Client/RatingAndReviewsScreen';
import ResignationsScreen from './assets/components/Client/ResignationsScreen';
import ResignationScreen from './assets/components/Client/ResignationScreen';
import WorkerRatingAndReviewsScreen from './assets/components/Worker/RatingAndReviewsScreen';
import LeaveJobScreen from './assets/components/Worker/LeaveJobScreen';
import TerminateContractScreen from './assets/components/Client/TerminateContractScreen';
import WorkerTerminationScreen from './assets/components/Worker/WorkerTerminationScreen';
import MyHabitsScreen from './assets/components/Worker/MyHabitsScreen';
import WorkerDirectoryScreen from './assets/components/Company/WorkerDirectoryScreen';
import WorkerDetailsVerificationScreen from './assets/components/Company/WorkerDetailsVerificationScreen';
import WorkerCertificationDetail from './assets/components/Client/WorkerCertificationDetail';
import PoliceVerificationPortal from './assets/components/Police/PoliceVerificationPortal';
import CharacterCertificateScreen from './assets/components/Police/CharacterCertificateScreen';
import IssueCharacterCertificateScreen from './assets/components/Police/IssueCharacterCertificateScreen';
import FileCriminalRecordScreen from './assets/components/Police/FileCriminalRecordScreen';
import Map from './assets/components/Map/Map';
import ClientProfileScreen from './assets/components/Client/ClientProfileScreen';

/**
 * Same stack as the original App.tsx: identical screen names, same
 * registration order, same initial route ("Login"). Each screen name is its
 * URL path, e.g. navigation.navigate('WorkerDetailScreen', { workerId })
 * → /WorkerDetailScreen (params in history state).
 */
export const SCREENS = [
  ['Login', LoginScreen],
  ['Signup', SignupScreen],
  ['AddSkills', AddSkillScreen],
  ['UserDashboardScreen', UserDashboardScreen],
  ['FindServiceScreen', FindServiceScreen],
  ['FilterationScreen', FilterationScreen],
  ['WorkerDetailScreen', WorkerDetailScreen],
  ['WorkerDashboardScreen', WorkerDashboardScreen],
  ['InterviewSelectionScreen', InterviewSelectionScreen],
  ['ActiveRequestsScreen', ActiveRequestsScreen],
  ['ActiveRequestScreen', ActiveRequestScreen],
  ['AcceptedRequestScreen', AcceptedRequestScreen],
  ['JobConfirmationScreen', JobConfirmationScreen],
  ['WorkerDecisionScreen', WorkerDecisionScreen],
  ['RatingAndReviewsScreen', RatingAndReviewsScreen],
  ['ResignationsScreen', ResignationsScreen],
  ['ResignationScreen', ResignationScreen],
  ['WorkerRatingAndReviewsScreen', WorkerRatingAndReviewsScreen],
  ['LeaveJobScreen', LeaveJobScreen],
  ['TerminateContractScreen', TerminateContractScreen],
  ['WorkerTerminationScreen', WorkerTerminationScreen],
  ['MyHabitsScreen', MyHabitsScreen],
  ['WorkerDirectoryScreen', WorkerDirectoryScreen],
  ['WorkerDetailsVerificationScreen', WorkerDetailsVerificationScreen],
  ['WorkerCertificationDetail', WorkerCertificationDetail],
  ['PoliceVerificationPortal', PoliceVerificationPortal],
  ['CharacterCertificateScreen', CharacterCertificateScreen],
  ['IssueCharacterCertificateScreen', IssueCharacterCertificateScreen],
  ['FileCriminalRecordScreen', FileCriminalRecordScreen],
  ['MapScreen', Map],
  ['ClientProfileScreen', ClientProfileScreen],
];

export default function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={pathFor('Login')} replace />} />
            {SCREENS.map(([name, component]) => (
              <Route key={name} path={pathFor(name)} element={<Screen name={name} component={component} />} />
            ))}
            <Route path="*" element={<Navigate to={pathFor('Login')} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toast />
      <DialogHost />
    </>
  );
}
