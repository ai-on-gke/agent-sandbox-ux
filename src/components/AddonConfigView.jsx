import React, { useState } from 'react';
import { ArrowLeft, Shield, HelpCircle, CheckCircle2, Settings, Database, HardDrive, ChevronRight } from 'lucide-react';

const AddonConfigView = ({ onNavigateBack }) => {
    const [isEnabled, setIsEnabled] = useState(true);
    const [deployPresets, setDeployPresets] = useState(true);
    const [collectLogs, setCollectLogs] = useState(true);
    const [collectMetrics, setCollectMetrics] = useState(true);
    const [clusterMode, setClusterMode] = useState('autopilot'); // 'standard' | 'autopilot'

    return (
        <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans">
            {/* Navigation Top Header Breadcrumbs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                    <button onClick={onNavigateBack} className="text-sandbox-cyan hover:underline">Home</button>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    <span className="text-white font-bold">GKE operator configuration</span>
                </div>
                <span className="text-xs font-mono text-slate-500">GKE CONSOLE // OPERATORS MANAGEMENT</span>
            </div>

            {/* Page Banner Title */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan to-sandbox-violet mb-2">
                    Agent Sandbox Add-on Configuration
                </h2>
                <p className="text-slate-400 text-sm max-w-3xl">
                    Configure secure execution operators, memory checkpoints logging parameters, and pre-warmed container queues defaults on your active GKE cluster.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Configuration Rules Form */}
                <div className="lg:col-span-2 bg-sandbox-surface border border-slate-800/60 rounded-2xl p-6 space-y-6 shadow-xl">
                    
                    {/* Cluster Profile Spec Selection */}
                    <div>
                        <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 font-semibold">GKE Cluster Architecture Mode</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div 
                                onClick={() => setClusterMode('autopilot')}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-black/20 ${clusterMode === 'autopilot' ? 'border-sandbox-cyan shadow-[0_0_15px_rgba(0,245,255,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                <Database className={`h-5 w-5 mt-0.5 ${clusterMode === 'autopilot' ? 'text-sandbox-cyan' : 'text-slate-500'}`} />
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-0.5">GKE Autopilot Profile</h4>
                                    <p className="text-slate-400 text-[11px]">Fully managed resource scaling with built-in limits rules.</p>
                                </div>
                            </div>
                            <div 
                                onClick={() => setClusterMode('standard')}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 bg-black/20 ${clusterMode === 'standard' ? 'border-sandbox-cyan shadow-[0_0_15px_rgba(0,245,255,0.1)]' : 'border-slate-800 hover:border-slate-700'}`}
                            >
                                <HardDrive className={`h-5 w-5 mt-0.5 ${clusterMode === 'standard' ? 'text-sandbox-cyan' : 'text-slate-500'}`} />
                                <div>
                                    <h4 className="text-sm font-bold text-white mb-0.5">GKE Standard Profile</h4>
                                    <p className="text-slate-400 text-[11px]">Manual node group configuration and custom pool rules sizing.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Master Switch Box */}
                    <div className="p-4 bg-black/30 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sandbox-cyan/10 rounded-lg">
                                <Shield className="h-5 w-5 text-sandbox-cyan" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    Enable Agent Sandbox Operator
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isEnabled ? 'bg-sandbox-green/10 text-sandbox-green' : 'bg-slate-800 text-slate-400'}`}>
                                        {isEnabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </h4>
                                <p className="text-slate-400 text-[11px] mt-0.5">Activates the secure user-space runsc runtime container containment.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sandbox-cyan peer-checked:after:bg-slate-950" />
                        </label>
                    </div>

                    {/* Preset Configurations Template Box */}
                    <div className="flex items-start justify-between gap-4 p-1.5">
                        <div className="flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                id="deployPresets" 
                                checked={deployPresets} 
                                onChange={(e) => setDeployPresets(e.target.checked)} 
                                disabled={!isEnabled}
                                className="mt-1 accent-sandbox-cyan" 
                            />
                            <div>
                                <label htmlFor="deployPresets" className="text-sm font-bold text-white cursor-pointer">Deploy preset runtime environments templates</label>
                                <p className="text-slate-400 text-[11px] mt-0.5">Automatically configures common sandbox customs specifications like <code>python-codex</code> and <code>vscode-execution</code> workloads definitions mapping claims rules.</p>
                            </div>
                        </div>
                    </div>

                    {/* Observability Defaults Block */}
                    <div className="border-t border-slate-800/60 pt-4">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 font-semibold flex items-center gap-1">
                            Observability Framework Defaults <HelpCircle className="h-3 w-3 text-slate-500" />
                        </h4>
                        <div className="space-y-3 pl-1">
                            <div className="flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    id="collectMetrics" 
                                    checked={collectMetrics} 
                                    onChange={(e) => setCollectMetrics(e.target.checked)}
                                    disabled={!isEnabled}
                                    className="mt-1 accent-sandbox-cyan" 
                                />
                                <div>
                                    <label htmlFor="collectMetrics" className="text-sm font-semibold text-slate-200 cursor-pointer">Automatically provision health &amp; benchmarking metrics</label>
                                    <p className="text-slate-500 text-[11px]">Triggers automatic warmpool depth list charts collection upon operator activation (Observability by Default).</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <input 
                                    type="checkbox" 
                                    id="collectLogs" 
                                    checked={collectLogs} 
                                    onChange={(e) => setCollectLogs(e.target.checked)}
                                    disabled={!isEnabled}
                                    className="mt-1 accent-sandbox-cyan" 
                                />
                                <div>
                                    <label htmlFor="collectLogs" className="text-sm font-semibold text-slate-200 cursor-pointer">Enable OpenTelemetry lifecycle trace logger auditing</label>
                                    <p className="text-slate-500 text-[11px]">Aggregates structured script trace records across discovery, initialization and run boundaries.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Action Button */}
                    <div className="border-t border-slate-800/60 pt-4 flex justify-end gap-3">
                        <button onClick={onNavigateBack} className="px-4 py-2 bg-transparent text-slate-400 text-xs hover:text-white rounded-lg transition-colors">Cancel</button>
                        <button 
                            onClick={() => alert('Cluster Operator Configurations Saved Successfully')}
                            className="px-5 py-2 bg-sandbox-cyan text-slate-950 font-bold text-xs rounded-lg shadow-md hover:bg-cyan-400 transition-colors flex items-center gap-1"
                        >
                            <Settings className="h-3.5 w-3.5" /> Save Configuration Settings
                        </button>
                    </div>
                </div>

                {/* Right Column: Persona & Architectural Summary */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 space-y-5">
                    <h3 className="text-sm font-bold text-white font-mono tracking-wide uppercase text-slate-300">Addon Specs Profile</h3>
                    
                    <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                        <div className="p-3 bg-sandbox-surface border border-slate-800 rounded-xl">
                            <div className="text-white font-bold mb-1">Seamless Enablement Flow</div>
                            Sandbox orchestration inherits core scheduling operators rules directly, providing a unified management experience similar to the native GKE Ray operator.
                        </div>
                        <div className="p-3 bg-sandbox-surface border border-slate-800 rounded-xl">
                            <div className="text-white font-bold mb-1">Automatic Dashboards Activation</div>
                            Selecting metrics enablement config triggers cloud logging telemetry templates generation instantly. No manual Prometheus alert configurations needed.
                        </div>
                    </div>

                    <div className="p-3 bg-sandbox-cyan/5 border border-sandbox-cyan/20 rounded-xl font-mono text-[11px] text-sandbox-cyan flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-sandbox-cyan shrink-0" />
                        Ready to apply on active cluster context.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddonConfigView;
