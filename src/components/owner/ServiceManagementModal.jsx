import React, { useState, useEffect } from 'react';
import { ownerServiceAPI } from '../../services/owner/ownerServiceAPI';
import { useNotification } from '../../context/NotificationContext';
import ServiceFormModal from './ServiceFormModal';

export default function ServiceManagementModal({ isOpen, onClose, field }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);
  const { notifySuccess, notifyError } = useNotification();

  useEffect(() => {
    if (isOpen && field) {
      fetchServices();
    }
  }, [isOpen, field]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await ownerServiceAPI.getServices(field._id);
      setServices(res.services || []);
    } catch (err) {
      notifyError();
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingService(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (srv) => {
    setEditingService(srv);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Chắc chắn xóa dịch vụ này?')) return;
    try {
      await ownerServiceAPI.deleteService(id);
      setServices((prev) => prev.filter((s) => s._id !== id));
      notifySuccess();
    } catch (err) {
      notifyError();
    }
  };

  const handleSave = async (formData) => {
    try {
      setSaving(true);
      if (editingService) {
        const res = await ownerServiceAPI.updateService(editingService._id, formData);
        setServices((prev) => prev.map((s) => (s._id === editingService._id ? res.service : s)));
      } else {
        const payload = { ...formData, fieldID: field._id };
        const res = await ownerServiceAPI.createService(payload);
        setServices((prev) => [res.service, ...prev]);
      }
      notifySuccess();
      setIsFormOpen(false);
    } catch (err) {
      notifyError();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="p-6 border-b border-outline-variant/10 flex items-start justify-between flex-shrink-0">
            <div>
              <span className="text-tertiary font-label text-xs uppercase tracking-[0.2em] block mb-1">
                Quản lý dịch vụ
              </span>
              <h3 className="headline-font text-2xl font-bold text-on-surface leading-tight">
                {field?.fieldName}
              </h3>
              <p className="text-on-surface-variant text-sm mt-1">{field?.fieldType}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-tertiary/10 hover:bg-tertiary hover:text-black text-tertiary px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Thêm dịch vụ
              </button>
              <button
                onClick={onClose}
                className="text-on-surface-variant hover:text-primary transition-colors p-1"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin mr-2">refresh</span>
                Đang tải dịch vụ...
              </div>
            ) : services.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-5xl mb-4 opacity-30">concierge</span>
                <p className="text-base font-semibold">Sân này chưa có dịch vụ nào</p>
                <p className="text-sm mt-1 opacity-70">Bấm "Thêm dịch vụ" để bắt đầu (VD: Nước, Áo, Giày...)</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((srv) => (
                  <div
                    key={srv._id}
                    className="flex items-center gap-4 p-4 bg-surface-container rounded-xl border border-outline-variant/10 hover:border-tertiary/30 group transition-all"
                  >
                    {srv.image ? (
                      <img
                        src={srv.image}
                        alt={srv.serviceName}
                        className="w-14 h-14 object-cover rounded-lg flex-shrink-0 bg-black/30"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-surface-container-high border border-outline-variant/20 flex items-center justify-center flex-shrink-0 text-on-surface-variant/40">
                        <span className="material-symbols-outlined text-2xl">fastfood</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface truncate">{srv.serviceName}</p>
                      <p className="text-tertiary text-sm font-semibold mt-0.5">
                        {srv.price?.toLocaleString('vi-VN')} đ
                      </p>
                      <p className="text-on-surface-variant text-xs mt-0.5">Kho: {srv.stock}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => handleEditClick(srv)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-variant hover:bg-primary/20 hover:text-primary text-on-surface-variant transition-colors"
                        title="Sửa dịch vụ"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(srv._id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-variant hover:bg-error/20 hover:text-error text-on-surface-variant transition-colors"
                        title="Xóa dịch vụ"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested: Service Add/Edit Form Modal */}
      <ServiceFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        initialData={editingService}
        isLoading={saving}
      />
    </>
  );
}
