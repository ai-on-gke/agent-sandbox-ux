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
  CheckCircle,
  Globe,
  Radio,
  Download,
  Sun,
  Moon,
  Pause,
  Play,
  Trash2
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
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

const sampleScatterData = [
    { name: 'minReplicas: 50 (Over-Provisioned)', cost: 85, latency: 0.4, size: 80, type: 'waste' },
    { name: 'minReplicas: 20 (Optimal Target)', cost: 42, latency: 0.9, size: 100, type: 'optimal' },
    { name: 'minReplicas: 0 (Cold starts)', cost: 5, latency: 12.6, size: 80, type: 'danger' },
    { name: 'minReplicas: 10 (Low depth)', cost: 22, latency: 4.5, size: 80, type: 'danger' },
    { name: 'minReplicas: 35 (High buffer)', cost: 65, latency: 0.6, size: 80, type: 'waste' }
];

const sampleAdminTemplates = [
  { 
    id: 'python-agent-runner', 
    name: 'python-agent-runner', 
    status: 'Active', 
    projectId: 'gke-ai-eco-dev', 
    activeClaims: 450, 
    warmPoolSize: 20, 
    isolation: 'gVisor (runsc)',
    cluster: 'barkland-brust',
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
    projectId: 'gke-ai-eco-dev', 
    activeClaims: 120, 
    warmPoolSize: 10, 
    isolation: 'gVisor (runsc)',
    cluster: 'barkland-brust',
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
    projectId: 'gke-ai-eco-dev', 
    activeClaims: 85, 
    warmPoolSize: 5, 
    isolation: 'gVisor (runsc)',
    cluster: 'barkland-brust',
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
  { id: 'sb-claim-x8a9', template: 'python-agent-runner', status: 'Running', cluster: 'barkland-brust', namespace: 'agent-runtime-prod', cpu: '0.4 Core', memory: '1.1 GiB', elapsed: '14m active', remaining: '46m', driver: 'runsc', priority: 'Critical-Agent' },
  { id: 'sb-claim-y3b2', template: 'python-agent-runner', status: 'Running', cluster: 'barkland-brust', namespace: 'agent-runtime-prod', cpu: '0.8 Core', memory: '2.4 GiB', elapsed: '45m active', remaining: '15m', driver: 'runsc', priority: 'Standard' },
  { id: 'sb-claim-z7c1', template: 'node-sandbox-executor', status: 'Ready', cluster: 'barkland-brust', namespace: 'agent-workers-node', cpu: '0.2 Core', memory: '512 MiB', elapsed: '2m active', remaining: '58m', driver: 'runsc', priority: 'Standard' },
  { id: 'sb-claim-w4d8', template: 'golang-crd-validator', status: 'Running', cluster: 'barkland-brust', namespace: 'crd-validators', cpu: '0.5 Core', memory: '1.0 GiB', elapsed: '1.2h active', remaining: '2.8h', driver: 'runsc', priority: 'Critical-Agent' }
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
  const [optimizerMinReplicas, setOptimizerMinReplicas] = useState(20);
  const [optimizerIppr, setOptimizerIppr] = useState(5);
  const [isEgressLockedDown, setIsEgressLockedDown] = useState(false);
  const [selectedSandboxIds, setSelectedSandboxIds] = useState(new Set());
  const [gpuQuotaUsedOverride, setGpuQuotaUsedOverride] = useState(null);
  const [tteOverride, setTteOverride] = useState(null);
  const [zombieCountOverride, setZombieCountOverride] = useState(null);
  const [isTemplateQuarantined, setIsTemplateQuarantined] = useState(false);
  const [selectedMapRegion, setSelectedMapRegion] = useState(null);
  const [usWestStatusOverride, setUsWestStatusOverride] = useState(null);

  useEffect(() => {
    if (selectedTemplate) {
      setOptimizerMinReplicas(selectedTemplate.warmPoolSize || 20);
      setIsEgressLockedDown(false);
      setIsTemplateQuarantined(false);
    }
  }, [selectedTemplate]);

  const [detailTab, setDetailTab] = useState('manifest'); 
  const [sandboxTab, setSandboxTab] = useState('terminal'); // 'terminal' | 'network' | 'telemetry'
  const [editableYaml, setEditableYaml] = useState('');
  const [currentDashboardTab, setCurrentDashboardTab] = useState('dashboard');
  const [globalTimeWindow, setGlobalTimeWindow] = useState('6H');
  const [isHpaEnabled, setIsHpaEnabled] = useState(true);
  const [isKedaEnabled, setIsKedaEnabled] = useState(false);
  const [isEvictionEnabled, setIsEvictionEnabled] = useState(true);

  const fleetHistoryData = useMemo(() => {
    const baseVal = 450;
    const points = 10;
    return Array.from({ length: points }, (_, i) => ({
      val: baseVal + Math.sin(i * 0.8) * 35 + Math.cos(i * 0.5) * 10 + Math.random() * 5
    }));
  }, [globalTimeWindow]);

  const latencyHistoryData = useMemo(() => {
    const points = 10;
    return Array.from({ length: points }, (_, i) => ({
      val: 1.2 + Math.sin(i * 1.1) * 0.15 + Math.random() * 0.05
    }));
  }, [globalTimeWindow]);

  const throughputHistoryData = useMemo(() => {
    const points = 10;
    return Array.from({ length: points }, (_, i) => ({
      val: 142 + Math.cos(i * 0.7) * 18 + Math.random() * 4
    }));
  }, [globalTimeWindow]);

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
    { id: 'snap-90f2a', timestamp: '2026-05-05 10:14:22', type: 'Standard', size: '420 MB', changes: 14, status: 'Ready', gcsPath: 'gs://agent-sandbox-runtime-snapshots/prod/snap-90f2a.tar.gz', baseSecure: 'v2.4.1 Base (Secure)' },

    { id: 'snap-hib-x892', timestamp: '2026-05-05 12:01:05', type: 'Hibernation', size: '480 MB', changes: 8, status: 'Archived', gcsPath: 'gs://agent-sandbox-runtime-snapshots/hibernation/snap-hib-x892.tar.gz', baseSecure: 'v2.3.0 Base (CVE Alert ⚠️)' }
  ]);
  const [sandboxLifecycleMap, setSandboxLifecycleMap] = useState({
    'sb-claim-x8a9': 'Running',
    'sb-claim-y3b2': 'Running',
    'sb-claim-z7c1': 'Running',
    'sb-claim-w4d8': 'Running'
  });
  const [isOtelTracingEnabled, setIsOtelTracingEnabled] = useState(false);
  const [hibernationIdInput, setHibernationIdInput] = useState('hib-session-99ab');
  const [autoResumeSnapshotId, setAutoResumeSnapshotId] = useState('snap-90f2a');
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

  const heroMetrics = useMemo(() => {
    const totalTemplates = sampleAdminTemplates.length;
    const totalSandboxes = sampleAdminTemplates.reduce((acc, cur) => acc + cur.activeClaims, 0);
    const inUse = Math.round(totalSandboxes * 0.91);
    const warm = Math.round(totalSandboxes * 0.06);
    const pending = Math.round(totalSandboxes * 0.02);
    const error = totalSandboxes - inUse - warm - pending;

    const gpuUsed = gpuQuotaUsedOverride !== null ? gpuQuotaUsedOverride : 320;
    const gpuPercent = Math.round((gpuUsed / 500) * 100);

    return {
      efficiency: {
        templates: totalTemplates,
        sandboxes: totalSandboxes,
        inUse,
        warm,
        pending,
        error
      },
      quota: {
        cpu: { used: 1240, total: 1600, percent: 78 },
        gpu: { used: gpuUsed, total: 500, percent: gpuPercent },
        memory: { used: 4.1, total: 5.0, percent: 82, unit: 'TiB' }
      },
      latency: {
        avgCreation: '1.2s',
        warmStart: '400ms',
        coldInstantiation: '14.5s',
        warmHitRatio: '94.2%'
      },
      throughput: {
        total: '142 / min',
        warm: '134 / min',
        cold: '8 / min'
      }
    };
  }, [gpuQuotaUsedOverride]);

  const triggerLifecycleAction = (actionName) => {
    setActionMessage(`Executing operation trigger [${actionName}]... Success.`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const executeLifecycleAction = (actionId) => {
    setConfirmModal(null);
    if (actionId.includes('Activate ZERO-EGRESS')) {
      setIsEgressLockedDown(true);
    }
    if (actionId.includes('Re-route us-west1 pending allocations')) {
      setUsWestStatusOverride('Optimal');
    }
    if (actionId.includes('Enforce zero-trust emergency quarantine policy')) {
      setIsTemplateQuarantined(true);
    }
    if (actionId.includes('Opt-out warm pools to reclaim')) {
      setGpuQuotaUsedOverride(240);
      setTteOverride('TTE: Stable');
    }
    if (actionId.includes('Evict and recycle all 3 idle zombie sandboxes')) {
      setSandboxLifecycleMap(prev => ({
        ...prev,
        'sb-claim-x8a9': 'Terminated',
        'sb-claim-y3b2': 'Terminated',
        'sb-claim-z7c1': 'Terminated'
      }));
    }
    if (actionId.startsWith('bulk-suspend-')) {
      const ids = actionId.replace('bulk-suspend-', '').split(',');
      ids.forEach(id => {
        setSandboxLifecycleMap(prev => ({ ...prev, [id]: 'Suspended' }));
      });
      setSelectedSandboxIds(new Set());
    }
    if (actionId.startsWith('bulk-terminate-')) {
      const ids = actionId.replace('bulk-terminate-', '').split(',');
      ids.forEach(id => {
        setSandboxLifecycleMap(prev => ({ ...prev, [id]: 'Terminated' }));
      });
      setSelectedSandboxIds(new Set());
    }
    if (actionId.startsWith('sb-evict-')) {
      const id = actionId.replace('sb-evict-', '');
      setSandboxLifecycleMap(prev => ({ ...prev, [id]: 'Terminated' }));
    }
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
      runtimeClassName: isolated-runtime
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
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">{confirmModal.title}</h3>
                <span className="text-[10px] font-mono text-slate-500 block mt-0.5">HIGH-STAKES INTERVENTION FLOW</span>
              </div>
            </div>
            <p className="text-slate-350 text-xs leading-relaxed font-sans">{confirmModal.message}</p>
            <div className="flex items-center justify-end gap-2 mt-2 text-xs font-mono">
              <button onClick={() => setConfirmModal(null)} className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all">Cancel</button>
              <button onClick={() => { executeLifecycleAction(confirmModal.actionId); setSelectedSandbox(null); }} className="px-4 py-2 rounded bg-sandbox-cyan text-slate-950 font-bold hover:bg-cyan-400 transition-all">Proceed with action</button>
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
              <button onClick={() => { setSelectedTemplate(null); setDetailTab('manifest'); }} className="text-sandbox-cyan hover:underline">Dashboard</button>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white bg-slate-800/60 px-2 py-0.5 rounded font-bold">{selectedTemplate.name}</span>
            </>
          ) : selectedSandbox ? (
            <>
              <button onClick={() => { setSelectedSandbox(null); setCurrentDashboardTab('sandboxes'); }} className="text-sandbox-cyan hover:underline">Dashboard</button>
              <ChevronRight className="h-3 w-3 text-slate-600" />
              <span className="text-white bg-slate-850 px-2 py-0.5 rounded font-bold font-mono">{selectedSandbox.id}</span>
            </>
          ) : (
            <span className="text-white font-bold">Dashboard</span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-slate-800 shadow-inner">
            <span className="text-sandbox-cyan font-bold font-mono text-[11px]">Context: {activeKubeContext || 'Loading...'}</span>
          </div>
        </div>
      </div>

      {/* HOISTED BANNER TITLE HEADER */}
      <div className="mb-8 shrink-0">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3 font-display">
          <Layers className="h-7 w-7 text-sandbox-cyan" /> 
          {selectedTemplate ? selectedTemplate.name : selectedSandbox ? selectedSandbox.id : "Dashboard"}
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

      </div>

      {/* TABS SELECTOR BAR FOR MAIN HUB VIEW */}
      {!selectedTemplate && !selectedSandbox && (
        <div className="flex border-b border-slate-800 w-full gap-8 mb-8 select-none shrink-0 overflow-x-auto no-scrollbar relative">
          {[
            { id: 'dashboard', label: 'Dashboard', count: null },
            { id: 'templates', label: 'Templates catalog', count: metrics.total },
            { id: 'sandboxes', label: 'Active claims sandboxes', count: sampleActiveSandboxesList.length },
            { id: 'snapshots', label: 'Available snapshots', count: snapshotsList.length }
          ].map((dTab) => {
            const isDActive = currentDashboardTab === dTab.id;
            return (
              <button
                key={dTab.id}
                onClick={() => { setCurrentDashboardTab(dTab.id); setSearchQuery(''); }}
                className={`px-5 py-3 border-b-2 font-bold transition-all relative cursor-pointer whitespace-nowrap -mb-[2px] ${
                  isDActive 
                    ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 via-sandbox-cyan/5 to-transparent font-extrabold shadow-[inset_0_-4px_0_rgba(0,245,255,0.1)]' 
                    : 'border-transparent text-slate-500 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{dTab.label}</span>
                {dTab.count !== null && (
                  <span className={`font-mono text-xs font-extrabold ${isDActive ? 'text-sandbox-cyan' : 'text-slate-500'}`}>
                    [{dTab.count}]
                  </span>
                )}
                
                {/* Architectural crisp bottom indicator line */}
                {isDActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-sandbox-cyan rounded-full z-10 animate-fade-in" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ROUTER ROUTING COMPONENT CORE DRAWER SWITCHES */}
      {selectedTemplate ? (
        /* REGISTRY TEMPLATE DETAILS SUB PAGES VIEW */
        <div className="flex flex-col h-full animate-fade-in">
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-slate-850/40">
            <div className="text-xs font-mono text-slate-450">
              Sandbox Template Details: <span className="text-white font-bold select-all">{selectedTemplate.name}</span>
            </div>
            <div className="flex gap-2 font-mono text-xs">
              <button 
                onClick={() => {
                  if (isTemplateQuarantined) {
                    setIsTemplateQuarantined(false);
                    setActionMessage(`Quarantine policy lifted for ${selectedTemplate.name}... Restoring GKE scheduler.`);
                    setTimeout(() => setActionMessage(null), 4000);
                  } else {
                    requestActionConfirmation(`Enforce zero-trust emergency quarantine policy on GKE template ${selectedTemplate.name}`);
                  }
                }} 
                className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer border ${
                  isTemplateQuarantined 
                    ? 'bg-sandbox-green/10 border-sandbox-green/30 text-sandbox-green hover:text-white' 
                    : 'bg-red-950/20 border-red-900/30 text-red-400 hover:text-white'
                }`}
              >
                {isTemplateQuarantined ? 'Lift Quarantine' : 'Quarantine Template'}
              </button>
              <button onClick={() => requestActionConfirmation(`Evict and recycle pools for ${selectedTemplate.name}`)} className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all font-bold">Recycle pool</button>
              <button onClick={() => { setSelectedTemplate(null); setDetailTab('overview'); }} className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all">Return to list</button>
            </div>
          </div>

          {/* Emergency Quarantine active banner */}
          {isTemplateQuarantined && (
            <div className="mb-6 p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-start gap-3 select-none animate-fade-in shadow-lg shadow-red-950/10">
              <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
              <div className="font-mono text-xs">
                <strong className="text-white block">⚠️ EMERGENCY TEMPLATE QUARANTINE ACTIVE</strong>
                <span className="text-slate-300 leading-relaxed">New GKE orchestrator sandbox claims for template <strong className="text-white">{selectedTemplate.name}</strong> are disabled fleet-wide. Active node scheduler allocations for this model are frozen.</span>
              </div>
            </div>
          )}

          {/* 🔴 RELEVANT HERO METRICS FOR TEMPLATES (Fully Aligned Visualization Style) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 shrink-0 animate-fade-in">
            
            {/* CARD 1: ACTIVE ASSIGNED CLAIMS */}
            <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
              <div>
                <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                  <div className="relative flex items-center gap-1 group/tooltip">
                    <span>Active Assigned Claims</span>
                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                      Total running isolated sandbox instances spawned explicitly from this environment template model.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                  <span className="text-2xl font-black font-mono text-white tracking-tight">{selectedTemplate.activeClaims}</span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Pods</span>
                </div>
              </div>
              
              <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                  <span className="text-slate-400">Cluster Allocation:</span>
                  <span className="text-white font-bold truncate max-w-[120px]">{selectedTemplate.cluster}</span>
                </div>
                <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                  <span className="text-slate-400">Namespace Target:</span>
                  <span className="text-purple-400 font-semibold truncate max-w-[100px]">{selectedTemplate.namespace || 'agent-runtime-prod'}</span>
                </div>
              </div>
            </div>

            {/* CARD 2: WARM RESERVE DEPTH */}
            <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
              <div>
                <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                  <div className="relative flex items-center gap-1 group/tooltip">
                    <span>Warm Reserve Depth</span>
                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                      Configured minReplicas pre-booted standby buffer depth awaiting instant incoming AI agent attachments.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                  <span className="text-2xl font-black font-mono text-white tracking-tight">{selectedTemplate.warmPoolSize}</span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Buffer Pods</span>
                </div>
              </div>
              
              <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                  <span className="text-slate-400">Target Max Bounds:</span>
                  <span className="text-sandbox-green font-bold">{selectedTemplate.targetCapacity || 500} Cap</span>
                </div>
                <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                  <span className="text-slate-400">Isolation Driver:</span>
                  <span className="text-slate-300 font-semibold">runsc (gVisor)</span>
                </div>
              </div>
            </div>

            {/* CARD 3: DAILY OVERHEAD COST */}
            <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
              <div>
                <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                  <div className="relative flex items-center gap-1 group/tooltip">
                    <span>Daily Overhead Cost</span>
                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                      SRE infrastructure spending footings mapped exactly per day for maintaining this isolated template model.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                  <span className="text-2xl font-black font-mono text-white tracking-tight">${selectedTemplate.costPerDay || 142.50}</span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">/ Day</span>
                </div>
              </div>
              
              <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                  <span className="text-slate-400">Avg Ingestion Rate:</span>
                  <span className="text-white font-bold">{selectedTemplate.avgClaimRate || 14.5}/m</span>
                </div>
                <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                  <span className="text-slate-400">Reconciliation Status:</span>
                  <span className="text-sandbox-green font-bold">Active Optimal</span>
                </div>
              </div>
            </div>            {/* CARD 4: EXFILTRATION SHIELD */}
            <div className={`rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all border ${
              isEgressLockedDown 
                ? 'bg-red-950/20 border-red-800/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' 
                : 'bg-slate-800/70 border-transparent'
            }`}>
              <div>
                <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                  <div className="relative flex items-center gap-1 group/tooltip">
                    <span className={isEgressLockedDown ? 'text-red-400' : ''}>
                      {isEgressLockedDown ? '⚠️ Lockdown Enforced' : 'Exfiltration Shield'}
                    </span>
                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                      Total anomalous outbound network connections dropped instantly via runsc socket interception layers.
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                  <span className={`text-2xl font-black font-mono tracking-tight ${isEgressLockedDown ? 'text-red-400 font-extrabold' : 'text-white'}`}>
                    {isEgressLockedDown ? 'LOCKED' : (selectedTemplate.blockedAttempts || 24)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                    {isEgressLockedDown ? 'Zero Outbound' : 'Blocks'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                  <span className="text-slate-400">Egress Filter Rules:</span>
                  <span className={`font-bold ${isEgressLockedDown ? 'text-red-400' : 'text-sandbox-cyan'}`}>
                    {isEgressLockedDown ? '0 Allowed' : `${selectedTemplate.egressRules || 3} Allowed`}
                  </span>
                </div>
                <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                  <span className="text-slate-400">Allowlist Enforced:</span>
                  <span className={`font-bold truncate max-w-[100px] ${isEgressLockedDown ? 'text-red-400 font-extrabold' : 'text-white'}`}>
                    {isEgressLockedDown ? 'ZERO TRUST' : 'Active DNS'}
                  </span>
                </div>

                {/* Emergency Action Switch */}
                {isEgressLockedDown ? (
                  <button 
                    onClick={() => {
                      setIsEgressLockedDown(false);
                      setActionMessage(`Egress lockdown policy removed for ${selectedTemplate.name}... Re-establishing allowed DNS filters.`);
                      setTimeout(() => setActionMessage(null), 4000);
                    }}
                    className="w-full mt-2 py-1.5 bg-sandbox-green/10 hover:bg-sandbox-green/20 border border-sandbox-green/30 text-sandbox-green hover:text-white font-mono text-[9px] font-bold rounded tracking-wide transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> REMOVE LOCKDOWN
                  </button>
                ) : (
                  <button 
                    onClick={() => requestActionConfirmation(`Activate ZERO-EGRESS emergency lockdown policy for template ${selectedTemplate.name}`)}
                    className="w-full mt-2 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-400 hover:text-white font-mono text-[9px] font-bold rounded tracking-wide transition-all text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ShieldAlert className="h-3.5 w-3.5" /> EMERGENCY LOCKDOWN
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* 🔴 REQUESTED 6 NAVIGATION TABS BAR */}
          <div className="flex border-b border-slate-800/80 w-full gap-2 mb-6 font-mono text-xs select-none shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'warmpool', label: 'Warm pool' },
              { id: 'activesandboxes', label: 'Active sandboxes' },
              { id: 'observability', label: 'Observability' },
              { id: 'logs', label: 'Logs' },
              { id: 'yaml', label: 'YAML' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDetailTab(tab.id)}
                className={`px-5 py-3 border-b-2 font-bold transition-all relative cursor-pointer whitespace-nowrap -mb-[2px] ${
                  (detailTab === tab.id || (detailTab === 'manifest' && tab.id === 'overview'))
                    ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 via-sandbox-cyan/5 to-transparent font-extrabold shadow-[inset_0_-4px_0_rgba(0,245,255,0.1)]' 
                    : 'border-transparent text-slate-500 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1">
            
            {/* TAB 1: OVERVIEW METADATA PANEL (Basic info + Resource Requests & Limits configuration) */}
            {(detailTab === 'overview' || detailTab === 'manifest') && (
              <div className="space-y-6 max-w-5xl animate-fade-in">
                
                {/* Basic Information Panel */}
                <div className="bg-sandbox-surface border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
                    Template Specification Basic Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Name:</span>
                      <span className="text-white font-bold select-all">{selectedTemplate.name}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Runtime Class Name:</span>
                      <span className="text-white font-bold select-all">isolated-runtime</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Labels:</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-white select-all">sandbox=python-sandbox-example</span>
                        <span className="text-white select-all text-[10px]">sandbox.gke.io/runtime=gvisor</span>
                      </div>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Namespace:</span>
                      <span className="text-white font-bold select-all">{selectedTemplate.namespace || 'agent-runtime-prod'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Image URI:</span>
                      <span className="text-white truncate max-w-xs select-all" title="gcr.io/gke-ai-eco-dev/agent-image-base:v2.4.1">gcr.io/gke-ai-eco-dev/agent-image-base:v2.4.1</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Created Date:</span>
                      <span className="text-white">2026-04-10 08:22:14 UTC</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Last Updates:</span>
                      <span className="text-white font-bold">{selectedTemplate.lastReconciled || '1.2m ago'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-900/80">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 font-bold text-[10px]">{selectedTemplate.status}</span>
                    </div>
                  </div>
                </div>

                {/* Configuration of Resource Requests and Resource Limits */}
                <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-2xl">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-3">
                    Configuration of Resource Requests and Resource Limits
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Resource Requests (Guaranteed Allocations)</span>
                      <div className="flex justify-between text-slate-300 border-b border-slate-900/80 pb-1">
                        <span>Requested CPU Cores:</span>
                        <strong className="text-white font-bold">0.5 Core</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Requested Memory Footprint:</span>
                        <strong className="text-sandbox-cyan font-bold">1.0 GiB</strong>
                      </div>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-900 space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Resource Limits (Maximum Hard Bounds)</span>
                      <div className="flex justify-between text-slate-300 border-b border-slate-900/80 pb-1">
                        <span>Max Compute CPU Ceiling:</span>
                        <strong className="text-amber-300 font-bold">2.0 Cores</strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Max Memory Eviction Ceiling:</span>
                        <strong className="text-purple-400 font-bold">4.0 GiB</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: WARM POOL SLIDER & AUTOSCALING TOGGLES */}
            {detailTab === 'warmpool' && (
              <div className="max-w-xl bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 space-y-6 animate-fade-in">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block border-b border-slate-800 pb-1.5 font-bold mb-3">Adjust warmpool capacity depth</span>
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
                          className="px-2 py-1 rounded bg-sandbox-cyan text-slate-950 text-[9px] font-sans font-bold uppercase hover:bg-cyan-400 transition-colors shadow-sm"
                        >
                          Apply Changes
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
                    className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-1.5 cursor-pointer" 
                  />
                </div>

                <div className="border-t border-slate-800/60 pt-4 font-mono text-xs space-y-3">
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mb-2">Advanced Autoscaling & Eviction Policies</span>
                  
                  {/* HPA Toggle */}
                  <div className="flex justify-between items-center bg-black/30 p-2 border border-slate-850 rounded-lg">
                    <div>
                      <span className="text-white font-bold block">Horizontal Pod Autoscaler (HPA)</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Scale buffer dynamically based on CPU/Mem utilization thresholds.</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsHpaEnabled(!isHpaEnabled);
                        triggerLifecycleAction(`HPA policy ${!isHpaEnabled ? 'ENABLED' : 'DISABLED'} for ${selectedTemplate.name}`);
                      }} 
                      className={`px-3 py-1 rounded font-bold text-[10px] uppercase border transition-all ${isHpaEnabled ? 'bg-sandbox-green/10 border-sandbox-green/30 text-sandbox-green' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {isHpaEnabled ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {/* KEDA Toggle */}
                  <div className="flex justify-between items-center bg-black/30 p-2 border border-slate-850 rounded-lg">
                    <div>
                      <span className="text-white font-bold block">KEDA Event PromQL Triggers</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Attach external Prometheus telemetry to drive reactive scaling rates.</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsKedaEnabled(!isKedaEnabled);
                        triggerLifecycleAction(`KEDA PromQL Triggers ${!isKedaEnabled ? 'ACTIVATED' : 'DEACTIVATED'} for ${selectedTemplate.name}`);
                      }} 
                      className={`px-3 py-1 rounded font-bold text-[10px] uppercase border transition-all ${isKedaEnabled ? 'bg-sandbox-violet/20 border-sandbox-violet/40 text-sandbox-violet' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {isKedaEnabled ? 'Active' : 'Off'}
                    </button>
                  </div>

                  {/* Multi-tier Priority Class Evictions */}
                  <div className="flex justify-between items-center bg-black/30 p-2 border border-slate-850 rounded-lg">
                    <div>
                      <span className="text-white font-bold block">Multi-Tier Priority Evictions</span>
                      <span className="text-[10px] text-slate-500 block leading-tight">Automatically recycle zombie or idle claims in exhaustion scenarios.</span>
                    </div>
                    <button 
                      onClick={() => {
                        setIsEvictionEnabled(!isEvictionEnabled);
                        triggerLifecycleAction(`Multi-Tier Evictions policy ${!isEvictionEnabled ? 'ENFORCED' : 'MUTED'} fleet-wide`);
                      }} 
                      className={`px-3 py-1 rounded font-bold text-[10px] uppercase border transition-all ${isEvictionEnabled ? 'bg-sandbox-orange/10 border-sandbox-orange/30 text-sandbox-orange' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
                    >
                      {isEvictionEnabled ? 'Enforced' : 'Off'}
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: ACTIVE SANDBOXES LIST */}
            {detailTab === 'activesandboxes' && (
              <div className="bg-sandbox-surface border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-5xl animate-fade-in">
                <div className="p-3 bg-black/40 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-800 font-bold select-none">
                  Active Sibling Sandbox Instance Claims Spawned from {selectedTemplate.name}
                </div>
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="bg-black/20 text-slate-500 text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5">Sandbox Claim ID</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5">Assigned Node Cluster</th>
                      <th className="px-4 py-2.5 text-right">Quota Used</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 text-[11px]">
                    {sampleActiveSandboxesList.filter(s => s.template === selectedTemplate.id || selectedTemplate.id === 'python-agent-runner').map((sb) => (
                      <tr key={sb.id} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2.5 font-bold text-white select-all">{sb.id}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 text-[9px]">{sb.status}</span>
                        </td>
                        <td className="px-4 py-2.5 text-sandbox-cyan font-bold">{sb.cluster}</td>
                        <td className="px-4 py-2.5 text-right text-slate-400 font-bold">{sb.cpu} / {sb.memory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 4: OBSERVABILITY METRICS GRAPHS */}
            {detailTab === 'observability' && (
              <div className="space-y-4 max-w-5xl animate-fade-in">
                {/* Right-Sizing Assistant (CUJ 7) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-6">
                    
                    {/* Left Section: 2D Quadrant Chart Canvas */}
                    <div className="lg:col-span-2 bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col h-[380px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                Resource Sizing Quadrant Mapping
                            </h3>
                            <div className="flex gap-4 text-[10px] font-mono">
                                <span className="flex items-center gap-1 text-sandbox-green"><span className="h-1.5 w-1.5 rounded-full bg-sandbox-green" /> Optimal</span>
                                <span className="flex items-center gap-1 text-sandbox-orange"><span className="h-1.5 w-1.5 rounded-full bg-sandbox-orange" /> Idle Waste</span>
                                <span className="flex items-center gap-1 text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> SLO Breached</span>
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full text-[11px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.5} />
                                    <XAxis type="number" dataKey="cost" name="Warm Pool Idle Cost" unit="$/day" stroke="#4b5563" domain={[0, 100]} />
                                    <YAxis type="number" dataKey="latency" name="Init Latency" unit="s" stroke="#4b5563" domain={[0, 15]} />
                                    <ZAxis type="number" dataKey="size" range={[60, 200]} />
                                    
                                    {/* Reference Target Lines for Quadrants */}
                                    <ReferenceLine x={50} stroke="#374151" strokeDasharray="4 4" />
                                    <ReferenceLine y={5} stroke="#374151" strokeDasharray="4 4" label={{ value: 'SLO Alert (5s)', fill: '#ef4444', position: 'top', offset: 5 }} />
                                    
                                    {/* Reference Zones */}
                                    <ReferenceArea x1={0} x2={50} y1={0} y2={5} fill="#10b981" fillOpacity={0.04} />
                                    <ReferenceArea x1={50} x2={100} y1={0} y2={5} fill="#f59e0b" fillOpacity={0.04} />
                                    <ReferenceArea x1={0} x2={100} y1={5} y2={15} fill="#ef4444" fillOpacity={0.04} />

                                    <Tooltip 
                                        cursor={{ strokeDasharray: '3 3' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const item = payload[0].payload;
                                                return (
                                                    <div className="bg-[#161C24] border border-slate-700 rounded-xl p-3 font-sans text-xs text-slate-300 shadow-2xl">
                                                        <div className="font-bold text-white mb-1">{item.name}</div>
                                                        <div>Warm Pool Cost: <span className="font-mono font-semibold text-pearl">${item.cost}/day</span></div>
                                                        <div>P99 Init Latency: <span className="font-mono font-semibold text-sandbox-cyan">{item.latency}s</span></div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    
                                    <Scatter name="Sandbox Configs" data={sampleScatterData} fill="#00F5FF">
                                        {sampleScatterData.map((entry, index) => {
                                            let color = '#00F5FF';
                                            if (entry.type === 'optimal') color = '#2ED168';
                                            if (entry.type === 'waste') color = '#F2994A';
                                            if (entry.type === 'danger') color = '#EF4444';
                                            return <cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                                          {/* Right Section: Parameter Configuration Recommendation Tuning Form */}
                    <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative group">
                        {(() => {
                          const baseCostPerPod = 7.125;
                          const currentCost = (selectedTemplate?.warmPoolSize || 0) * baseCostPerPod;
                          const projectedCost = optimizerMinReplicas * baseCostPerPod;
                          const costDelta = projectedCost - currentCost;
                          const costDeltaStr = costDelta >= 0 ? `+$${costDelta.toFixed(2)}` : `-$${Math.abs(costDelta).toFixed(2)}`;
                          
                          const claimRate = selectedTemplate?.avgClaimRate || 14.5;
                          // Hit ratio model based on claim rate scale
                          const hitRatio = Math.min(100, Math.round((optimizerMinReplicas / Math.max(1, claimRate * 2.5)) * 100));
                          const projectedLatency = (hitRatio / 100) * 0.4 + (1 - hitRatio / 100) * 14.5;
                          const efficiencyScore = Math.round(hitRatio);

                          return (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                                    <Sliders className="h-4 w-4 text-sandbox-cyan" /> Cost-UX Tradeoff Simulator
                                </h3>
                                
                                <div>
                                    <div className="flex justify-between text-xs mb-1 relative group/tooltip">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <span>Warm reserve (minReplicas)</span>
                                            <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan" />
                                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 leading-normal z-50 font-sans normal-case font-normal">
                                                Configure the standby pre-booted buffer depth to tune agent instantiation latency.
                                            </div>
                                        </div>
                                        <span className="text-sandbox-cyan font-mono font-bold">{optimizerMinReplicas} pods</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="0" 
                                      max="100" 
                                      value={optimizerMinReplicas} 
                                      onChange={(e) => setOptimizerMinReplicas(parseInt(e.target.value))}
                                      className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-2 cursor-pointer" 
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1 relative group/tooltip">
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <span>Autoscaler provision rate (IPPR)</span>
                                            <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan" />
                                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 leading-normal z-50 font-sans normal-case font-normal">
                                                Autoscale provision rate defining warm pool restoration speed.
                                            </div>
                                        </div>
                                        <span className="text-sandbox-cyan font-mono font-bold">{optimizerIppr} / sec</span>
                                    </div>
                                    <input 
                                      type="range" 
                                      min="1" 
                                      max="20" 
                                      value={optimizerIppr} 
                                      onChange={(e) => setOptimizerIppr(parseInt(e.target.value))}
                                      className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-2 cursor-pointer" 
                                    />
                                </div>

                                {/* Simulated Tradeoff Output Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3 bg-black/40 p-3 rounded-xl border border-slate-900 text-xs font-mono">
                                  <div>
                                    <span className="text-slate-500 block text-[10px] uppercase">P99 Cold Start</span>
                                    <strong className={`text-sm font-black ${projectedLatency < 2.0 ? 'text-sandbox-green' : projectedLatency < 6.0 ? 'text-amber-400' : 'text-red-400'}`}>
                                      {projectedLatency.toFixed(2)}s
                                    </strong>
                                  </div>
                                  <div>
                                    <span className="text-slate-500 block text-[10px] uppercase">Overhead cost</span>
                                    <strong className="text-sm text-white font-black">
                                      ${projectedCost.toFixed(2)} <span className="text-[9px] text-slate-450 font-normal">/day</span>
                                    </strong>
                                    <span className={`block text-[9px] ${costDelta >= 0 ? 'text-sandbox-orange' : 'text-sandbox-green'}`}>
                                      {costDeltaStr} / day delta
                                    </span>
                                  </div>
                                </div>

                                <div className="border-t border-slate-850 pt-3 text-[11px] text-slate-400 leading-relaxed">
                                    <div className="flex gap-2 items-start p-2 bg-slate-900/40 border border-slate-800/60 rounded-lg">
                                        {projectedLatency < 2.0 ? (
                                          <CheckCircle className="h-4 w-4 text-sandbox-green shrink-0 mt-0.5" />
                                        ) : (
                                          <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${projectedLatency < 6.0 ? 'text-amber-400' : 'text-red-400'}`} />
                                        )}
                                        <div>
                                            <span className="text-white font-bold block">Efficiency Forecast: {efficiencyScore}% hit ratio</span>
                                            {projectedLatency < 2.0 ? (
                                              <span>Highly optimized! This configuration guarantees SLO limits with minimal warm pool overhead risk constraints.</span>
                                            ) : projectedLatency < 6.0 ? (
                                              <span>Sub-optimal response performance risk. Elevated user experience cold-start penalties might be observed.</span>
                                            ) : (
                                              <span>Critical SLO breach warning! Inadequate warm reserve buffer depth will force severe cold-start penalties.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => requestActionConfirmation(`Tune warm reserve minReplicas to ${optimizerMinReplicas} pods (Cost Delta: ${costDeltaStr}/day) for ${selectedTemplate?.name}`)}
                                    className="w-full py-2 bg-gradient-to-r from-sandbox-cyan to-blue-600 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:from-cyan-400 hover:to-blue-500 transition-colors mt-2 cursor-pointer"
                                >
                                    Apply Tradeoff Optimization
                                </button>
                            </div>
                          );
                        })()}
                    </div>
                </div>

                {/* BRAND NEW DELIVERABLE: MODEL CACHE & TTFT TELEMETRY COCKPIT */}
                <div className="col-span-1 lg:col-span-3 bg-slate-900/40 border border-slate-850 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-6 w-full select-none animate-fade-in">
                  {/* Column 1: GKE Model Cache Telemetry */}
                  <div className="flex-1 space-y-3 font-mono text-xs">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                      <Server className="h-4 w-4 text-sandbox-cyan" /> GKE Model Weight & Prefix Caching
                    </h4>
                    
                    <div className="space-y-2.5">
                      {/* Cache Hit Ratio */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-300">vLLM Cache Hit Ratio:</span>
                          <strong className="text-sandbox-green">94.2%</strong>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-1.5 p-[1px] flex">
                          <div className="bg-gradient-to-r from-sandbox-cyan to-sandbox-green h-full rounded-full" style={{ width: '94.2%' }} />
                        </div>
                      </div>

                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-300">Hydration Load Latency:</span>
                        <strong className="text-white">1.2 seconds</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-300">Pre-cached Snapshots:</span>
                        <span className="text-sandbox-cyan font-bold truncate max-w-[140px]">gs://model-weights</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-300">Cache Storage Volume:</span>
                        <strong className="text-white">18.4 GiB</strong>
                      </div>
                    </div>
                  </div>

                  {/* Vertical divider */}
                  <div className="hidden md:block w-px bg-slate-850" />

                  {/* Column 2: LLM Generation Performance */}
                  <div className="flex-1 space-y-3 font-mono text-xs">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                      <Activity className="h-4 w-4 text-sandbox-cyan" /> LLM Generation Telemetry
                    </h4>

                    <div className="space-y-2.5">
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-300">Time-To-First-Token (TTFT):</span>
                        <strong className="text-sandbox-green">420ms</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-300">Decoding Speed:</span>
                        <strong className="text-white">48 tokens / sec</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-900">
                        <span className="text-slate-300">API Egress Endpoints:</span>
                        <span className="text-white font-bold truncate max-w-[180px]">vertex-llm-prod</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-300">Token Gen Health:</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 font-bold text-[10px]">Secure / Stable</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
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

            {/* TAB 5: LOGS STREAMS */}
            {detailTab === 'logs' && (
              <div className="bg-black border border-slate-800 rounded-xl p-4 shadow-2xl max-w-5xl animate-fade-in">
                <div className="text-xs font-mono text-slate-400 border-b border-slate-900 pb-2 mb-3 font-bold">
                  Live Operator Reconciler Streams for {selectedTemplate.name}
                </div>
                <div className="font-mono text-xs text-emerald-400 space-y-1.5 p-2 bg-slate-950/80 rounded-lg overflow-y-auto max-h-[180px] border border-slate-900 select-all">
                  <div className="text-slate-500">&gt;&gt; [GKE-OPERATOR] Saturated local template config cache successfully.</div>
                  <div>&gt;&gt; [CRD-RECONCILER] Verified warm pool buffer minReplicas target bounds intact.</div>
                  <div>&gt;&gt; [L7-SHIELD] Intercepting outbound raw TCP boundaries matching allowlist domains.</div>
                  <div className="text-cyan-400">&gt;&gt; [METRICS-PROXY] Dispatched OpenTelemetry distributed tracing spans to backend sync.</div>
                </div>
              </div>
            )}

            {/* TAB 6: YAML EDITOR */}
            {detailTab === 'yaml' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col shadow-xl max-w-5xl animate-fade-in">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-2 select-none">
                  Raw YAML CustomResourceDefinition Model Specification
                </div>
                <textarea
                  value={editableYaml || getYamlSpecString(selectedTemplate)}
                  onChange={(e) => setEditableYaml(e.target.value)}
                  rows={14}
                  className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-400 leading-relaxed focus:outline-none focus:border-sandbox-cyan/40 resize-none no-scrollbar"
                />
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
              <div>Sandbox ID: <span className="text-white font-bold select-all">{selectedSandbox.id}</span></div>
              <div>Isolation: <span className="text-slate-300 font-bold">{selectedSandbox.driver || 'runsc (gVisor)'}</span></div>
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
                className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all font-bold"
              >
                {(sandboxLifecycleMap[selectedSandbox.id] || 'Running') === 'Running' ? 'Suspend sandbox' : 'Resume sandbox'}
              </button>

              <button 
                onClick={() => requestActionConfirmation(`sb-evict-${selectedSandbox.id}`)}
                className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all font-bold"
              >
                Terminate sandbox
              </button>
              <button 
                onClick={() => { setSelectedSandbox(null); setSandboxTab('overview'); setCurrentDashboardTab('sandboxes'); }}
                className="px-3 py-1.5 rounded bg-black/20 border border-slate-800 text-slate-400 hover:text-white transition-all"
              >
                Back to list
              </button>
            </div>
          </div>


          {/* 🔴 REQUESTED 6 NAVIGATION TABS BAR FOR SANDBOX DETAILS */}
          <div className="flex border-b border-slate-800/80 w-full gap-2 mb-6 font-mono text-xs select-none shrink-0 overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },

              { id: 'snapshots', label: 'Snapshots' },
              { id: 'observability', label: 'Observability' },
              { id: 'logs', label: 'Logs' },
              { id: 'yaml', label: 'YAML' }
            ].map((tab) => {
              const isActTab = sandboxTab === tab.id || (sandboxTab === 'terminal' && tab.id === 'overview');
              return (
                <button
                  key={tab.id}
                  onClick={() => setSandboxTab(tab.id)}
                  className={`px-5 py-3 border-b-2 font-bold transition-all relative cursor-pointer whitespace-nowrap -mb-[2px] ${
                    isActTab 
                      ? 'border-sandbox-cyan text-sandbox-cyan bg-gradient-to-t from-sandbox-cyan/10 via-sandbox-cyan/5 to-transparent font-extrabold shadow-[inset_0_-4px_0_rgba(0,245,255,0.1)]' 
                      : 'border-transparent text-slate-500 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1">
            
            {/* TAB 1: OVERVIEW METADATA PANEL (Details + Resource Requests & Limits configuration) */}
            {(sandboxTab === 'overview' || sandboxTab === 'terminal') && (
              <div className="space-y-6 max-w-5xl animate-fade-in">
                
                {/* Metadata Details Panel */}
                <div className="p-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    Sandbox Claim Pod Instance Basic Details
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Namespace:</span>
                      <span className="text-white font-bold select-all">{selectedSandbox.namespace || 'agent-runtime-prod'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Template:</span>
                      <span className="text-white font-bold select-all">{selectedSandbox.template}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Cluster:</span>
                      <span className="text-white font-bold truncate max-w-xs select-all">{activeKubeContext || selectedSandbox.cluster || 'gke-us-central-c1'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Node:</span>
                      <span className="text-white select-all">gke-barkland-brust-pool-1-a</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">POD ID:</span>
                      <span className="text-white font-bold select-all">{selectedSandbox.id}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">IP Address:</span>
                      <span className="text-white font-bold select-all">10.52.184.12</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Current Snapshot:</span>
                      <span className="text-white font-bold select-all">snap-90f2a (Active Base)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Driver Boundary:</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-white border border-slate-700 font-bold text-[10px]">runsc (gVisor)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Sandbox Router:</span>
                      <span className="text-white font-bold select-all">router.default.svc.cluster.local</span>
                    </div>
                  </div>
                </div>

                {/* Configuration of Resource Requests and Resource Limits */}
                <div className="p-4 mt-4">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2 mb-4">
                    Configuration of Resource Requests and Resource Limits
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-mono text-xs">
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Resource Requests (Guaranteed Allocations)</span>
                      <div className="flex justify-between text-slate-300 py-1">
                        <span>Requested CPU Cores:</span>
                        <strong className="text-white font-bold">0.4 Core</strong>
                      </div>
                      <div className="flex justify-between text-slate-300 py-1">
                        <span>Requested Memory Footprint:</span>
                        <strong className="text-sandbox-cyan font-bold">1.1 GiB</strong>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Resource Limits (Maximum Hard Bounds)</span>
                      <div className="flex justify-between text-slate-300 py-1">
                        <span>Max Compute CPU Ceiling:</span>
                        <strong className="text-amber-300 font-bold">1.0 Core</strong>
                      </div>
                      <div className="flex justify-between text-slate-300 py-1">
                        <span>Max Memory Eviction Ceiling:</span>
                        <strong className="text-purple-400 font-bold">2.0 GiB</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-sandbox-surface border border-slate-800 rounded-xl overflow-hidden shadow-2xl max-w-5xl animate-fade-in mt-4">
                  <div className="p-3 bg-black/40 font-mono text-[10px] text-slate-400 uppercase border-b border-slate-800 font-bold select-none">
                    List of Managed Sibling Pods Mapped to {selectedSandbox.template}
                  </div>
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead className="bg-black/20 text-slate-500 text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Sibling Pod Instance ID</th>
                        <th className="px-4 py-2.5 text-center">State</th>
                        <th className="px-4 py-2.5">Assigned Cluster</th>
                        <th className="px-4 py-2.5 text-right">Allocated Footprint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300 text-[11px]">
                      {sampleActiveSandboxesList.filter(s => s.template === selectedSandbox.template || s.cluster === selectedSandbox.cluster).map((sb) => (
                        <tr key={sb.id} className="hover:bg-slate-900/40">
                          <td className="px-4 py-2.5 font-bold text-white select-all">{sb.id}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 text-[9px]">{sb.status}</span>
                          </td>
                          <td className="px-4 py-2.5 text-sandbox-cyan font-bold">{sb.cluster}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400 font-bold">{sb.cpu} / {sb.memory}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>



              </div>
            )}

            {/* TAB 2: MANAGED PODS LIST */}


            {/* TAB 3: SNAPSHOTS LIST */}
            {sandboxTab === 'snapshots' && (
              <div className="space-y-6 max-w-5xl animate-fade-in w-full">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl shadow-inner text-xs font-mono">
                  <div className="flex flex-col gap-1 border-r border-slate-850 pr-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Snapshots API Bound</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
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
                  </div>
                </div>                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl overflow-hidden shadow-lg w-full">
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
                          <th className="px-4 py-2.5">Security Base Integrity</th>
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
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${
                                    snap.baseSecure.includes('Secure')
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-sandbox-green'
                                      : 'bg-red-500/10 border-red-500/20 text-rose-400'
                                  }`}>
                                    {snap.baseSecure}
                                  </span>
                                </td>
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
                                    Create Sandbox
                                  </button>
                                </td>
                              </tr>
                              
                              {/* Expanded Sub-Row State Diff Browser Container */}
                              {isExpanded && (
                                <tr className="bg-slate-950/60 border-y border-slate-850 animate-fade-in">
                                  <td colSpan={9} className="p-4">
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

              </div>
            )}

            {/* TAB 4: OBSERVABILITY METRICS GRAPHS */}
            {sandboxTab === 'observability' && (
              <div className="space-y-4 max-w-5xl animate-fade-in">
                {/* 🔴 RELEVANT HERO METRICS FOR SANDBOXES (Identical Visualization Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 shrink-0 animate-fade-in">
                  
                  {/* CARD 1: ASSIGNED PARENT TEMPLATE */}
                  <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                    <div>
                      <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                        <div className="relative flex items-center gap-1 group/tooltip">
                          <span>Assigned Parent Template</span>
                          <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                            Explicitly referenced runtime environment model driving this isolated claim pod instance.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap truncate">
                        <span className="text-xl font-black font-mono text-white tracking-tight truncate max-w-[180px]">{selectedSandbox.template}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                      <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                        <span className="text-slate-400">Spec Verified:</span>
                        <span className="text-sandbox-cyan font-bold">Secure Bound</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                        <span className="text-slate-400">Driver Kernel:</span>
                        <span className="text-slate-300 font-semibold">runsc (gVisor)</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: ACTIVE SIBLING PODS */}
                  <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                    <div>
                      <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                        <div className="relative flex items-center gap-1 group/tooltip">
                          <span>Active Sibling Pods</span>
                          <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                            Total concurrent sibling claim instances running within the exact same assigned physical cluster node.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">18</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Instances</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                      <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                        <span className="text-slate-400">Node Pool Node:</span>
                        <span className="text-sandbox-green font-bold truncate max-w-[100px]">pool-1-a</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                        <span className="text-slate-400">Load Distribution:</span>
                        <span className="text-slate-300 font-semibold">Rebalanced</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 3: EGRESS NETWORK ACCESS */}
                  <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                    <div>
                      <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                        <div className="relative flex items-center gap-1 group/tooltip">
                          <span>Egress Network Access</span>
                          <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                            Enforced Layer 7 allowlist network boundaries dropping unsanctioned external payload destinations.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                        <span className="text-xl font-black font-mono text-sandbox-cyan tracking-tight">DNS Allowed</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                      <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                        <span className="text-slate-400">Active Sockets:</span>
                        <span className="text-white font-bold">2 Bound</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                        <span className="text-slate-400">Exfil Traps:</span>
                        <span className="text-sandbox-orange font-bold">0 Caught</span>
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: KERNEL HEAP OVERHEADS */}
                  <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                    <div>
                      <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                        <div className="relative flex items-center gap-1 group/tooltip">
                          <span>Kernel Heap Overheads</span>
                          <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                            Active memory overheads allocated specifically to secure runsc user-space virtual kernel process handling.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">12.4</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">MiB</span>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                      <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                        <span className="text-slate-400">Syscall Drops:</span>
                        <span className="text-sandbox-green font-bold">Autopilot Shield</span>
                      </div>
                      <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                        <span className="text-slate-400">Tracing Buffer:</span>
                        <span className="text-purple-400 font-semibold">Active</span>
                      </div>
                    </div>
                  </div>

                </div>
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
                      <span className="h-2 w-2 rounded-full bg-sandbox-cyan" />
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

            {/* TAB 5: LOGS STREAMS */}
            {sandboxTab === 'logs' && (
              <div className="space-y-4 max-w-5xl animate-fade-in">
                <div className="bg-black border border-slate-900/50 rounded-2xl p-4 flex flex-col shadow-2xl min-h-[340px]">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-2 mb-3 font-mono font-bold">
                    <div className="flex items-center gap-1.5"><Terminal className="h-4 w-4 text-sandbox-cyan" /> stdout / stderr active container shell log stream</div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => triggerLifecycleAction('Download complete container diagnostic stdout raw text')} className="text-slate-500 hover:text-sandbox-cyan flex items-center gap-0.5 transition-colors"><Download className="h-3 w-3" /> Download</button>
                      <span className="text-sandbox-cyan">● CAPTURING STREAM</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 font-mono text-xs text-emerald-400 space-y-2 p-1 overflow-y-auto max-h-[200px] select-all leading-relaxed no-scrollbar mb-3">
                    {terminalOutput.map((line, index) => (
                      <div key={index} className={line.includes('SYSTEM') ? 'text-slate-500' : line.includes('CLI USER INPUT') ? 'text-amber-300 font-bold' : line.includes('L7 ALLOWED') ? 'text-cyan-400' : 'text-emerald-400'}>
                        {line}
                      </div>
                    ))}
                  </div>

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

                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl overflow-hidden shadow-xl mt-4">
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
              </div>
            )}

            {/* TAB 6: YAML EDITOR */}
            {sandboxTab === 'yaml' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col shadow-xl max-w-5xl animate-fade-in">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-2 select-none">
                  Raw YAML Container Instance Engine Specification
                </div>
                <textarea
                  value={editableYaml || getYamlSpecString(selectedTemplate || { name: selectedSandbox.template })}
                  onChange={(e) => setEditableYaml(e.target.value)}
                  rows={14}
                  className="w-full bg-black/60 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-emerald-400 leading-relaxed focus:outline-none focus:border-sandbox-cyan/40 resize-none no-scrollbar"
                />
              </div>
            )}

          </div>


        </div>
      ) : (
        /* MAIN HUB CONTENT CONTAINER */
        <div className="space-y-8 animate-fade-in">
          {/* TAB 1: DASHBOARD */}
          {currentDashboardTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Global Time Window Selector (Integrated sleek header) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-850 select-none">
                <div>
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-sandbox-cyan flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-sandbox-cyan" /> Platform Global Real-Time Overview
                  </h3>
                  <span className="text-[10px] text-slate-300 font-mono">Continuous GKE node pool reconciliation and provisioning telemetry metrics</span>
                </div>
                <div className="flex bg-black/35 rounded-xl p-1 gap-0.5 text-[11px] font-mono border border-slate-900">
                  {['1H', '6H', '24H', '7D'].map((window) => {
                    const isSelected = globalTimeWindow === window;
                    return (
                      <button
                        key={window}
                        onClick={() => setGlobalTimeWindow(window)}
                        className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer uppercase ${
                          isSelected 
                            ? 'bg-sandbox-cyan text-slate-950 font-black shadow-[0_2px_8px_rgba(0,245,255,0.25)]' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {window}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hero Metrics Set 1 (Global Fleet Overview Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0 animate-fade-in">
                
                {/* PILLAR 1: FLEET EFFICIENCY */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 hover:border-sandbox-cyan/35 rounded-2xl p-4 flex flex-col justify-between shadow-[0_8px_30px_rgba(0,245,255,0.02)] transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Fleet Compute Volumes</span>
                        <HelpCircle className="h-3 w-3 text-slate-455 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-200 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Aggregated count of available environment templates and active sandbox instance claims globally.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-1 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{heroMetrics.efficiency.templates}</span>
                        <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">Templates</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="text-2xl font-black font-mono text-sandbox-cyan tracking-tight">{heroMetrics.efficiency.sandboxes}</span>
                        <span className="text-[10px] text-slate-300 font-mono whitespace-nowrap">Claims</span>
                      </div>
                    </div>

                    {/* Micro Trend Line Chart */}
                    <div className="h-8 w-full mt-2 overflow-hidden select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={fleetHistoryData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id="colorFleet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#00F5FF" strokeWidth={1.5} fillOpacity={1} fill="url(#colorFleet)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Continuous Segmented Stacked Spectrum Bar */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-300 mb-1 whitespace-nowrap">
                      <span>Sandbox Status</span>
                      <span className="text-sandbox-green font-bold">{Math.round((heroMetrics.efficiency.inUse / heroMetrics.efficiency.sandboxes) * 100)}% Active</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 flex overflow-hidden gap-[1px] p-[1px]">
                      <div className="bg-sandbox-green h-full rounded-l-full" style={{ flexGrow: heroMetrics.efficiency.inUse }} />
                      <div className="bg-sandbox-cyan h-full" style={{ flexGrow: heroMetrics.efficiency.warm }} />
                      <div className="bg-amber-400 h-full" style={{ flexGrow: heroMetrics.efficiency.pending }} />
                      <div className="bg-sandbox-orange h-full rounded-r-full" style={{ flexGrow: heroMetrics.efficiency.error }} />
                    </div>
                    <div className="flex justify-between items-center gap-1 text-[8px] font-mono text-slate-200 mt-2 whitespace-nowrap truncate">
                      <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-sandbox-green shrink-0" /> Act: <strong className="text-white font-bold">{heroMetrics.efficiency.inUse > 0 ? heroMetrics.efficiency.inUse : '-'}</strong></span>
                      <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-sandbox-cyan shrink-0" /> Wrm: <strong className="text-white font-bold">{heroMetrics.efficiency.warm > 0 ? heroMetrics.efficiency.warm : '-'}</strong></span>
                      <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-amber-400 shrink-0" /> Pnd: <strong className="text-white font-bold">{heroMetrics.efficiency.pending > 0 ? heroMetrics.efficiency.pending : '-'}</strong></span>
                      <span className="flex items-center gap-1"><span className="h-1 w-1 rounded-full bg-sandbox-orange shrink-0" /> Err: <strong className="text-white font-bold">{heroMetrics.efficiency.error > 0 ? heroMetrics.efficiency.error : '-'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* PILLAR 2: PROACTIVE QUOTA & REMEDIATION ENGINE (SRE Attention centerpiece) */}
                <div className={`bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 flex flex-col justify-between transition-all relative overflow-hidden border ${
                  tteOverride 
                    ? 'border-slate-800 hover:border-sandbox-cyan/35 shadow-[0_8px_30px_rgba(0,245,255,0.02)]' 
                    : 'border-sandbox-orange/40 bg-gradient-to-b from-slate-900 to-black shadow-[0_8px_30px_rgba(242,153,74,0.08)]'
                }`}>
                  {/* Preemptive Spotlight Warning Glow */}
                  {!tteOverride && (
                    <div className="absolute top-0 right-0 w-24 h-24 bg-sandbox-orange/5 rounded-full blur-xl" />
                  )}
                  
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider flex justify-between items-center select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span className={tteOverride ? 'text-sandbox-cyan font-extrabold' : 'text-sandbox-orange font-extrabold'}>
                          {tteOverride ? '● Global Quota Healthy' : '● Proactive Quota Alerts'}
                        </span>
                        <HelpCircle className="h-3 w-3 text-slate-455 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Forecasting exhaust time limits with direct actionable remediation paths.
                        </div>
                      </div>
                      <span className={`font-black text-[9px] ${tteOverride ? 'text-sandbox-green font-bold' : 'text-sandbox-orange'}`}>
                        {tteOverride || 'TTE: 38m'}
                      </span>
                    </div>
                    
                    <div className="space-y-2.5 font-mono">
                      {/* GPU Quota at Risk */}
                      <div>
                        <div className="flex justify-between text-[10px] mb-1 whitespace-nowrap">
                          <span className="text-slate-300">GPU A100 Units</span>
                          <span className={`font-bold ${tteOverride ? 'text-sandbox-cyan' : 'text-sandbox-orange'}`}>
                            {heroMetrics.quota.gpu.used} <span className="text-slate-300">/ {heroMetrics.quota.gpu.total}</span> ({heroMetrics.quota.gpu.percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-950/80 rounded-full h-1.5 p-[1px] flex relative">
                          {/* Consumed */}
                          <div className={`${tteOverride ? 'bg-sandbox-cyan shadow-[0_0_8px_rgba(0,245,255,0.4)]' : 'bg-sandbox-orange shadow-[0_0_8px_rgba(242,153,74,0.6)]'} h-full rounded-full`} style={{ width: `${heroMetrics.quota.gpu.percent}%` }} />
                          {/* Projected Spike */}
                          {!tteOverride && (
                            <div className="bg-sandbox-orange/30 h-full stripe-pattern rounded-r-full" style={{ width: '21%' }} />
                          )}
                        </div>
                      </div>
                      
                      {/* CPU and Memory metrics */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[9px] border-t border-white/5">
                        <div>
                          <span className="text-slate-300">CPU Cores:</span> <strong className="text-slate-200">{heroMetrics.quota.cpu.percent}%</strong>
                        </div>
                        <div>
                          <span className="text-slate-300">Memory:</span> <strong className="text-slate-200">{heroMetrics.quota.memory.percent}%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Mitigation Trigger Button */}
                  <div className="mt-3 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                    {!tteOverride ? (
                      <button 
                        onClick={() => requestActionConfirmation('Opt-out warm pools to reclaim 15% GPU capacity')}
                        className="w-full py-1.5 rounded bg-sandbox-orange/10 hover:bg-sandbox-orange/25 border border-sandbox-orange/30 text-sandbox-orange hover:text-white font-mono text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Zap className="h-3 w-3" /> EVACUATE 8 IDLE BUFFER GPUS
                      </button>
                    ) : (
                      <div className="w-full py-1.5 rounded bg-sandbox-green/10 border border-sandbox-green/30 text-sandbox-green font-mono text-[9px] font-bold text-center flex items-center justify-center gap-1 shadow-sm select-none">
                        <CheckCircle className="h-3 w-3" /> CAPACITY RECLAIMED
                      </div>
                    )}
                    <a 
                      href="https://console.cloud.google.com/iam-admin/quotas" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[9px] font-mono text-slate-455 hover:text-sandbox-cyan transition-colors text-center flex items-center justify-center gap-0.5 font-bold"
                    >
                      Request Quota Increase <ChevronRight className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>

                {/* PILLAR 3: CREATION LATENCY */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 hover:border-sandbox-violet/35 rounded-2xl p-4 flex flex-col justify-between shadow-[0_8px_30px_rgba(157,95,242,0.02)] transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-2 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Creation Latencies</span>
                        <HelpCircle className="h-3 w-3 text-slate-455 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-200 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Statistical distributions of cache hit performance, warm reserve instantiation, and cold start times.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">{heroMetrics.latency.avgCreation}</span>
                      <span className="text-[9px] font-mono text-slate-300 uppercase font-bold">Avg Cold Bound</span>
                    </div>

                    {/* Micro Trend Line Chart */}
                    <div className="h-8 w-full mt-2 overflow-hidden select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={latencyHistoryData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#9D5FF2" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#9D5FF2" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#9D5FF2" strokeWidth={1.5} fillOpacity={1} fill="url(#colorLatency)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap">
                      <span className="text-slate-300 font-medium">Warm Start Path:</span>
                      <span className="text-sandbox-green font-bold">{heroMetrics.latency.warmStart}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">Cold Instantiation:</span>
                      <span className="text-slate-200 font-bold">{heroMetrics.latency.coldInstantiation}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">Warm Hit Ratio:</span>
                      <span className="text-sandbox-cyan font-bold">{heroMetrics.latency.warmHitRatio}</span>
                    </div>
                  </div>
                </div>

                {/* PILLAR 4: THROUGHPUT */}
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 hover:border-sandbox-green/35 rounded-2xl p-4 flex flex-col justify-between shadow-[0_8px_30px_rgba(46,209,104,0.02)] transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-2 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Throughput Flow</span>
                        <HelpCircle className="h-3 w-3 text-slate-455 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-200 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Aggregate incoming claim allocations alongside warm pool vs. cold start handling throughput rates.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">{heroMetrics.throughput.total.split(' ')[0]}</span>
                      <span className="text-[9px] font-mono text-slate-300 uppercase tracking-wider font-bold">Claims / Minute</span>
                    </div>

                    {/* Micro Trend Line Chart */}
                    <div className="h-8 w-full mt-2 overflow-hidden select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={throughputHistoryData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                          <defs>
                            <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2ED168" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#2ED168" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="val" stroke="#2ED168" strokeWidth={1.5} fillOpacity={1} fill="url(#colorThroughput)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap">
                      <span className="text-slate-300 font-medium">Warm Boot Rate:</span>
                      <span className="text-sandbox-green font-bold">{heroMetrics.throughput.warm}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap">
                      <span className="text-slate-300 font-medium">Cold Boot Rate:</span>
                      <span className="text-slate-200 font-bold">{heroMetrics.throughput.cold}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* BRAND NEW DELIVERABLE: DYNAMIC GLOBAL DEPLOYMENT TOPOLOGY MAP HUD */}
              <div className="bg-sandbox-surface/80 backdrop-blur-md border border-slate-800/60 rounded-3xl p-6 shadow-2xl animate-fade-in select-none w-full">
                <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-sandbox-cyan" /> Global Multi-Region GKE Deployment Topology Map
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 font-bold">
                    REAL-TIME REGIONAL TEMPLATE REPLICATION & SNAPSHOT HYDRATION STATES
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Left & Mid Columns: stylized Interactive SVG World Map Canvas */}
                  <div className="lg:col-span-2 bg-slate-950/60 border border-slate-900 rounded-2xl p-4 min-h-[320px] relative overflow-hidden flex flex-col justify-between">
                    
                    {/* Technical grid lines backdrop */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-10 pointer-events-none" />
                    
                    {/* SVG world map stylized outline with connected region routes */}
                    <svg className="w-full h-full min-h-[260px] absolute inset-0 z-0 select-none pointer-events-none" viewBox="0 0 1000 320" fill="none">
                      {/* North America Dotted Paths */}
                      <path d="M 150 80 Q 220 70 250 120" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M 250 120 Q 290 125 340 135" stroke="#00F5FF" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6" />
                      
                      {/* Transatlantic Routes */}
                      <path d="M 340 135 Q 440 90 540 95" stroke="#9D5FF2" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6" />
                      
                      {/* Transpacific Routes */}
                      <path d="M 250 120 Q 540 220 840 180" stroke="#2ED168" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                      
                      {/* Abstract stylized dotted continent grids backing */}
                      <circle cx="150" cy="80" r="1.5" fill="#475569" />
                      <circle cx="180" cy="110" r="1.5" fill="#475569" />
                      <circle cx="240" cy="90" r="1.5" fill="#475569" />
                      <circle cx="280" cy="140" r="1.5" fill="#475569" />
                      <circle cx="320" cy="160" r="1.5" fill="#475569" />
                      <circle cx="520" cy="80" r="1.5" fill="#475569" />
                      <circle cx="560" cy="110" r="1.5" fill="#475569" />
                      <circle cx="820" cy="160" r="1.5" fill="#475569" />
                      <circle cx="860" cy="190" r="1.5" fill="#475569" />
                    </svg>

                    {/* Dynamic Interactive Region Nodes overlays */}
                    <div className="relative z-10 flex-1 w-full h-full min-h-[260px]">
                      
                      {/* Region Node: US-WEST1 (Oregon) */}
                      <div 
                        onClick={() => setSelectedMapRegion('us-west1')}
                        className={`absolute left-[18%] top-[34%] group/node cursor-pointer hover:scale-105 transition-transform select-none rounded-full p-1.5 transition-all ${
                          selectedMapRegion === 'us-west1' ? 'bg-slate-900/90 border border-sandbox-orange shadow-[0_0_15px_rgba(242,153,74,0.4)]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="absolute left-6 -top-6 hidden group-hover/node:block w-48 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-mono z-50 whitespace-normal shadow-black/80">
                          <strong className="text-white block text-[10px]">us-west1 (Oregon)</strong>
                          • Sandboxes: 64 active<br/>
                          • Templates: python-agent<br/>
                          • Snapshots: 2 Ready
                        </span>
                        <span className="h-3 w-3 rounded-full bg-sandbox-orange border border-black flex items-center justify-center relative">
                          {(!selectedMapRegion || selectedMapRegion === 'us-west1') && usWestStatusOverride !== 'Optimal' && (
                            <span className="h-2.5 w-2.5 rounded-full bg-sandbox-orange animate-ping absolute" />
                          )}
                        </span>
                        <span className="text-[9px] font-mono font-black text-slate-300 absolute top-5 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-900 px-1 py-0.5 rounded whitespace-nowrap">us-west1</span>
                      </div>

                      {/* Region Node: US-CENTRAL1 (Iowa - Registry Hub) */}
                      <div 
                        onClick={() => setSelectedMapRegion('us-central1')}
                        className={`absolute left-[25%] top-[38%] group/node cursor-pointer hover:scale-105 transition-transform select-none rounded-full p-1.5 transition-all ${
                          selectedMapRegion === 'us-central1' ? 'bg-slate-900/90 border border-sandbox-cyan shadow-[0_0_15px_rgba(0,245,255,0.4)]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="absolute left-6 -top-6 hidden group-hover/node:block w-48 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-mono z-50 whitespace-normal shadow-black/80">
                          <strong className="text-white block text-[10px]">us-central1 (Iowa - Hub)</strong>
                          • Sandboxes: 380 active<br/>
                          • Templates: 4 Registry templates<br/>
                          • Snapshots: 8 Ready
                        </span>
                        <span className="h-3.5 w-3.5 rounded-full bg-sandbox-cyan border border-black flex items-center justify-center relative shadow-[0_0_10px_rgba(0,245,255,0.4)]">
                          <span className="h-2.5 w-2.5 rounded-full bg-sandbox-cyan" />
                        </span>
                        <span className="text-[9px] font-mono font-black text-white absolute top-5 left-1/2 -translate-x-1/2 bg-sandbox-cyan/25 border border-sandbox-cyan/30 px-1 py-0.5 rounded whitespace-nowrap shadow-md shadow-black/80">us-central1 ★</span>
                      </div>

                      {/* Region Node: US-EAST4 (Virginia) */}
                      <div 
                        onClick={() => setSelectedMapRegion('us-east4')}
                        className={`absolute left-[34%] top-[42%] group/node cursor-pointer hover:scale-105 transition-transform select-none rounded-full p-1.5 transition-all ${
                          selectedMapRegion === 'us-east4' ? 'bg-slate-900/90 border border-sandbox-cyan shadow-[0_0_15px_rgba(0,245,255,0.4)]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="absolute left-6 -top-6 hidden group-hover/node:block w-48 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-mono z-50 whitespace-normal shadow-black/80">
                          <strong className="text-white block text-[10px]">us-east4 (Virginia)</strong>
                          • Sandboxes: 98 active<br/>
                          • Templates: node-sandbox-executor<br/>
                          • Snapshots: 3 Ready
                        </span>
                        <span className="h-3 w-3 rounded-full bg-sandbox-cyan border border-black flex items-center justify-center relative">
                          {selectedMapRegion === 'us-east4' && (
                            <span className="h-2.5 w-2.5 rounded-full bg-sandbox-cyan animate-ping absolute" />
                          )}
                        </span>
                        <span className="text-[9px] font-mono font-black text-slate-300 absolute top-5 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-900 px-1 py-0.5 rounded whitespace-nowrap">us-east4</span>
                      </div>

                      {/* Region Node: EUROPE-WEST3 (Frankfurt) */}
                      <div 
                        onClick={() => setSelectedMapRegion('europe-west3')}
                        className={`absolute left-[54%] top-[30%] group/node cursor-pointer hover:scale-105 transition-transform select-none rounded-full p-1.5 transition-all ${
                          selectedMapRegion === 'europe-west3' ? 'bg-slate-900/90 border border-sandbox-violet shadow-[0_0_15px_rgba(157,95,242,0.4)]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="absolute left-6 -top-6 hidden group-hover/node:block w-48 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-mono z-50 whitespace-normal shadow-black/80">
                          <strong className="text-white block text-[10px]">europe-west3 (Frankfurt)</strong>
                          • Sandboxes: 142 active<br/>
                          • Templates: 2 replicated models<br/>
                          • Snapshots: 3 Ready
                        </span>
                        <span className="h-3 w-3 rounded-full bg-sandbox-violet border border-black flex items-center justify-center relative">
                          {selectedMapRegion === 'europe-west3' && (
                            <span className="h-2 w-2 rounded-full bg-sandbox-violet animate-pulse absolute" />
                          )}
                        </span>
                        <span className="text-[9px] font-mono font-black text-slate-300 absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-900 px-1 py-0.5 rounded whitespace-nowrap">europe-west3</span>
                      </div>

                      {/* Region Node: ASIA-EAST1 (Taiwan) */}
                      <div 
                        onClick={() => setSelectedMapRegion('asia-east1')}
                        className={`absolute left-[84%] top-[56%] group/node cursor-pointer hover:scale-105 transition-transform select-none rounded-full p-1.5 transition-all ${
                          selectedMapRegion === 'asia-east1' ? 'bg-slate-900/90 border border-sandbox-green shadow-[0_0_15px_rgba(46,209,104,0.4)]' : 'hover:bg-slate-900/40'
                        }`}
                      >
                        <span className="absolute right-6 -top-6 hidden group-hover/node:block w-48 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-250 font-mono z-50 whitespace-normal shadow-black/80">
                          <strong className="text-white block text-[10px]">asia-east1 (Taiwan)</strong>
                          • Sandboxes: 63 active<br/>
                          • Templates: python-agent-runner<br/>
                          • Snapshots: 2 Ready
                        </span>
                        <span className="h-3 w-3 rounded-full bg-sandbox-green border border-black flex items-center justify-center relative">
                          {selectedMapRegion === 'asia-east1' && (
                            <span className="h-2 w-2 rounded-full bg-sandbox-green animate-pulse absolute" />
                          )}
                        </span>
                        <span className="text-[9px] font-mono font-black text-slate-300 absolute top-4 left-1/2 -translate-x-1/2 bg-slate-950/80 border border-slate-900 px-1 py-0.5 rounded whitespace-nowrap">asia-east1</span>
                      </div>

                    </div>

                    <div className="text-[9px] font-mono text-slate-500 relative z-10 border-t border-white/5 pt-2 flex justify-between select-none">
                      <span>Connected to regional GKE Autopilot node group planes via Google Front End (GFE) network meshes</span>
                      <span className="text-sandbox-cyan font-bold">★★ registry synchronization active</span>
                    </div>
                  </div>

                  {/* Right Column: Detailed Regional Topology Distribution OR Regional Active Claims HUD */}
                  <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between font-mono text-xs gap-4 min-h-[360px] transition-all">
                    
                    {selectedMapRegion ? (
                      /* REGION DRILLDOWN ACTIVE CLAIMS HUD PANEL */
                      <div className="flex-1 flex flex-col justify-between gap-3 animate-fade-in">
                        <div>
                          <button 
                            onClick={() => setSelectedMapRegion(null)}
                            className="text-sandbox-cyan hover:underline text-[9px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1 select-none cursor-pointer"
                          >
                            ← Back to Global View
                          </button>
                          <h4 className="text-[11px] font-black text-white uppercase tracking-wider border-b border-slate-850 pb-2 select-none flex items-center gap-1">
                            <Server className="h-3.5 w-3.5 text-sandbox-cyan" /> Deployed claims: {selectedMapRegion}
                          </h4>
                        </div>

                        <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar max-h-[250px] mt-2 pr-0.5">
                          
                          {/* Warning Scenario Case: US-WEST1 (Oregon) has scheduling queue failures */}
                          {selectedMapRegion === 'us-west1' && (
                            <>
                              {usWestStatusOverride !== 'Optimal' ? (
                                <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-2xl flex flex-col gap-2 animate-fade-in">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                                    <div className="text-[10px] text-slate-300 leading-relaxed">
                                      <strong className="text-white block">⚠️ REGIONAL SCHEDULER CRITICAL</strong>
                                      Compute Engine vCPU quotas exhausted in <code className="text-white">us-west1-b</code>. 2 allocations starved.
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => requestActionConfirmation('Re-route us-west1 pending allocations to us-central1 hub')}
                                    className="w-full py-1 bg-sandbox-orange text-slate-950 hover:bg-orange-400 font-bold text-[9px] rounded transition-all cursor-pointer flex items-center justify-center gap-1"
                                  >
                                    <Zap className="h-3 w-3" /> RE-ROUTE TO US-CENTRAL1 HUB
                                  </button>
                                </div>
                              ) : (
                                <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl flex items-center gap-2 animate-fade-in">
                                  <CheckCircle className="h-4 w-4 text-sandbox-green shrink-0" />
                                  <div className="text-[10px] text-slate-300">
                                    <strong className="text-white block">REACTION SUCCESSFUL</strong>
                                    Claims dynamically re-routed to Central pool GKE nodes. Region is optimal.
                                  </div>
                                </div>
                              )}

                              {/* Active Claims listing inside us-west1 */}
                              <div className="space-y-2 mt-1">
                                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className="text-white font-bold block select-all">sb-claim-w4d8</span>
                                    <span className="text-slate-400">golang-crd-validator</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded border text-[8px] font-bold ${
                                    usWestStatusOverride === 'Optimal' 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-sandbox-green' 
                                      : 'bg-red-500/10 border-red-500/20 text-rose-400 animate-pulse'
                                  }`}>
                                    {usWestStatusOverride === 'Optimal' ? 'Running' : 'Pending Starvation'}
                                  </span>
                                </div>
                                <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                  <div>
                                    <span className="text-white font-bold block select-all">sb-claim-idle-t9e1</span>
                                    <span className="text-slate-400">python-agent-runner</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded border text-[8px] font-bold ${
                                    usWestStatusOverride === 'Optimal' 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-sandbox-green' 
                                      : 'bg-red-500/10 border-red-500/20 text-rose-400'
                                  }`}>
                                    {usWestStatusOverride === 'Optimal' ? 'Running' : 'Pending Quota'}
                                  </span>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Standard healthy regions (e.g., europe-west3) */}
                          {selectedMapRegion !== 'us-west1' && (
                            <div className="space-y-2">
                              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                <div>
                                  <span className="text-white font-bold block select-all">sb-claim-x8a9</span>
                                  <span className="text-slate-400">python-agent-runner</span>
                                </div>
                                <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-sandbox-green text-[8px] font-bold">
                                  Running
                                </span>
                              </div>
                              <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
                                <div>
                                  <span className="text-white font-bold block select-all">sb-claim-y3b2</span>
                                  <span className="text-slate-400">python-agent-runner</span>
                                </div>
                                <span className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-sandbox-green text-[8px] font-bold">
                                  Running
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="bg-black/40 p-2 rounded-xl text-[9px] text-slate-300 leading-normal border border-slate-850 mt-2">
                          📌 Region <strong className="text-white">{selectedMapRegion}</strong> is actively synchronized with the central registry hub node pools.
                        </div>
                      </div>
                    ) : (
                      /* GLOBAL REGIONAL DEPLOYMENT BREAKDOWN LIST (Normal View) */
                      <>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2 select-none">
                          Regional Topology Breakdown
                        </h4>

                        <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar max-h-[240px]">
                          {[
                            { region: 'us-central1', detail: 'Iowa Hub', templates: '4 Active', sandboxes: '380 Claims', snapshots: '8 Ready', status: 'Optimal', color: 'text-sandbox-cyan bg-sandbox-cyan/10 border-sandbox-cyan/20' },
                            { region: 'europe-west3', detail: 'Frankfurt', templates: '2 Replicated', sandboxes: '142 Claims', snapshots: '3 Ready', status: 'Optimal', color: 'text-sandbox-green bg-sandbox-green/10 border-sandbox-green/20' },
                            { region: 'us-east4', detail: 'Virginia', templates: '1 Replicated', sandboxes: '98 Claims', snapshots: '3 Ready', status: 'Optimal', color: 'text-sandbox-green bg-sandbox-green/10 border-sandbox-green/20' },
                            { region: 'us-west1', detail: 'Oregon', templates: '1 Replicated', sandboxes: '64 Claims', snapshots: '2 Ready', status: usWestStatusOverride === 'Optimal' ? 'Optimal' : 'Degraded', color: usWestStatusOverride === 'Optimal' ? 'text-sandbox-green bg-sandbox-green/10 border-sandbox-green/20' : 'text-sandbox-orange bg-sandbox-orange/10 border-sandbox-orange/20' },
                            { region: 'asia-east1', detail: 'Taiwan', templates: '1 Replicated', sandboxes: '63 Claims', snapshots: '2 Ready', status: 'Optimal', color: 'text-sandbox-green bg-sandbox-green/10 border-sandbox-green/20' }
                          ].map((item, k) => (
                            <div 
                              key={k} 
                              onClick={() => setSelectedMapRegion(item.region)}
                              className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 hover:border-slate-800 hover:bg-slate-900/30 transition-all cursor-pointer animate-fade-in"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <strong className="text-white font-bold text-[11px]">{item.region} <span className="text-slate-500 font-normal">({item.detail})</span></strong>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${item.color}`}>{item.status}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-400">
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-500 font-bold">Templates</span>
                                  <span className="text-white font-semibold">{item.templates}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-500 font-bold">Active Pods</span>
                                  <span className="text-sandbox-cyan font-bold">{item.sandboxes}</span>
                                </div>
                                <div>
                                  <span className="block text-[8px] uppercase text-slate-500 font-bold">Snapshots</span>
                                  <span className="text-sandbox-green font-bold">{item.snapshots}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-black/40 border border-slate-855 p-2.5 rounded-xl text-[9px] text-slate-300 leading-normal leading-relaxed select-none border-t border-white/5 mt-2">
                          💡 <strong className="text-white">SRE Tip:</strong> Sandbox reservations are automatically routed to the closest geographical GCP region to guarantee sub-second template loading latencies and avoid cross-zone data latency overhead.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* BRAND NEW DELIVERABLE: LIVE GKE DNS INTERCEPT & THREAT REMEDIATION CONSOLE (The "Wow" Centerpiece) */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-3xl p-5 shadow-xl animate-fade-in select-none w-full">
                <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2.5">
                  <h3 className="text-xs font-black font-mono uppercase tracking-wider text-sandbox-cyan flex items-center gap-2">
                    <Radio className="h-4 w-4 text-sandbox-cyan" /> GKE DNS Network Intercept & Threat Remediation Console
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sandbox-green" />
                    <span className="text-[9px] font-mono text-slate-450 font-bold uppercase tracking-wider">
                      L7 Egress Security proxy listening
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                  {/* Left Panel: scrolling live log stream of intercepted agent DNS queries */}
                  <div className="lg:col-span-2 bg-black/50 border border-slate-850/80 rounded-2xl p-4 min-h-[220px] max-h-[220px] overflow-y-auto no-scrollbar font-mono text-[10px] leading-relaxed text-slate-300 flex flex-col gap-2">
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 select-none">
                      Raw Egress Socket Interception Logs (runsc-network-filter)
                    </div>
                    
                    {/* Log rows */}
                    <div className="space-y-1.5 flex-1 overflow-y-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-550">[13:24:02]</span>
                        <span className="text-sandbox-cyan font-bold">sb-claim-x8a9</span>
                        <span className="text-slate-400">L7 DNS query to</span>
                        <code className="text-white font-bold">api.openai.com</code>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 rounded text-[8px] font-bold ml-auto">ALLOWED</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-550">[13:24:05]</span>
                        <span className="text-sandbox-cyan font-bold">sb-claim-y3b2</span>
                        <span className="text-slate-400">L7 DNS query to</span>
                        <code className="text-white font-bold">pypi.org</code>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 rounded text-[8px] font-bold ml-auto">ALLOWED</span>
                      </div>
                      
                      {/* The Threat Incident row */}
                      {((sandboxLifecycleMap['sb-claim-x8a9'] || 'Running') !== 'Terminated') && (
                        <div className="flex items-center gap-2 p-1 bg-red-950/10 border border-red-900/30 rounded-lg animate-pulse text-rose-300">
                          <span className="text-red-500">[13:24:12]</span>
                          <span className="text-red-400 font-bold">sb-claim-x8a9</span>
                          <span>Outbound TCP raw socket connection to</span>
                          <code className="text-white font-black bg-red-950 border border-red-800 px-1 py-0.5 rounded select-all">malicious-exfil-node.ru</code>
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-rose-400 border border-red-500/30 rounded text-[8px] font-bold ml-auto">BLOCKED</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <span className="text-slate-550">[13:24:15]</span>
                        <span className="text-sandbox-cyan font-bold">sb-claim-z7c1</span>
                        <span className="text-slate-400">L7 DNS query to</span>
                        <code className="text-white font-bold">github.com</code>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-sandbox-green border border-emerald-500/20 rounded text-[8px] font-bold ml-auto">ALLOWED</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel: Threat remediation actions */}
                  <div className="bg-slate-950/50 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between gap-3 font-mono text-xs select-none">
                    <div>
                      <span className="px-1.5 py-0.5 bg-red-500/10 text-rose-400 border border-red-500/20 rounded text-[8px] font-bold uppercase tracking-wide block w-max mb-2">
                        Threat Detected
                      </span>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider mb-1">
                        Exfiltration Attempt Blocked
                      </h4>
                      <p className="text-slate-400 text-[10px] leading-relaxed">
                        Sandbox <strong className="text-white">sb-claim-x8a9</strong> running untrusted Python agent script attempted out-of-allowlist socket connection to <code className="text-rose-400 font-bold">malicious-exfil-node.ru</code>.
                      </p>
                    </div>

                    {((sandboxLifecycleMap['sb-claim-x8a9'] || 'Running') !== 'Terminated') ? (
                      <button
                        onClick={() => requestActionConfirmation('sb-evict-sb-claim-x8a9')}
                        className="w-full py-2 bg-red-600 hover:bg-red-500 text-white font-black font-mono text-[10px] rounded-lg shadow-md shadow-red-950/40 transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" /> QUARANTINE & TERMINATE sb-claim-x8a9
                      </button>
                    ) : (
                      <div className="w-full py-2 bg-emerald-950/30 border border-emerald-900/30 text-sandbox-green font-black text-center text-[9px] rounded-lg flex items-center justify-center gap-1 select-none animate-fade-in">
                        <CheckCircle className="h-3.5 w-3.5" /> ROGUE INSTANCE TERMINATED
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resource Availability GKE SKUs Grid */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 shadow-xl animate-fade-in w-full">
                <div className="flex justify-between items-center mb-6 border-b border-slate-850 pb-3 select-none">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Server className="h-4 w-4 text-sandbox-cyan" /> Global GKE Accelerator SKU Availability Matrix
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500">
                    OPPORTUNISTIC CAPACITY FOR SPOT / PREEMPTIBLE VM ALLOCATIONS
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    {
                      name: 'Standard Memory',
                      type: 'DDR5 Node RAM',
                      inUse: '241,050 GiB',
                      free: '59,400 GiB',
                      pct: 80,
                      contiguous: '12K GiB block',
                      risk: 'Low Preempt',
                      riskPct: 5,
                      color: 'from-emerald-500/10 to-teal-500/10',
                      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                      glow: 'shadow-[0_0_15px_rgba(16,185,129,0.05)] border-slate-800 hover:border-emerald-500/30'
                    },
                    {
                      name: 'Compute CPU',
                      type: 'GKE Node vCPUs',
                      inUse: '1,240 Cores',
                      free: '360 Cores',
                      pct: 78,
                      contiguous: '128 Core Pool',
                      risk: 'Low Preempt',
                      riskPct: 8,
                      color: 'from-blue-500/10 to-indigo-500/10',
                      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.05)] border-slate-800 hover:border-blue-500/30'
                    },
                    {
                      name: 'NVIDIA A100',
                      type: '80GB SXM4 Tensor',
                      inUse: '320 GPUs',
                      free: '180 GPUs',
                      pct: 64,
                      contiguous: '64 GPU Slice',
                      risk: '12% Risk',
                      riskPct: 12,
                      color: 'from-sandbox-cyan/10 to-blue-600/10',
                      badge: 'bg-sandbox-cyan/10 text-sandbox-cyan border-sandbox-cyan/20',
                      glow: 'shadow-[0_0_15px_rgba(0,245,255,0.05)] border-slate-800 hover:border-sandbox-cyan/30'
                    },
                    {
                      name: 'NVIDIA H100',
                      type: '80GB PCIe Hopper',
                      inUse: '640 GPUs',
                      free: '1,360 GPUs',
                      pct: 32,
                      contiguous: '128 GPU Slice',
                      risk: '88% Risk ⚠️',
                      riskPct: 88,
                      color: 'from-rose-500/10 to-amber-500/10',
                      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.08)] border-rose-950/30 hover:border-rose-850'
                    },
                    {
                      name: 'Google TPU v4',
                      type: 'Tensor Pod Slices',
                      inUse: '5 Slices',
                      free: '59 Slices',
                      pct: 8,
                      contiguous: '16 Slice Pod',
                      risk: '45% Risk',
                      riskPct: 45,
                      color: 'from-sandbox-violet/10 to-purple-600/10',
                      badge: 'bg-sandbox-violet/10 text-sandbox-violet border-sandbox-violet/20',
                      glow: 'shadow-[0_0_15px_rgba(157,95,242,0.05)] border-slate-800 hover:border-sandbox-violet/30'
                    }
                  ].map((sku) => (
                    <div 
                      key={sku.name} 
                      className={`relative bg-slate-950/60 rounded-2xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 duration-300 border ${sku.glow} group`}
                    >
                      <div className={`absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br ${sku.color} rounded-full blur-2xl opacity-10 group-hover:opacity-30 transition-all`} />
                      
                      <div>
                        <div className="flex justify-between items-start mb-3 select-none">
                          <div>
                            <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border font-bold ${sku.badge}`}>{sku.type}</span>
                            <h4 className="text-sm font-black font-mono text-white tracking-tight mt-1.5">{sku.name}</h4>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9px] font-mono font-bold ${sku.riskPct > 60 ? 'text-rose-400 font-extrabold' : sku.riskPct > 30 ? 'text-amber-400' : 'text-sandbox-green'}`}>
                              {sku.risk}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 mb-3">
                          <div className="flex justify-between items-center text-[9px] font-mono text-slate-300 mb-1">
                            <span>Capacity Used</span>
                            <span className="font-bold text-white">{sku.pct}%</span>
                          </div>
                          <div className="w-full bg-slate-900/90 rounded-full h-1.5 p-[1px] flex overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${sku.riskPct > 60 ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-sandbox-cyan to-blue-500'}`}
                              style={{ width: `${sku.pct}%` }} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2.5 border-t border-white/5 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-300">
                          <span>In Use:</span>
                          <strong className="text-slate-250 font-bold">{sku.inUse}</strong>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Free:</span>
                          <strong className="text-sandbox-green font-bold">{sku.free}</strong>
                        </div>
                        <div className="flex justify-between items-center pt-1 text-slate-400 border-t border-white/5">
                          <span className="flex items-center gap-1 select-none"><Box className="h-3 w-3 text-slate-500 shrink-0" /> Max Sched Block:</span>
                          <span className="text-sandbox-cyan font-extrabold select-all">{sku.contiguous}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TEMPLATES CATALOG */}
          {currentDashboardTab === 'templates' && (
            <div className="space-y-8 animate-fade-in">
              {/* Consolidated Platform Hero Metrics Deck (Set 2) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0 animate-fade-in">
                {/* CARD 1: ACTIVE SANDBOX CLAIMS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Active Sandbox Claims</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Total running isolated infrastructure instances globally paired with runtime isolation status.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-1 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{metrics.totalClaims}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Pods</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="text-2xl font-black font-mono text-sandbox-cyan tracking-tight">Optimal</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">runsc</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
                      <span>Kernel Isolation Integrity:</span>
                      <span className="text-sandbox-green font-bold">100% Intact</span>
                    </div>
                    <div className="flex justify-between text-slate-400 whitespace-nowrap">
                      <span>Detected Kernel Escapes:</span>
                      <span className="text-white font-bold">0 Incidents</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: REGISTERED TEMPLATE SPECS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Registered Template Specs</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Unique verified environment template models deployed alongside primary version index tracking.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-1 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">{metrics.total}</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Models</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="text-2xl font-black font-mono text-sandbox-green tracking-tight">v2.4</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Index</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
                      <span>Spec Compliance Ratio:</span>
                      <span className="text-sandbox-cyan font-bold">100% Verified</span>
                    </div>
                    <div className="flex justify-between text-slate-400 whitespace-nowrap">
                      <span>Reconciliation Overheads:</span>
                      <span className="text-slate-300 font-bold">${metrics.totalCost.toFixed(2)}/day</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: WARMPOOL FLEET READINESS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Warmpool Fleet Readiness</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Aggregated provisioned warm buffer depths paired with instant rehydration latency benchmarks.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between mb-1 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-white tracking-tight">35</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Buffer Pods</span>
                      </div>
                      <div className="flex items-baseline gap-1 text-right">
                        <span className="text-2xl font-black font-mono text-purple-400 tracking-tight">&lt;1.8s</span>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Latency</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
                    <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
                      <span>Warmpool Cache Health:</span>
                      <span className="text-sandbox-green font-bold">Reconciled</span>
                    </div>
                    <div className="flex justify-between text-slate-400 whitespace-nowrap">
                      <span>Hit Ratio Optimization:</span>
                      <span className="text-white font-bold">94.2% Optimal</span>
                    </div>
                  </div>
                </div>

                {/* CARD 4: RESOURCE ALLOCATION QUOTAS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Resource Allocation Quotas</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Real-time aggregate compute capacity limits tracking consumed cores, memory, and cluster saturation.
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 font-mono">
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5 whitespace-nowrap">
                          <span className="text-slate-400">CPU Cores</span>
                          <span className="text-white font-bold">1240 <span className="text-slate-500">/ 1600</span></span>
                        </div>
                        <div className="w-full bg-slate-950/80 rounded-full h-1 p-[1px]">
                          <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: '78%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] mb-0.5 whitespace-nowrap">
                          <span className="text-slate-400">Memory Alloc</span>
                          <span className="text-white font-bold">4.1 <span className="text-slate-500">/ 5.0 TiB</span></span>
                        </div>
                        <div className="w-full bg-slate-950/80 rounded-full h-1 p-[1px]">
                          <div className="bg-gradient-to-r from-sandbox-cyan to-blue-400 h-full rounded-full" style={{ width: '82%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 font-mono text-[10px] overflow-hidden">
                    <div className="flex justify-between text-slate-400 whitespace-nowrap truncate">
                      <span>Limits Security:</span>
                      <span className="text-sandbox-green font-bold">Secured</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Popularity Chart */}
              <div className="bg-sandbox-surface/50 border border-slate-800/60 rounded-xl p-4 shadow-xl h-[200px] flex flex-col shrink-0 animate-fade-in">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-2 font-bold select-none">Template popularity spectrum</div>
                <div className="flex-1 w-full h-full text-[9px] font-mono">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usageData?.popularity || []} margin={{ left: -15, bottom: 15, top: 10, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#4B5563" 
                        label={{ value: 'Sandbox Environment Spec Model', position: 'insideBottom', offset: -10, fill: '#64748B', fontSize: 9 }} 
                      />
                      <YAxis 
                        stroke="#4B5563" 
                        label={{ value: 'Active Sandbox Claims', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748B', fontSize: 9 }} 
                      />
                      <ChartTooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F172A', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.9)',
                          color: '#F8FAFC',
                          padding: '8px 12px',
                          fontFamily: 'var(--font-mono)'
                        }} 
                        itemStyle={{ color: '#00F5FF', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '2px' }}
                        cursor={false} 
                      />
                      <Bar dataKey="sandboxes" name="Active Pods" fill="#00F5FF" radius={[4,4,0,0]}>
                        {(usageData?.popularity || []).map((entry, index) => <BarCell key={`cell-${index}`} fill={['#00F5FF', '#9D5FF2', '#2ED168', '#F2994A'][index % 4]} opacity={0.8} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-3 shadow-md shrink-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter templates registry by model name, project cluster ID..." className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono" />
                </div>
              </div>

              <div className="bg-sandbox-surface/90 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/50 border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="w-8 px-3 py-2 text-center"></th>
                        <th className="px-3 py-2">Template name</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-sandbox-cyan">Release Version</th>
                        <th className="px-3 py-2">Project ID</th>
                        <th className="px-3 py-2 text-right">Active claims</th>
                        <th className="px-3 py-2 text-slate-500">Location</th>
                        <th className="px-3 py-2 text-right text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-sans text-slate-300">
                      {filteredAndSortedTemplates.map((template) => {
                        const versionStr = template.id === 'python-agent-runner' ? 'v2.4.1-stable' : template.id === 'node-sandbox-executor' ? 'v1.8.0-edge' : 'v1.0.2-patch';
                        return (
                          <tr key={template.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/40">
                            <td className="px-2 py-2.5 text-center text-slate-500"></td>
                            <td className="px-3 py-2.5 font-bold text-white">{template.name}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{template.status}</span>
                            </td>
                            <td className="px-3 py-2.5 font-mono text-sandbox-cyan font-bold whitespace-nowrap">{versionStr}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-400">{template.projectId}</td>
                            <td className="px-3 py-2.5 text-right font-mono text-white font-bold">{template.activeClaims}</td>
                            <td className="px-3 py-2.5 text-sandbox-cyan font-mono text-[11px] font-bold">{activeKubeContext || template.cluster}</td>
                            <td className="px-3 py-2.5 text-right">
                              <button onClick={() => { setSelectedTemplate(template); setEditableYaml(getYamlSpecString(template)); }} className="text-[11px] text-sandbox-cyan hover:underline font-mono font-bold whitespace-nowrap">View details ➔</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVE CLAIMS SANDBOXES */}
          {currentDashboardTab === 'sandboxes' && (
            <div className="space-y-8 animate-fade-in">
              {/* Sandboxes Observability Metrics Deck */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0 animate-fade-in">
                {/* CARD 1: ACTIVE SANDBOX CLAIMS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Active Sandbox Claims</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Total active running isolated sandbox container claims globally provisioned.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap truncate">
                      <span className="text-2xl font-black font-mono text-white tracking-tight truncate max-w-[180px]">{sampleActiveSandboxesList.length}</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Instances</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Spec Verified:</span>
                      <span className="text-sandbox-cyan font-bold">Secure Bound</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                      <span className="text-slate-400">Driver Kernel:</span>
                      <span className="text-slate-300 font-semibold">runsc (gVisor)</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: COMPUTE NODE DISTRIBUTION */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Compute Node Distribution</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Distribution of sandbox claim pods across physical compute node groups.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">100%</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Balanced</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Active Nodes:</span>
                      <span className="text-sandbox-green font-bold truncate max-w-[100px]">14 Pools</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                      <span className="text-slate-400">Load Distribution:</span>
                      <span className="text-slate-300 font-semibold">Rebalanced</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: EGRESS NETWORK ACCESS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Egress Network Access</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Enforced Layer 7 allowlist network boundaries dropping unsanctioned external payload destinations.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-xl font-black font-mono text-sandbox-cyan tracking-tight">DNS Allowed</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Active Sockets:</span>
                      <span className="text-white font-bold">24 Bound</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                      <span className="text-slate-400">Exfil Traps:</span>
                      <span className="text-sandbox-orange font-bold">0 Caught</span>
                    </div>
                  </div>
                </div>

                {/* CARD 4: KERNEL HEAP OVERHEADS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Kernel Heap Overheads</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Active memory overheads allocated specifically to secure runsc user-space virtual kernel process handling.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">12.4</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">MiB avg</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Syscall Drops:</span>
                      <span className="text-sandbox-green font-bold">Autopilot Shield</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-0.5 whitespace-nowrap truncate">
                      <span className="text-slate-400">Tracing Buffer:</span>
                      <span className="text-purple-400 font-semibold">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Window & Utilization AreaCharts */}
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
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Real-time fleet CPU utilization</span>
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
                  <span className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Real-time fleet Memory utilization</span>
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
                    <span className="h-2 w-2 rounded-full bg-sandbox-cyan" />
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

              {/* Zombie Sandbox spend reclamation banner */}
              {((sandboxLifecycleMap['sb-claim-x8a9'] || 'Running') !== 'Terminated' || 
                (sandboxLifecycleMap['sb-claim-y3b2'] || 'Running') !== 'Terminated') && (
                <div className="bg-slate-950/60 border border-sandbox-orange/30 rounded-2xl p-4 shadow-lg animate-fade-in select-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-sandbox-orange" />
                  <div className="space-y-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-sandbox-orange/10 text-sandbox-orange border border-sandbox-orange/20 text-[9px] font-bold">
                        🧟 3 Zombie Sandboxes Detected
                      </span>
                      <span className="text-white text-[10px] font-bold">UNATTENDED IDLE ALLOCATIONS</span>
                    </div>
                    <p className="text-slate-300 text-[10px] leading-relaxed">
                      Claims <strong className="text-white">sb-claim-x8a9</strong>, <strong className="text-white">sb-claim-y3b2</strong>, and <strong className="text-white">sb-claim-z7c1</strong> are consuming <strong className="text-sandbox-cyan">2.4 GPUs / 4.6 GiB RAM</strong> with 0% active sockets for over 30m.
                    </p>
                    <span className="text-red-400 block text-[9px] font-bold">
                      Wasting an estimated $580.00 / month in regional compute allocation spend!
                    </span>
                  </div>
                  <button 
                    onClick={() => requestActionConfirmation('Evict and recycle all 3 idle zombie sandboxes to reclaim $580/mo spend')}
                    className="px-3 py-1.5 bg-sandbox-orange text-slate-950 hover:bg-orange-400 font-mono text-[10px] font-extrabold rounded-lg shadow-md transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Zap className="h-3.5 w-3.5" /> RECLAIM IDLE SPEND
                  </button>
                </div>
              )}

              <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-3 shadow-md shrink-0">
                <div className="relative flex items-center">
                  <Search className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter active claims by container sandbox ID or template..." className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono" />
                </div>
              </div>

              <div className="bg-sandbox-surface/90 border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse select-none">
                    <thead className="bg-black/50 border-b border-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={selectedSandboxIds.size === filteredAndSortedSandboxes.filter(s => (sandboxLifecycleMap[s.id] || s.status) !== 'Terminated').length && filteredAndSortedSandboxes.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                const activeIds = filteredAndSortedSandboxes
                                  .filter(s => (sandboxLifecycleMap[s.id] || s.status) !== 'Terminated')
                                  .map(s => s.id);
                                setSelectedSandboxIds(new Set(activeIds));
                              } else {
                                setSelectedSandboxIds(new Set());
                              }
                            }}
                            className="accent-sandbox-cyan cursor-pointer h-3.5 w-3.5 rounded bg-black border-slate-800"
                          />
                        </th>
                        <th className="px-4 py-2.5">Sandbox claim ID</th>
                        <th className="px-4 py-2.5">Template runtime</th>
                        <th className="px-4 py-2.5">Orchestrator Priority</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5">Compute Quota</th>
                        <th className="px-4 py-2.5">Cluster scope</th>
                        <th className="px-4 py-2.5 font-mono text-slate-500 text-right">Lifespan remaining</th>
                        <th className="px-4 py-2.5 text-right text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300 text-[11px]">
                      {filteredAndSortedSandboxes.map((sandbox) => {
                        const liveStatus = sandboxLifecycleMap[sandbox.id] || sandbox.status;
                        const isTerminated = liveStatus === 'Terminated';

                        return (
                          <tr 
                            key={sandbox.id} 
                            className={`transition-colors border-b border-slate-800/40 ${
                              isTerminated 
                                ? 'bg-red-950/5 opacity-40 hover:bg-red-950/10' 
                                : liveStatus === 'Suspended'
                                ? 'bg-sandbox-orange/5 hover:bg-slate-800/25'
                                : 'hover:bg-slate-800/30'
                            }`}
                          >
                            {/* Checkbox column */}
                            <td className="px-4 py-2.5 text-center">
                              {!isTerminated && (
                                <input 
                                  type="checkbox"
                                  checked={selectedSandboxIds.has(sandbox.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedSandboxIds);
                                    if (e.target.checked) {
                                      newSet.add(sandbox.id);
                                    } else {
                                      newSet.delete(sandbox.id);
                                    }
                                    setSelectedSandboxIds(newSet);
                                  }}
                                  className="accent-sandbox-cyan cursor-pointer h-3.5 w-3.5 rounded bg-black border-slate-800"
                                />
                              )}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-white flex items-center gap-1.5">
                              <Box className={`h-3.5 w-3.5 ${isTerminated ? 'text-slate-600' : liveStatus === 'Suspended' ? 'text-sandbox-orange' : 'text-sandbox-cyan'}`} /> 
                              <span className="select-all">{sandbox.id}</span>
                            </td>
                            <td className="px-4 py-2.5 font-sans font-semibold text-slate-400">{sandbox.template}</td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${
                                sandbox.priority === 'Critical-Agent'
                                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                  : 'bg-slate-950 border-slate-900 text-slate-400'
                              }`}>
                                {sandbox.priority || 'Standard'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${
                                isTerminated 
                                  ? 'bg-red-500/10 border-red-500/20 text-rose-400' 
                                  : liveStatus === 'Suspended'
                                  ? 'bg-sandbox-orange/10 border-sandbox-orange/20 text-sandbox-orange'
                                  : 'bg-emerald-500/10 border-emerald-500/20 text-sandbox-green'
                              }`}>
                                {liveStatus}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{sandbox.cpu} / {sandbox.memory}</td>
                            <td className="px-4 py-2.5 text-sandbox-cyan font-mono text-xs font-bold">{activeKubeContext || sandbox.cluster}</td>
                            <td className="px-4 py-2.5 text-right text-slate-500 font-bold">{sandbox.elapsed}</td>
                            <td className="px-4 py-2.5 text-right flex items-center justify-end gap-2">
                              
                              {/* Quick Row Actions */}
                              {!isTerminated && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newStatus = liveStatus === 'Suspended' ? 'Running' : 'Suspended';
                                      setSandboxLifecycleMap(prev => ({ ...prev, [sandbox.id]: newStatus }));
                                      triggerLifecycleAction(`${newStatus === 'Suspended' ? 'Suspending' : 'Resuming'} sandbox ${sandbox.id}`);
                                    }}
                                    title={liveStatus === 'Suspended' ? 'Resume sandbox' : 'Suspend sandbox'}
                                    className={`p-1 rounded border transition-colors cursor-pointer ${
                                      liveStatus === 'Suspended'
                                        ? 'bg-sandbox-green/10 hover:bg-sandbox-green/20 border-sandbox-green/30 text-sandbox-green'
                                        : 'bg-black/40 hover:bg-slate-850 border-slate-800 hover:border-sandbox-orange text-slate-400 hover:text-sandbox-orange'
                                    }`}
                                  >
                                    {liveStatus === 'Suspended' ? (
                                      <Play className="h-3 w-3" />
                                    ) : (
                                      <Pause className="h-3 w-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      requestActionConfirmation(`sb-evict-${sandbox.id}`);
                                    }}
                                    title="Terminate sandbox"
                                    className="p-1 rounded bg-red-950/20 hover:bg-red-900/20 border border-red-900/30 hover:border-red-800 text-red-400 hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}

                              <button 
                                onClick={() => setSelectedSandbox(sandbox)}
                                className="px-2 py-1 rounded bg-sandbox-cyan/10 border border-sandbox-cyan/30 text-sandbox-cyan hover:bg-sandbox-cyan hover:text-slate-950 text-[10px] font-sans font-bold transition-all shadow-sm cursor-pointer"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Floating Bulk Actions Dock */}
              {selectedSandboxIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-red-500/30 rounded-2xl px-6 py-3.5 shadow-[0_10px_40px_rgba(239,68,68,0.2)] z-50 flex items-center gap-5 text-xs font-mono animate-fade-in backdrop-blur-md">
                  <div className="flex items-center gap-2 select-none">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-slate-300">Selected: <strong className="text-red-400 font-bold select-all">{selectedSandboxIds.size} active instances</strong></span>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => requestActionConfirmation(`bulk-suspend-${Array.from(selectedSandboxIds).join(',')}`)}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 hover:border-slate-600 text-slate-200 hover:text-white font-bold rounded-lg transition-all cursor-pointer"
                    >
                      BULK SUSPEND
                    </button>
                    <button 
                      onClick={() => requestActionConfirmation(`bulk-terminate-${Array.from(selectedSandboxIds).join(',')}`)}
                      className="px-3.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-800 text-red-400 hover:text-white font-bold rounded-lg transition-all cursor-pointer"
                    >
                      BULK TERMINATE
                    </button>
                  </div>
                  <div className="h-4 w-px bg-slate-800" />
                  <button 
                    onClick={() => setSelectedSandboxIds(new Set())}
                    className="text-slate-500 hover:text-white transition-colors cursor-pointer font-bold"
                  >
                    CLEAR
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 4: AVAILABLE SNAPSHOTS */}
          {currentDashboardTab === 'snapshots' && (
            <div className="space-y-8 animate-fade-in w-full">
              {/* Snapshots Observability Metrics Deck */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 shrink-0 animate-fade-in">
                {/* CARD 1: TOTAL CAPTURED SNAPSHOTS */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Total Captured Snapshots</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Total frozen memory footprints and snapshot state images ready for instant hydration.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">{snapshotsList.length}</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Images</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Hydration Ready:</span>
                      <span className="text-sandbox-green font-bold">100%</span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: STORAGE VOLUME ATTRIBUTED */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Storage Volume Attributed</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Total Google Cloud Storage bucket capacity consumed by compressed tarball runtime snapshot checkpoints.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-sandbox-cyan tracking-tight">1.4 GB</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Tarballs</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Storage Class:</span>
                      <span className="text-slate-300 font-semibold">Standard Nearline</span>
                    </div>
                  </div>
                </div>

                {/* CARD 3: WARMPOOL HYDRATION LATENCY */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Warmpool Hydration Latency</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Mean duration required to uncompress and hydrate a frozen memory image into a running sandbox pod.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-2xl font-black font-mono text-purple-400 tracking-tight">420ms</span>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Mean</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">P99 Tail Latency:</span>
                      <span className="text-amber-300 font-semibold">850ms</span>
                    </div>
                  </div>
                </div>

                {/* CARD 4: RECONCILIATION INTEGRITY */}
                <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
                  <div>
                    <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
                      <div className="relative flex items-center gap-1 group/tooltip">
                        <span>Reconciliation Integrity</span>
                        <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                          Continuous state verification ensuring snapshots match GKE custom resource definition spec manifests.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1 whitespace-nowrap">
                      <span className="text-xl font-black font-mono text-sandbox-green tracking-tight">100% Verified</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-[10px] font-mono pt-2.5 border-t border-white/5 overflow-hidden">
                    <div className="flex justify-between items-center bg-slate-900/40 px-2 py-1 rounded whitespace-nowrap truncate">
                      <span className="text-slate-400">Corrupted Checkpoints:</span>
                      <span className="text-white font-bold">0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl shadow-inner text-xs font-mono">
                <div className="flex flex-col gap-1 border-r border-slate-850 pr-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Snapshots API Bound</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
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
                </div>
              </div>

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
                        <th className="px-4 py-2.5">Security Base Integrity</th>
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
                                <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold ${
                                  snap.baseSecure.includes('Secure')
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-sandbox-green'
                                    : 'bg-red-500/10 border-red-500/20 text-rose-400'
                                }`}>
                                  {snap.baseSecure}
                                </span>
                              </td>
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
                                  Create Sandbox
                                </button>
                              </td>
                            </tr>
                            
                            {isExpanded && (
                              <tr className="bg-slate-950/60 border-y border-slate-850 animate-fade-in">
                                <td colSpan={9} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono text-slate-300">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformAdminDashboard;
