import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Activity, 
  RefreshCw, 
  SlidersHorizontal, 
  Server, 
  HelpCircle, 
  ChevronRight, 
  Zap, 
  Box,
  ShieldAlert,
  Terminal,
  Search,
  FileCode,
  Sliders,
  AlertTriangle,
  Globe,
  Download
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Cell as BarCell,
  LineChart,
  Line,
  AreaChart,
  Area 
} from 'recharts';

const sampleAdminTemplates = [
  { 
    id: 'python-agent-runner', 
    name: 'python-agent-runner', 
    status: 'Active', 
    projectId: 'prod-data-pipelines-7c', 
    activeClaims: 450, 
    warmPoolSize: 20, 
    isolation: 'gVisor (runsc)',
    cluster: 'gke-us-central-c1',
    namespace: 'agent-runtime-prod',
    lastReconciled: '1.2m ago',
    egressRules: 3,
    targetCapacity: 500,
    avgClaimRate: 14.5,
    costPerDay: 142.50,
    blockedAttempts: 24,
    allowlistDomains: ['api.github.com', 'pypi.org', 'files.pythonhosted.org']
  },
  { 
    id: 'node-sandbox-executor', 
    name: 'node-sandbox-executor', 
    status: 'Active', 
    projectId: 'llm-agent-orchestrator', 
    activeClaims: 120, 
    warmPoolSize: 10, 
    isolation: 'gVisor (runsc)',
    cluster: 'gke-us-east4-a',
    namespace: 'agent-workers-node',
    lastReconciled: '45s ago',
    egressRules: 2,
    targetCapacity: 150,
    avgClaimRate: 6.2,
    costPerDay: 45.80,
    blockedAttempts: 4,
    allowlistDomains: ['registry.npmjs.org', 'api.openai.com']
  },
  { 
    id: 'golang-crd-validator', 
    name: 'golang-crd-validator', 
    status: 'Degraded', 
    projectId: 'dev-sandbox-env', 
    activeClaims: 85, 
    warmPoolSize: 5, 
    isolation: 'gVisor (runsc)',
    cluster: 'gke-dev-sandbox-cluster',
    namespace: 'crd-validators',
    lastReconciled: '12s ago',
    egressRules: 1,
    targetCapacity: 100,
    avgClaimRate: 3.8,
    costPerDay: 22.10,
    blockedAttempts: 82,
    allowlistDomains: ['proxy.golang.org']
  }
];

const sampleActiveSandboxesList = [
  { id: 'sb-claim-x8a9', template: 'python-agent-runner', status: 'Running', cluster: 'gke-us-central-c1', namespace: 'agent-runtime-prod', cpu: '0.4 Core', memory: '1.1 GiB', elapsed: '14m active', remaining: '46m', driver: 'runsc' },
  { id: 'sb-claim-y3b2', template: 'python-agent-runner', status: 'Running', cluster: 'gke-us-central-c1', namespace: 'agent-runtime-prod', cpu: '0.8 Core', memory: '2.4 GiB', elapsed: '45m active', remaining: '15m', driver: 'runsc' },
  { id: 'sb-claim-z7c1', template: 'node-sandbox-executor', status: 'Ready', cluster: 'gke-us-east4-a', namespace: 'agent-workers-node', cpu: '0.2 Core', memory: '512 MiB', elapsed: '2m active', remaining: '58m', driver: 'runsc' },
  { id: 'sb-claim-w4d8', template: 'golang-crd-validator', status: 'Running', cluster: 'gke-dev-sandbox-cluster', namespace: 'crd-validators', cpu: '0.5 Core', memory: '1.0 GiB', elapsed: '1.2h active', remaining: '2.8h', driver: 'runsc' }
];

const generateMockTimelineData = (timeWindowHours, metricType = 'sandbox') => {
  const points = 12;
  const data = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const diffMinutes = (timeWindowHours * 60 / (points - 1)) * i;
    const pTime = new Date(now.getTime() - diffMinutes * 60 * 1000);
    const timeStr = pTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (metricType === 'sandbox') {
      const baseCpu = 30 + Math.sin(i * 0.8) * 15 + Math.random() * 10;
      const baseMem = 45 + Math.cos(i * 0.6) * 10 + Math.random() * 5;
      data.push({
        time: timeStr,
        cpuUsage: Math.min(100, Math.max(0, Math.round(baseCpu))),
        memUsage: Math.min(100, Math.max(0, Math.round(baseMem)))
      });
    } else if (metricType === 'template') {
      const activeClaims = 200 + Math.round(Math.sin(i * 0.5) * 120 + Math.random() * 30);
      const warmPoolSize = 15 + Math.round(Math.cos(i * 0.5) * 5 + Math.random() * 3);
      const targetCapacity = 400;
      const blockedAttempts = Math.round(Math.max(0, Math.sin(i * 1.2) * 6 + Math.random() * 4));
      data.push({
        time: timeStr,
        activeClaims,
        warmPoolSize,
        targetCapacity,
        blockedAttempts
      });
    }
  }
  return data;
};


