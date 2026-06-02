import React, { useState } from 'react';
import { ArrowLeft, Copy, Eye, FileCode, Activity } from 'lucide-react';

const sampleTemplatesList = [
    { id: 'python-codex', name: 'python-codex', activeSandboxes: 450, warmPoolSize: 20, isolation: 'gVisor (runsc)' },
    { id: 'vscode-execution', name: 'vscode-execution', activeSandboxes: 120, warmPoolSize: 10, isolation: 'gVisor (runsc)' }
];

const pythonYamlCode = `apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxTemplate
metadata:
  name: python-codex
  namespace: default
spec:
  podTemplate:
    spec:
      runtimeClassName: gvisor
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
      nodeSelector:
        sandbox.gke.io/runtime: gvisor
      tolerations:
      - key: "sandbox.gke.io/runtime"
        value: "gvisor"
        effect: "NoSchedule"
      containers:
      - name: python-runtime
        image: registry.k8s.io/agent-sandbox/python-runtime-sandbox:v0.1.0
---
apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxWarmPool
metadata:
  name: python-codex-warmpool
  namespace: default
spec:
  replicas: 20
  sandboxTemplateRef:
    name: python-codex`;

const vscodeYamlCode = `apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxTemplate
metadata:
  name: vscode-execution
  namespace: default
spec:
  podTemplate:
    spec:
      runtimeClassName: gvisor
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
      nodeSelector:
        sandbox.gke.io/runtime: gvisor
      tolerations:
      - key: "sandbox.gke.io/runtime"
        value: "gvisor"
        effect: "NoSchedule"
      containers:
      - name: vscode-runtime
        image: registry.k8s.io/agent-sandbox/vscode-runtime-sandbox:v0.1.0
---
apiVersion: extensions.agents.x-k8s.io/v1alpha1
kind: SandboxWarmPool
metadata:
  name: vscode-execution-warmpool
  namespace: default
spec:
  replicas: 10
  sandboxTemplateRef:
    name: vscode-execution`;

