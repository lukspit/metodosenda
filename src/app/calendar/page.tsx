'use client';

import React, { useState } from 'react';
import { useApp, Meeting } from '../../context/AppContext';
import { SmartInput } from '../../components/SmartInput';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Users,
  Video,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function CalendarPage() {
  const { meetings, departments, profiles, createMeeting } = useApp();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);

  // Estados do Formulário Manual
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState('');

  // Callback ao agendar reunião via IA
  const handleAISuccess = async (result: any) => {
    if (result.action === 'create' && result.data) {
      const { title, description, start_time, end_time, department_id, participants } = result.data;
      
      const success = await createMeeting({
        title,
        description,
        start_time,
        end_time: end_time || new Date(new Date(start_time).getTime() + 3600000).toISOString(),
        department_id,
        participants: participants || []
      });

      if (success) {
        setAiFeedback(result.explanation || `Reunião "${title}" agendada com sucesso!`);
        if (start_time) {
          setCurrentDate(new Date(start_time));
          setSelectedDate(new Date(start_time));
        }
        setTimeout(() => setAiFeedback(null), 5000);
      }
    }
  };

  // Cadastrar Reunião Manual
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newStart || !newEnd) return;

    const success = await createMeeting({
      title: newTitle,
      description: newDesc,
      start_time: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newStart}`).toISOString(),
      end_time: new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${newEnd}`).toISOString(),
      department_id: newDept || null,
      participants: []
    });

    if (success) {
      setNewTitle('');
      setNewStart('');
      setNewEnd('');
      setNewDesc('');
      setNewDept('');
      setShowAddForm(false);
      alert('Reunião agendada com sucesso!');
    }
  };

  // Funções de navegação do calendário
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Cálculo das datas da grade mensal
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const suggestions = [
    'Marcar alinhamento com a equipe comercial amanhã às 10h',
    'Agendar conselho de diretoria na próxima quarta às 14h sobre os indicadores',
    'Marcar feedback com Fabricio na sexta-feira às 17h'
  ];

  // Reuniões do dia selecionado
  const selectedDayMeetings = meetings.filter(meet => 
    isSameDay(parseISO(meet.start_time), selectedDate)
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Agenda</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calendário integrado de reuniões, consultorias e alinhamentos.</p>
      </div>

      {/* Input de IA Contextual */}
      <SmartInput
        context="meetings"
        placeholder="Agende uma reunião por voz ou texto... (ex: 'Marcar reunião com comercial amanhã às 14h')"
        onSuccess={handleAISuccess}
        existingData={{ departments, profiles }}
        suggestions={suggestions}
      />

      {/* Feedback de IA */}
      {aiFeedback && (
        <div className="bg-[#C5A85A]/10 border border-[#C5A85A]/35 text-[#C5A85A] px-4 py-3 rounded-md flex items-center gap-2 text-xs font-semibold animate-fadeIn">
          <Sparkles className="w-4 h-4 fill-[#C5A85A]/20" />
          <span>IA: {aiFeedback}</span>
        </div>
      )}

      {/* Grid Principal Calendário / Detalhes do Dia */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Calendário Mensal (8 Colunas) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E2538] rounded-lg p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm">
          {/* Header do Calendário */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dias da Semana */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 py-4">
            <div>DOM</div>
            <div>SEG</div>
            <div>TER</div>
            <div>QUA</div>
            <div>QUI</div>
            <div>SEX</div>
            <div>SÁB</div>
          </div>

          {/* Grade de Dias */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const dayMeetings = meetings.filter(meet => isSameDay(parseISO(meet.start_time), day));
              
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[75px] p-2 rounded-md flex flex-col justify-between border transition-all duration-200 text-left relative ${
                    !isCurrentMonth 
                      ? 'text-slate-300 dark:text-slate-650 bg-slate-50/30 dark:bg-transparent border-transparent' 
                      : isSelected
                        ? 'bg-[#C5A85A] text-white border-[#C5A85A] shadow-md shadow-[#C5A85A]/20'
                        : 'bg-white dark:bg-[#161B29]/30 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-350'
                  }`}
                >
                  <span className="font-bold text-xs">{format(day, 'd')}</span>
                  
                  {/* Indicador de Reuniões */}
                  {dayMeetings.length > 0 && (
                    <div className="flex flex-col gap-1 w-full mt-2">
                      {dayMeetings.slice(0, 2).map(m => (
                        <div 
                          key={m.id}
                          className={`text-[8px] px-1.5 py-0.5 rounded truncate font-medium ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : 'bg-[#C5A85A]/15 text-[#C5A85A] dark:bg-[#C5A85A]/10'
                          }`}
                        >
                          {m.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <span className={`text-[7px] font-bold text-right ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          +{dayMeetings.length - 2} mais
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detalhes do Dia & Agendamento Manual (4 Colunas) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Reuniões do Dia Selecionado */}
          <div className="bg-white dark:bg-[#1E2538] rounded-lg p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">Reuniões do Dia</h3>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                  {format(selectedDate, 'eeee, d MMMM', { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="p-1.5 bg-[#C5A85A]/10 text-[#C5A85A] hover:bg-[#C5A85A] hover:text-white rounded-lg transition-colors"
                title="Agendar Manual"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Listagem de Reuniões */}
            {selectedDayMeetings.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {selectedDayMeetings.map((meet) => {
                  const dept = departments.find(d => d.id === meet.department_id)?.name || 'Geral';
                  
                  return (
                    <div 
                      key={meet.id} 
                      className="border-l-4 border-[#C5A85A] bg-slate-50 dark:bg-[#161B29]/65 px-4 py-3 rounded-r-xl border-y border-r border-slate-100 dark:border-slate-800/80 space-y-2"
                    >
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 leading-snug">{meet.title}</h4>
                      {meet.description && <p className="text-[10px] text-slate-450 font-light">{meet.description}</p>}
                      
                      <div className="flex flex-wrap gap-y-1 justify-between items-center text-[9px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C5A85A]" />
                          {format(parseISO(meet.start_time), 'HH:mm')} - {format(parseISO(meet.end_time), 'HH:mm')}
                        </span>
                        <span className="bg-[#C5A85A]/10 text-[#C5A85A] px-2 py-0.5 rounded font-bold uppercase">
                          {dept}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">Nenhuma reunião agendada para este dia.</p>
            )}
          </div>

          {/* Formulário de Agendamento Manual */}
          {showAddForm && (
            <div className="bg-white dark:bg-[#1E2538] rounded-lg p-6 border border-slate-200/60 dark:border-slate-850 shadow-sm animate-fadeIn">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm mb-4">Novo Agendamento</h3>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Título</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Conselho Trimestral"
                    className="w-full bg-slate-50 dark:bg-[#1A2332] text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Início</label>
                    <input
                      type="time"
                      required
                      value={newStart}
                      onChange={e => setNewStart(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1A2332] text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Término</label>
                    <input
                      type="time"
                      required
                      value={newEnd}
                      onChange={e => setNewEnd(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#1A2332] text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Setor</label>
                  <select
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#1A2332] text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A85A]"
                  >
                    <option value="">Geral</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Descrição</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    rows={2}
                    placeholder="Pauta da reunião..."
                    className="w-full bg-slate-50 dark:bg-[#1A2332] text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#C5A85A] resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end text-xs">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)} 
                    className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-1.5 bg-[#C5A85A] hover:bg-[#B3964C] text-white rounded-lg font-bold shadow transition-colors"
                  >
                    Agendar
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
