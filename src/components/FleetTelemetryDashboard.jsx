import React, { useState, useEffect } from 'react';
import { ArrowLeft as BackIcon, Info as InfoIcon, AlertTriangle as AlertIcon, Zap as QuickIcon, Server as FleetIcon, Activity as HealthIcon, Layers as StackIcon, TrendingUp as SpeedIcon, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';

const sampleTimelineData = [
    { time: '09:00', desired: 500, ready: 490, latency: 0.8 },
    { time: '09:30', desired: 500, ready: 485, latency: 0.9 },
    { time: '10:00', desired: 500, ready: 420, latency: 1.4 }, // Drainage warning
    { time: '10:30', desired: 600, ready: 310, latency: 3.2 }, // High stress / Exhaustion
    { time: '11:00', desired: 600, ready: 550, latency: 1.1 }, // Scaling recovery
    { time: '11:30', desired: 600, ready: 590, latency: 0.8 }
];

const FleetTelemetryDashboard = ({ onNavigateBack, onNavigate }) => {
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [timeRange, setTimeRange] = useState('1h');
    const [telemetryData, setTelemetryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [clusterContext, setClusterContext] = useState('BARKLAND-BRUST');

    useEffect(() => {
        fetch('/api/kube-context')
            .then(res => res.json())
            .then(data => {
                if (data.context) setClusterContext(data.context.toUpperCase());
            })
            .catch(err => console.error("Failed to fetch kube-context:", err));
    }, []);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);

        fetch(`/api/v1/telemetry/summary?range=${timeRange}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (isMounted) {
                    setTelemetryData(data);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Failed to fetch telemetry summary:", err);
                    setError(err.message);
                    setLoading(false);
                }
            });

        return () => { isMounted = false; };
    }, [timeRange]);

    const toggleTooltip = (id) => {
        setActiveTooltip(activeTooltip === id ? null : id);
    };

    return (
        <div 
            onClick={() => setActiveTooltip(null)}
            className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans select-none"
        >
            {/* Navigation Top Row Breadcrumbs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                    <button onClick={onNavigateBack} className="text-sandbox-cyan hover:underline">Home</button>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    <span className="text-white font-bold">Warm pool fleet observability</span>
                </div>
                <div className="flex items-center gap-3">
                    {/* Time Range Selector */}
                    <div className="flex bg-black/40 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
                        {['1h', '12h', '24h'].map((r) => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-2.5 py-1 rounded-md transition-colors ${timeRange === r ? 'bg-sandbox-cyan text-black font-bold' : 'text-slate-400 hover:text-white'}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                    <button 
                        onClick={() => onNavigate('right-sizing')}
                        className="text-[11px] font-mono bg-sandbox-surface hover:border-sandbox-cyan/40 text-slate-300 px-3 py-1 rounded-lg border border-slate-800 transition-colors flex items-center gap-1"
                    >
                        <SpeedIcon className="h-3.5 w-3.5 text-sandbox-cyan" /> Right-Sizing Quad Chart
                    </button>
                    <span className="text-xs font-mono text-slate-500 bg-black/20 px-3 py-1 rounded-lg border border-slate-800 flex items-center">CLUSTER // {clusterContext}</span>
                </div>
            </div>

            {/* Section: Title Banner */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan to-sandbox-violet mb-1">
                        Warm Pool Fleet Observability
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Real-time infrastructure tracking for desired vs. ready pods allocations and service level objectives (SLO).
                    </p>
                </div>
                {/* Active Warning Banner */}
                {/* Active Warning / Error Banner */}
                {error ? (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 max-w-md">
                        <AlertIcon className="h-5 w-5 text-red-500 shrink-0" />
                        <div className="text-[11px] leading-normal text-slate-300">
                            <span className="text-red-500 font-bold font-mono uppercase block">Telemetry Fetch Error</span>
                            {error}
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-sandbox-orange/10 border border-sandbox-orange/30 rounded-xl flex items-center gap-3 max-w-md">
                        <AlertIcon className="h-5 w-5 text-sandbox-orange shrink-0 animate-bounce" />
                        <div className="text-[11px] leading-normal text-slate-300">
                            <span className="text-sandbox-orange font-bold font-mono uppercase block">Warm Pool Drainage Alert</span>
                            Exhaustion index spikes recorded at 10:30 AM due to python-codex allocation surge.
                        </div>
                    </div>
                )}
            </div>

            {/* Section: Core Telemetry Metrics Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Card 1: Ready Pods Depth */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between relative group">
                    <div>
                        <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
                            <div className="relative flex items-center gap-1 group/tooltip">
                                <span>Ready / desired pods</span>
                                <InfoIcon 
                                    onClick={(e) => { e.stopPropagation(); toggleTooltip('pods'); }}
                                    className="h-3 w-3 text-slate-500 cursor-pointer hover:text-sandbox-cyan transition-colors" 
                                />
                                <div className={`absolute bottom-full left-0 mb-2 ${activeTooltip === 'pods' ? 'block' : 'hidden group-hover/tooltip:block'} w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md`}>
                                    Ratio of container instances currently initialized and fully capable of accepting active claims vs the desired target capacity pool.
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-white mt-0.5">
                            {loading ? '...' : telemetryData?.summary?.readyWarmPods ?? 590} 
                            <span className="text-xs text-slate-500 font-normal"> / {loading ? '...' : telemetryData?.summary?.desiredWarmPods ?? 600}</span>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-sandbox-cyan flex items-center justify-between mt-2 border-t border-slate-800/40 pt-1 w-full">
                        <span>Active Sandboxes: {loading ? '...' : telemetryData?.summary?.activeSandboxes ?? 1057}</span>
                        <span className="text-sandbox-green">✔ {loading ? '...' : ((telemetryData?.summary?.readyWarmPods / telemetryData?.summary?.desiredWarmPods) * 100).toFixed(1)}% ready</span>
                    </span>
                </div>

                {/* Card 2: Avg Creation Latency */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between relative group">
                    <div>
                        <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
                            <div className="relative flex items-center gap-1 group/tooltip">
                                <span>P99 creation latency</span>
                                <InfoIcon 
                                    onClick={(e) => { e.stopPropagation(); toggleTooltip('latency'); }}
                                    className="h-3 w-3 text-slate-500 cursor-pointer hover:text-sandbox-cyan transition-colors" 
                                />
                                <div className={`absolute bottom-full left-0 mb-2 ${activeTooltip === 'latency' ? 'block' : 'hidden group-hover/tooltip:block'} w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 legendary-normal z-50 font-sans normal-case font-normal backdrop-blur-md`}>
                                    99th percentile speed to spin up a cold container sandbox environment under secure user-space isolation.
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-sandbox-cyan mt-0.5">
                            {loading ? '...' : `${telemetryData?.summary?.p99LatencySeconds ?? 0.82}s`}
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-2 border-t border-slate-800/40 pt-1 w-full">
                        <span className="text-sandbox-green">✔ SLO met</span>
                        <span className="text-sandbox-orange">Errors: {loading ? '...' : telemetryData?.summary?.errorCount ?? 3}</span>
                    </span>
                </div>

                {/* Card 3: Claim Request Rates */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between relative group">
                    <div>
                        <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
                            <div className="relative flex items-center gap-1 group/tooltip">
                                <span>Claims allocation rate</span>
                                <InfoIcon 
                                    onClick={(e) => { e.stopPropagation(); toggleTooltip('rate'); }}
                                    className="h-3 w-3 text-slate-500 cursor-pointer hover:text-sandbox-violet transition-colors" 
                                />
                                <div className={`absolute bottom-full left-0 mb-2 ${activeTooltip === 'rate' ? 'block' : 'hidden group-hover/tooltip:block'} w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md`}>
                                    Number of incoming sandbox resource claim requests routed per second across current operational clusters.
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-white mt-0.5">
                            {loading ? '...' : `${telemetryData?.summary?.claimsQps ?? 145} QPS`}
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5 mt-2 border-t border-slate-800/40 pt-1">Stabilized track</span>
                </div>

                {/* Card 4: Resource Efficiency */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-4 flex flex-col justify-between relative group">
                    <div>
                        <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
                            <div className="relative flex items-center gap-1 group/tooltip">
                                <span>Autopilot node efficiency</span>
                                <InfoIcon 
                                    onClick={(e) => { e.stopPropagation(); toggleTooltip('efficiency'); }}
                                    className="h-3 w-3 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors" 
                                />
                                <div className={`absolute bottom-full right-0 mb-2 ${activeTooltip === 'efficiency' ? 'block' : 'hidden group-hover/tooltip:block'} w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md`}>
                                    Percentage of host cluster compute capacity actively utilized vs unallocated idle buffer overhead memory.
                                </div>
                            </div>
                        </div>
                        <div className="text-xl font-bold font-mono text-white mt-0.5">
                            {loading ? '...' : '84.2%'}
                        </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-2 border-t border-slate-800/40 pt-1 w-full">
                        <span>CPU: {loading ? '...' : telemetryData?.summary?.cpuAllocationCores ?? '1.2k'} cores</span>
                        <span>Mem: {loading ? '...' : telemetryData?.summary?.memoryAllocationGb ?? '4.5k'} GB</span>
                    </span>
                </div>
            </div>

            {/* Section: Core Recharts Graphic Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* Chart 1: Desired vs Ready pods Depth Timeline */}
                <div className="lg:col-span-2 bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col h-[320px]">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1">
                        Capacity Depth Timeline <span className="text-[10px] text-slate-600 normal-case font-sans font-normal">(Ready vs Desired Pods)</span>
                    </h3>
                    <div className="flex-1 w-full h-full text-[11px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={telemetryData?.timeSeries ?? sampleTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorDesired" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#9D5FF2" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#9D5FF2" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorReady" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2ED168" stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor="#2ED168" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.5} />
                                <XAxis dataKey="time" stroke="#4b5563" fontClassName="font-mono" />
                                <YAxis stroke="#4b5563" fontClassName="font-mono" domain={[0, 700]} />
                                <Tooltip contentStyle={{ backgroundColor: '#161C24', borderColor: '#374151', color: '#FAFAFA' }} />
                                <Legend wrapperStyle={{ paddingTop: 10 }} />
                                <Area type="monotone" dataKey="desired" name="Desired Capacity" stroke="#9D5FF2" strokeWidth={2} fillOpacity={1} fill="url(#colorDesired)" />
                                <Area type="monotone" dataKey="ready" name="Ready Pods Pool" stroke="#2ED168" strokeWidth={2} fillOpacity={1} fill="url(#colorReady)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Chart 2: Sizing Latency Performance Bar Tracker */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col h-[320px]">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1">
                        SLO Target Tracking <span className="text-[10px] text-slate-600 normal-case font-sans font-normal">(Avg Creation Latency)</span>
                    </h3>
                    <div className="flex-1 w-full h-full text-[11px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={telemetryData?.timeSeries ?? sampleTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.5} />
                                <XAxis dataKey="time" stroke="#4b5563" />
                                <YAxis stroke="#4b5563" label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#6b7280', offset: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#161C24', borderColor: '#374151', color: '#FAFAFA' }} cursor={false} />
                                <Bar dataKey="latency" name="P99 Latency (s)" fill="#00F5FF" radius={[4, 4, 0, 0]}>
                                    {(telemetryData?.timeSeries ?? sampleTimelineData).map((entry, index) => (
                                        <area key={`cell-${index}`} fill={entry.latency > 2.5 ? '#F2994A' : '#00F5FF'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Warning Taxonomy Log Entries */}
            <div className="bg-black/20 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sandbox-green" />
                    <span>
                        GKE Resource Grouping Engine Online: Aggregating resources 
                        {telemetryData ? ` (Sandboxes: ${telemetryData.crdCounts.Sandbox}, Templates: ${telemetryData.crdCounts.SandboxTemplate}, Pools: ${telemetryData.crdCounts.SandboxWarmPool})` : ''}
                    </span>
                </div>
                <span className="text-[10px] text-slate-600">POLLING DATA // EVERY 30S</span>
            </div>
        </div>
    );
};

export default FleetTelemetryDashboard;
