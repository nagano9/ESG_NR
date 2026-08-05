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
import { useAuth } from './lib/AuthContext.tsx';
import { Globe, LogIn } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = React.useState('overview');
  const { user, loading, login } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-8">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-emerald-200">
          <Globe className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AIPulse ESG</h1>
        <p className="text-slate-500 mb-8 text-center max-w-sm">
          Centralized ESG management and executive intelligence for Nusantara Renewable Holding.
        </p>
        <button
          onClick={login}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
        >
          <LogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <Overview />;
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
