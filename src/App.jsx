// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import AgentSandboxHome from './components/AgentSandboxHome';
import AddonConfigView from './components/AddonConfigView';
import FleetTelemetryDashboard from './components/FleetTelemetryDashboard';
import RightSizingAssistant from './components/RightSizingAssistant';
import TemplateManagementConsole from './components/TemplateManagementConsole';
import DeveloperTraceLogs from './components/DeveloperTraceLogs';
import PlatformAdminDashboard from './components/PlatformAdminDashboard';
import TemplateUsageReport from './components/TemplateUsageReport';
import ClusterLevelDashboard from './components/ClusterLevelDashboard';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'addon-config' | 'fleet-telemetry' | 'right-sizing' | 'templates-console' | 'developer-logs' | 'platform-admin' | 'usage-report'
  const [routingHistory, setRoutingHistory] = useState([]);

  const handleNavigateBackFromRightSizing = () => {
    if (routingHistory.includes('platform-admin')) {
      setCurrentView('platform-admin');
      setRoutingHistory([]);
    } else {
      setCurrentView('home');
    }
  };

  return (
    <ErrorBoundary>
      <div className="bg-mesh-pattern w-screen min-h-screen flex items-center justify-center p-4 md:p-8 overflow-y-auto relative">
        <div className="max-w-6xl w-full min-h-[85vh] bg-sandbox-bg/95 backdrop-blur-3xl rounded-[24px] border border-slate-900/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.75)] flex flex-col relative overflow-hidden z-10">
          <main className="flex-1 overflow-y-auto flex flex-col relative w-full">
            {currentView === 'home' && <AgentSandboxHome onNavigate={setCurrentView} />}
            {currentView === 'addon-config' && <AddonConfigView onNavigateBack={() => setCurrentView('home')} />}
            {currentView === 'fleet-telemetry' && <FleetTelemetryDashboard onNavigateBack={() => setCurrentView('home')} onNavigate={setCurrentView} />}
            {currentView === 'right-sizing' && <RightSizingAssistant onNavigateBack={handleNavigateBackFromRightSizing} onNavigate={setCurrentView} routingHistory={routingHistory} />}
            {currentView === 'templates-console' && <TemplateManagementConsole onNavigateBack={() => setCurrentView('home')} />}
            {currentView === 'developer-logs' && <DeveloperTraceLogs onNavigateBack={() => setCurrentView('home')} />}
            {currentView === 'platform-admin' && <PlatformAdminDashboard onNavigateBack={() => setCurrentView('home')} onNavigate={setCurrentView} setRoutingHistory={setRoutingHistory} />}
            {currentView === 'cluster-dashboard' && <ClusterLevelDashboard onNavigateBack={() => setCurrentView('home')} onNavigate={setCurrentView} />}
            {currentView === 'usage-report' && <TemplateUsageReport onNavigateBack={() => setCurrentView('home')} />}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
