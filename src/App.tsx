/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DarAlAthathView } from './components/DarAlAthathView';
import { useKeepAlive } from './hooks/useKeepAlive';

export default function App() {
  // Keep 24/7 anti-sleep and heartbeat active in the background
  useKeepAlive();

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#FFFBF5] text-[#2B2117]">
      <DarAlAthathView />
    </div>
  );
}
