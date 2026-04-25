import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ownerFieldService } from "../../services/owner/ownerFieldService";
import { useNotification } from "../../context/NotificationContext";
import FieldFormModal from "../../components/owner/FieldFormModal";
import ServiceManagementModal from "../../components/owner/ServiceManagementModal";

export default function OwnerFieldsPage() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const { notifySuccess, notifyError } = useNotification();

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [saving, setSaving] = useState(false);

  const [serviceTargetField, setServiceTargetField] = useState(null);

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
    if (!window.confirm("Bạn có chắc chắn muốn xóa sân này không?")) return;
    try {
      await ownerFieldService.deleteField(id);
      notifySuccess();
      setFields((prev) => prev.filter((f) => f._id !== id));
    } catch (error) {
      notifyError();
    }
  };

  const handleAdd = () => {
    setEditingField(null);
    setIsFieldModalOpen(true);
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setIsFieldModalOpen(true);
  };

  const handleSaveField = async (formData) => {
    try {
      setSaving(true);
      if (editingField) {
        await ownerFieldService.updateField(editingField._id, formData);
      } else {
        await ownerFieldService.createField(formData);
      }
      notifySuccess();
      setIsFieldModalOpen(false);
      fetchFields();
    } catch (error) {
      notifyError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div className="max-w-2xl">
          <span className="text-tertiary font-label text-xs uppercase tracking-[0.3em] mb-2 block">
            Facility Management
          </span>
          <h2 className="headline-font text-5xl font-extrabold text-on-surface tracking-tighter leading-none">
            Fields &amp; <span className="text-primary italic">Services</span>
          </h2>
          <p className="text-on-surface-variant mt-4 font-body max-w-md">
            Control your arena's inventory. Manage field availability,
            amenities, and pricing from a single hub.
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

      {/* Field Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="headline-font text-xl font-bold flex items-center gap-2">
          <span className="w-2 h-6 bg-primary"></span>
          Active Pitch Inventory
        </h3>
        <span className="text-on-surface-variant text-xs font-label">
          {fields.length} TOTAL FIELDS
        </span>
      </div>

      {/* Fields List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-on-surface-variant">
            Đang tải dữ liệu...
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-10 bg-surface-container rounded-xl border border-outline-variant/10 text-on-surface-variant">
            Bạn chưa có sân nào. Hãy tạo sân mới!
          </div>
        ) : (
          fields.map((field) => (
            <div
              key={field._id}
              className="block group bg-surface-container hover:bg-surface-container-high transition-all duration-300 rounded-xl overflow-hidden relative border border-transparent hover:border-primary/10"
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div className="w-full md:w-64 h-48 md:h-auto overflow-hidden relative bg-surface-container-lowest flex-shrink-0">
                  {field.image && field.image.length > 0 ? (
                    <img
                      src={field.image[0]}
                      alt={field.fieldName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant/30">
                      <span className="material-symbols-outlined text-4xl mb-2">
                        stadium
                      </span>
                      <span className="text-xs uppercase font-label">
                        No Image
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent"></div>
                  <span className="absolute top-4 left-4 bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded headline-font uppercase">
                    {field.status}
                  </span>
                </div>

                {/* Info */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="headline-font text-2xl font-bold group-hover:text-primary transition-colors">
                        {field.fieldName}
                      </h4>
                      <p className="text-tertiary text-xs font-label uppercase tracking-wider">
                        {field.fieldType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-on-surface-variant text-[10px] font-label uppercase">
                        Sức chứa/Slot
                      </p>
                      <p className="text-xl font-bold text-on-surface">
                        {field.slotDuration}
                        <span className="text-xs text-on-surface-variant">
                          {" "}
                          min
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-on-surface-variant text-sm">
                    Giá/slot:{" "}
                    <span className="font-semibold text-on-surface">
                      {(field.hourlyPrice ?? field.price ?? 0).toLocaleString(
                        "vi-VN",
                      )}
                      đ
                    </span>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-sm">
                        calendar_today
                      </span>
                      <span>
                        Daily: {field.openingTime || "06:00"} -{" "}
                        {field.closingTime || "22:00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-sm">
                        location_on
                      </span>
                      <span
                        className="truncate max-w-[200px]"
                        title={field.address}
                      >
                        {field.address || "Chưa cập nhật"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                    <button
                      onClick={() => setServiceTargetField(field)}
                      className="px-4 py-2 text-xs font-bold font-label uppercase text-tertiary/70 hover:text-tertiary hover:bg-tertiary/10 border border-transparent rounded transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        concierge
                      </span>
                      Services
                    </button>
                    <button
                      onClick={() => handleEdit(field)}
                      className="px-4 py-2 text-xs font-bold font-label uppercase text-on-surface-variant hover:text-primary hover:bg-surface-variant rounded transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        edit
                      </span>
                      Edit Pitch
                    </button>
                    <button
                      onClick={() => handleDelete(field._id)}
                      className="px-4 py-2 text-xs font-bold font-label uppercase text-error/60 hover:text-error hover:bg-error/10 rounded transition-colors flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Field Form Modal */}
      <FieldFormModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleSaveField}
        initialData={editingField}
        isLoading={saving}
      />

      {/* Services Management Popup Modal */}
      <ServiceManagementModal
        isOpen={!!serviceTargetField}
        onClose={() => setServiceTargetField(null)}
        field={serviceTargetField}
      />
    </>
  );
}
