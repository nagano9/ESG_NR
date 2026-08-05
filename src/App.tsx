import React from 'react';
import { Shell } from './components/layout/Shell.tsx';
import { Overview } from './components/dashboard/Overview.tsx';
import { Inventory } from './components/ghg/Inventory.tsx';
import { Materiality } from './components/materiality/Assessment.tsx';
import { Builder } from './components/reporting/Builder.tsx';
import { IFCChecklist } from './components/safeguards/IFCChecklist.tsx';
import { Tracker } from './components/actions/Tracker.tsx';
import { DataEntry } from './components/entry/DataEntry.tsx';
import { Stakeholders } from './components/stakeholders/Stakeholders.tsx';
import { EntityWorkspace } from './components/entity/EntityWorkspace.tsx';
import { useAuth } from './lib/AuthContext.tsx';
import { Globe, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('entity-workspace');
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Globe className="h-8 w-8" />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-slate-950">AIPulse ESG</h1>
          <p className="mx-auto mb-8 max-w-sm text-sm leading-6 text-slate-500">
            Centralized ESG management and executive intelligence for Nusantara Renewable Holding.
          </p>
          <button
            onClick={login}
            className="inline-flex w-full items-center justify-center gap-3 rounded-md bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <LogIn className="h-5 w-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
      case 'entity-workspace': return <EntityWorkspace />;
      case 'data-entry': return <DataEntry />;
      case 'ghg': return <Inventory />;
      case 'materiality': return <Materiality />;
      case 'reporting': return <Builder />;
      case 'safeguards': return <IFCChecklist />;
      case 'actions': return <Tracker />;
      case 'stakeholders': return <Stakeholders />;
      default: return <Overview />;
    }
  };

  return (
    <Shell activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Shell>
  );
}
