import React from 'react';
import { Activity, Shield, Zap, Terminal, Cpu, Layers, ArrowRight, CheckCircle, Network, RefreshCw, Server, SlidersHorizontal, HardDrive } from 'lucide-react';

const AgentSandboxHome = ({ onNavigate }) => {
    return (
        <div className="w-full p-6 md:p-12 flex flex-col items-center justify-start font-sans text-sandbox-text relative overflow-y-auto flex-1 selection:bg-sandbox-cyan/30">
            <div className="max-w-5xl w-full z-10 flex flex-col items-stretch gap-14">
                
                {/* 1. HERO HEADER: WHAT IT IS & BRIEF DESCRIPTION */}
                <header className="text-center flex flex-col items-center pt-4">
                    <div className="flex items-center justify-center mb-4 space-x-3 select-none">
                        <div className="p-2.5 bg-sandbox-cyan/10 rounded-2xl border border-sandbox-cyan/15 shadow-[0_0_35px_rgba(0,245,255,0.15)]">
                          <Shield className="h-9 w-9 text-sandbox-cyan" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan via-purple-400 to-sandbox-violet line-height-tight font-display">
                            Agent Sandbox
                        </h1>
                    </div>
                    <p className="text-xl text-slate-300 max-w-3xl leading-relaxed font-light tracking-wide mb-6 font-sans">
                        Modular, visually stunning console hub to deploy, audit, and contain autonomous AI agent workloads isolated inside secure user-space containers on Kubernetes.
                    </p>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 justify-center items-center font-mono text-xs mt-2 border border-transparent bg-black/30 px-6 py-3 rounded-full shadow-inner">
                        <div className="flex items-center gap-3 text-slate-500 font-sans text-[11px] font-medium border-r border-slate-800/80 pr-6 select-none whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-sandbox-green animate-pulse" />
                                Isolated User-Space Sandbox
                            </span>
                            <span className="text-slate-700">•</span>
                            <span>
                                Kubernetes Operator Native
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                            <button 
                                onClick={() => onNavigate('cluster-dashboard')}
                                className="bg-gradient-to-r from-sandbox-cyan to-cyan-400 text-slate-950 px-4 py-1.5 rounded-full font-bold hover:brightness-110 transition-all flex items-center gap-1 shadow-[0_0_20px_rgba(0,245,255,0.2)] cursor-pointer text-[11px]"
                            >
                                Cluster resource explorer <ArrowRight className="h-3 w-3 font-extrabold" />
                            </button>
                            <button 
                                onClick={() => onNavigate('fleet-telemetry')}
                                className="bg-sandbox-green/10 border border-sandbox-green/30 text-sandbox-green hover:bg-sandbox-green/20 px-4 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.1)] cursor-pointer text-[11px]"
                            >
                                <Activity className="h-3.5 w-3.5 text-sandbox-green animate-pulse" />
                                Warm pool telemetry
                            </button>
                            <button 
                                onClick={() => onNavigate('addon-config')}
                                className="bg-black/20 border border-transparent text-slate-500 hover:text-slate-300 px-4 py-1.5 rounded-full font-bold transition-all cursor-pointer text-[11px]"
                            >
                                Configure operator
                            </button>
                        </div>
                    </div>
                </header>

                {/* 2. RATIONALE: WHY WE NEED IT */}
                <section className="bg-gradient-to-br from-slate-900/40 via-sandbox-surface/70 to-black/40 border border-slate-900/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-64 h-64 bg-sandbox-violet/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col md:flex-row items-start gap-6">
                        <div className="p-3 bg-sandbox-orange/10 border border-sandbox-orange/15 rounded-2xl text-sandbox-orange shrink-0">
                            <SlidersHorizontal className="h-6 w-6" />
                        </div>
                        <div className="space-y-3 flex-1">
                            <h2 className="text-lg font-bold text-white font-display tracking-tight">
                                Why ephemeral agent workloads require sandboxing
                            </h2>
                            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                                When autonomous AI agents execute arbitrary code blocks or fetch untrusted software dependencies, they pose critical security vectors—including <strong>host node kernel escapes, supply chain exploits, and data exfiltration</strong>. Agent Sandbox solves this by isolating workloads in user-space layers, combining sub-second latency with zero-trust egress constraints.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-slate-300">
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Contain arbitrary code
                                </div>
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Zero-trust egress bans
                                </div>
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Sub-second cold starts
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. CORE CAPABILITIES & WORKFLOWS SECTION */}
                <section className="space-y-6">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-white font-display">
                            Core capabilities & orchestration workflows
                        </h2>
                        <p className="text-xs text-slate-450 font-sans">
                            Enterprise isolation infrastructure purpose-built for Kubernetes workloads.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Capability 1 */}
                        <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 space-y-3 shadow-xl">
                            <div className="flex items-center gap-2 text-sandbox-cyan font-mono text-xs font-bold uppercase tracking-wider">
                                <Zap className="h-4.5 w-4.5" /> Smart warmpool provisioner
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Bypass standard Kubernetes container scheduling delays. Dynamically manage pre-heated execution nodes via state queues, guaranteeing container allocations in <strong>less than 1.0 seconds</strong>.
                            </p>
                        </div>

                        {/* Capability 2 */}
                        <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 space-y-3 shadow-xl">
                            <div className="flex items-center gap-2 text-purple-400 font-mono text-xs font-bold uppercase tracking-wider">
                                <Shield className="h-4.5 w-4.5" /> Isolated kernel containment
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Every container runs isolated inside a custom user-space kernel layer. Guest application system calls are intercepted before reaching the host Linux kernel, eliminating host tenant exploits.
                            </p>
                        </div>

                        {/* Capability 3 */}
                        <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 space-y-3 shadow-xl">
                            <div className="flex items-center gap-2 text-sandbox-green font-mono text-xs font-bold uppercase tracking-wider">
                                <Network className="h-4.5 w-4.5" /> Layer 7 egress filtering
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Hot-inject strict allowlist auditing to prevent data leakage. Restrict outbound packets exclusively to verified domain endpoints (e.g., OpenAI APIs, package repos) while dropping suspicious exfiltration attempts instantly.
                            </p>
                        </div>

                        {/* Capability 4 */}
                        <div className="bg-sandbox-surface border border-slate-800/60 rounded-2xl p-5 space-y-3 shadow-xl">
                            <div className="flex items-center gap-2 text-sandbox-orange font-mono text-xs font-bold uppercase tracking-wider">
                                <HardDrive className="h-4.5 w-4.5" /> State capture replication
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Leverage native pod snapshots to freeze running memory contexts and serialize state layers to secure storage buckets. Rehydrate footprints via fast-path resume bindings in <strong>under 1.8 seconds</strong>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. AUDIENCE SECTION: WHO IT IS FOR */}
                <section className="space-y-6 mb-4">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-white font-display">
                            Persona consoles alignment
                        </h2>
                        <p className="text-xs text-slate-450 font-sans">
                            Empowering enterprise architects, SRE, and developer teams with unified operations panels.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 border border-slate-900/40 rounded-2xl p-4">
                        <div className="p-4 space-y-2">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-sandbox-cyan" /> Platform architects
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Optimize min/max warm pool replica depths, audit resource constraints (CPU/memory limits), and balance cluster utilization metrics vs spend overhead.
                            </p>
                        </div>
                        <div className="p-4 space-y-2 border-y md:border-y-0 md:border-x border-slate-900/40">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Security SREs & engineers
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Hot-inject emergency dynamic egress bans via the Outbound Policy Interceptor, monitor trace spans through OpenTelemetry sidecars, and analyze filesystem diff tracks.
                            </p>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-sandbox-green" /> AI software engineers
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Browse environment catalog templates, trace container execution runtime logs, and copy programmatic Python/JS initialization SDK template snippets.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FOOTER STATUS BAR */}
                <footer className="flex justify-between items-center border-t border-slate-900/40 pt-4 font-mono text-[10px] text-slate-600 select-none">
                    <span>AGENT SANDBOX SUITE V1.0</span>
                    <span>OBSIDIAN CLUSTER ENGINE CONSOLE</span>
                </footer>

            </div>
        </div>
    );
};

export default AgentSandboxHome;
