'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 rounded-2xl bg-[#B3B8B80C] border border-white/5 flex flex-col items-center justify-center min-h-[400px] text-center font-[family-name:var(--font-rh-display)]">
        <div className="w-16 h-16 bg-[#B2E234]/10 rounded-full flex items-center justify-center mb-4">
          <Send className="h-7 w-7 text-[#B2E234]" />
        </div>
        <h3 className="text-xl font-black text-white mb-2">¡Mensaje enviado!</h3>
        <p className="text-[#B3B8B8] text-sm">Te responderemos lo antes posible.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 md:p-8 rounded-2xl bg-[#B3B8B80C] border border-white/5 space-y-5 font-[family-name:var(--font-rh-display)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-white mb-2">Nombre</label>
          <input
            type="text"
            required
            placeholder="Tu nombre"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#B2E234]/50 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-white mb-2">Email</label>
          <input
            type="email"
            required
            placeholder="tu@email.com"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#B2E234]/50 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-white mb-2">Teléfono</label>
        <input
          type="tel"
          placeholder="+51 999 888 777"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#B2E234]/50 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-white mb-2">Asunto</label>
        <select
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#B2E234]/50 text-sm appearance-none"
        >
          <option value="" className="bg-[#121A1A]">Seleccionar asunto</option>
          <option value="info" className="bg-[#121A1A]">Información general</option>
          <option value="membership" className="bg-[#121A1A]">Membresías</option>
          <option value="classes" className="bg-[#121A1A]">Clases grupales</option>
          <option value="personal" className="bg-[#121A1A]">Entrenamiento personal</option>
          <option value="other" className="bg-[#121A1A]">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-white mb-2">Mensaje</label>
        <textarea
          required
          rows={4}
          placeholder="Cuéntanos en qué podemos ayudarte..."
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#B2E234]/50 text-sm resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full py-3.5 bg-[#B2E234] hover:bg-[#8DB52A] text-[#121A1A] font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <Send className="h-4 w-4" />
        Enviar mensaje
      </button>
    </form>
  );
}
