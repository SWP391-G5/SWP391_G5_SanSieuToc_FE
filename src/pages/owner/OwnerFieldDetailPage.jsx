import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ownerFieldService } from "../../services/owner/ownerFieldService";
import { ownerServiceAPI } from "../../services/owner/ownerServiceAPI";
import { useNotification } from "../../context/NotificationContext";
import FieldFormModal from "../../components/owner/FieldFormModal";
import ServiceFormModal from "../../components/owner/ServiceFormModal";

export default function OwnerFieldDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notifySuccess, notifyError } = useNotification();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchField();
    fetchServices();
  }, [id]);

  const fetchField = async () => {
    try {
      setLoading(true);
      const res = await ownerFieldService.getFieldById(id);
      setField(res.field);
    } catch (err) {
      notifyError();
      navigate("/owner/fields");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const res = await ownerServiceAPI.getServices(id);
      setServices(res.services || []);
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleEditField = () => {
    setIsFieldModalOpen(true);
  };

  const handleSaveField = async (formData) => {
    try {
      setSaving(true);
      await ownerFieldService.updateField(id, formData);
      notifySuccess();
      setIsFieldModalOpen(false);
      fetchField();
    } catch (err) {
      notifyError();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sân này?")) return;
    try {
      await ownerFieldService.deleteField(id);
      navigate("/owner/fields");
    } catch (err) {
      notifyError();
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (srv) => {
    setEditingService(srv);
    setIsServiceModalOpen(true);
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("Xóa dịch vụ này?")) return;
    try {
      await ownerServiceAPI.deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s._id !== serviceId));
      notifySuccess();
    } catch (err) {
      notifyError();
    }
  };

  const handleSaveService = async (formData) => {
    try {
      setSaving(true);
      if (editingService) {
        await ownerServiceAPI.updateService(editingService._id, formData);
      } else {
        await ownerServiceAPI.createService({ ...formData, fieldID: id });
      }
      notifySuccess();
      setIsServiceModalOpen(false);
      fetchServices();
    } catch (err) {
      notifyError();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!field) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <Link
          to="/owner/fields"
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Quay lại danh sách sân
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container rounded-xl overflow-hidden">
            {field.image && field.image.length > 0 ? (
              <img
                src={field.image[0]}
                alt={field.fieldName}
                className="w-full h-64 object-cover"
              />
            ) : (
              <div className="w-full h-64 flex items-center justify-center text-on-surface-variant/30">
                <span className="material-symbols-outlined text-6xl">stadium</span>
              </div>
            )}
          </div>

          <div className="bg-surface-container rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="headline-font text-3xl font-bold">{field.fieldName}</h1>
                <p className="text-tertiary text-sm uppercase">{field.fieldType}</p>
              </div>
              <span className="bg-primary text-on-primary text-xs font-bold px-3 py-1 rounded">
                {field.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-on-surface-variant text-xs">Giá/slot</p>
                <p className="text-2xl font-bold text-primary">
                  {(field.hourlyPrice ?? field.price ?? 0).toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs">Thời gian</p>
                <p className="text-lg font-semibold">
                  {field.openingTime || "06:00"} - {field.closingTime || "22:00"}
                </p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs">Slot Duration</p>
                <p className="text-lg font-semibold">{field.slotDuration} min</p>
              </div>
              <div>
                <p className="text-on-surface-variant text-xs">Địa chỉ</p>
                <p className="text-sm">{field.address || "Chưa cập nhật"}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-outline-variant/10">
              <button
                onClick={handleEditField}
                className="flex-1 py-2 bg-primary text-on-primary font-bold rounded-lg hover:opacity-90"
              >
                Chỉnh sửa sân
              </button>
              <button
                onClick={handleDelete}
                className="py-2 px-4 text-error hover:bg-error/10 rounded-lg"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">Dịch vụ</h2>
              <button
                onClick={handleAddService}
                className="text-primary hover:bg-primary/10 p-2 rounded-lg"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>

            {loadingServices ? (
              <div className="text-center py-8 text-on-surface-variant">
                Đang tải...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl opacity-30">
                  concierge
                </span>
                <p className="mt-2 text-sm">Chưa có dịch vụ nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((srv) => (
                  <div
                    key={srv._id}
                    className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {srv.image ? (
                        <img
                          src={srv.image}
                          alt={srv.serviceName}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/40">
                            concierge
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm">{srv.serviceName}</p>
                        <p className="text-primary text-sm font-bold">
                          {srv.price?.toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditService(srv)}
                        className="p-2 text-on-surface-variant hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-sm">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteService(srv._id)}
                        className="p-2 text-error hover:bg-error/10 rounded-lg"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FieldFormModal
        isOpen={isFieldModalOpen}
        onClose={() => setIsFieldModalOpen(false)}
        onSave={handleSaveField}
        initialData={field}
        isLoading={saving}
      />

      <ServiceFormModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
        isLoading={saving}
      />
    </>
  );
}