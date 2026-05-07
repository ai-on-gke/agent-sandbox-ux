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

import React from 'react';

export const Card = ({ title, value, icon, details }) => {
  return (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg flex items-start space-x-4 transition-colors">
    <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg mt-1">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{value}</h3>
      {details && (
        <div className="space-y-1">
            {details.map((detail, idx) => (
                <div key={idx} className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                    <span>{detail.label}:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{detail.value}</span>
                </div>
            ))}
        </div>
      )}
    </div>
  </div>
  );
};
