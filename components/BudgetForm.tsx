import React, { useState, useEffect, useRef } from 'react';
import { Printer, Save, FileDown, ArrowLeft, Upload, Image as ImageIcon } from 'lucide-react';
import { FIXED_PARTS_LIST, Budget, ClientData, ServiceSelection } from '../types';
import { db } from '../services/db';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface BudgetFormProps {
  existingBudget?: Budget | null;
  onClose: () => void;
}

const emptyServiceSelection: ServiceSelection = {
  funil: false,
  pintura: false,
  retoq: false,
  martel: false,
  partDescription: '',
  partPrice: 0
};

const BudgetForm: React.FC<BudgetFormProps> = ({ existingBudget, onClose }) => {
  const [budgetId, setBudgetId] = useState<number | null>(existingBudget?.id || null);
  const [logo, setLogo] = useState<string | undefined>(existingBudget?.logo);
  const [isSaving, setIsSaving] = useState(false);
  
  // Client Data State
  const [clientData, setClientData] = useState<ClientData>(existingBudget?.clientData || {
    name: '',
    phone: '',
    cpfCnpj: '',
    date: new Date().toISOString().split('T')[0],
    estimator: '',
    vehicle: '',
    color: '',
    plate: '',
    year: '',
  });

  // Services State (Integrated table)
  const [services, setServices] = useState<Record<string, ServiceSelection>>(existingBudget?.services || {});

  // Observations
  const [observations, setObservations] = useState<string>(existingBudget?.observations || '');

  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize empty services if new
  useEffect(() => {
    if (!existingBudget) {
      const initialServices: Record<string, ServiceSelection> = {};
      FIXED_PARTS_LIST.forEach(part => {
        initialServices[part] = { ...emptyServiceSelection };
      });
      setServices(initialServices);
    }
  }, [existingBudget]);

  const handleServiceChange = (part: string, field: keyof ServiceSelection, value: any) => {
    setServices(prev => ({
      ...prev,
      [part]: {
        ...(prev[part] || emptyServiceSelection),
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateTotal = (): number => {
    const items = Object.values(services) as ServiceSelection[];
    return items.reduce((acc: number, item: ServiceSelection) => acc + (Number(item.partPrice) || 0), 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const total = calculateTotal();
      const budgetToSave = {
        ...(budgetId ? { id: budgetId } : {}),
        clientData,
        services,
        observations,
        createdAt: existingBudget?.createdAt || Date.now(),
        totalValue: total,
        logo
      };

      const saved = await db.save(budgetToSave as Budget);
      setBudgetId(saved.id);
      alert(`Orçamento nº ${saved.id} salvo com sucesso!`);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Erro ao salvar orçamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePDF = async () => {
    if (contentRef.current) {
      try {
        // Reset scroll to ensure full capture
        window.scrollTo(0, 0);

        const canvas = await html2canvas(contentRef.current, {
          scale: 3, // Higher scale for better text resolution
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollY: 0, // Prevent scroll offset issues
        });
        
        const imgData = canvas.toDataURL('image/png'); // PNG is sharper than JPEG for text
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate dimensions to fit page width while maintaining aspect ratio
        const imgProps = pdf.getImageProperties(imgData);
        const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
        pdf.save(`Orcamento_${budgetId || 'Novo'}.pdf`);
      } catch (error) {
        console.error("Error generating PDF", error);
        alert("Erro ao gerar PDF. Tente novamente ou use a opção Imprimir > Salvar como PDF.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 min-h-screen">
      {/* Toolbar */}
      <div className="w-full max-w-[210mm] flex justify-between items-center no-print px-4 md:px-0">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className={`flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save size={18} /> {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
            <Printer size={18} /> Imprimir
          </button>
          <button onClick={handleGeneratePDF} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            <FileDown size={18} /> PDF
          </button>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div 
        ref={contentRef}
        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-8 print:shadow-none print:w-full print:p-0 relative text-xs md:text-sm font-sans box-border"
        style={{ color: '#000' }}
      >
        {/* HEADER */}
        <div className="border border-black mb-1">
          <div className="flex">
            {/* Left Section - Services List */}
             <div className="w-1/3 bg-gray-100 p-4 border-r border-black flex flex-col justify-center text-[10px] uppercase font-bold text-gray-800 leading-relaxed">
               <p>• Funilaria artesanal</p>
               <p>• Pintura</p>
               <p>• Espelhamento 3M</p>
               <p>• Personalização e concertos de para-choque</p>
               <p>• Conserto de faróis e lanternas</p>
             </div>

            {/* Center Section - Logo Upload */}
            <div className="w-1/3 bg-gray-900 text-white p-2 flex flex-col justify-center items-center relative overflow-hidden group">
               <input 
                 type="file" 
                 accept="image/*" 
                 ref={fileInputRef} 
                 className="hidden" 
                 onChange={handleLogoUpload} 
               />
               
               {logo ? (
                 <div 
                   className="w-full h-full flex items-center justify-center cursor-pointer relative"
                   onClick={() => fileInputRef.current?.click()}
                 >
                   <img src={logo} alt="Logo" className="max-h-[160px] max-w-full object-contain" />
                   <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center text-[10px] text-white no-print">
                     Trocar Imagem
                   </div>
                 </div>
               ) : (
                 <div 
                   className="flex flex-col items-center justify-center cursor-pointer hover:text-gray-300"
                   onClick={() => fileInputRef.current?.click()}
                 >
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-center" style={{ fontFamily: 'Arial, sans-serif' }}>AUTO PINTURAS</h1>
                    <div className="flex items-center gap-1 mt-2 text-[10px] bg-white/10 px-2 py-1 rounded no-print">
                      <Upload size={12} />
                      <span>Enviar Logo</span>
                    </div>
                 </div>
               )}
            </div>

            {/* Right Section - Contacts */}
            <div className="w-1/3 bg-gray-100 p-2 flex flex-col justify-center border-l border-black text-right pr-4">
              <div className="mb-2">
                <p className="font-bold text-lg leading-tight">Yago Guiffon</p>
                <p className="text-red-700 font-bold text-lg leading-tight">41 99529-0287</p>
              </div>
              <div className="mb-2">
                <p className="font-bold text-lg leading-tight">Cidinho</p>
                <p className="text-red-700 font-bold text-lg leading-tight">41 99632-4463</p>
              </div>
              <div className="flex items-center justify-end gap-2 mt-auto">
                <span className="font-bold text-[10px]">CNPJ: 30.706.702/0001-56</span>
              </div>
            </div>
          </div>
          
          {/* Address Strip - Single line per address */}
          <div className="border-t border-black bg-white text-[8px] flex justify-between px-2 py-1 items-center gap-2 whitespace-nowrap overflow-hidden">
             <div className="flex-1 border-r border-gray-300 pr-1 truncate">
               <span className="font-bold text-red-600">Matriz:</span> Linha Verde - BR 116 - Nº 7800 - Cristo Rei - Curitiba - PR
             </div>
             <div className="flex-1 pl-1 text-center truncate">
               <span className="font-bold text-red-600">Filial 1:</span> Av. Presidente Affonso Camargo, 2971 - Capão da Imbuia - Curitiba - PR
             </div>
          </div>
        </div>

        {/* CLIENT DATA FORM */}
        <div className="bg-gray-100/50 border border-black p-2 mb-1 space-y-1">
          {/* Row 1 */}
          <div className="flex gap-2 items-end">
            <label className="w-16 font-semibold">Cliente:</label>
            <input 
              type="text" 
              value={clientData.name} 
              onChange={(e) => setClientData({...clientData, name: e.target.value})}
              className="flex-1 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
            <label className="w-10 font-semibold text-right">Data:</label>
            <input 
              type="date" 
              value={clientData.date} 
              onChange={(e) => setClientData({...clientData, date: e.target.value})}
              className="w-32 bg-transparent border-b border-gray-400 outline-none px-1 h-6 text-center font-handwritten text-xl text-blue-800"
            />
          </div>

          {/* Row 2 */}
          <div className="flex gap-2 items-end">
            <label className="w-16 font-semibold">Telefone:</label>
            <input 
              type="text" 
              value={clientData.phone} 
              onChange={(e) => setClientData({...clientData, phone: e.target.value})}
              className="w-1/3 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
            <label className="w-20 font-semibold text-right">CPF/CNPJ:</label>
            <input 
              type="text" 
              value={clientData.cpfCnpj} 
              onChange={(e) => setClientData({...clientData, cpfCnpj: e.target.value})}
              className="flex-1 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
            <label className="w-24 font-semibold text-right">Orçamentista:</label>
            <input 
              type="text" 
              value={clientData.estimator} 
              onChange={(e) => setClientData({...clientData, estimator: e.target.value})}
              className="w-1/4 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
          </div>

          {/* Row 3 */}
          <div className="flex gap-2 items-end">
            <label className="w-16 font-semibold">Veículo:</label>
            <input 
              type="text" 
              value={clientData.vehicle} 
              onChange={(e) => setClientData({...clientData, vehicle: e.target.value})}
              className="flex-1 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
            <label className="w-10 font-semibold text-right">Cor:</label>
            <input 
              type="text" 
              value={clientData.color} 
              onChange={(e) => setClientData({...clientData, color: e.target.value})}
              className="w-32 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
             <label className="w-12 font-semibold text-right">Placa:</label>
            <input 
              type="text" 
              value={clientData.plate} 
              onChange={(e) => setClientData({...clientData, plate: e.target.value})}
              className="w-24 bg-transparent border-b border-gray-400 outline-none px-1 h-6 uppercase font-handwritten text-xl text-blue-800"
            />
             <label className="w-10 font-semibold text-right">Ano:</label>
            <input 
              type="text" 
              value={clientData.year} 
              onChange={(e) => setClientData({...clientData, year: e.target.value})}
              className="w-16 bg-transparent border-b border-gray-400 outline-none px-1 h-6 font-handwritten text-xl text-blue-800"
            />
          </div>
        </div>

        {/* MAIN INTEGRATED TABLE */}
        <div className="flex border border-black h-[180mm]"> 
          
          {/* SINGLE TABLE */}
          <div className="w-full flex flex-col">
            <div className="bg-gray-800 text-white text-center font-bold py-1 border-b border-black uppercase text-sm grid grid-cols-12">
               <div className="col-span-12">SERVIÇOS E PEÇAS</div>
            </div>
            
            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-gray-400 bg-gray-100 text-[9px] font-bold text-center h-8 items-center">
              <div className="col-span-3 pl-1 text-left border-r border-gray-300 h-full flex items-center">PARTES</div>
              <div className="col-span-1 border-r border-gray-300 h-full flex items-center justify-center">FUNIL</div>
              <div className="col-span-1 border-r border-gray-300 h-full flex items-center justify-center">PINTURA</div>
              <div className="col-span-1 border-r border-gray-300 h-full flex items-center justify-center">RETOQ</div>
              <div className="col-span-1 border-r border-gray-300 h-full flex items-center justify-center">MARTEL</div>
              <div className="col-span-3 border-r border-gray-300 h-full flex items-center justify-center">DESC. PEÇA (OPCIONAL)</div>
              <div className="col-span-2 h-full flex items-center justify-center">VALOR PEÇA R$</div>
            </div>
            
            {/* Table Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {FIXED_PARTS_LIST.map((part, index) => (
                <div key={index} className="grid grid-cols-12 border-b border-gray-300 text-[10px] h-full items-center hover:bg-gray-50">
                  {/* Part Name */}
                  <div className="col-span-3 pl-1 font-medium truncate whitespace-nowrap overflow-hidden border-r border-gray-300 h-full flex items-center" title={part}>
                    {part}
                  </div>
                  
                  {/* Checkboxes - CUSTOM X IMPLEMENTATION (No borders now) */}
                  {(['funil', 'pintura', 'retoq', 'martel'] as const).map((type) => (
                    <div key={type} className="col-span-1 border-r border-gray-300 h-full flex items-center justify-center">
                      <div 
                        onClick={() => handleServiceChange(part, type, !services[part]?.[type])}
                        className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                         {services[part]?.[type] && (
                            <span className="font-sans font-bold text-xs text-blue-800 leading-none">X</span>
                         )}
                      </div>
                    </div>
                  ))}

                  {/* Part Description Input */}
                  <div className="col-span-3 border-r border-gray-300 h-full">
                     <input 
                        type="text" 
                        value={services[part]?.partDescription || ''}
                        onChange={(e) => handleServiceChange(part, 'partDescription', e.target.value)}
                        placeholder=""
                        className="w-full h-full bg-transparent px-1 outline-none text-center font-handwritten text-lg text-blue-800"
                      />
                  </div>

                  {/* Part Price Input */}
                  <div className="col-span-2 h-full">
                     <input 
                        type="number" 
                        value={services[part]?.partPrice === 0 ? '' : services[part]?.partPrice}
                        onChange={(e) => handleServiceChange(part, 'partPrice', parseFloat(e.target.value) || 0)}
                        placeholder=""
                        className="w-full h-full bg-transparent px-1 outline-none text-right font-medium font-handwritten text-lg text-blue-800"
                      />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER - OBS & TOTAL */}
        <div className="flex border border-t-0 border-black h-[40mm]">
          {/* Observation Area */}
          <div className="w-[70%] border-r border-black flex flex-col">
            <div className="bg-gray-800 text-white text-center font-bold py-1 text-xs uppercase">
              CAMPO DE OBSERVAÇÃO
            </div>
            <textarea 
              className="w-full h-full resize-none p-2 text-xs outline-none bg-transparent font-handwritten text-xl text-blue-800"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
            ></textarea>
          </div>

          {/* Total & Signature */}
          <div className="w-[30%] flex flex-col">
             <div className="bg-gray-800 text-white text-center font-bold py-1 text-xs uppercase">
              TOTAL GERAL - R$
            </div>
            <div className="flex-1 flex items-center justify-center text-2xl font-bold bg-gray-50 font-handwritten text-4xl text-blue-800">
               R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="h-10 border-t border-black flex items-end justify-center pb-1">
              <span className="text-[9px] text-gray-500 uppercase font-semibold">Assinatura Cliente</span>
            </div>
          </div>
        </div>
        
        {/* Budget Number (System generated) */}
        <div className="absolute top-8 right-8 text-red-600 font-bold text-lg border-2 border-red-600 px-2 rotate-[-5deg] opacity-80">
          Nº {budgetId ? budgetId : '______'}
        </div>

      </div>
    </div>
  );
};

export default BudgetForm;