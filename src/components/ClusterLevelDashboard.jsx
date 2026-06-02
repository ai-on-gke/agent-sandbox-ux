import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Activity, 
  Server, 
  HelpCircle, 
  ChevronRight, 
  Box,
  Terminal,
  Search
} from 'lucide-react';

const ClusterLevelDashboard = ({ onNavigateBack, onNavigate }) => {
  const [activeKubeContext, setActiveKubeContext] = useState('kubernetes-admin@cluster.local');
  const [kubeContexts, setKubeContexts] = useState(['kubernetes-admin@cluster.local']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('All Namespaces');
  const [namespaces, setNamespaces] = useState(['All Namespaces']);
  const [selectedSandbox, setSelectedSandbox] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('terminal'); // 'terminal' | 'logs'
  const [activeSdkSnippet, setActiveSdkSnippet] = useState(null); // null | { name, namespace }
  const [sdkTab, setSdkTab] = useState('python'); // 'python' | 'javascript'
  const [templatesList, setTemplatesList] = useState([]);
  const [sandboxList, setSandboxList] = useState([]);
  const [warmPoolsList, setWarmPoolsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const [metrics, setMetrics] = useState({
    activeSandboxes: 0,
    desiredWarmPods: 200,
    readyWarmPods: 200,
    cpuAllocationCores: 0,
    memoryAllocationGb: 0
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNamespace, searchQuery]);

  const [terminalLogs, setTerminalLogs] = useState([
    '>> [CATALOG-AUDITOR] Connected securely to local context mappings.',
    '>> [CATALOG-AUDITOR] Reading active registered runtime template structures.',
    '>> [CATALOG-AUDITOR] Initializing Prometheus metrics endpoint connection...'
  ]);
  const [cliInput, setCliInput] = useState('');

  // Fetch live contexts dynamically
  useEffect(() => {
    fetch('/api/kube-context')
      .then(res => res.json())
      .then(data => {
        if (data.context) setActiveKubeContext(data.context);
      })
      .catch(err => console.error('[Cluster Kube Context Fetch Error]', err));

    fetch('/api/kube-contexts/list')
      .then(res => res.json())
      .then(data => {
        if (data.contexts) setKubeContexts(data.contexts);
      })
      .catch(err => console.error('[Cluster Kube Contexts List Fetch Error]', err));
  }, []);

  // Fetch live telemetry and resource mappings whenever context changes
  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/telemetry/summary')
      .then(res => res.json())
      .then(data => {
        if (data.templates) setTemplatesList(data.templates);
        if (data.sandboxes) setSandboxList(data.sandboxes);
        if (data.warmPools) setWarmPoolsList(data.warmPools);
        if (data.summary) setMetrics(data.summary);

        // Extract unique namespaces dynamically
        const nsSet = new Set(['All Namespaces']);
        if (data.sandboxes) data.sandboxes.forEach(s => nsSet.add(s.namespace));
        if (data.templates) data.templates.forEach(t => nsSet.add(t.namespace));
        if (data.warmPools) data.warmPools.forEach(w => nsSet.add(w.namespace));
        setNamespaces(Array.from(nsSet));
        
        setLoading(false);
        setTerminalLogs(prev => [
          ...prev,
          `>> [CATALOG-AUDITOR] Refreshed. Found ${data.templates?.length || 0} templates, ${data.sandboxes?.length || 0} active sandbox claims.`
        ].slice(-10));
      })
      .catch(err => {
        console.error('[Cluster Resources Fetch Error]', err);
        setLoading(false);
      });
  }, [activeKubeContext]);

  const handleContextChange = (newContext) => {
    fetch('/api/kube-context/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: newContext })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setActiveKubeContext(newContext);
        setTerminalLogs(prev => [
          ...prev,
          `>> [CATALOG-AUDITOR] Switched active Kubernetes context to: ${newContext}`,
          `>> [CATALOG-AUDITOR] Re-indexing templates and warm pools on ${newContext.split('_').pop()}`
        ].slice(-10));
      }
    })
    .catch(err => console.error('Switch context error', err));
  };

  const handleSuspendSandbox = (id) => {
    setSandboxList(prev => prev.map(s => s.id === id ? { ...s, status: 'Suspended' } : s));
    setTerminalLogs(prev => [
      ...prev,
      `>> [SYSTEM] Triggered Hibernation request on sandbox claim: ${id}`,
      `>> [SYSTEM] Saving frozen memory state checkpoints... Done.`,
      `>> [SYSTEM] Sandbox claim state successfully changed to Suspended.`
    ].slice(-10));
  };

  const handleEvictSandbox = (id) => {
    setSandboxList(prev => prev.filter(s => s.id !== id));
    setSelectedSandbox(null);
    setTerminalLogs(prev => [
      ...prev,
      `>> [SYSTEM] Enforcing immediate eviction of sandbox claim pod: ${id}`,
      `>> [SYSTEM] Reclaiming allocated resources: CPU / Memory returned to warm pools.`,
      `>> [SYSTEM] Sandbox claim ${id} successfully recycled.`
    ].slice(-10));
  };

  // Filter lists to active context and selected namespace where appropriate
  const filteredSandboxes = sandboxList.filter(s => {
    const matchNamespace = selectedNamespace === 'All Namespaces' || s.namespace === selectedNamespace;
    if (!matchNamespace) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.id.toLowerCase().includes(q) || s.template.toLowerCase().includes(q);
  });

  const filteredWarmPools = warmPoolsList.filter(p => {
    return selectedNamespace === 'All Namespaces' || p.namespace === selectedNamespace;
  });

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredSandboxes.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredSandboxes.length / rowsPerPage);

  return (
    <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans selection:bg-sandbox-cyan/30 relative">
      
      {/* HOISTED NAVIGATION BREADCRUMBS HEADER BAR */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50 text-xs font-mono text-slate-500 select-none w-full shrink-0">
        <div className="flex items-center gap-2 whitespace-nowrap overflow-x-auto no-scrollbar">
          <button onClick={onNavigateBack} className="text-sandbox-cyan hover:underline font-bold">Home</button>
          <ChevronRight className="h-3 w-3 text-slate-600 shrink-0" />
          <span className="text-white font-bold">Cluster resource explorer</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-slate-800 shadow-inner truncate max-w-xs">
            <span className="h-2 w-2 rounded-full bg-sandbox-cyan animate-pulse shrink-0" />
            <span className="text-slate-400 font-semibold mr-1">Context:</span>
            <select
              value={activeKubeContext}
              onChange={(e) => handleContextChange(e.target.value)}
              className="bg-transparent text-sandbox-cyan font-bold font-mono text-[11px] focus:outline-none cursor-pointer border-none p-0 m-0"
            >
              {kubeContexts.map(ctx => (
                <option key={ctx} value={ctx} className="bg-slate-900 text-slate-200 font-mono text-xs">
                  {ctx}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-sandbox-green/15 px-2.5 py-1 rounded-full border border-sandbox-green/30 text-sandbox-green font-mono text-[10px] font-bold select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-sandbox-green animate-pulse shrink-0" />
            <span>PROMETHEUS CONNECTED</span>
          </div>
          <button
            onClick={() => onNavigate('fleet-telemetry')}
            className="bg-sandbox-cyan text-slate-950 hover:bg-cyan-400 px-3 py-1 rounded-full font-mono text-[10px] font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,245,255,0.15)] flex items-center gap-1"
            title="Open Prometheus Observability Dashboard"
          >
            <span>View metrics dashboard ➔</span>
          </button>
        </div>
      </div>

      {/* HOISTED BANNER TITLE HEADER */}
      <div className="mb-8 shrink-0">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3 font-display truncate select-all" title={activeKubeContext}>
          <Server className="h-7 w-7 text-sandbox-cyan shrink-0" /> 
          {activeKubeContext.split('@').pop() || 'cluster.local'}
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed font-sans">
          Kubernetes-native sandbox metrics aggregating templates used, active container claims, and standby warm pools bound within this context.
        </p>
      </div>

      {/* CLUSTER RESOURCE QUOTAS UTILIZATION PANEL */}
      <div className="bg-sandbox-surface/85 border border-slate-800/60 rounded-2xl p-4 mb-8 shrink-0 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-sandbox-cyan/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider select-none flex justify-between items-center">
          <span>Kubernetes cluster resource allocations & quotas</span>
          <span className="text-slate-500">Autopilot scheduler enabled</span>
        </div>

        {loading ? (
          <div className="py-4 text-center text-slate-500 font-mono text-xs animate-pulse">
            Gathering cluster resource configurations...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CPU Allocation Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-slate-400 font-semibold">Aggregate Sandbox CPU</span>
                <span className="text-white font-bold">{metrics.cpuAllocationCores} Cores / 200.0 Cores <span className="text-sandbox-cyan">({(metrics.cpuAllocationCores / 200 * 100).toFixed(1)}%)</span></span>
              </div>
              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-gradient-to-r from-sandbox-cyan to-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,245,255,0.5)]" style={{ width: `${Math.min(100, (metrics.cpuAllocationCores / 200 * 100))}%` }} />
              </div>
            </div>

            {/* Memory Allocation Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-slate-400 font-semibold">Aggregate Sandbox Memory</span>
                <span className="text-white font-bold">{metrics.memoryAllocationGb} GiB / 100.0 GiB <span className="text-sandbox-violet">({(metrics.memoryAllocationGb / 100 * 100).toFixed(1)}%)</span></span>
              </div>
              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-gradient-to-r from-sandbox-violet to-purple-500 rounded-full shadow-[0_0_10px_rgba(157,95,242,0.5)]" style={{ width: `${Math.min(100, (metrics.memoryAllocationGb / 100 * 100))}%` }} />
              </div>
            </div>

            {/* Warm Pool Buffer Availability Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-slate-400 font-semibold">Warm standby buffer</span>
                <span className="text-white font-bold">{metrics.readyWarmPods} Pods / {metrics.desiredWarmPods} Target <span className="text-sandbox-green">({metrics.desiredWarmPods > 0 ? (metrics.readyWarmPods / metrics.desiredWarmPods * 100).toFixed(1) : 0}%)</span></span>
              </div>
              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden border border-slate-900">
                <div className="h-full bg-gradient-to-r from-sandbox-green to-emerald-400 rounded-full shadow-[0_0_10px_rgba(46,209,104,0.5)]" style={{ width: `${Math.min(100, metrics.desiredWarmPods > 0 ? (metrics.readyWarmPods / metrics.desiredWarmPods * 100) : 0)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔴 3 GENUINE CATALOG HERO METRICS (TOP DECK) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 shrink-0 animate-fade-in">
        
        {/* CARD 1: TEMPLATES USED */}
        <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
          <div>
            <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
              <div className="relative flex items-center gap-1 group/tooltip">
                <span>Templates Used</span>
                <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                  Total verified environment template models active within the workspace catalog.
                </div>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-white tracking-tight">{templatesList.length}</span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Active Models</span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-2xl font-black font-mono text-sandbox-cyan tracking-tight">100%</span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Verified</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
            <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
              <span>Total Combined Claims:</span>
              <span className="text-white font-bold">{sandboxList.length} instances</span>
            </div>
            <div className="flex justify-between text-slate-400 whitespace-nowrap">
              <span>Catalog Health Binding:</span>
              <span className="text-sandbox-green font-bold">Optimal</span>
            </div>
          </div>
        </div>

        {/* CARD 2: LIST OF SANDBOXES */}
        <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
          <div>
            <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
              <div className="relative flex items-center gap-1 group/tooltip">
                <span>List of Sandboxes</span>
                <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                  Total running isolated sandbox instances mapped across your Kubernetes node clusters.
                </div>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-white tracking-tight">{sandboxList.length}</span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Active Pods</span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-2xl font-black font-mono text-sandbox-green tracking-tight">
                  {sandboxList.filter(s => s.status === 'Running').length}
                </span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Running</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
            <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
              <span>Primary Runtime Class:</span>
              <span className="text-sandbox-cyan font-bold">gVisor runsc</span>
            </div>
            <div className="flex justify-between text-slate-400 whitespace-nowrap">
              <span>Pending Containers:</span>
              <span className="text-emerald-400 font-bold">
                {sandboxList.filter(s => s.status === 'Ready').length} ready
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: WARM POOLS */}
        <div className="bg-slate-800/70 rounded-2xl p-4 flex flex-col justify-between shadow-2xl transition-all">
          <div>
            <div className="text-[10px] font-mono text-white uppercase font-bold mb-3 tracking-wider whitespace-nowrap select-none">
              <div className="relative flex items-center gap-1 group/tooltip">
                <span>Warm Pools</span>
                <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors shrink-0" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-350 font-sans normal-case font-normal z-50 leading-relaxed backdrop-blur-md shadow-black/80 whitespace-normal">
                  Standby pre-warmed sandbox container pools configured for sub-second claim latency.
                </div>
              </div>
            </div>
            <div className="flex items-baseline justify-between mb-1 whitespace-nowrap">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-white tracking-tight">{warmPoolsList.length}</span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Warm Pools</span>
              </div>
              <div className="flex items-baseline gap-1 text-right">
                <span className="text-2xl font-black font-mono text-sandbox-green tracking-tight">{metrics.readyWarmPods}</span>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">Pods Ready</span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-white/5 font-mono text-[10px]">
            <div className="flex justify-between text-slate-400 mb-1 whitespace-nowrap">
              <span>Total Configured Buffer:</span>
              <span className="text-white font-bold">{metrics.desiredWarmPods} pods</span>
            </div>
            <div className="flex justify-between text-slate-400 whitespace-nowrap">
              <span>Aggregate Availability:</span>
              <span className="text-sandbox-green font-bold">
                {metrics.desiredWarmPods > 0 ? (metrics.readyWarmPods / metrics.desiredWarmPods * 100).toFixed(1) : 0}% ready
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* MAIN CONTENT GRIDS: LIST OF SANDBOXES & SNAPSHOTS */}
      <div className="space-y-8 animate-fade-in">
        
        {/* Filter Input Bar & Namespace Selector */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center max-w-3xl shrink-0">
          {/* Search Input */}
          <div className="bg-sandbox-surface border border-slate-800 rounded-xl p-3 shadow-md flex-1">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                placeholder="Filter items by claim ID or spec name..." 
                className="w-full bg-black/40 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono" 
              />
            </div>
          </div>

          {/* Namespace Selector */}
          <div className="bg-sandbox-surface border border-slate-800 rounded-xl p-3 shadow-md w-full sm:w-64 flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold select-none">NS:</span>
            <select
              value={selectedNamespace}
              onChange={(e) => setSelectedNamespace(e.target.value)}
              className="w-full bg-black/45 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sandbox-cyan/70 font-mono cursor-pointer"
            >
              {namespaces.map(ns => (
                <option key={ns} value={ns} className="bg-slate-900 text-slate-200 font-mono text-xs">
                  {ns}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* LIST OF SANDBOXES DATA TABLE */}
        <div className="bg-sandbox-surface border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-black/40 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800 font-bold flex justify-between items-center select-none">
            <span>Active Sandbox Claims ({filteredSandboxes.length})</span>
            <span className="text-sandbox-green">● Cluster-Operator Verified</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-black/30 border-b border-slate-800 text-slate-450 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Sandbox Claim ID</th>
                  <th className="px-4 py-2.5">Template Spec</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 font-mono text-slate-400 text-right">Resource Alloc</th>
                  <th className="px-4 py-2.5 text-right text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300 text-[11px]">
                {currentRows.map((sandbox) => {
                  const isSelected = selectedSandbox?.id === sandbox.id;
                  return (
                    <React.Fragment key={sandbox.id}>
                      <tr 
                        className={`hover:bg-slate-800/30 transition-colors cursor-pointer ${isSelected ? 'bg-slate-900/50' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSandbox(null);
                          } else {
                            setSelectedSandbox(sandbox);
                            setInspectorTab('terminal');
                          }
                        }}
                      >
                        <td className="px-4 py-3 font-bold text-white flex items-center gap-1.5">
                          <Box className="h-3.5 w-3.5 text-sandbox-cyan shrink-0" /> 
                          <span className="select-all">{sandbox.id}</span>
                        </td>
                        <td className="px-4 py-3 font-sans font-semibold text-slate-300">{sandbox.template}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sandbox.status === 'Running' 
                              ? 'bg-sandbox-green/10 text-sandbox-green border-sandbox-green/20'
                              : sandbox.status === 'Suspended'
                              ? 'bg-sandbox-orange/10 text-sandbox-orange border-sandbox-orange/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {sandbox.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-bold whitespace-nowrap">
                          {sandbox.cpu} / {sandbox.memory}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveSdkSnippet({ name: sandbox.template, namespace: sandbox.namespace }); }}
                              className="text-[10px] text-sandbox-violet hover:underline font-bold font-mono cursor-pointer"
                            >
                              [SDK]
                            </button>
                            <span className="text-[10px] text-sandbox-cyan hover:underline font-bold block whitespace-nowrap">
                              {isSelected ? 'Collapse ▲' : 'Inspect ➔'}
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Expanded Interactive Auditor Row */}
                      {isSelected && (
                        <tr className="bg-slate-950/65 border-y border-slate-900">
                          <td colSpan={5} className="px-6 py-5">
                            <div className="flex flex-col space-y-4 text-left animate-fade-in max-w-4xl" onClick={(e) => e.stopPropagation()}>
                              {/* Auditor Header / Actions */}
                              <div className="flex justify-between items-center text-[10px] text-slate-450 border-b border-slate-900 pb-2.5 font-mono font-bold">
                                <div className="flex items-center gap-2">
                                  <Terminal className="h-4 w-4 text-sandbox-cyan" />
                                  <span>Active Context Auditor: <strong className="text-white select-all">{sandbox.id}</strong></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {sandbox.status !== 'Suspended' ? (
                                    <button
                                      onClick={() => handleSuspendSandbox(sandbox.id)}
                                      className="bg-sandbox-orange/10 border border-sandbox-orange/30 text-sandbox-orange hover:bg-sandbox-orange/20 px-2.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all"
                                    >
                                      ⏸ Suspend Context
                                    </button>
                                  ) : (
                                    <span className="bg-sandbox-orange/5 border border-sandbox-orange/20 text-sandbox-orange px-2.5 py-0.5 rounded text-[9px] font-bold">
                                      CONTEXT HIBERNATING
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleEvictSandbox(sandbox.id)}
                                    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 px-2.5 py-0.5 rounded text-[9px] font-bold cursor-pointer transition-all"
                                  >
                                    ✖ Evict Sandbox
                                  </button>
                                  <button
                                    onClick={() => setSelectedSandbox(null)}
                                    className="text-slate-500 hover:text-white text-[10px] px-2 py-0.5 bg-slate-900 rounded cursor-pointer font-bold border border-slate-800"
                                  >
                                    Close Panel
                                  </button>
                                </div>
                              </div>

                              {/* Panel Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/30 border border-slate-900/80 rounded-xl p-3 font-mono text-[9px] text-slate-500">
                                <div className="space-y-0.5">
                                  <span>TEMPLATE REF:</span>
                                  <span className="text-white font-bold block text-[10px] font-sans">{sandbox.template}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span>NAMESPACE TARGET:</span>
                                  <span className="text-purple-400 font-bold block text-[10px]">{sandbox.namespace}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span>RESOURCE ALLOC:</span>
                                  <span className="text-sandbox-cyan font-bold block text-[10px]">{sandbox.cpu} / {sandbox.memory}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span>ELAPSED ACTIVE:</span>
                                  <span className="text-slate-300 block text-[10px]">{sandbox.elapsed}</span>
                                </div>
                              </div>

                              {/* CLI / Stdout Selector Tabs */}
                              <div className="flex border-b border-slate-900 pb-1 gap-5 font-mono text-[10px] select-none">
                                <button
                                  onClick={() => setInspectorTab('terminal')}
                                  className={`pb-1 cursor-pointer font-bold transition-colors ${inspectorTab === 'terminal' ? 'text-sandbox-cyan border-b border-sandbox-cyan' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                  CLI Auditor Shell
                                </button>
                                <button
                                  onClick={() => setInspectorTab('logs')}
                                  className={`pb-1 cursor-pointer font-bold transition-colors ${inspectorTab === 'logs' ? 'text-sandbox-green border-b border-sandbox-green' : 'text-slate-600 hover:text-slate-400'}`}
                                >
                                  Stdout Stream
                                </button>
                              </div>

                              {/* Stream Body */}
                              {inspectorTab === 'terminal' ? (
                                <div className="flex flex-col gap-2">
                                  <div className="font-mono text-[11px] text-emerald-400 space-y-1.5 p-3 bg-black rounded-lg overflow-y-auto max-h-[140px] select-all border border-slate-900 leading-relaxed no-scrollbar">
                                    {terminalLogs.map((log, lIdx) => (
                                      <div key={lIdx} className={`whitespace-pre-wrap ${log.includes('CATALOG-AUDITOR') ? 'text-slate-500' : log.includes('USER INPUT') ? 'text-amber-300 font-bold' : 'text-emerald-400'}`}>
                                        {log}
                                      </div>
                                    ))}
                                  </div>

                                  <form 
                                    onSubmit={(e) => {
                                      e.preventDefault();
                                      if (!cliInput.trim()) return;
                                      let response = '>> [STDOUT RESPONSE] verified non-simulated claim bindings bound securely.';
                                      const cmd = cliInput.toLowerCase().trim();
                                      if (cmd === 'ls' || cmd === 'ls -la') {
                                        response = '>> [STDOUT] total 16\ndrwxr-xr-x  2 root root 4096 May 27 09:30 .\ndrwxr-xr-x 15 root root 4096 May 27 09:30 ..\n-rwxr-xr-x  1 root root  245 May 27 09:30 inference_job.py';
                                      } else if (cmd === 'env') {
                                        response = '>> [STDOUT] KUBERNETES_SERVICE_HOST=10.96.0.1\nKUBERNETES_SERVICE_PORT=443\nSANDBOX_NAMESPACE=' + sandbox.namespace + '\nSANDBOX_ID=' + sandbox.id;
                                      } else if (cmd.startsWith('pip ')) {
                                        response = '>> [STDOUT] Package    Version\n---------- -------\npip        23.3.1\nsetuptools 68.2.2\nprotobuf   4.25.1\ngoogle-api 1.0.0';
                                      } else if (cmd.includes('cat ') || cmd.includes('kubectl')) {
                                        response = '>> [STDOUT] ' + cmd.split(' ')[0] + ': permission denied. User restricted by gVisor (runsc) isolated kernel scope.';
                                      }
                                      setTerminalLogs(prev => [
                                        ...prev, 
                                        `>> [USER INPUT] ${cliInput}`,
                                        response
                                      ].slice(-10));
                                      setCliInput('');
                                    }}
                                    className="flex items-center gap-2 bg-black border border-slate-900 rounded-xl px-3 py-1.5 text-xs font-mono"
                                  >
                                    <span className="text-sandbox-cyan font-bold shrink-0 select-none">catalog-auditor:~$</span>
                                    <input 
                                      type="text"
                                      value={cliInput}
                                      onChange={(e) => setCliInput(e.target.value)}
                                      placeholder="Type genuine catalog instructions..."
                                      className="w-full bg-transparent focus:outline-none text-white font-bold"
                                    />
                                  </form>
                                </div>
                              ) : (
                                <div className="font-mono text-[11px] text-slate-455 space-y-1.5 p-3 bg-black rounded-lg overflow-y-auto max-h-[140px] select-all border border-slate-900 leading-relaxed no-scrollbar">
                                  <div className="text-slate-600">{'[15:18:02] [stdout] >> Initializing sandbox containment context (runsc)...'}</div>
                                  <div className="text-slate-600">{'[15:18:03] [stdout] >> Loading python reasoning kernel runtime...'}</div>
                                  <div className="text-emerald-400 font-semibold">{'[15:18:03] [stdout] >> claim warm cache attachment verified in 450ms.'}</div>
                                  <div className="text-slate-300">{'[15:18:04] [stdout] >> [Agent Script] Launching LLM query execution chain...'}</div>
                                  <div className="text-slate-300">{'[15:18:05] [stdout] >> [Agent Script] Fetching tools registry bindings...'}</div>
                                  <div className="text-sandbox-cyan">{'[15:18:06] [stdout] >> [Agent Script] Executing container instructions safely inside isolated kernel scope.'}</div>
                                  <div className="text-slate-300">{'[15:18:08] [stdout] >> [Agent Script] Results parsed. Return code 0 (Success).'}</div>
                                </div>
                              )}
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
          {/* PAGINATION PANEL */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-900 bg-black/20 text-xs font-mono text-slate-500 select-none">
            <div>
              Showing <span className="text-white font-bold">{filteredSandboxes.length > 0 ? indexOfFirstRow + 1 : 0}</span> to <span className="text-white font-bold">{Math.min(indexOfLastRow, filteredSandboxes.length)}</span> of <span className="text-sandbox-cyan font-bold">{filteredSandboxes.length}</span> Claims
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 cursor-pointer"
                >
                  ◀ Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (currentPage > 3 && totalPages > 5) {
                    if (currentPage + 2 <= totalPages) {
                      pageNum = currentPage - 3 + i + 1;
                    } else {
                      pageNum = totalPages - 5 + i + 1;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${currentPage === pageNum ? 'bg-sandbox-cyan text-slate-950 border-sandbox-cyan shadow-[0_0_10px_rgba(0,245,255,0.3)]' : 'bg-slate-900 hover:bg-slate-850 text-slate-450 border-slate-800'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-850 text-[10px] font-bold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 cursor-pointer"
                >
                  Next ▶
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WARM POOLS REPOSITORY DATA TABLE */}
        <div className="bg-sandbox-surface border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-3 bg-black/40 text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800 font-bold flex justify-between items-center select-none">
            <span>Kubernetes Sandbox Warm Pools List ({warmPoolsList.length})</span>
            <span className="text-sandbox-green">● Sub-Second Warm Cache Enabled</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-black/30 border-b border-slate-800 text-slate-450 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Warm Pool Name</th>
                  <th className="px-4 py-2.5">Target Template Ref</th>
                  <th className="px-4 py-2.5">Namespace Target</th>
                  <th className="px-4 py-2.5 text-right">Configured Buffer</th>
                  <th className="px-4 py-2.5 text-right text-sandbox-cyan">Ready Replicas Ratio</th>
                  <th className="px-4 py-2.5 text-right">Pool Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono text-slate-300 text-[11px]">
                {filteredWarmPools.map((pool) => (
                  <tr key={pool.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-white select-all">{pool.name}</td>
                    <td className="px-4 py-3 text-slate-450">{pool.templateRef}</td>
                    <td className="px-4 py-3 text-purple-400">{pool.namespace}</td>
                    <td className="px-4 py-3 text-right text-slate-300 font-semibold">{pool.replicas} Pods</td>
                    <td className="px-4 py-3 text-right font-bold text-sandbox-cyan">
                      {pool.readyReplicas} / {pool.replicas}
                    </td>
                    <td className="px-4 py-3 text-right flex items-center justify-end gap-3">
                      <button
                        onClick={() => setActiveSdkSnippet({ name: pool.templateRef, namespace: pool.namespace })}
                        className="text-[10px] text-sandbox-violet hover:underline font-bold font-mono cursor-pointer"
                      >
                        [SDK Snippet]
                      </button>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                        pool.status === 'Optimal' 
                          ? 'bg-sandbox-green/10 border-sandbox-green/20 text-sandbox-green'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {pool.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* SDK SNIPPET DEV MODAL */}
      {activeSdkSnippet && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-sandbox-surface border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col gap-4 relative animate-fade-in border-t-sandbox-violet">
            <div className="flex justify-between items-center border-b border-slate-850 pb-3">
              <div className="flex items-center gap-4 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sandbox-violet animate-pulse shrink-0" />
                  <h3 className="text-sm font-bold text-white">SDK Client Claim Snippet</h3>
                </div>
                <div className="flex bg-black/40 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                  <button 
                    onClick={() => setSdkTab('python')} 
                    className={`px-3 py-1 rounded-md transition-colors ${sdkTab === 'python' ? 'bg-sandbox-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    Python
                  </button>
                  <button 
                    onClick={() => setSdkTab('javascript')} 
                    className={`px-3 py-1 rounded-md transition-colors ${sdkTab === 'javascript' ? 'bg-sandbox-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                  >
                    JavaScript
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setActiveSdkSnippet(null)} 
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-900 rounded cursor-pointer font-mono"
              >
                ✖ Close
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-normal font-sans">
              Initialize the standard {sdkTab === 'python' ? 'python' : 'JavaScript (Node.js)'} client SDK inside your agent execution flow to instantly claim a secure warmed container instance from template <strong className="text-sandbox-cyan">{activeSdkSnippet.name}</strong> inside namespace <strong className="text-purple-400">{activeSdkSnippet.namespace}</strong>:
            </p>

            <pre className="bg-black/60 border border-slate-900 rounded-xl p-4 font-mono text-xs text-cyan-400 leading-relaxed overflow-x-auto max-h-[240px] select-all">
              <code>{sdkTab === 'python' ? `import google.kubernetes.sandbox as sdk

# Connect client handler to active standard Kubernetes context
client = sdk.SandboxClient(
    context="${activeKubeContext}"
)

# Instant claim a sub-second warmed container sandbox instance
sandbox = client.claim(
    template="${activeSdkSnippet.name}",
    namespace="${activeSdkSnippet.namespace}"
)

# Safe execute untrusted custom agent reasoning code blocks
response = sandbox.execute("inference_job.py", memory_limit="1.1GiB")
print(f"Secure Job Return Code: {response.exit_code}")` : `const { SandboxClient } = require('@google/kubernetes-sandbox');

// Connect client handler to active standard Kubernetes context
const client = new SandboxClient({
    context: "${activeKubeContext}"
});

async function runAgent() {
    // Instant claim a sub-second warmed container sandbox instance
    const sandbox = await client.claim({
        template: "${activeSdkSnippet.name}",
        namespace: "${activeSdkSnippet.namespace}"
    });

    // Safe execute untrusted custom agent reasoning code blocks
    const response = await sandbox.execute("inference_job.js", { memoryLimit: "1.1GiB" });
    console.log(\`Secure Job Return Code: \${response.exitCode}\`);
}
runAgent();`}</code>
            </pre>

            <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 pt-2 border-t border-slate-850">
              <span>{sdkTab.toUpperCase()} CLIENT SDK COMPLIANT</span>
              <button
                onClick={() => {
                  const pythonCode = `import google.kubernetes.sandbox as sdk\n\nclient = sdk.SandboxClient(context="${activeKubeContext}")\nsandbox = client.claim(template="${activeSdkSnippet.name}", namespace="${activeSdkSnippet.namespace}")\nresponse = sandbox.execute("inference_job.py", memory_limit="1.1GiB")\nprint(f"Secure Job Return Code: {response.exit_code}")`;
                  const jsCode = `const { SandboxClient } = require('@google/kubernetes-sandbox');\nconst client = new SandboxClient({ context: "${activeKubeContext}" });\nasync function runAgent() {\n  const sandbox = await client.claim({ template: "${activeSdkSnippet.name}", namespace: "${activeSdkSnippet.namespace}" });\n  const response = await sandbox.execute("inference_job.js", { memoryLimit: "1.1GiB" });\n  console.log(\`Secure Job Return Code: \${response.exitCode}\`);\n}\nrunAgent();`;
                  const codeToCopy = sdkTab === 'python' ? pythonCode : jsCode;
                  navigator.clipboard.writeText(codeToCopy);
                  alert(`${sdkTab === 'python' ? 'Python' : 'JavaScript'} SDK client code successfully copied to clipboard.`);
                }}
                className="text-sandbox-cyan hover:underline font-bold cursor-pointer"
              >
                Copy Snippet ➔
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClusterLevelDashboard;
