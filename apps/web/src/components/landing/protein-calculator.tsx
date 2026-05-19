'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete';
type Goal = 'lose' | 'maintain' | 'gain';

const activityLabels: Record<ActivityLevel, string> = {
  sedentary: 'Sedentario',
  light: 'Ejercicio ligero (1-2 días/sem)',
  moderate: 'Ejercicio moderado (3-4 días/sem)',
  intense: 'Ejercicio intenso (5-6 días/sem)',
  athlete: 'Atleta (2x al día)',
};

const goalLabels: Record<Goal, string> = {
  lose: 'Perder grasa',
  maintain: 'Mantener peso',
  gain: 'Ganar músculo',
};

// Factor de proteína g/kg según actividad + objetivo
const proteinFactors: Record<ActivityLevel, Record<Goal, number>> = {
  sedentary: { lose: 1.2, maintain: 0.8, gain: 1.4 },
  light: { lose: 1.4, maintain: 1.0, gain: 1.6 },
  moderate: { lose: 1.6, maintain: 1.2, gain: 1.8 },
  intense: { lose: 1.8, maintain: 1.4, gain: 2.0 },
  athlete: { lose: 2.0, maintain: 1.6, gain: 2.4 },
};

export function ProteinCalculator() {
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<Goal>('maintain');
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    if (!w || w <= 0 || w > 300) return;
    const factor = proteinFactors[activity][goal];
    setResult(Math.round(w * factor));
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-8 rounded-2xl bg-[#B3B8B80C] border border-white/5 font-[family-name:var(--font-rh-display)]">
      <div className="space-y-5">
        {/* Peso */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Tu peso (kg)
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ej: 75"
            min="30"
            max="300"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#B2E234]/50 text-sm"
          />
        </div>

        {/* Nivel de actividad */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Nivel de actividad
          </label>
          <select
            value={activity}
            onChange={(e) => setActivity(e.target.value as ActivityLevel)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#B2E234]/50 text-sm appearance-none"
          >
            {Object.entries(activityLabels).map(([key, label]) => (
              <option key={key} value={key} className="bg-[#121A1A] text-white">
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            Tu objetivo
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(goalLabels) as [Goal, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGoal(key)}
                className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                  goal === key
                    ? 'bg-[#B2E234] text-[#121A1A]'
                    : 'bg-white/5 text-[#B3B8B8] border border-white/10 hover:border-white/20'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Botón calcular */}
        <button
          onClick={calculate}
          className="w-full py-3.5 bg-[#B2E234] hover:bg-[#8DB52A] text-[#121A1A] font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="h-4 w-4" />
          Calcular
        </button>

        {/* Resultado */}
        {result !== null && (
          <div className="text-center p-6 rounded-xl bg-[#B2E234]/10 border border-[#B2E234]/20">
            <p className="text-sm text-[#B3B8B8] mb-1">Necesitas aproximadamente</p>
            <p className="text-4xl font-black text-[#B2E234]">{result}g</p>
            <p className="text-sm text-[#B3B8B8] mt-1">de proteína al día</p>
          </div>
        )}
      </div>
    </div>
  );
}
