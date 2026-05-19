'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Header } from '@/components/dashboard/header';
import { MembersTable } from './_components/members-table';
import { MemberForm } from './_components/member-form';

export default function MembersPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editMemberId, setEditMemberId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditMemberId(null);
    setFormOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditMemberId(id);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditMemberId(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditMemberId(null);
  };

  return (
    <>
      {/* DESKTOP — header instantáneo (lego), tabla anima por dentro */}
      <div className="hidden md:block space-y-6">
        <div className="anim-lego">
          <Header title="Clientes" description="Gestiona los clientes del gimnasio" eyebrow="Membresías">
            <button onClick={handleCreate} className="btn-fire">
              <Plus className="h-4 w-4" strokeWidth={3} />
              Nuevo cliente
            </button>
          </Header>
        </div>

        <MembersTable refreshKey={refreshKey} onEdit={handleEdit} />
      </div>

      {/* MOBILE NATIVO */}
      <div className="md:hidden">
        <MembersTable refreshKey={refreshKey} onEdit={handleEdit} />

        {/* FAB crear cliente */}
        <button onClick={handleCreate} className="mobile-fab" aria-label="Nuevo cliente">
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      <MemberForm
        open={formOpen}
        memberId={editMemberId}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}
