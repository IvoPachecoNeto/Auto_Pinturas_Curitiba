import React, { useState, useMemo, useRef } from 'react';
import { Budget } from '../types';
import { Plus, Edit, Trash2, Search, Car, DollarSign, Download, Upload } from 'lucide-react';
import { db } from '../services/db';

interface BudgetListProps {
  budgets: Budget[];
  onNew: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const BudgetList: React.FC<BudgetListProps> = ({ budgets, onNew, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter budgets based on search term (Name, Plate, or ID)
  const filteredBudgets = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return budgets
      .filter((budget) => {
        const nameMatch = budget.clientData.name?.toLowerCase().includes(term) || false;
        const plateMatch = budget.clientData.plate?.toLowerCase().includes(term) || false;
        const idMatch = budget.id.toString().includes(term);
        return nameMatch || plateMatch || idMatch;
      })
      .sort((a, b) => b.id - a.id);
  }, [budgets, searchTerm]);

  // Calculate totals based on filtered results
  const totalValue = filteredBudgets.reduce((acc, curr) => acc + curr.totalValue, 0);
  const totalCount = filteredBudgets.length;

  const handleExport = async () => {
    try {
      const json = await db.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_orcamentos_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Erro ao exportar dados.");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Isso irá adicionar os orçamentos do arquivo ao seu sistema. Deseja continuar?")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = event.target?.result as string;
        const count = await db.importData(json);
        alert(`${count} orçamentos restaurados com sucesso! A página será recarregada.`);
        window.location.reload();
      } catch (error) {
        alert("Erro ao ler o arquivo de backup. Verifique se é um arquivo válido.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Orçamentos</h1>
          <p className="text-gray-500">Auto Pinturas Curitiba - Gerenciador</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          {/* Backup Buttons */}
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
            title="Salvar arquivo de backup no computador"
          >
            <Download size={20} /> <span className="hidden sm:inline">Backup</span>
          </button>
          
          <button 
            onClick={handleImportClick}
            className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
            title="Restaurar backup de um arquivo"
          >
            <Upload size={20} /> <span className="hidden sm:inline">Restaurar</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".json" 
            onChange={handleFileChange}
          />

          {/* New Budget Button */}
          <button 
            onClick={onNew}
            className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition shadow-lg"
          >
            <Plus size={20} /> Novo
          </button>
        </div>
      </div>

      {/* Search and Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Search Input */}
        <div className="md:col-span-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, placa..."
            className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm transition"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Summary Dashboard */}
        <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-3 flex flex-col sm:flex-row justify-around items-center text-blue-900 shadow-sm">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <div className="bg-blue-200 p-2 rounded-full">
              <Car size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Veículos</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </div>
          <div className="h-8 w-px bg-blue-200 hidden sm:block"></div>
          <div className="flex items-center gap-3">
             <div className="bg-green-200 p-2 rounded-full">
              <DollarSign size={20} className="text-green-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Valor Total</p>
              <p className="text-2xl font-bold text-green-800">
                R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        {filteredBudgets.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <Search size={48} className="text-gray-300 mb-4" />
            <p className="text-lg font-medium">Nenhum orçamento encontrado.</p>
            <p className="text-sm">Tente buscar por outro termo ou crie um novo orçamento.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Nº</th>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Veículo</th>
                  <th className="px-6 py-4 text-right">Valor Total</th>
                  <th className="px-6 py-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBudgets.map((budget) => (
                  <tr key={budget.id} className="hover:bg-gray-50 transition group">
                    <td className="px-6 py-4 font-medium text-gray-900">#{budget.id}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(budget.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{budget.clientData.name || 'Sem nome'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex flex-col">
                        <span>{budget.clientData.vehicle}</span>
                        <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded w-fit mt-1 font-mono">
                          {budget.clientData.plate || '---'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      R$ {budget.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEdit(budget.id)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Tem certeza que deseja excluir este orçamento?')) onDelete(budget.id);
                          }}
                          className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-full hover:bg-red-100 transition"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center text-xs text-gray-400">
        Mostrando {filteredBudgets.length} de {budgets.length} registros
      </div>
    </div>
  );
};

export default BudgetList;