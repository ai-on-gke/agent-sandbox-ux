import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, BarChart2, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

const TemplateUsageReport = ({ onNavigateBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/metrics/usage')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch usage metrics statistics data');
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full p-10 flex flex-col items-center justify-center text-slate-400 font-mono text-xs min-h-[50vh]">
        <RefreshCw className="h-6 w-6 text-sandbox-cyan animate-spin mb-2" />
        Loading fleet metrics report analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-10 flex flex-col items-center justify-center text-status-critical font-mono text-xs min-h-[50vh]">
        <div className="p-3 bg-status-critical/10 border border-status-critical/30 rounded-xl max-w-md text-center">
          Error loading metrics: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans selection:bg-sandbox-cyan/30">
      {/* Sub Navigation Row bar Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/50">
        <button 
          onClick={onNavigateBack} 
          className="flex items-center gap-2 text-xs font-mono text-sandbox-cyan hover:text-white hover:underline transition-all group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" /> BACK TO CORE HUB
        </button>
        <span className="text-xs font-mono text-slate-500 tracking-wider">METRICS SYSTEM // RESOURCE AUDITOR</span>
      </div>

      {/* Title Banner Header with Google Sans */}
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3 font-display">
          <BarChart2 className="h-7 w-7 text-sandbox-cyan" /> Template usage report
        </h2>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Static aggregated observability module reporting sandbox allocation popularity indices fetched dynamically from active metrics operators endpoints.
        </p>
      </div>

      {/* Series of KPI Cards without Icons - Sentence Casing with Tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
        {/* KPI Card 1: Total Managed Templates */}
        <div className="bg-sandbox-surface/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between relative group shadow-lg backdrop-blur-sm">
          <div>
            <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
              <div className="relative flex items-center gap-1 group/tooltip">
                <span>Total templates</span>
                <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-cyan transition-colors" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md">
                  Total number of environment specification CRD templates registered globally inside the active namespace context.
                </div>
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-sandbox-cyan transition-colors">
              {data?.totalTemplates}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 border-t border-slate-800/40 pt-1">
            Infrastructure config templates verified
          </div>
        </div>

        {/* KPI Card 2: Total Active Sandboxes */}
        <div className="bg-sandbox-surface/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between relative group shadow-lg backdrop-blur-sm">
          <div>
            <div className="text-slate-450 font-display text-xs font-bold mb-1.5 select-none">
              <div className="relative flex items-center gap-1 group/tooltip">
                <span>Total active sandboxes</span>
                <HelpCircle className="h-3 w-3 text-slate-500 cursor-help hover:text-sandbox-violet transition-colors" />
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover/tooltip:block w-52 p-2 bg-slate-900/95 border border-slate-800 rounded-lg shadow-2xl text-[10px] text-slate-300 leading-normal z-50 font-sans normal-case font-normal backdrop-blur-md">
                  Aggregate count of pre-warmed and claimed sandbox containers running simultaneously across project nodes.
                </div>
              </div>
            </div>
            <div className="text-3xl font-black font-mono tracking-tight text-sandbox-violet">
              {data?.totalActiveSandboxes}
            </div>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-2 border-t border-slate-800/40 pt-1">
            Live isolated environments running
          </div>
        </div>
      </div>

      {/* Popularity Distribution Bar Chart Analytics View Block */}
      <div className="bg-sandbox-surface border border-slate-800/60 rounded-xl p-5 shadow-2xl flex flex-col h-[380px] max-w-4xl">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5 select-none">
          Template popularity descriptor <span className="text-[10px] text-slate-500 normal-case font-sans font-normal">(active sandbox allocations counts per configuration spec model)</span>
        </h3>

        <div className="flex-1 w-full h-full text-[11px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.popularity || []} margin={{ top: 10, right: 20, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" opacity={0.4} />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280" 
                tick={{ fill: '#9CA3AF', fontSize: 10 }} 
                angle={-12}
                textAnchor="end"
                interval={0}
              />
              <YAxis stroke="#6B7280" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0D1117', borderColor: '#1F2937', color: '#F0F6FC' }}
                itemStyle={{ color: '#00F5FF', fontFamily: 'monospace' }}
                labelStyle={{ fontWeight: 'bold', color: '#FAFAFA', fontFamily: 'sans-serif' }}
                formatter={(value) => [`${value} Active sandboxes`, 'Allocations']}
              />
              <Bar dataKey="sandboxes" fill="#00F5FF" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {(data?.popularity || []).map((entry, idx) => {
                  // Custom premium high-fidelity color gradients alternates matching our design tokens rules
                  const colors = ['#00F5FF', '#9D5FF2', '#2ED168', '#F2994A', '#3B82F6', '#6B7280'];
                  return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} opacity={0.85} className="transition-all hover:opacity-100 cursor-pointer" />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TemplateUsageReport;
