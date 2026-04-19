import React, { useState, useEffect } from 'react';

export default function ServiceFormModal({ isOpen, onClose, onSave, initialData, isLoading }) {
  const [formData, setFormData] = useState({
    serviceName: '',
    price: 0,
    stock: 0,
    image: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        serviceName: initialData.serviceName || '',
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        image: initialData.image || ''
      });
    } else {
      setFormData({ serviceName: '', price: 0, stock: 0, image: '' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="headline-font text-xl font-bold text-on-surface">
            {initialData ? 'Cập nhật Dịch vụ' : 'Thêm Dịch vụ Mới'}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Tên Dịch vụ</label>
            <input 
              required 
              type="text" 
              name="serviceName" 
              value={formData.serviceName} 
              onChange={handleChange} 
              placeholder="VD: Nước Suối, Thuê Áo"
              className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none placeholder:text-on-surface-variant/30" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Đơn Giá (VNĐ)</label>
              <input 
                required 
                type="number" 
                name="price" 
                min="0"
                value={formData.price} 
                onChange={handleChange} 
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Số lượng có sẵn</label>
              <input 
                required 
                type="number" 
                name="stock" 
                min="0"
                value={formData.stock} 
                onChange={handleChange} 
                className="w-full bg-surface-container border border-outline-variant/20 rounded-lg px-4 py-3 text-on-surface focus:border-primary focus:outline-none" 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Hình ảnh minh họa</label>
            <div className="border border-dashed border-outline-variant/30 p-4 rounded-xl text-center bg-surface-container hover:bg-surface-container-high transition-colors">
               <input 
                 type="file" 
                 id="service-image"
                 accept="image/*" 
                 onChange={handleImageChange} 
                 className="hidden" 
               />
               <label htmlFor="service-image" className="cursor-pointer flex flex-col items-center">
                 <span className="material-symbols-outlined text-3xl text-on-surface-variant/50 mb-2">image</span>
                 <span className="text-xs font-bold text-on-surface-variant">Tải ảnh lên</span>
               </label>
               {formData.image && (
                 <div className="mt-4 relative group rounded overflow-hidden">
                   <img src={formData.image} alt="Ảnh xem trước" className="h-32 w-full object-cover rounded-lg border border-outline-variant/20" />
                   <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute top-2 right-2 bg-error text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="material-symbols-outlined text-xs block">delete</span>
                   </button>
                 </div>
               )}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/10">
            <button type="button" onClick={onClose} className="px-5 py-3 text-sm font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-variant rounded-lg transition-colors">Hủy</button>
            <button type="submit" disabled={isLoading} className="impact-gradient px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-wider text-on-primary shadow-lg shadow-primary/20 hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2">
              {isLoading ? <><span className="material-symbols-outlined animate-spin">sync</span> Đang lưu...</> : 'Lưu Dịch Vụ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
