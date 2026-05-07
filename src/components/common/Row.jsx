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

export const Row = ({ label, value, unit = '' }) => {
    if (value === undefined || value === null || value === 'Unknown' || value === 'N/A' || value === '') return null;
    return (
        <div className="flex justify-between gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400">{label}:</span>
            <span className="font-mono font-medium text-slate-900 dark:text-slate-200">
                {typeof value === 'number' ? value.toLocaleString() : value}{unit}
            </span>
        </div>
    );
};
