import React from 'react';
import { Shell } from './components/layout/Shell.tsx';
import { useAuth } from './lib/AuthContext.tsx';
import { Globe, LogIn } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

function LoadError() {
  return (
    <div className="app-panel p-6">
      <h2 className="text-lg font-semibold text-slate-950">Unable to load this workspace</h2>
      <p className="mt-2 text-sm text-slate-500">Refresh the page or switch to another module while the application recovers.</p>
    </div>
  );
}

function lazyView<T extends Record<string, React.ComponentType<any>>>(loader: () => Promise<T>, exportName: keyof T) {
  return React.lazy(() => loader()
    .then((module) => ({ default: module[exportName] }))
    .catch(() => ({ default: LoadError })));
}

const Overview = lazyView(() => import('./components/dashboard/Overview.tsx'), 'Overview');
const Inventory = lazyView(() => import('./components/ghg/Inventory.tsx'), 'Inventory');
const Materiality = lazyView(() => import('./components/materiality/Assessment.tsx'), 'Materiality');
const Builder = lazyView(() => import('./components/reporting/Builder.tsx'), 'Builder');
const IFCChecklist = lazyView(() => import('./components/safeguards/IFCChecklist.tsx'), 'IFCChecklist');
const Tracker = lazyView(() => import('./components/actions/Tracker.tsx'), 'Tracker');
const DataEntry = lazyView(() => import('./components/entry/DataEntry.tsx'), 'DataEntry');
const Stakeholders = lazyView(() => import('./components/stakeholders/Stakeholders.tsx'), 'Stakeholders');
const EntityWorkspace = lazyView(() => import('./components/entity/EntityWorkspace.tsx'), 'EntityWorkspace');

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
      <ErrorBoundary resetKey={activeTab}>
        <React.Suspense fallback={<div className="app-panel p-6 text-sm font-medium text-slate-500">Loading workspace...</div>}>
          {renderContent()}
        </React.Suspense>
      </ErrorBoundary>
    </Shell>
  );
}
