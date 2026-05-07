import React from 'react';
import { ArrowLeft, Sliders, HelpCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, ReferenceArea } from 'recharts';

const sampleScatterData = [
    { name: 'minReplicas: 50 (Over-Provisioned)', cost: 85, latency: 0.4, size: 80, type: 'waste' },
    { name: 'minReplicas: 20 (Optimal Target)', cost: 42, latency: 0.9, size: 100, type: 'optimal' },
    { name: 'minReplicas: 0 (Cold starts)', cost: 5, latency: 12.6, size: 80, type: 'danger' },
    { name: 'minReplicas: 10 (Low depth)', cost: 22, latency: 4.5, size: 80, type: 'danger' },
    { name: 'minReplicas: 35 (High buffer)', cost: 65, latency: 0.6, size: 80, type: 'waste' }
];

const RightSizingAssistant = ({ onNavigateBack, onNavigate, routingHistory = [] }) => {
    const comingFromAdmin = routingHistory.includes('platform-admin');

    return (
        <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans">
            {/* Header Navigation / Dynamic Multi-Level Breadcrumbs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60 text-xs font-mono">
                {comingFromAdmin ? (
                    <div className="flex items-center gap-2 text-slate-500">
                        <button onClick={() => onNavigate ? onNavigate('home') : onNavigateBack()} className="text-sandbox-cyan hover:underline">Home</button>
                        <ChevronRight className="h-3 w-3 text-slate-600" />
                        <button onClick={onNavigateBack} className="text-sandbox-cyan hover:underline">Platform admin hub</button>
                        <ChevronRight className="h-3 w-3 text-slate-600" />
                        <span className="text-white font-bold">Right-sizing assistant</span>
                    </div>
                ) : (
                    <button onClick={onNavigateBack} className="flex items-center gap-2 text-sandbox-cyan hover:underline">
                        <ArrowLeft className="h-4 w-4" /> BACK TO HUB
                    </button>
                )}
                <span className="text-slate-500">ADMIN METRICS ENGINE // COST CONTROLLER</span>
            </div>

            {/* Title Banner */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan to-sandbox-violet mb-2">
                    Cost vs. Performance Right-Sizing Assistant
                </h2>
                <p className="text-slate-400 text-sm max-w-3xl">
                    Analyze cluster trade-offs between sandbox initialization latency (Y-Axis) and warm pool resource idle waste cost (X-Axis) to tune <code>minReplicas</code> thresholds.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                
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
                </div>

                 {/* Right Section: Parameter Configuration Recommendation Tuning Form */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-6 flex flex-col justify-between shadow-xl relative group">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                            <Sliders className="h-4 w-4 text-sandbox-cyan" /> Parameter optimizer
                        </h3>
                        
                        <div>
                            <div className="flex justify-between text-xs mb-1 relative group/tooltip">
                                <div className="flex items-center gap-1 text-slate-400">
                                    <span>minReplicas pool depth</span>
                                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan" />
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover\/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md">
                                        Minimum number of container environments preserved warm to eliminate cold-start initialization latency overhead.
                                    </div>
                                </div>
                                <span className="text-sandbox-cyan font-mono font-bold">20 pods</span>
                            </div>
                            <input type="range" min="0" max="100" defaultValue="20" className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between text-xs mb-1 relative group/tooltip">
                                <div className="flex items-center gap-1 text-slate-400">
                                    <span>IPPR (Instance provision rate)</span>
                                    <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan" />
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover\/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md">
                                        Instance provision rate defining how quickly the cluster autoscaler creates fresh buffer instances per second.
                                    </div>
                                </div>
                                <span className="text-sandbox-cyan font-mono font-bold">5 / sec</span>
                            </div>
                            <input type="range" min="1" max="20" defaultValue="5" className="w-full accent-sandbox-cyan bg-slate-950 rounded-lg h-2" />
                        </div>

                        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-2 leading-relaxed">
                            <div className="flex gap-2 items-start p-2.5 bg-black/20 border border-slate-800 rounded-xl">
                                <AlertTriangle className="h-4 w-4 text-sandbox-green shrink-0 mt-0.5" />
                                <div>
                                    <span className="text-white font-bold block">Sizing recommendation:</span>
                                    Setting <code>minReplicas: 20</code> reduces initialization tail-latency to 0.9s while keeping active cluster resource waste index under optimal parameters constraints.
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => alert('Optimized minReplicas parameters deployed to active sandbox custom operators context')}
                        className="w-full py-2 bg-gradient-to-r from-sandbox-cyan to-blue-600 text-slate-950 font-bold text-xs rounded-lg shadow-md hover:from-cyan-400 hover:to-blue-500 transition-colors mt-4"
                    >
                        Apply Parameters Optimization
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RightSizingAssistant;