const TemplateManagementConsole = ({ onNavigateBack }) => {
    const [selectedId, setSelectedId] = useState('python-codex');
    const [consoleTab, setConsoleTab] = useState('yaml'); // 'yaml' | 'sdk'

    const currentTemplate = sampleTemplatesList.find(t => t.id === selectedId);
    const currentYaml = selectedId === 'python-codex' ? pythonYamlCode : vscodeYamlCode;

    return (
        <div className="w-full p-6 md:p-10 flex flex-col text-sandbox-text h-full overflow-y-auto font-sans">
            {/* Top Navigation Line Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
                <button onClick={onNavigateBack} className="flex items-center gap-2 text-xs font-mono text-sandbox-cyan hover:underline">
                    <ArrowLeft className="h-4 w-4" /> BACK TO HUB
                </button>
                <span className="text-xs font-mono text-slate-500">INFRASTRUCTURE REGISTRY // TEMPLATES AUDITOR</span>
            </div>

            {/* Title Section Banner */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sandbox-cyan to-sandbox-violet mb-2">
                    Sandbox Environment Template Directory
                </h2>
                <p className="text-slate-400 text-sm max-w-3xl">
                    Centralized workspace to browse active infrastructure template models specifications, track sandbox claims, and inspect localized environment YAML definitions files.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Panel Column: Templates & Usage Reports Catalog Directory */}
                <div className="space-y-3 lg:col-span-1">
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-400 mb-1 font-semibold">Active Spec Templates</label>
                    
                    {sampleTemplatesList.map((template) => (
                        <div 
                            key={template.id}
                            onClick={() => setSelectedId(template.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between bg-sandbox-surface/60 ${selectedId === template.id ? 'border-sandbox-cyan shadow-[0_0_15px_rgba(0,245,255,0.1)] bg-sandbox-surface' : 'border-slate-800/80 hover:border-slate-700'}`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                    <FileCode className={`h-4 w-4 ${selectedId === template.id ? 'text-sandbox-cyan' : 'text-slate-500'}`} />
                                    {template.name}
                                </h4>
                                <span className="text-[10px] font-mono text-slate-500">{template.isolation}</span>
                            </div>
                            <div className="border-t border-slate-800/60 pt-2 mt-2 flex justify-between font-mono text-[10px] text-slate-400">
                                <div>Active Claims: <span className="text-white font-bold">{template.activeSandboxes}</span></div>
                                <div>Min Buffer: <span className="text-sandbox-cyan font-bold">{template.warmPoolSize}</span></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right Panel Column: Inline Spec YAML Config & Python SDK Code snippet generation */}
                <div className="lg:col-span-2 bg-sandbox-surface border border-slate-900/40 rounded-2xl p-5 shadow-xl flex flex-col">
                    
                    {/* Sub-tab Deck selector */}
                    <div className="flex border-b border-slate-850 pb-2 mb-4 font-mono text-[11px] gap-4 select-none">
                      <button 
                        onClick={() => setConsoleTab('yaml')}
                        className={`pb-1 font-bold transition-all cursor-pointer ${consoleTab === 'yaml' ? 'text-sandbox-cyan border-b-2 border-sandbox-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Specifications YAML Spec
                      </button>
                      <button 
                        onClick={() => setConsoleTab('sdk')}
                        className={`pb-1 font-bold transition-all cursor-pointer ${consoleTab === 'sdk' ? 'text-sandbox-cyan border-b-2 border-sandbox-cyan' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        Python SDK Initialization Code
                      </button>
                    </div>

                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-sandbox-cyan" />
                            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
                                {consoleTab === 'yaml' ? `GKE Template CustomResource Schema: ${currentTemplate?.name}.yaml` : `Programmatic SDK Client Invocation Bindings`}
                            </h3>
                        </div>
                        <button 
                            onClick={() => {
                                const clipText = consoleTab === 'yaml' ? currentYaml : `import google.gke.sandbox as sdk\n\n# Instantiate claim handles for pre-warmed isolation container pools\nclient = sdk.SandboxClient(project_id="gke-ai-eco-dev", cluster="barkland-brust")\nsandbox = client.claim(template="${currentTemplate?.name}", warm_timeout=1.5)\n\n# Execute secure code instructions blocks safely\nresponse = sandbox.execute("main_agent_inference.py", memory_limit="1.1GiB")\nprint(f"Execution completed. Status: {response.status_code}")`;
                                navigator.clipboard.writeText(clipText);
                                alert('Code contents successfully copied to clipboard.');
                            }}
                            className="p-1 text-slate-500 hover:text-sandbox-cyan transition-colors hover:bg-slate-800/60 rounded"
                            title="Copy code context"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Code Blocks Pane Container */}
                    {consoleTab === 'yaml' ? (
                      <pre className="bg-black/40 border border-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 leading-relaxed overflow-x-auto max-h-[320px] select-all">
                          <code>{currentYaml}</code>
                      </pre>
                    ) : (
                      <pre className="bg-black/40 border border-slate-900 rounded-xl p-4 font-mono text-xs text-cyan-400 leading-relaxed overflow-x-auto max-h-[320px] select-all">
                          <code>{`import google.gke.sandbox as sdk

# Instantiate claim handles for pre-warmed isolation container pools
client = sdk.SandboxClient(project_id="gke-ai-eco-dev", cluster="barkland-brust")
sandbox = client.claim(template="${currentTemplate?.name}", warm_timeout=1.5)

# Execute secure code instructions blocks safely and retrieve logs
response = sandbox.execute("main_agent_inference.py", memory_limit="1.1GiB")
print(f"Execution completed. Containment status: {response.status_code}")`}</code>
                      </pre>
                    )}

                    {/* Static Usage Summary Footer Block */}
                    <div className="mt-4 pt-3 border-t border-slate-900/50 flex items-center justify-between font-mono text-[10px] text-slate-500">
                        <div className="flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-sandbox-green" /> {consoleTab === 'yaml' ? 'Capacity distribution rule verified' : 'Python SDK client schema compliance verified'}</div>
                        <span>RESOURCE HUB // {consoleTab === 'yaml' ? 'CRD COMPLIANT' : 'SDK GENERATOR READY'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateManagementConsole;
