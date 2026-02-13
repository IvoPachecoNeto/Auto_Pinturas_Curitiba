import React, { useState, useEffect } from 'react';
import BudgetForm from './components/BudgetForm';
import BudgetList from './components/BudgetList';
import { db } from './services/db';
import { Budget } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, []);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await db.getAll();
      setBudgets(data);
    } catch (error) {
      console.error("Failed to load budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setCurrentBudget(null);
    setView('form');
  };

  const handleEdit = async (id: number) => {
    try {
      const budget = await db.getById(id);
      if (budget) {
        setCurrentBudget(budget);
        setView('form');
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
      alert("Erro ao abrir orçamento.");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await db.delete(id);
      await loadBudgets();
    } catch (error) {
      console.error("Error deleting budget:", error);
      alert("Erro ao excluir orçamento.");
    }
  };

  const handleCloseForm = () => {
    setView('list');
    loadBudgets();
  };

  if (loading && view === 'list') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500">
        Carregando sistema...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {view === 'list' ? (
        <BudgetList 
          budgets={budgets} 
          onNew={handleNew} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
        />
      ) : (
        <BudgetForm 
          existingBudget={currentBudget} 
          onClose={handleCloseForm} 
        />
      )}
    </div>
  );
};

export default App;