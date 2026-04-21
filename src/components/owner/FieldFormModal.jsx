import React, { useState, useEffect } from "react";

export default function FieldFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    fieldName: "",
    fieldType: "Sân 5 người",
    address: "",
    description: "",
    hourlyPrice: "",
    slotDuration: 60,
    openingTime: "06:00",
    closingTime: "22:00",
    utilities: "",
    status: "Active",
    image: [],
  });

  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        utilities: initialData.utilities
          ? initialData.utilities.join(", ")
          : "",
        status: initialData.status || "Active",
        hourlyPrice: initialData.hourlyPrice ?? initialData.price ?? "",
      });
      setPreviewImages(initialData.image || []);
    } else {
      setFormData({
        fieldName: "",
        fieldType: "Sân 5 người",
        address: "",
        description: "",
        hourlyPrice: "",
        slotDuration: 60,
        openingTime: "06:00",
        closingTime: "22:00",
        utilities: "",
        status: "Active",
        image: [],
      });
      setPreviewImages([]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const promises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });
    });

    Promise.all(promises).then((base64Images) => {
      setFormData((prev) => ({
        ...prev,
        image: [...prev.image, ...base64Images],
      }));
      setPreviewImages((prev) => [...prev, ...base64Images]);
    });
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => {
      const newImages = [...prev.image];
      newImages.splice(index, 1);
      return { ...prev, image: newImages };
    });
    setPreviewImages((prev) => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    const nameTrimmed = String(formData.fieldName || "").trim();
    const typeTrimmed = String(formData.fieldType || "").trim();
    const addressTrimmed = String(formData.address || "").trim();
    const openingTrimmed = String(formData.openingTime || "").trim();
    const closingTrimmed = String(formData.closingTime || "").trim();
    const hourlyPriceNumber = Number(formData.hourlyPrice);
    const slotDurationNumber = Number(formData.slotDuration);

    if (!nameTrimmed) nextErrors.fieldName = "Vui lòng nhập tên sân.";
    if (!typeTrimmed) nextErrors.fieldType = "Vui lòng chọn loại sân.";
    if (!addressTrimmed) nextErrors.address = "Vui lòng nhập địa chỉ.";
    if (!openingTrimmed) nextErrors.openingTime = "Vui lòng chọn giờ mở cửa.";
    if (!closingTrimmed) nextErrors.closingTime = "Vui lòng chọn giờ đóng cửa.";

    if (
      formData.hourlyPrice === "" ||
      Number.isNaN(hourlyPriceNumber) ||
      hourlyPriceNumber < 0
    ) {
      nextErrors.hourlyPrice = "Giá/giờ không hợp lệ.";
    }
    if (Number.isNaN(slotDurationNumber) || slotDurationNumber <= 0) {
      nextErrors.slotDuration = "Thời lượng slot không hợp lệ.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const hourlyPrice =
      formData.hourlyPrice === "" ? undefined : Number(formData.hourlyPrice);
    const payload = {
      ...formData,
      hourlyPrice,
      utilities: formData.utilities
        .split(",")
        .map((u) => u.trim())
        .filter(Boolean),
    };
    onSave(payload);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="button"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="bg-surface-container-low border border-outline-variant/20 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h3 className="headline-font text-2xl font-bold text-on-surface">
            {initialData ? "Cập nhật Sân Bóng" : "Thêm Sân Mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-80px)]"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Tên sân bóng
              </label>
              <input
                required
                type="text"
                name="fieldName"
                value={formData.fieldName}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="VD: Sân Chảo Lửa 1"
              />
              {errors.fieldName ? (
                <div className="text-xs text-error">{errors.fieldName}</div>
              ) : null}
            </div>

            {/* Field Type & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                  Loại Sân
                </label>
                <select
                  name="fieldType"
                  value={formData.fieldType}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none select-none appearance-none"
                >
                  <option value="Sân 5 người">Sân 5 người</option>
                  <option value="Sân 7 người">Sân 7 người</option>
                  <option value="Sân 11 người">Sân 11 người</option>
                </select>
                {errors.fieldType ? (
                  <div className="text-xs text-error">{errors.fieldType}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                  Tình trạng
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="Active">Hoạt động (Active)</option>
                  <option value="Maintain">Bảo trì (Maintain)</option>
                </select>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Địa chỉ cụ thể
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="VD: 123 Đường ABC, Quận X..."
              />
              {errors.address ? (
                <div className="text-xs text-error">{errors.address}</div>
              ) : null}
            </div>

            {/* Timings & Duration */}
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Thời gian Slot (phút)
              </label>
              <input
                type="number"
                name="slotDuration"
                min="30"
                max="180"
                step="30"
                value={formData.slotDuration}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
              />
              {errors.slotDuration ? (
                <div className="text-xs text-error">{errors.slotDuration}</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Giá/giờ (VND)
              </label>
              <input
                type="number"
                name="hourlyPrice"
                min="0"
                step="1000"
                value={formData.hourlyPrice}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                placeholder="VD: 200000"
              />
              {errors.hourlyPrice ? (
                <div className="text-xs text-error">{errors.hourlyPrice}</div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                  Giờ mở cửa
                </label>
                <input
                  type="time"
                  name="openingTime"
                  value={formData.openingTime}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                />
                {errors.openingTime ? (
                  <div className="text-xs text-error">{errors.openingTime}</div>
                ) : null}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                  Giờ đóng cửa
                </label>
                <input
                  type="time"
                  name="closingTime"
                  value={formData.closingTime}
                  onChange={handleChange}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                />
                {errors.closingTime ? (
                  <div className="text-xs text-error">{errors.closingTime}</div>
                ) : null}
              </div>
            </div>

            {/* Description & Utilities */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Mô tả giới thiệu
              </label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="Mô tả chất lượng cỏ, không gian, v.v..."
              ></textarea>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Tiện ích (Ngăn cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                name="utilities"
                value={formData.utilities}
                onChange={handleChange}
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none placeholder:text-on-surface-variant/30"
                placeholder="VD: Wifi miễn phí, Bãi đỗ xe có mái che, Nước free..."
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                Hình ảnh sân (Kéo thả hoặc chọn file)
              </label>
              <div className="border-2 border-dashed border-outline-variant/30 rounded-xl p-6 bg-surface-container text-center hover:bg-surface-container-high transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-4xl mb-2">
                    cloud_upload
                  </span>
                  <span className="font-semibold text-sm">
                    Bấm để tải ảnh lên
                  </span>
                  <span className="text-xs opacity-70 mt-1">
                    Hỗ trợ JPG, PNG, WEBP
                  </span>
                </label>
              </div>

              {/* Image Previews */}
              {previewImages.length > 0 && (
                <div className="mt-4 grid grid-cols-4 sm:grid-cols-6 gap-4">
                  {previewImages.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-black"
                    >
                      <img
                        src={src}
                        alt="Ảnh xem trước"
                        className="w-full h-full object-cover opacity-80"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Xóa ảnh này"
                      >
                        <span className="material-symbols-outlined text-xs block">
                          close
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="impact-gradient px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest text-on-primary shadow-[0_0_15px_rgba(142,255,113,0.3)] hover:scale-105 transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    refresh
                  </span>
                  Đang lưu...
                </>
              ) : (
                "Lưu Sân Bóng"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
