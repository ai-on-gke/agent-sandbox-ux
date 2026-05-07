// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const MultiSelectDropdown = ({ label, options, selected, onChange, counts, formatLabel, labelSuffix }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCount = selected.size;
    
    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs rounded-md px-3 py-2 flex items-center justify-between hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
                title={`${label}: ${selectedCount > 0 ? [...selected].join(', ') : 'All'}`}
            >
                <div className="flex items-center gap-2 truncate pr-2">
                    <span className="font-semibold text-slate-500">{label}</span>
                    {labelSuffix}
                    <span className="truncate">
                        {selectedCount === 0 ? 'All' : `${selectedCount} selected`}
                    </span>
                </div>
                <ChevronDown size={12} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[100] p-2 space-y-1">
                    <div 
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 ${selectedCount === 0 ? 'bg-blue-600/10 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}
                        onClick={() => { onChange(''); setIsOpen(false); }}
                    >
                         <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedCount === 0 ? 'bg-blue-600 border-blue-600' : 'border-slate-500'}`}>
                            {selectedCount === 0 && <Check size={10} className="text-white" />}
                         </div>
                         <span className="text-xs">All {label}</span>
                         <span className="text-[10px] text-slate-500 ml-auto">{options.length}</span>
                    </div>
                    
                    <div className="h-px bg-slate-200 dark:bg-slate-700 my-1 mx-1" />

                    {options.map(opt => {
                        const count = (counts && counts[opt]) || 0;
                        const isSelected = selected.has(opt);
                        return (
                            <div 
                                key={opt} 
                                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${count === 0 ? 'opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-700'} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                onClick={() => onChange(opt)}
                                title={formatLabel ? formatLabel(opt) : opt}
                            >
                                 <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                 </div>
                                 <span className={`text-xs truncate flex-1 ${isSelected ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                                     {formatLabel ? formatLabel(opt) : opt}
                                 </span>
                                 <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{count}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
