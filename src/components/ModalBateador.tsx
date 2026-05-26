import { useState } from 'react';

export interface FormBateador {
  numero: string;
  apellido: string;
  nombre: string;
  equipo: string;
  ladoBateo: 'D' | 'Z' | 'S';
}

export const FORM_VACIO: FormBateador = { numero: '', apellido: '', nombre: '', equipo: '', ladoBateo: 'D' };

export default function ModalBateador({
  inicial,
  titulo,
  subtitulo,
  onGuardar,
  onClose,
}: {
  inicial?: FormBateador;
  titulo: string;
  subtitulo?: string;
  onGuardar: (d: FormBateador) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormBateador>(inicial ?? FORM_VACIO);
  const set = (k: keyof FormBateador) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const guardar = () => {
    if (!form.apellido.trim() || !form.numero.trim()) return;
    onGuardar({
      numero: form.numero.trim(),
      apellido: form.apellido.trim().toUpperCase(),
      nombre: form.nombre.trim().toUpperCase(),
      equipo: form.equipo.trim().toUpperCase(),
      ladoBateo: form.ladoBateo,
    });
    onClose();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <h2 className="sheet-title">{titulo}</h2>
        {subtitulo && <p className="sheet-subtitle">{subtitulo}</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group" style={{ width: '40%' }}>
            <label className="label"># Camiseta *</label>
            <input className="input" placeholder="7" value={form.numero} onChange={set('numero')} maxLength={3} inputMode="numeric" />
          </div>
          <div className="form-group">
            <label className="label">Apellido *</label>
            <input className="input" placeholder="HORT" value={form.apellido} onChange={set('apellido')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Nombre</label>
            <input className="input" placeholder="LOCHLAN" value={form.nombre} onChange={set('nombre')} maxLength={40} autoCapitalize="characters" />
          </div>
          <div className="form-group">
            <label className="label">Lado de bateo</label>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              {(['D', 'Z', 'S'] as const).map(l => (
                <button
                  key={l}
                  className={`btn ${form.ladoBateo === l ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, borderRadius: 0, border: 'none', borderRight: l !== 'S' ? '1px solid var(--border)' : 'none', padding: '10px 0' }}
                  onClick={() => setForm({ ...form, ladoBateo: l })}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={guardar}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