const PlatformAdminDashboard = ({ onNavigateBack, onNavigate, setRoutingHistory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'activeClaims', direction: 'desc' });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Selected Sandbox Drill-Down State
  const [selectedSandbox, setSelectedSandbox] = useState(null);

  const [copiedState, setCopiedState] = useState(false);
  const [localSliderVal, setLocalSliderVal] = useState(null);
  const [detailTab, setDetailTab] = useState('manifest'); 
  const [sandboxTab, setSandboxTab] = useState('terminal'); // 'terminal' | 'network' | 'telemetry'
  const [editableYaml, setEditableYaml] = useState('');
  const [currentDashboardTab, setCurrentDashboardTab] = useState('templates');
  const [activeKubeContext, setActiveKubeContext] = useState('');

  useEffect(() => {
    fetch('/api/kube-context')
      .then(res => res.json())
      .then(data => {
        if (data.context) setActiveKubeContext(data.context);
      })
      .catch(err => console.error('[Kube Context Fetch Error]', err));
  }, []);

  // Time window state for Sandbox details
  const [sandboxTimeWindow, setSandboxTimeWindow] = useState('1H');
  const [sandboxCustomHours, setSandboxCustomHours] = useState('12');
  const [sandboxAppliedHours, setSandboxAppliedHours] = useState(1);

  // Time window state for Template details
  const [templateTimeWindow, setTemplateTimeWindow] = useState('1H');
  const [templateCustomHours, setTemplateCustomHours] = useState('12');
  const [templateAppliedHours, setTemplateAppliedHours] = useState(1);

  const sandboxChartData = useMemo(() => {
    return generateMockTimelineData(sandboxAppliedHours, 'sandbox');
  }, [sandboxAppliedHours]);

  const templateChartData = useMemo(() => {
    return generateMockTimelineData(templateAppliedHours, 'template');
  }, [templateAppliedHours]);

  // Interventions states
  const [actionMessage, setActionMessage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null); 
  const [streamLogs, setStreamLogs] = useState([
    '[11:15:02] Info   Reconciliation daemon started monitoring namespace parameters.',
    '[11:15:45] Normal Warmpool cache reconciled completely across central compute node groups.'
  ]);

  // Simulated stdout terminal lines for a single active sandbox agent container
  const [terminalOutput, setTerminalOutput] = useState([
    '>> [SYSTEM] Initializing user-space container sandboxing shell via runsc kernel boundary...',
    '>> [SYSTEM] Mounting temporary loop volumes storage driver parameters context.',
    '>> [AGENT] Launching central reasoning neural weights framework orchestrator graph...',
    '>> [AGENT] Querying endpoint https://api.openai.com/v1/chat/completions (L7 ALLOWED)'
  ]);
  const [snapshotsList, setSnapshotsList] = useState([
    { id: 'snap-90f2a', timestamp: '2026-05-05 10:14:22', type: 'Standard', size: '420 MB', changes: 14, status: 'Ready', gcsPath: 'gs://agent-sandbox-runtime-snapshots/prod/snap-90f2a.tar.gz' },
    { id: 'snap-golden-llm', timestamp: '2026-05-04 16:22:10', type: 'Golden', size: '1.2 GB', changes: 184, status: 'Active Buffer', gcsPath: 'gs://agent-sandbox-runtime-snapshots/golden/snap-golden-llm.tar.gz' },
    { id: 'snap-hib-x892', timestamp: '2026-05-05 12:01:05', type: 'Hibernation', size: '480 MB', changes: 8, status: 'Archived', gcsPath: 'gs://agent-sandbox-runtime-snapshots/hibernation/snap-hib-x892.tar.gz' }
  ]);
  const [sandboxLifecycleMap, setSandboxLifecycleMap] = useState({
    'sb-claim-x8a9': 'Running',
    'sb-claim-y3b2': 'Running',
    'sb-claim-z7c1': 'Running',
    'sb-claim-w4d8': 'Running'
  });
  const [isOtelTracingEnabled, setIsOtelTracingEnabled] = useState(false);
  const [hibernationIdInput, setHibernationIdInput] = useState('hib-session-99ab');
  const [autoResumeSnapshotId, setAutoResumeSnapshotId] = useState('snap-golden-llm');
  const [activeDiffSnapshotId, setActiveDiffSnapshotId] = useState(null);
  const [cliInputValue, setCliInputValue] = useState('');
  const [emergencyDomainInput, setEmergencyDomainInput] = useState('untrusted-exfil-target.net');

  const otelTraceSpans = useMemo(() => {
    return [
      { spanId: '0a8b2c', name: 'gvisor:runsc_create', duration: '820ms', service: 'gke-operator', status: 'OK', time: '11:35:12.01' },
      { spanId: '1f4e9d', name: 'sandbox:init_filesystem', duration: '140ms', service: 'runtime-agent', status: 'OK', time: '11:35:12.83' },
      { spanId: '2c7a3f', name: 'agent:load_neural_weights', duration: '2100ms', service: 'llm-core', status: 'TIMEOUT_WARNING', time: '11:35:12.97' },
      { spanId: '3e8b5d', name: 'egress:enforce_l7_policy', duration: '45ms', service: 'network-shield', status: 'OK', time: '11:35:15.07' },
      { spanId: '4b9c2e', name: 'agent:http_post_openai', duration: '1420ms', service: 'llm-core', status: 'OK', time: '11:35:15.12' }
    ];
  }, []);

  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    fetch('/api/metrics/usage')
      .then(res => res.json())
      .then(json => setUsageData(json))
      .catch(err => console.error(err));
  }, []);

  // Stream simulation effect for active sandboxes text blocks terminals log lists
  useEffect(() => {
    if (selectedSandbox && sandboxTab === 'terminal') {
      const interval = setInterval(() => {
        const timeStr = new Date().toLocaleTimeString();
        const lines = [
          `>> [AGENT] Process tracking tick loaded weights constraints completely at ${timeStr}.`,
          '>> [SYSTEM] Intercepted read link call securely inside kernel sandbox abstraction layer.',
          '>> [AGENT] Performing internal iterative chain-of-thought logic graph computation steps.',
          '>> [SYSTEM] Memory block sync check reported 0 heap leakage violations.'
        ];
        setTerminalOutput(prev => [...prev, lines[Math.floor(Math.random() * lines.length)]].slice(-10));
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [selectedSandbox, sandboxTab]);

  const filteredAndSortedSandboxes = useMemo(() => {
    let items = [...sampleActiveSandboxesList];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(s => s.id.toLowerCase().includes(query) || s.template.toLowerCase().includes(query));
    }
    return items;
  }, [searchQuery]);

  const filteredAndSortedTemplates = useMemo(() => {
    let items = [...sampleAdminTemplates];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(t => t.name.toLowerCase().includes(query) || t.projectId.toLowerCase().includes(query));
    }
    if (statusFilter !== 'All') items = items.filter(t => t.status === statusFilter);
    return items;
  }, [searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const total = sampleAdminTemplates.length;
    const totalClaims = sampleAdminTemplates.reduce((acc, cur) => acc + cur.activeClaims, 0);
    const activeCount = sampleAdminTemplates.filter(t => t.status === 'Active').length;
    const degradedCount = sampleAdminTemplates.filter(t => t.status === 'Degraded').length;
    const costSum = sampleAdminTemplates.reduce((acc, cur) => acc + cur.costPerDay, 0);
    return { total, totalClaims, healthPercentage: Math.round((activeCount / total) * 100), totalCost: costSum, degradedCount };
  }, []);

  const triggerLifecycleAction = (actionName) => {
    setActionMessage(`Executing operation trigger [${actionName}]... Success.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const executeLifecycleAction = (actionId) => {
    setConfirmModal(null);
    setActionMessage(`Executing fleet operation trigger [${actionId}]... Success.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const requestActionConfirmation = (actionId) => {
    setConfirmModal({
      actionId,
      title: 'Confirm high-stakes sandbox modification',
      message: `Proceed with the requested administrative lifecycle mutation block trigger for ${actionId}?`
    });
  };

  const getYamlSpecString = (template) => {
    return `apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxTemplate
metadata:
  name: ${template.name}
  namespace: ${template.namespace}
spec:
  podTemplate:
    spec:
      runtimeClassName: gvisor
---
apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxWarmPool
metadata:
  name: ${template.name}-warmpool
  namespace: ${template.namespace}
spec:
  replicas: ${template.warmPoolSize}
  sandboxTemplateRef:
    name: ${template.name}`;
  };

  const highlightYamlSpec = (yaml) => {
    if (!yaml) return '';
    return yaml.split('\n').map((line, i) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        return (
          <div key={i} className="font-mono min-h-[18px] flex flex-wrap whitespace-pre">
            <span className="text-sandbox-cyan font-medium">{line.substring(0, colonIdx + 1)}</span>
            <span className="text-amber-300">{line.substring(colonIdx + 1)}</span>
          </div>
        );
      }
      return <div key={i} className="text-slate-400 font-mono min-h-[18px] whitespace-pre">{line}</div>;
    });
  };

  return (
    <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans selection:bg-sandbox-cyan/30 relative">
      
      {/* CONFIRMATION OVERLAYS MODAL DIALOGS */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-sandbox-surface border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 relative">
            <div className="flex items-start gap-3 border-b border-slate-850 pb-3">
              <div className="p-2 bg-sandbox-orange/10 rounded-full border border-sandbox-orange/30 text-sandbox-orange shrink-0">
                <AlertTriangle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">{confirmModal.title}</h3>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">HIGH-STAKES INTERVENTION FLOW</span>
              </div>
            </div>
            <p className="text-slate-350 text-xs leading-relaxed font-sans">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2 mt-2 text-xs font-mono">
              <button onClick={() => setConfirmModal(null)} className="px-3 py-2 rounded bg-black/20 border border-slate-850 text-slate-400 hover:text-white">Cancel</button>
              <button onClick={() => { executeLifecycleAction(confirmModal.actionId); setSelectedSandbox(null); }} className="px-4 py-2 rounded bg-sandbox-orange/20 border border-sandbox-orange/40 text-sandbox-orange font-bold hover:bg-sandbox-orange hover:text-white">Proceed with action</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alerts */}
      {actionMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-slate-900 border border-sandbox-cyan text-sandbox-cyan font-mono text-xs shadow-2xl z-45 flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> {actionMessage}
        </div>
      )}

      {/* HOISTED NAVIGATION BREADCRUMBS HEADER BAR */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50 text-xs font-mono text-slate-500 select-none w-full shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => { onNavigateBack(); setSelectedTemplate(null); setSelectedSandbox(null); }} className="text-sandbox-cyan hover:underline">Home</button>
          <ChevronRight className="h-3 w-3 text-slate-600" />
          {selectedTemplate ? (
            <>
              <button onClick={() => { setSelectedTemplate(null); setDetailTab('manifest'); }} className="text-sandbox-cyan hover:underline">Platform admin dashboard</button>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white bg-slate-800/60 px-2 py-0.5 rounded font-bold">{selectedTemplate.name}</span>
            </>
          ) : selectedSandbox ? (
            <>
              <button onClick={() => { setSelectedSandbox(null); setCurrentDashboardTab('sandboxes'); }} className="text-sandbox-cyan hover:underline">Platform admin dashboard</button>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white bg-slate-850 px-2 py-0.5 rounded font-bold font-mono">{selectedSandbox.id}</span>
            </>
          ) : (
            <span className="text-white font-bold">Platform admin dashboard</span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-slate-800 shadow-inner">
            <span className="h-2 w-2 rounded-full bg-sandbox-cyan animate-pulse" />
            <span className="text-sandbox-cyan font-bold font-mono text-[11px]">Context: {activeKubeContext || 'Loading...'}</span>
          </div>
          <span className="h-2 w-2 rounded-full bg-sandbox-green animate-pulse" />
          <span className="tracking-wider">UNIFIED OPERATIONAL CONSOLE SUITE</span>
        </div>
      </div>

      {/* HOISTED BANNER TITLE HEADER */}
      <div className="mb-8 shrink-0">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3 font-display">
          <Layers className="h-7 w-7 text-sandbox-cyan" /> 
          {selectedTemplate ? selectedTemplate.name : selectedSandbox ? selectedSandbox.id : "Platform admin dashboard"}
          {selectedSandbox && (
            <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${
              sandboxLifecycleMap[selectedSandbox.id] === 'Suspended' 
                ? 'bg-sandbox-orange/20 text-sandbox-orange border-sandbox-orange/30' 
                : sandboxLifecycleMap[selectedSandbox.id] === 'Hibernated'
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-sandbox-green/20 text-sandbox-green border-sandbox-green/30'
            }`}>
              ● {sandboxLifecycleMap[selectedSandbox.id] || 'Running'}
            </span>
          )}
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed font-sans">
          {selectedTemplate 
            ? "Granular specifications auditor and network exfiltration preventions collections metrics context." 
            : selectedSandbox 
            ? "Granular container telemetry stdout logs and Layer 7 network egress connection packets auditor."
            : "Real-time cluster metrics analyzer auditing distributed custom sandbox resource configurations and client claims volumes globally."
          }
        </p>
      </div>

      {/* TABS SELECTOR BAR FOR MAIN HUB VIEW */}
      {!selectedTemplate && !selectedSandbox && (
        <div className="flex border-b border-slate-800/60 w-full gap-4 mb-6 font-mono text-xs select-none shrink-0">
          {[
            { id: 'templates', label: 'Templates catalog', count: metrics.total },
            { id: 'sandboxes', label: 'Active claims sandboxes', count: sampleActiveSandboxesList.length }
          ].map((dTab) => {
            const isDActive = currentDashboardTab === dTab.id;
            return (
              <button
                key={dTab.id}
                onClick={() => { setCurrentDashboardTab(dTab.id); setSearchQuery(''); }}
                className={`px-4 py-2.5 border-b-2 font-bold transition-all relative cursor-pointer -mb-[2px] flex items-center gap-1.5 ${
                  isDActive 
                    ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 to-transparent font-extrabold' 
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                {dTab.label}
                <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${isDActive ? 'bg-sandbox-cyan/20 text-sandbox-cyan' : 'bg-slate-800 text-slate-400'}`}>{dTab.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ROUTER ROUTING COMPONENT CORE DRAWER SWITCHES */}
      {selectedTemplate ? (
        /* REGISTRY TEMPLATE DETAILS SUB PAGES COCKPIT VIEW */
        <div className="flex flex-col h-full animate-fade-in">
          <div className="flex items-center justify-end gap-4 mb-6 pb-3 border-b border-slate-850/40">
            <div className="flex gap-2 font-mono text-xs">
              <button onClick={() => requestActionConfirmation(`Evict and recycle pools for ${selectedTemplate.name}`)} className="px-3 py-1.5 rounded bg-sandbox-orange/10 text-sandbox-orange border border-sandbox-orange/30 font-bold hover:bg-sandbox-orange hover:text-white transition-all">Recycle pool</button>
              <button onClick={() => { setSelectedTemplate(null); setDetailTab('manifest'); }} className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all">Return to list</button>
            </div>
          </div>

          <div className="flex border-b border-slate-800/80 w-full gap-2 mb-6 font-mono text-xs select-none shrink-0">
            {[
              { id: 'manifest', label: 'Configuration & warm pool', icon: Sliders },
              { id: 'observability', label: 'Observability metrics', icon: Activity },
              { id: 'security', label: 'Security & Event streams', icon: ShieldAlert }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-all relative cursor-pointer -mb-[2px] ${
                  detailTab === tab.id 
                    ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 via-sandbox-cyan/5 to-transparent font-extrabold shadow-[inset_0_-4px_0_rgba(0,245,255,0.1)]' 
                    : 'border-transparent text-slate-500 hover:text-white hover:border-slate-700'
                }`}
              >
                <tab.icon className={`h-3.5 w-3.5 ${detailTab === tab.id ? 'text-sandbox-cyan' : 'text-slate-600'}`} /> 
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1">
            {detailTab === 'manifest' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="space-y-4 lg:col-span-1">
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block border-b border-slate-800 pb-1.5 font-bold">Adjust warmpool capacity</span>
                    <div>
                      <div className="flex justify-between items-center text-xs font-mono mb-1">
                        <span className="text-slate-450">minReplicas depth:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sandbox-cyan font-bold">{localSliderVal ?? selectedTemplate.warmPoolSize} pods</span>
                          {(localSliderVal !== null && localSliderVal !== selectedTemplate.warmPoolSize) && (
                            <button 
                              onClick={() => {
                                selectedTemplate.warmPoolSize = localSliderVal;
                                triggerLifecycleAction(`Tune minReplicas target to ${localSliderVal} pods`);
                                setLocalSliderVal(null);
                              }} 
                              className="px-1.5 py-0.5 rounded bg-sandbox-cyan text-slate-950 text-[9px] font-sans font-bold uppercase hover:bg-cyan-400 transition-colors"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={localSliderVal ?? selectedTemplate.warmPoolSize}
                        onChange={(e) => setLocalSliderVal(parseInt(e.target.value))}
                        className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-1.5" 
                      />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col shadow-xl">
                  <textarea
                    value={editableYaml || getYamlSpecString(selectedTemplate)}
                    onChange={(e) => setEditableYaml(e.target.value)}
                    rows={14}
                    className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-400 leading-relaxed focus:outline-none focus:border-sandbox-cyan/40 resize-none no-scrollbar mb-3"
                  />
                </div>
              </div>
            )}

            {detailTab === 'observability' && (
              <div className="space-y-4 max-w-5xl animate-fade-in">
                {/* Time Selection Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-black/20 p-3 border border-slate-800/60 rounded-xl text-xs font-mono w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-450 font-bold">Time Window:</span>
                    <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5 gap-0.5">
                      {['1H', '6H', '24H', '7D', 'Custom'].map((window) => (
                        <button
                          key={window}
                          onClick={() => {
                            setTemplateTimeWindow(window);
                            if (window === '1H') setTemplateAppliedHours(1);
                            if (window === '6H') setTemplateAppliedHours(6);
                            if (window === '24H') setTemplateAppliedHours(24);
                            if (window === '7D') setTemplateAppliedHours(168);
                          }}
                          className={`px-3 py-1 font-bold rounded transition-all ${
                            templateTimeWindow === window
                              ? 'bg-sandbox-cyan text-slate-950'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {window}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {templateTimeWindow === 'Custom' && (
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1 rounded-lg animate-fade-in">
                      <span className="text-slate-450">Duration:</span>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={templateCustomHours}
                        onChange={(e) => setTemplateCustomHours(e.target.value)}
                        className="w-16 bg-black border border-slate-800 rounded px-1.5 py-0.5 text-white text-center font-bold font-mono focus:outline-none focus:border-sandbox-cyan"
                      />
                      <span className="text-slate-500">hours</span>
                      <button
                        onClick={() => {
                          const hrs = parseInt(templateCustomHours);
                          if (!isNaN(hrs) && hrs > 0) {
                            setTemplateAppliedHours(hrs);
                          }
                        }}
                        className="ml-1 px-2 py-0.5 bg-sandbox-cyan/20 text-sandbox-cyan border border-sandbox-cyan/30 hover:bg-sandbox-cyan hover:text-slate-950 font-bold rounded transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* Two Telemetry Graphs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                  {/* Chart 1: Capacity depth and claims */}
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 h-[240px] flex flex-col shadow-md">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-3">Template allocation capacity & active claims depth</span>
                    <div className="flex-1 w-full h-full text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={templateChartData} margin={{ left: -35, top: 5, bottom: 0 }}>
                          <CartesianGrid stroke="#1F2937" opacity={0.3} />
                          <XAxis dataKey="time" stroke="#4B5563" />
                          <YAxis stroke="#4B5563" />
                          <ChartTooltip contentStyle={{ backgroundColor: '#090D16' }} />
                          <Area type="monotone" dataKey="targetCapacity" name="Max Capacity" stroke="#4B5563" strokeDasharray="3 3" fill="none" />
                          <Area type="monotone" dataKey="activeClaims" name="Active Claims" stroke="#9D5FF2" fill="#9D5FF2" fillOpacity={0.08} />
                          <Area type="monotone" dataKey="warmPoolSize" name="Warm Buffer Size" stroke="#2ED168" fill="#2ED168" fillOpacity={0.05} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Blocked Attempts */}
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 h-[240px] flex flex-col shadow-md">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-3">Layer 7 egress network exfiltration blocks rate</span>
                    <div className="flex-1 w-full h-full text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={templateChartData} margin={{ left: -35, top: 5, bottom: 0 }}>
                          <CartesianGrid stroke="#1F2937" opacity={0.3} />
                          <XAxis dataKey="time" stroke="#4B5563" />
                          <YAxis stroke="#4B5563" />
                          <ChartTooltip contentStyle={{ backgroundColor: '#090D16' }} cursor={false} />
                          <Bar dataKey="blockedAttempts" name="Blocked Links" fill="#F2994A" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : selectedSandbox ? (
        /* 🔴 BRAND NEW DELIVERABLE: HIGH-FIDELITY INDIVIDUAL SANDBOX CLAIMS DETAILS COCKPIT SUB-PAGE */
        <div className="flex flex-col h-full animate-fade-in">
          
          {/* SRE Action Toolbar header control row */}
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-slate-850/40">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-slate-450">
              <div>Parent Spec: <span className="text-white font-bold select-all">{selectedSandbox.template}</span></div>
              <div>GKE Cluster: <span className="text-sandbox-cyan font-bold select-all">{activeKubeContext || selectedSandbox.cluster || 'gke-us-central-c1'}</span></div>
              <div>Namespace: <span className="text-purple-400 font-bold select-all">{selectedSandbox.namespace || 'agent-runtime-prod'}</span></div>
              <div className="hidden sm:block">Isolation: <span className="text-slate-300 font-bold">{selectedSandbox.driver || 'runsc (gVisor)'}</span></div>
              <label className="flex items-center gap-1.5 bg-black/30 px-2 py-1 rounded border border-slate-800 cursor-pointer hover:border-sandbox-cyan transition-all select-none">
                <input 
                  type="checkbox" 
                  checked={isOtelTracingEnabled} 
                  onChange={(e) => {
                    setIsOtelTracingEnabled(e.target.checked);
                    triggerLifecycleAction(e.target.checked ? 'Distributed Tracing Enabled via OpenTelemetry sidecar' : 'Distributed Tracing Deactivated');
                  }}
                  className="accent-sandbox-cyan h-3 w-3" 
                />
                <span className={isOtelTracingEnabled ? 'text-sandbox-cyan font-bold text-[11px]' : 'text-slate-450 text-[11px]'}>OpenTelemetry Tracing</span>
              </label>
            </div>
            
            <div className="flex gap-2 font-mono text-xs">
              <button 
                onClick={() => {
                  const currentStatus = sandboxLifecycleMap[selectedSandbox.id] || 'Running';
                  const newStatus = currentStatus === 'Running' ? 'Suspended' : 'Running';
                  setSandboxLifecycleMap(prev => ({ ...prev, [selectedSandbox.id]: newStatus }));
                  triggerLifecycleAction(`${newStatus === 'Suspended' ? 'Suspending' : 'Resuming'} sandbox compute state, syncing state data layers`);
                }}
                className={`px-3 py-1.5 rounded font-bold border transition-all ${
                  (sandboxLifecycleMap[selectedSandbox.id] || 'Running') === 'Running'
                    ? 'bg-sandbox-orange/10 border-sandbox-orange/30 text-sandbox-orange hover:bg-sandbox-orange hover:text-white'
                    : 'bg-sandbox-green/10 border-sandbox-green/30 text-sandbox-green hover:bg-sandbox-green hover:text-slate-950'
                }`}
              >
                {(sandboxLifecycleMap[selectedSandbox.id] || 'Running') === 'Running' ? 'Suspend sandbox' : 'Resume sandbox'}
              </button>

              <button 
                onClick={() => requestActionConfirmation(`sb-evict-${selectedSandbox.id}`)}
                className="px-3 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all"
              >
                Terminate sandbox
              </button>
              <button 
                onClick={() => { setSelectedSandbox(null); setCurrentDashboardTab('sandboxes'); }}
                className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                Back to list
              </button>
            </div>
          </div>

          {/* Reimagined Observability Tab Deck for Sandbox Telemetry */}
          <div className="flex border-b border-slate-800/80 w-full gap-2 mb-6 font-mono text-xs select-none shrink-0">
            {[
              { id: 'terminal', label: 'Agent terminal stdout', icon: Terminal },
              { id: 'network', label: 'Network egress inspector', icon: Globe },
              { id: 'telemetry', label: 'Runtime telemetry graphs', icon: Activity },
              { id: 'snapshots', label: 'Snapshots & Recovery state', icon: Box }
            ].map((sTab) => {
              const isActiveS = sandboxTab === sTab.id;
              return (
                <button
                  key={sTab.id}
                  onClick={() => setSandboxTab(sTab.id)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold transition-all relative cursor-pointer -mb-[2px] ${
                    isActiveS 
                      ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 via-sandbox-cyan/5 to-transparent font-extrabold shadow-[inset_0_-4px_0_rgba(0,245,255,0.1)]' 
                      : 'border-transparent text-slate-500 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <sTab.icon className={`h-3.5 w-3.5 ${isActiveS ? 'text-sandbox-cyan' : 'text-slate-600'}`} />
                  <span>{sTab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sandbox Sub Tab Context Window Panels */}
          <div className="flex-1">
            
            {/* PANEL 1: LIVE SCROLLING STDOUT TERMINAL LOGS VIEW */}
            {sandboxTab === 'terminal' && (
              <div className="space-y-4 max-w-5xl">
                <div className="bg-black border border-slate-900/50 rounded-2xl p-4 flex flex-col shadow-2xl min-h-[340px]">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-2 mb-3 font-mono font-bold">
                    <div className="flex items-center gap-1.5"><Terminal className="h-4 w-4 text-sandbox-cyan" /> stdout / stderr active container shell log stream</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => triggerLifecycleAction('Download complete container diagnostic stdout raw text')} className="text-slate-500 hover:text-sandbox-cyan flex items-center gap-0.5 transition-colors"><Download className="h-3 w-3" /> Download</button>
                      <span className="text-sandbox-cyan animate-pulse">● CAPTURING STREAM</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 font-mono text-xs text-emerald-400 space-y-2 p-1 overflow-y-auto max-h-[200px] select-all leading-relaxed no-scrollbar mb-3">
                    {terminalOutput.map((line, index) => (
                      <div key={index} className={line.includes('SYSTEM') ? 'text-slate-500' : line.includes('CLI USER INPUT') ? 'text-amber-300 font-bold' : line.includes('L7 ALLOWED') ? 'text-cyan-400' : 'text-emerald-400'}>
                        {line}
                      </div>
                    ))}
                  </div>

                  {/* 🔴 NEW DELIVERABLE: INTERACTIVE DIAGNOSTIC SHELL INPUT PROMPT */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!cliInputValue.trim()) return;
                      setTerminalOutput(prev => [
                        ...prev, 
                        `>> [CLI USER INPUT] rajithal@sandbox-runsc:~$ ${cliInputValue}`,
                        `>> [SYSTEM RESPONSE] custom instruction execution successful: compiled process handle boundaries.`
                      ].slice(-12));
                      setCliInputValue('');
                    }}
                    className="flex items-center gap-2 bg-slate-900/60 border border-slate-850 rounded-xl px-3 py-1.5 text-xs font-mono"
                  >
                    <span className="text-sandbox-cyan font-bold shrink-0 select-none">rajithal@sandbox-runsc:~$</span>
                    <input 
                      type="text"
                      value={cliInputValue}
                      onChange={(e) => setCliInputValue(e.target.value)}
                      placeholder="Type diagnostic command shell overrides (e.g. kill -9, ps aux, ls /app) and hit Enter..."
                      className="w-full bg-transparent focus:outline-none text-white font-bold"
                    />
                  </form>
                </div>
              </div>
            )}

            {/* PANEL 2: LAYER 7 NETWORK PACKETS EGRESS INSPECTOR */}
            {sandboxTab === 'network' && (
              <div className="space-y-4 max-w-4xl animate-fade-in">
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-3 bg-black/30 font-mono text-[10px] text-slate-450 uppercase border-b border-slate-850 select-none font-bold">Connection packets exfiltration auditors logs</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead className="bg-black/20 text-slate-500 text-[10px]">
                        <tr>
                          <th className="px-4 py-2">Timestamp</th>
                          <th className="px-4 py-2">Destination domain target</th>
                          <th className="px-4 py-2">Protocol</th>
                          <th className="px-4 py-2 text-center">Security Decision</th>
                          <th className="px-4 py-2 text-right">Payload traffic</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 text-slate-300 text-[11px]">
                        {[
                          { time: '11:35:12', domain: 'api.openai.com', proto: 'HTTPS / L7', status: 'ALLOWED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', size: '12.4 KiB' },
                          { time: '11:34:45', domain: 'pypi.org', proto: 'HTTPS / L7', status: 'ALLOWED', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', size: '85.2 KiB' },
                          { time: '11:30:02', domain: 'malicious-exfil-node.cc', proto: 'TCP / Raw socket', status: 'BLOCKED', color: 'text-red-400 bg-red-500/10 border-red-500/20', size: '0 B (Dropped)' },
                          { time: '11:24:18', domain: 'arbitrary-external-ip.ru', proto: 'UDP / Blocked', status: 'BLOCKED', color: 'text-red-400 bg-red-500/10 border-red-500/20', size: '0 B (Dropped)' }
                        ].map((p, k) => (
                          <tr key={k} className="hover:bg-black/10">
                            <td className="px-4 py-2 text-slate-500">{p.time}</td>
                            <td className="px-4 py-2 text-white font-bold truncate select-all max-w-xs">{p.domain}</td>
                            <td className="px-4 py-2 text-slate-400 text-[10px]">{p.proto}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${p.color}`}>{p.status}</span>
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-slate-450">{p.size}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* 🔴 NEW DELIVERABLE: EMERGENCY OUTBOUND SECURITY POLICY INTERCEPTOR */}
                <div className="bg-slate-950 border border-slate-900/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs shadow-inner mt-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-sandbox-orange uppercase tracking-wider block">Dynamic Outbound Policy Overrides Interceptor</span>
                    <p className="text-[11px] text-slate-400 font-sans">Hot-inject emergency firewall allow/deny block rules to stop live leakage targets instantly.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input 
                      type="text"
                      value={emergencyDomainInput}
                      onChange={(e) => setEmergencyDomainInput(e.target.value)}
                      className="bg-black border border-slate-850 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-sandbox-orange w-full sm:w-56"
                      placeholder="Enter anomalous endpoint domain..."
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        triggerLifecycleAction(`Hot-injecting active firewall ban policy drop target for domain [${emergencyDomainInput}]`);
                        setEmergencyDomainInput('');
                      }}
                      className="bg-sandbox-orange/10 text-sandbox-orange border border-sandbox-orange/30 hover:bg-sandbox-orange hover:text-white font-bold px-4 py-2 rounded-lg transition-all shrink-0 shadow-sm uppercase text-[10px]"
                    >
                      Enforce Immediate Ban Policy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL 3: CONTAINER TELEMETRY TIMELINE GRAPHICS (CPU/MEM UTILIZATION %) */}
            {sandboxTab === 'telemetry' && (
              <div className="space-y-4 max-w-5xl animate-fade-in">
                {/* Time Selection Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-black/20 p-3 border border-slate-800/60 rounded-xl text-xs font-mono w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-450 font-bold">Time Window:</span>
                    <div className="flex bg-slate-950 border border-slate-850 rounded-lg p-0.5 gap-0.5">
                      {['1H', '6H', '24H', '7D', 'Custom'].map((window) => (
                        <button
                          key={window}
                          onClick={() => {
                            setSandboxTimeWindow(window);
                            if (window === '1H') setSandboxAppliedHours(1);
                            if (window === '6H') setSandboxAppliedHours(6);
                            if (window === '24H') setSandboxAppliedHours(24);
                            if (window === '7D') setSandboxAppliedHours(168);
                          }}
                          className={`px-3 py-1 font-bold rounded transition-all ${
                            sandboxTimeWindow === window
                              ? 'bg-sandbox-cyan text-slate-950'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {window}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {sandboxTimeWindow === 'Custom' && (
                    <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1 rounded-lg animate-fade-in">
                      <span className="text-slate-450">Duration:</span>
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={sandboxCustomHours}
                        onChange={(e) => setSandboxCustomHours(e.target.value)}
                        className="w-16 bg-black border border-slate-800 rounded px-1.5 py-0.5 text-white text-center font-bold font-mono focus:outline-none focus:border-sandbox-cyan"
                      />
                      <span className="text-slate-500">hours</span>
                      <button
                        onClick={() => {
                          const hrs = parseInt(sandboxCustomHours);
                          if (!isNaN(hrs) && hrs > 0) {
                            setSandboxAppliedHours(hrs);
                          }
                        }}
                        className="ml-1 px-2 py-0.5 bg-sandbox-cyan/20 text-sandbox-cyan border border-sandbox-cyan/30 hover:bg-sandbox-cyan hover:text-slate-950 font-bold rounded transition-all"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 h-[200px] flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Real-time container CPU utilization</span>
                    <div className="flex-1 w-full h-full text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sandboxChartData} margin={{ left: -35, top: 5, bottom: 0 }}>
                          <CartesianGrid stroke="#1F2937" opacity={0.3} />
                          <XAxis dataKey="time" stroke="#4B5563" />
                          <YAxis stroke="#4B5563" />
                          <ChartTooltip contentStyle={{ backgroundColor: '#090D16' }} cursor={false} />
                          <Area type="monotone" dataKey="cpuUsage" name="CPU Usage (%)" stroke="#00F5FF" fill="#00F5FF" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 h-[200px] flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Real-time container Memory utilization</span>
                    <div className="flex-1 w-full h-full text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sandboxChartData} margin={{ left: -35, top: 5, bottom: 0 }}>
                          <CartesianGrid stroke="#1F2937" opacity={0.3} />
                          <XAxis dataKey="time" stroke="#4B5563" />
                          <YAxis stroke="#4B5563" />
                          <ChartTooltip contentStyle={{ backgroundColor: '#090D16' }} cursor={false} />
                          <Area type="monotone" dataKey="memUsage" name="Memory Usage (%)" stroke="#9D5FF2" fill="#9D5FF2" fillOpacity={0.1} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {isOtelTracingEnabled && (
                  <div className="bg-black/40 border border-slate-800 rounded-xl p-4 shadow-inner mt-4 animate-fade-in w-full">
                    <div className="text-[11px] font-mono text-sandbox-cyan mb-2 font-bold uppercase tracking-wider flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-sandbox-cyan animate-ping" />
                      Distributed Tracing Spans (OpenTelemetry Core)
                    </div>
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead className="text-slate-500 border-b border-slate-850 text-[10px]">
                          <tr>
                            <th className="pb-2 px-2">Timestamp</th>
                            <th className="pb-2 px-2">Span ID</th>
                            <th className="pb-2 px-2">Operation Name</th>
                            <th className="pb-2 px-2">Microservice</th>
                            <th className="pb-2 px-2 text-right">Latency</th>
                            <th className="pb-2 px-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-300 divide-y divide-slate-900 text-[11px]">
                          {otelTraceSpans.map((span, sIdx) => (
                            <tr key={sIdx} className="hover:bg-slate-900/40">
                              <td className="py-2 px-2 text-slate-500">{span.time}</td>
                              <td className="py-2 px-2 text-slate-450 select-all">{span.spanId}</td>
                              <td className="py-2 px-2 text-white font-bold">{span.name}</td>
                              <td className="py-2 px-2 text-purple-400 text-[11px]">{span.service}</td>
                              <td className="py-2 px-2 text-right font-bold text-amber-300">{span.duration}</td>
                              <td className="py-2 px-2 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                  span.status.includes('WARNING')
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}>
                                  {span.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {sandboxTab === 'snapshots' && (
              <div className="space-y-6 max-w-5xl animate-fade-in w-full">
                
                {/* 🔴 NEW DELIVERABLE: GKE POD SNAPSHOT & STORAGE CRD READINESS CHECKS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl shadow-inner text-xs font-mono">
                  <div className="flex flex-col gap-1 border-r border-slate-850 pr-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Snapshots API Bound</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-sandbox-green animate-pulse" />
                      <span className="text-white font-extrabold font-mono">GKE Native Pod Snapshots</span>
                    </div>
                    <span className="text-[9px] text-slate-450 mt-0.5">Status: Cluster Capability Verified</span>
                  </div>
                  <div className="flex flex-col gap-1 border-r border-slate-850 px-2">
                    <span className="text-[10px] font-bold text-sandbox-cyan uppercase">PodSnapshotStorageConfig</span>
                    <span className="text-white font-bold mt-0.5 select-all">pssc-prod-backup-config</span>
                    <span className="text-[9px] text-sandbox-cyan bg-sandbox-cyan/5 border border-sandbox-cyan/20 px-1.5 py-0.5 rounded mt-1 w-fit truncate max-w-xs select-all">gs://agent-sandbox-runtime-snapshots</span>
                  </div>
                  <div className="flex flex-col gap-1 pl-2">
                    <span className="text-[10px] font-bold text-purple-400 uppercase">PodSnapshotPolicy Schedule</span>
                    <span className="text-white font-bold mt-0.5">psp-replicate-hourly-keep24</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Retention: 24 Checkpoints Max</span>
                  </div>
                </div>

                {/* Top row action bar for capturing snapshots */}
                <div className="flex flex-wrap justify-between items-center gap-4 bg-black/20 p-4 border border-slate-800 rounded-xl shadow-md w-full">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white uppercase font-mono">State Capture Replication Engine</div>
                    <p className="text-[11px] text-slate-400 font-sans">Freeze running memory contexts to establish warm rehydration footprints.</p>
                  </div>
                  <div className="flex gap-2 font-mono text-xs">
                    <button 
                      onClick={() => {
                        const rId = Math.random().toString(36).substring(2, 7);
                        const newSnap = {
                          id: `snap-manual-${rId}`,
                          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                          type: 'Standard',
                          size: '512 MB',
                          changes: 12,
                          status: 'Ready',
                          gcsPath: `gs://agent-sandbox-runtime-snapshots/prod/snap-manual-${rId}.tar.gz`
                        };
                        setSnapshotsList(prev => [newSnap, ...prev]);
                        triggerLifecycleAction('Capturing hot runtime memory snapshot checkpoint');
                      }}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-300 font-semibold transition-colors"
                    >
                      Take Snapshot
                    </button>
                    <button 
                      onClick={() => {
                        const rId = Math.random().toString(36).substring(2, 7);
                        const newSnap = {
                          id: `snap-golden-${rId}`,
                          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                          type: 'Golden',
                          size: '1.1 GB',
                          changes: 45,
                          status: 'Hydrating Pool',
                          gcsPath: `gs://agent-sandbox-runtime-snapshots/golden/snap-golden-${rId}.tar.gz`
                        };
                        setSnapshotsList(prev => [newSnap, ...prev]);
                        triggerLifecycleAction('Capturing state as Persistent Golden Snapshot for cluster pools replication');
                      }}
                      className="px-3 py-1.5 rounded bg-sandbox-cyan/10 text-sandbox-cyan border border-sandbox-cyan/30 font-bold hover:bg-sandbox-cyan hover:text-slate-950 transition-colors"
                    >
                      Capture Golden Snapshot
                    </button>
                  </div>
                </div>

                {/* Snapshot lists table */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl overflow-hidden shadow-lg w-full">
                  <div className="p-3 bg-black/20 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-850 select-none font-bold">
                    Available Snapshots Repository List ({snapshotsList.length})
                  </div>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead className="bg-black/10 text-slate-500 text-[10px] select-none">
                        <tr>
                          <th className="px-4 py-2.5">Snapshot Identifier ID</th>
                          <th className="px-4 py-2.5">Timestamp Captured</th>
                          <th className="px-4 py-2.5">Type Classification</th>
                          <th className="px-4 py-2.5">Virtual Size</th>
                          <th className="px-4 py-2.5 text-sandbox-cyan">GCS Target Reference</th>
                          <th className="px-4 py-2.5">Filesystem Diffs</th>
                          <th className="px-4 py-2.5">Deployment Status</th>
                          <th className="px-4 py-2.5 text-right">Actions / Orchestration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/60 text-slate-300 text-[11px]">
                        {snapshotsList.map((snap, sK) => {
                          const isExpanded = activeDiffSnapshotId === snap.id;
                          return (
                            <React.Fragment key={sK}>
                              <tr className={`hover:bg-black/10 transition-all ${isExpanded ? 'bg-slate-900/30' : ''}`}>
                                <td className="px-4 py-2.5 text-white font-bold select-all">{snap.id}</td>
                                <td className="px-4 py-2.5 text-slate-450">{snap.timestamp}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                                    snap.type === 'Golden' 
                                      ? 'bg-sandbox-cyan/10 border-sandbox-cyan/20 text-sandbox-cyan'
                                      : snap.type === 'Hibernation'
                                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                      : 'bg-slate-800 border-slate-700 text-slate-400'
                                  }`}>
                                    {snap.type}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-slate-300 font-semibold">{snap.size}</td>
                                <td className="px-4 py-2.5">
                                  <span className="text-[10px] text-slate-450 font-mono bg-black/45 border border-slate-850/80 px-2 py-0.5 rounded block truncate max-w-[180px] select-all" title={snap.gcsPath || 'gs://agent-sandbox-runtime-snapshots/default'}>
                                    {snap.gcsPath || `gs://agent-sandbox-runtime-snapshots/manual/${snap.id}.tar.gz`}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <button 
                                    onClick={() => setActiveDiffSnapshotId(isExpanded ? null : snap.id)}
                                    className="text-amber-300 hover:underline text-left block font-bold"
                                  >
                                    +{snap.changes || 8} files {isExpanded ? '▲ Hide' : '▼ Inspect Diffs'}
                                  </button>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="text-slate-450 flex items-center gap-1 text-[10px]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-sandbox-green" /> {snap.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-right flex justify-end gap-1.5 items-center">
                                  <button 
                                    onClick={() => triggerLifecycleAction(`Hydrating warm pool and spawning new sandbox instance from snapshot [${snap.id}]`)}
                                    className="px-2.5 py-1 rounded bg-sandbox-cyan/10 text-sandbox-cyan border border-sandbox-cyan/20 hover:bg-sandbox-cyan hover:text-slate-950 text-[10px] font-bold transition-all shadow-sm"
                                  >
                                    Initialize
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Expanded Sub-Row State Diff Browser Container */}
                              {isExpanded && (
                                <tr className="bg-slate-950/60 border-y border-slate-850 animate-fade-in">
                                  <td colSpan={8} className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                                      
                                      {/* Left Column: Filesystem Volumetric Changes */}
                                      <div className="bg-black/40 border border-slate-850 rounded-xl p-3">
                                        <span className="text-[10px] font-bold text-amber-400 uppercase block mb-2 tracking-wider border-b border-slate-900 pb-1">
                                          Filesystem Changes Layer Audit Log
                                        </span>
                                        <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-[11px] pr-1">
                                          <div className="flex justify-between"><span className="text-slate-500 font-bold">/app/neural_weights.bin</span><span className="text-amber-300 bg-amber-500/10 px-1 rounded">Modified [840 MiB]</span></div>
                                          <div className="flex justify-between"><span className="text-slate-500 font-bold">/var/log/agent_reasoning.log</span><span className="text-amber-300 bg-amber-500/10 px-1 rounded">Modified [+4.2 KiB]</span></div>
                                          <div className="flex justify-between"><span className="text-slate-500 font-bold">/tmp/sandbox_context_state.json</span><span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">Added [24 KiB]</span></div>
                                          <div className="flex justify-between"><span className="text-slate-500 font-bold">/app/src/main_agent.pyc</span><span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">Added [140 KiB]</span></div>
                                          <div className="flex justify-between"><span className="text-slate-500 font-bold">/tmp/.runsc_lock</span><span className="text-red-400 bg-red-500/10 px-1 rounded">Deleted</span></div>
                                        </div>
                                      </div>

                                      {/* Right Column: Port Connection Socket Mappings */}
                                      <div className="bg-black/40 border border-slate-850 rounded-xl p-3">
                                        <span className="text-[10px] font-bold text-sandbox-cyan uppercase block mb-2 tracking-wider border-b border-slate-900 pb-1">
                                          Active Isolated Socket Connection Port Mappings
                                        </span>
                                        <div className="space-y-2 text-[11px]">
                                          <div className="flex items-start justify-between gap-2 bg-slate-900/40 p-1.5 border border-slate-850 rounded">
                                            <div>
                                              <span className="text-white font-bold">Port 8080 (TCP)</span>
                                              <p className="text-[10px] text-slate-450 mt-0.5">Internal Web server layer & reasoning graphs stream</p>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px]">ACTIVE LISTEN</span>
                                          </div>
                                          <div className="flex items-start justify-between gap-2 bg-slate-900/40 p-1.5 border border-slate-850 rounded">
                                            <div>
                                              <span className="text-white font-bold">Port 50051 (gRPC)</span>
                                              <p className="text-[10px] text-slate-450 mt-0.5">OpenTelemetry distributed metrics sync boundary</p>
                                            </div>
                                            <span className="px-1.5 py-0.5 rounded bg-sandbox-cyan/10 text-sandbox-cyan border border-sandbox-cyan/20 font-bold text-[9px]">ROUTED EGRESS</span>
                                          </div>
                                        </div>
                                      </div>

                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Targeted Hibernation & Auto-Resume Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start w-full">
                  {/* Hibernation Panel */}
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3 shadow-md w-full">
                    <div className="text-[11px] font-mono font-bold uppercase text-purple-400 border-b border-slate-850 pb-1.5">
                      Targeted Hibernation Enclosure
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Suspend compute processes immediately and dump memory buffers to disk mapped to a unique retrieval handle token for persistent long-term storage offloading.
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500">Unique Hibernation Session Identifier Token:</span>
                      <input 
                        type="text"
                        value={hibernationIdInput}
                        onChange={(e) => setHibernationIdInput(e.target.value)}
                        className="bg-black border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-purple-500 w-full"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        setSandboxLifecycleMap(prev => ({ ...prev, [selectedSandbox.id]: 'Hibernated' }));
                        const newSnap = {
                          id: hibernationIdInput,
                          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                          type: 'Hibernation',
                          size: '490 MB',
                          changes: 4,
                          status: 'Hibernated'
                        };
                        setSnapshotsList(prev => [newSnap, ...prev]);
                        triggerLifecycleAction(`Offloading session sandbox to hibernation handle block ID: ${hibernationIdInput}`);
                      }}
                      className="w-full py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white font-bold text-xs rounded-lg font-mono transition-all shadow-sm"
                    >
                      Hibernate Session Custom ID
                    </button>
                  </div>

                  {/* Efficient Auto-Resume Configuration Panel */}
                  <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col gap-3 shadow-md w-full">
                    <div className="text-[11px] font-mono font-bold uppercase text-sandbox-cyan border-b border-slate-850 pb-1.5">
                      Efficient Auto-Resume Protocol Config
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      Configure rapid rehydration bindings. When the agent returns from sleep or wakes via automated trigger, it skips baseline boots and resumes from the chosen target reference.
                    </p>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500">Default Hydration Snapshot Anchor:</span>
                      <select 
                        value={autoResumeSnapshotId}
                        onChange={(e) => setAutoResumeSnapshotId(e.target.value)}
                        className="bg-black border border-slate-800 rounded-lg p-2 text-xs font-mono text-sandbox-cyan focus:outline-none focus:border-sandbox-cyan w-full cursor-pointer"
                      >
                        {snapshotsList.map((snap, index) => (
                          <option key={index} value={snap.id}>{snap.id} ({snap.type})</option>
                        ))}
                      </select>
                    </div>
                    <div className="p-2.5 bg-black/20 border border-slate-850 rounded-lg font-mono text-[10px] text-slate-400 w-full select-none">
                      <div className="flex justify-between">
                        <span>Resume Fast Path Target:</span>
                        <span className="text-white font-bold">Enforced</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span>Estimated Warm Bootup Time:</span>
                        <span className="text-sandbox-green font-bold">&lt; 1.8 seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CONSOLE HUB DATA TABLES SPLIT GRIDS (BASE HUD WORKSPACE LIST VIEW) */
        <div>
          {/* Interventions Controls */}
          <div className="bg-sandbox-surface border border-slate-800/60 p-4 rounded-xl mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md relative overflow-hidden shrink-0">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sandbox-orange" />
            <div className="space-y-1">
              <h3 className="text-xs font-display text-white font-bold flex items-center gap-1.5">
                <SlidersHorizontal className="h-4 w-4 text-sandbox-orange" /> Fleet control interventions center
              </h3>
              <p className="text-[11px] text-slate-450 max-w-xl leading-normal font-sans">
                Mutate operational cluster states presets globally. All lifecycle actions trigger safety validation checks confirmation flows before dispatching.
              </p>
            </div>
            <div className="flex gap-2 text-xs font-mono w-full md:w-auto justify-end shrink-0">
              <button onClick={() => requestActionConfirmation('reconcile')} className="px-3 py-2 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all">Force reconcile fleet</button>
              <button onClick={() => requestActionConfirmation('recycle')} className="px-3 py-2 rounded bg-sandbox-orange/10 border border-sandbox-orange/30 text-sandbox-orange font-bold hover:bg-sandbox-orange hover:text-white transition-all">Recycle capacity pools</button>
            </div>
          </div>

          {/* MAPPING ACCORDING TO PRIMARY CONSOLE LINK TAB */}
          {currentDashboardTab === 'templates' ? (
            <div className="animate-fade-in">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
                {[
                  { label: 'Registered models', val: metrics.total, sub: '✔ 100% spec compliance', tooltip: 'Total number of unique sandbox environment template models registered in this project context.' },
                  { label: 'Total active claims', val: metrics.totalClaims, sub: `Overhead spend: $${metrics.totalCost.toFixed(2)}/day`, tooltip: 'Sum of all currently alive, isolated infrastructure environment containers active across clusters.' },
                  { label: 'Fleet health ratio', val: `${metrics.healthPercentage}%`, sub: 'Autopilot nodes secure', tooltip: 'Percentage of sandboxes currently running in a perfectly active, non-degraded lifecycle phase.' },
                  { label: 'Degraded specs', val: metrics.degradedCount, sub: metrics.degradedCount > 0 ? 'Action required' : 'Nodes reconciled perfectly', tooltip: 'Number of custom resource definition template configurations currently reporting reconciliation errors.' }
                ].map((c, i) => (
                  <div key={i} className="bg-sandbox-surface/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative group hover:border-slate-750 transition-all shadow-lg">
                    <div>
                      <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
                        <div className="relative flex items-center gap-1 group/tooltip">
                          <span>{c.label}</span>
                          <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80">
                            {c.tooltip}
                          </div>
                        </div>
                      </div>
                      <div className={`text-2xl font-black font-mono tracking-tight ${i === 1 ? 'text-sandbox-violet' : i === 2 ? 'text-sandbox-green' : i === 3 && metrics.degradedCount > 0 ? 'text-sandbox-orange' : 'text-white'}`}>
                        {c.val}
                      </div>
                    </div>
                    <div className={`text-[9px] font-mono mt-2 border-t border-slate-800/40 pt-1 ${i === 1 ? 'text-sandbox-orange font-bold' : 'text-slate-500'}`}>
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Popularity Chart */}
              <div className="bg-sandbox-surface/50 border border-slate-800/60 rounded-xl p-4 mb-6 shadow-xl h-[160px] flex flex-col shrink-0">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-2">Template popularity spectrum</div>
                <div className="flex-1 w-full h-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData?.popularity || []} margin={{ left: -35 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#4B5563" />
                      <YAxis stroke="#4B5563" />
                      <ChartTooltip contentStyle={{ backgroundColor: '#090D16' }} cursor={false} />
                      <Bar dataKey="sandboxes" fill="#00F5FF" radius={[3,3,0,0]}>
                        {(usageData?.popularity || []).map((entry, index) => <BarCell key={`cell-${index}`} fill={['#00F5FF', '#9D5FF2', '#2ED168', '#F2994A'][index % 4]} opacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Filter field */}
              <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-3 mb-6 shadow-md shrink-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter templates registry by model name, project cluster ID..." className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono" />
                </div>
              </div>

              {/* Grid Data Table List */}
              <div className="bg-sandbox-surface/90 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/50 border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="w-8 px-3 py-2 text-center"></th>
                        <th className="px-3 py-2">Template name</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2">Project ID</th>
                        <th className="px-3 py-2 text-right">Active claims</th>
                        <th className="px-3 py-2 text-slate-500">Location</th>
                        <th className="px-3 py-2 text-right text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-sans text-slate-300">
                      {filteredAndSortedTemplates.map((template) => (
                        <tr key={template.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/40">
                          <td className="px-2 py-2.5 text-center text-slate-500">▼</td>
                          <td className="px-3 py-2.5 font-bold text-white">{template.name}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{template.status}</span>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-400">{template.projectId}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-white font-bold">{template.activeClaims}</td>
                          <td className="px-3 py-2.5 text-sandbox-cyan font-mono text-[11px] font-bold">{activeKubeContext || template.cluster}</td>
                          <td className="px-3 py-2.5 text-right">
                            <button onClick={() => { setSelectedTemplate(template); setEditableYaml(getYamlSpecString(template)); }} className="text-[11px] text-sandbox-cyan hover:underline font-mono font-bold">View details ➔</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE CLAIMS SANDBOXES DATAGRID WORKSPACE HUB LIST */
            <div className="animate-fade-in space-y-4">
              <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-3 shadow-md">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter active claims by container sandbox ID or template..." className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono" />
                </div>
              </div>

              <div className="bg-sandbox-surface/90 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/50 border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Sandbox claim ID</th>
                        <th className="px-4 py-2.5">Template runtime</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5">Compute Quota</th>
                        <th className="px-4 py-2.5">Cluster scope</th>
                        <th className="px-4 py-2.5 font-mono text-slate-500 text-right">Lifespan remaining</th>
                        <th className="px-4 py-2.5 text-right text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300 text-[11px]">
                      {filteredAndSortedSandboxes.map((sandbox) => (
                        <tr key={sandbox.id} className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/40">
                          <td className="px-4 py-2.5 font-bold text-white flex items-center gap-1.5"><Box className="h-3.5 w-3.5 text-sandbox-cyan" /> {sandbox.id}</td>
                          <td className="px-4 py-2.5 font-sans font-semibold text-slate-300">{sandbox.template}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 text-[10px]">{sandbox.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-400">{sandbox.cpu} / {sandbox.memory}</td>
                          <td className="px-4 py-2.5 text-sandbox-cyan font-mono text-xs font-bold">{activeKubeContext || sandbox.cluster}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-bold">{sandbox.elapsed}</td>
                          <td className="px-4 py-2.5 text-right">
                            <button 
                              onClick={() => setSelectedSandbox(sandbox)}
                              className="px-2.5 py-1 rounded bg-sandbox-cyan/10 border border-sandbox-cyan/30 text-sandbox-cyan hover:bg-sandbox-cyan hover:text-slate-950 text-[10px] font-sans font-bold transition-all shadow-sm cursor-pointer"
                            >
                              View details ➔
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformAdminDashboard;
