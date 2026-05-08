import React from 'react';
import { Activity, Shield, Zap, Terminal, Cpu, Layers, ArrowRight, CheckCircle, Network, RefreshCw, Server, SlidersHorizontal } from 'lucide-react';

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
                        Secure, high-performance isolated execution environments built to orchestrate, audit, and contain ephemeral AI agent workloads seamlessly on Google Kubernetes Engine.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center items-center font-mono text-xs">
                        <span className="bg-slate-900/60 px-3 py-1 rounded-full border border-slate-900/50 text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-sandbox-green" />
                            gVisor runsc Sandbox
                        </span>
                        <span className="bg-slate-900/60 px-3 py-1 rounded-full border border-slate-900/50 text-slate-400">
                            GKE Operator Native
                        </span>
                        <button 
                            onClick={() => onNavigate('platform-admin')}
                            className="bg-sandbox-cyan text-slate-950 px-4 py-1 rounded-full font-bold hover:bg-cyan-400 transition-colors flex items-center gap-1 shadow-[0_0_20px_rgba(0,245,255,0.2)]"
                        >
                            Launch Admin Console <ArrowRight className="h-3 w-3" />
                        </button>
                        <button 
                            onClick={() => onNavigate('cluster-dashboard')}
                            className="bg-black/20 border border-slate-800 text-slate-400 hover:text-white px-4 py-1 rounded-full font-bold transition-colors flex items-center gap-1"
                        >
                            Cluster Operations Deck <ArrowRight className="h-3 w-3" />
                        </button>
                        <button 
                            onClick={() => onNavigate('addon-config')}
                            className="bg-black/20 border border-slate-800 text-slate-400 hover:text-white px-4 py-1 rounded-full font-bold transition-colors"
                        >
                            Configure GKE Operator
                        </button>
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
                                Why Ephemeral Agent Workloads Require Sandboxing
                            </h2>
                            <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-sans">
                                Autonomous AI agents frequently generate, execute, and iterate on arbitrary third-party scripts or invoke untrusted runtime binaries. Without strict protection layers, these scripts pose extreme security hazards—including <strong>host node kernel escapes, supply chain file corruption, and active data exfiltration</strong>. 
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px] font-mono text-slate-300">
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Contain Untrusted Code
                                </div>
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Prevent Exfiltration
                                </div>
                                <div className="bg-black/20 border border-slate-900/30 p-2.5 rounded-xl flex items-center gap-2">
                                    <CheckCircle className="h-3.5 w-3.5 text-sandbox-orange shrink-0" /> Sub-Second Cold Starts
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                {/* 4. AUDIENCE SECTION: WHO IT IS FOR */}
                <section className="space-y-6 mb-4">
                    <div className="text-center space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-white font-display">
                            Built For Enterprise AI Operations
                        </h2>
                        <p className="text-xs text-slate-450 font-sans">
                            Empowering infrastructure, security SRE, and developer teams with unified control handles.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-black/20 border border-slate-900/40 rounded-2xl p-4">
                        <div className="p-4 space-y-2">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-sandbox-cyan" /> Platform Architects
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Manage density ratios, configure warmpool container depths, and audit cluster capacity footprints vs token spend over time.
                            </p>
                        </div>
                        <div className="p-4 space-y-2 border-y md:border-y-0 md:border-x border-slate-900/40">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Security Engineers & SREs
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Enforce allowlists, analyze connection logs, take snapshots, and monitor runtime threat vector logs in the console drawer workspace.
                            </p>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-sandbox-green" /> AI Software Engineers
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                                Trigger python client scripts instantly, save golden checkpoints, and execute recursive logic loops safely without local machine risk.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FOOTER STATUS BAR */}
                <footer className="flex justify-between items-center border-t border-slate-900/40 pt-4 font-mono text-[10px] text-slate-600 select-none">
                    <span>AGENT SANDBOX SUITE V1.0</span>
                    <span>OBSIDIAN CYBER ENGINE CONSOLE</span>
                </footer>

            </div>
        </div>
    );
};

export default AgentSandboxHome;
