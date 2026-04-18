import React, { useEffect, useState } from 'react';
import { ownerFieldService } from '../../services/owner/ownerFieldService';
import { ownerServiceAPI } from '../../services/owner/ownerServiceAPI';
import { useNotification } from '../../context/NotificationContext';
import FieldFormModal from '../../components/owner/FieldFormModal';
import ServiceFormModal from '../../components/owner/ServiceFormModal';

export default function OwnerFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifySuccess, notifyError } = useNotification();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);

  // States for Services
  const [selectedFieldForServices, setSelectedFieldForServices] = useState(null);
  const [services, setServices] = useState([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [savingService, setSavingService] = useState(false);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const res = await ownerFieldService.getMyFields();
      setFields(res.fields || []);
    } catch (error) {
      notifyError();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sân này không? (Soft Delete)')) return;
    try {
      await ownerFieldService.deleteField(id);
      notifySuccess();
      // Tối ưu UX: Cập nhật state trực tiếp không cần GET lại tốn thời gian
      setFields((prev) => prev.filter((f) => f._id !== id));
    } catch (error) {
      notifyError();
    }
  };

  const handleAdd = () => {
    setEditingField(null);
    setIsModalOpen(true);
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setIsModalOpen(true);
  };

  const handleSaveField = async (formData) => {
    try {
      setSaving(true);
      if (editingField) {
        await ownerFieldService.updateField(editingField._id, formData);
        notifySuccess();
      } else {
        await ownerFieldService.createField(formData);
        notifySuccess();
      }
      setIsModalOpen(false);
      fetchFields();
    } catch (error) {
      notifyError();
    } finally {
      setSaving(false);
    }
  };

  // --- Handlers for Services ---
  const handleSelectFieldForServices = async (field) => {
    setSelectedFieldForServices(field);
    try {
      const res = await ownerServiceAPI.getServices(field._id);
      setServices(res.services || []);
    } catch (err) {
      notifyError();
    }
  };

  const handleAddService = () => {
    if (!selectedFieldForServices) {
       notifyError();
       return;
    }
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (srv) => {
    setEditingService(srv);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Chắc chắn xóa dịch vụ này khỏi menu?')) return;
    try {
      await ownerServiceAPI.deleteService(id);
      setServices(prev => prev.filter(s => s._id !== id));
      notifySuccess();
    } catch (err) {
      notifyError();
    }
  };

  const handleSaveService = async (formData) => {
    try {
      setSavingService(true);
      if (editingService) {
        const res = await ownerServiceAPI.updateService(editingService._id, formData);
        setServices(prev => prev.map(s => s._id === editingService._id ? res.service : s));
        notifySuccess();
      } else {
        const payload = { ...formData, fieldID: selectedFieldForServices._id };
        const res = await ownerServiceAPI.createService(payload);
        setServices([res.service, ...services]);
        notifySuccess();
      }
      setIsServiceModalOpen(false);
    } catch (err) {
      notifyError();
    } finally {
      setSavingService(false);
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="max-w-2xl">
          <span className="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">Facility Management</span>
          <h2 className="headline-font text-5xl font-extrabold text-on-surface tracking-tighter leading-none">
            Fields & <span className="text-primary italic">Services</span>
          </h2>
          <p className="text-on-surface-variant mt-4 font-body max-w-md">
            Control your arena's inventory. Manage field availability, professional amenities, and pricing dynamics from a single hub.
          </p>
        </div>
        <button 
          onClick={handleAdd}
          className="impact-gradient text-on-primary font-bold px-8 py-4 rounded-md flex items-center gap-3 headline-font uppercase text-sm tracking-widest scale-100 hover:scale-[1.02] transition-transform active:scale-95"
        >
          <span className="material-symbols-outlined">add_box</span>
          Add New Field
        </button>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Fields */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="headline-font text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-primary"></span>
              Active Pitch Inventory
            </h3>
            <span className="text-on-surface-variant text-xs font-label">{fields.length} TOTAL FIELDS</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-on-surface-variant">Đang tải dữ liệu...</div>
          ) : fields.length === 0 ? (
            <div className="text-center py-10 bg-surface-container rounded-xl border border-outline-variant/10 text-on-surface-variant">
              Bạn chưa có sân nào. Hãy tạo sân mới!
            </div>
          ) : (
            fields.map((field) => (
              <div
                key={field._id}
                className="group bg-surface-container hover:bg-surface-container-high transition-all duration-300 rounded-xl overflow-hidden relative border border-transparent hover:border-primary/10"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative bg-surface-container-lowest flex-shrink-0">
                    {field.image && field.image.length > 0 ? (
                      <img
                        src={field.image[0]}
                        alt={field.fieldName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30">
                         <span className="material-symbols-outlined text-4xl mb-2">stadium</span>
                         <span className="text-xs uppercase font-label">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
                    <span className="absolute top-4 left-4 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded headline-font uppercase">
                      {field.status}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="headline-font text-2xl font-bold group-hover:text-primary transition-colors">{field.fieldName}</h4>
                        <p className="text-tertiary text-xs font-label uppercase tracking-wider">{field.fieldType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-on-surface-variant text-[10px] font-label uppercase">Sức chứa/Slot</p>
                        <p className="text-xl font-bold text-on-surface">{field.slotDuration}<span className="text-xs text-on-surface-variant"> min</span></p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        <span>Daily: {field.openingTime || '06:00'} - {field.closingTime || '22:00'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="truncate max-w-[200px]" title={field.address}>{field.address || 'Chưa cập nhật'}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                      <button 
                        onClick={() => handleSelectFieldForServices(field)}
                        className={`px-4 py-2 text-xs font-bold font-label uppercase rounded transition-colors flex items-center gap-2 ${selectedFieldForServices?._id === field._id ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'text-tertiary/70 hover:text-tertiary hover:bg-tertiary/10 border border-transparent'}`}
                      >
                        <span className="material-symbols-outlined text-lg">concierge</span>
                        Services
                      </button>
                      <button 
                        onClick={() => handleEdit(field)}
                        className="px-4 py-2 text-xs font-bold font-label uppercase text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Pitch
                      </button>
                      <button
                        onClick={() => handleDelete(field._id)}
                        className="px-4 py-2 text-xs font-bold font-label uppercase text-error/60 hover:text-error hover:bg-error/10 rounded transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="headline-font text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">concierge</span>
                Additional Services
              </h3>
              {selectedFieldForServices && (
                <button 
                  onClick={handleAddService}
                  className="w-8 h-8 rounded bg-tertiary/10 text-tertiary hover:bg-tertiary hover:text-black transition-colors flex items-center justify-center"
                  title="Add New Service"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              )}
            </div>

            <div className="space-y-4">
              {!selectedFieldForServices ? (
                 <div className="text-sm text-center py-8 text-on-surface-variant italic bg-surface-container/50 rounded-lg">
                   Bấm nút "Services" ở một sân bóng<br/> để quản lý dịch vụ đính kèm.
                 </div>
              ) : services.length === 0 ? (
                 <div className="text-sm text-center py-6 text-on-surface-variant italic bg-surface-container/50 rounded-lg">
                   Sân này chưa có dịch vụ nào.<br/> Bấm dấu + để thêm (vd: Nước, Áo)
                 </div>
              ) : (
                services.map(srv => (
                  <div key={srv._id} className="flex items-center p-3 bg-surface-container rounded-lg group">
                    {srv.image ? (
                      <img src={srv.image} alt={srv.serviceName} className="w-12 h-12 object-cover rounded mr-4 bg-black/50" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-surface border border-outline-variant/20 flex items-center justify-center mr-4 text-on-surface-variant/50">
                        <span className="material-symbols-outlined">fastfood</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-sm text-on-surface">{srv.serviceName}</p>
                      <p className="text-[10px] font-label text-tertiary tracking-widest">{srv.price.toLocaleString('vi-VN')} đ</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-on-surface-variant font-semibold">Kho: {srv.stock}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditService(srv)} className="text-on-surface-variant hover:text-tertiary transition-colors"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                        <button onClick={() => handleDeleteService(srv._id)} className="text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Stats Placeholder */}
          <div className="bg-surface-container p-6 rounded-xl border-l-4 border-tertiary">
            <p className="text-on-surface-variant text-[10px] font-label uppercase mb-2">Weekend Utilization</p>
            <div className="flex items-end gap-1 mb-4">
              <span className="text-3xl font-bold headline-font">94%</span>
              <span className="text-primary text-xs mb-1.5 flex items-center"><span className="material-symbols-outlined text-xs">arrow_upward</span>12%</span>
            </div>
            <div className="w-full bg-surface-variant h-1 rounded-full overflow-hidden">
              <div className="bg-tertiary h-full w-[94%]"></div>
            </div>
          </div>
        </div>
      </div>

      <FieldFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveField}
        initialData={editingField}
        isLoading={saving}
      />

      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
        isLoading={savingService}
      />
    </>
  );
}
