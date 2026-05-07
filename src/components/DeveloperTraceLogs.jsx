import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Search, Info, Terminal, ChevronRight } from 'lucide-react';

const sampleTraceLogsList = [
    { timestamp: '11:24:05', id: 'sb-claim-a4f8', pipelineStep: 'Execution', status: 'FAILED', error: 'TemplateNotFoundError', details: 'Sandbox instance claim rejected: active template model python-codex specs configuration invalid.' },
    { timestamp: '11:22:12', id: 'sb-claim-9d3e', pipelineStep: 'Initialization', status: 'SUCCESS', error: 'NONE', details: 'gVisor user-space container runsc sandbox boundary established in 0.82 seconds.' },
    { timestamp: '11:19:45', id: 'sb-claim-8b2c', pipelineStep: 'Discovery', status: 'FAILED', error: 'EgressBlockedException', details: 'Layer 7 security network controller blocked connection request request to non-allowlisted domain.' },
    { timestamp: '11:15:30', id: 'sb-claim-7c1a', pipelineStep: 'Execution', status: 'SUCCESS', error: 'NONE', details: 'Agent task script executed completely inside isolated runtime enclosure container recycled.' }
];

const DeveloperTraceLogs = ({ onNavigateBack }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const currentLog = sampleTraceLogsList[activeIndex];

    return (
        <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans">
            {/* Navigation Top Header Breadcrumbs */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60 text-xs font-mono text-slate-500">
                <div className="flex items-center gap-2">
                    <button onClick={onNavigateBack} className="text-sandbox-cyan hover:underline">Home</button>
                    <ChevronRight className="h-3 w-3 text-slate-600" />
                    <span className="text-white font-bold">Trace diagnostics logs</span>
                </div>
                <span className="text-xs font-mono text-slate-500">OTEL METRICS PANE // FAILURE DIAGNOSTICS</span>
            </div>

            {/* Title Section */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan to-sandbox-violet mb-2">
                    Telemetry Failure &amp; Trace Diagnostics Logs
                </h2>
                <p className="text-slate-400 text-sm max-w-3xl">
                    Drill into active OpenTelemetry diagnostic trace lines to isolate and troubleshoot agent failures across discovery routing, sandbox setup, and execution environments.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column: Logs Entries Records List Browser */}
                <div className="space-y-3 lg:col-span-2">
                    <div className="flex items-center justify-between bg-sandbox-surface border border-slate-800 rounded-xl px-3 py-2 mb-2">
                        <div className="flex items-center gap-2 text-xs text-slate-500 w-full">
                            <Search className="h-3.5 w-3.5 text-slate-600" />
                            <input type="text" placeholder="Filter by claim ID or error label..." className="bg-transparent border-none outline-none text-white w-full text-xs" disabled />
                        </div>
                    </div>

                    <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-2.5 space-y-2 shadow-xl">
                        {sampleTraceLogsList.map((log, idx) => (
                            <div 
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between font-mono text-xs ${activeIndex === idx ? 'border-sandbox-cyan bg-black/30 shadow-md' : 'border-transparent bg-transparent hover:bg-black/10'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                                    <span className="text-slate-300 font-bold">{log.id}</span>
                                    <span className="text-[11px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">{log.pipelineStep}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {log.status === 'FAILED' ? (
                                        <span className="text-red-400 flex items-center gap-1 font-bold text-[11px]"><AlertCircle className="h-3.5 w-3.5 text-red-400" /> {log.error}</span>
                                    ) : (
                                        <span className="text-sandbox-green flex items-center gap-1 font-bold text-[11px]"><CheckCircle className="h-3.5 w-3.5 text-sandbox-green" /> SUCCESS</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: OpenTelemetry Trace Inspector Metadata Block */}
                <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800/60">
                        <Terminal className="h-4 w-4 text-sandbox-cyan" />
                        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">Trace Inspector</h3>
                    </div>

                    {currentLog && (
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-slate-500 font-mono block mb-0.5">Trace Step Target:</span>
                                <span className="text-white font-bold bg-slate-800 px-2 py-0.5 rounded inline-block font-mono text-[11px]">{currentLog.pipelineStep} Boundary</span>
                            </div>
                            <div>
                                <span className="text-slate-500 font-mono block mb-0.5">Exception Status Code:</span>
                                <span className={`font-mono font-bold ${currentLog.status === 'FAILED' ? 'text-red-400' : 'text-sandbox-green'}`}>
                                    {currentLog.status === 'FAILED' ? `500 // ${currentLog.error}` : '200 // OK'}
                                </span>
                            </div>
                            <div className="border-t border-slate-800/60 pt-2">
                                <span className="text-slate-500 font-mono block mb-1">Diagnostic Log String:</span>
                                <p className="text-slate-300 leading-relaxed bg-black/30 border border-slate-800 p-3 rounded-xl text-[11px]">
                                    {currentLog.details}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-2 font-mono text-[10px] text-slate-600 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-slate-600" /> OpenTelemetry tracing engine logs hooks
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeveloperTraceLogs;
