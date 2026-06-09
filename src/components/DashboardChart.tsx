'use client';

import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Indicator } from '../context/AppContext';

interface DashboardChartProps {
  indicators: Indicator[];
  chartData: any[];
}

export default function DashboardChart({ indicators, chartData }: DashboardChartProps) {
  if (!indicators || indicators.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-slate-400 text-sm">
        Nenhum indicador cadastrado para esta empresa.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorInd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#C5A85A" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#C5A85A" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1E2538', 
            borderColor: '#334155', 
            borderRadius: '8px',
            color: '#fff',
            fontSize: '12px'
          }} 
        />
        {indicators.slice(0, 4).map((ind, index) => {
          if (!ind || !ind.name) return null;
          return (
            <Area 
              key={ind.id || index}
              type="monotone" 
              dataKey={ind.name} 
              stroke={index === 0 ? '#C5A85A' : index === 1 ? '#10B981' : index === 2 ? '#3B82F6' : '#8B5CF6'} 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorInd)" 
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
