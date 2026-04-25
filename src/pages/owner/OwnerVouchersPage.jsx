import React, { useState, useEffect } from 'react';
import ownerVoucherService from '../../services/owner/ownerVoucherService';
import { ownerFieldService } from '../../services/owner/ownerFieldService';
import Toast from '../../components/Toast';

export default function OwnerVouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState({
    voucherName: '',
    discountValue: 0,
    maxDiscount: 0,
    quantity: 0,
    beginDate: '',
    endDate: '',
    applicableFields: []
  });

  useEffect(() => {
    fetchVouchers();
    fetchFields();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await ownerVoucherService.getVouchers();
      if (res.data?.success) setVouchers(res.data.vouchers);
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to fetch vouchers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const res = await ownerFieldService.getMyFields();
      if (res?.fields) setFields(res.fields);
      else if (res?.data) setFields(res.data);
      else if (Array.isArray(res)) setFields(res);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentVoucher.voucherName || !currentVoucher.beginDate || !currentVoucher.endDate) {
      setToast({ message: 'Please fill in required fields', type: 'error' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(currentVoucher.beginDate);
    const end = new Date(currentVoucher.endDate);

    if (start < today) {
      setToast({ message: 'Start date cannot be in the past', type: 'error' });
      return;
    }
    if (end <= start) {
      setToast({ message: 'End date must be after start date', type: 'error' });
      return;
    }
    if (currentVoucher.discountValue <= 0 || currentVoucher.discountValue > 100) {
      setToast({ message: 'Discount percentage must be between 1 and 100', type: 'error' });
      return;
    }
    if (currentVoucher.maxDiscount < 0 || currentVoucher.maxDiscount > 9999999) {
      setToast({ message: 'Max discount must be between 0 and 9,999,999', type: 'error' });
      return;
    }

    if (!/^[A-Za-z0-9]+$/.test(currentVoucher.voucherName)) {
      setToast({ message: 'Voucher code can only contain letters and numbers', type: 'error' });
      return;
    }
    if (currentVoucher.voucherName.length > 50) {
      setToast({ message: 'Voucher code must be at most 50 characters', type: 'error' });
      return;
    }
    
    try {
      setLoading(true);
      if (isEditing) {
        await ownerVoucherService.updateVoucher(currentVoucher._id, currentVoucher);
        setToast({ message: 'Voucher updated successfully', type: 'success' });
      } else {
        await ownerVoucherService.createVoucher(currentVoucher);
        setToast({ message: 'Voucher created successfully', type: 'success' });
      }
      setShowModal(false);
      fetchVouchers();
    } catch (error) {
      console.error(error);
      setToast({ message: error.response?.data?.message || 'Action failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this voucher?')) return;
    try {
      setLoading(true);
      await ownerVoucherService.deleteVoucher(id);
      setToast({ message: 'Voucher deleted successfully', type: 'success' });
      fetchVouchers();
    } catch (error) {
      console.error(error);
      setToast({ message: 'Failed to delete voucher', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (voucher = null) => {
    if (voucher) {
      setIsEditing(true);
      setCurrentVoucher({
        ...voucher,
        beginDate: voucher.beginDate ? new Date(voucher.beginDate).toISOString().split('T')[0] : '',
        endDate: voucher.endDate ? new Date(voucher.endDate).toISOString().split('T')[0] : '',
        applicableFields: voucher.applicableFields?.map(f => f.fieldID?._id || f.fieldID) || []
      });
    } else {
      setIsEditing(false);
      setCurrentVoucher({
        voucherName: '',
        discountValue: 0,
        maxDiscount: 0,
        quantity: 0,
        beginDate: '',
        endDate: '',
        applicableFields: []
      });
    }
    setShowModal(true);
  };

  const handleFieldToggle = (fieldId) => {
    setCurrentVoucher(prev => {
      const exists = prev.applicableFields.includes(fieldId);
      if (exists) {
        return { ...prev, applicableFields: prev.applicableFields.filter(id => id !== fieldId) };
      } else {
        return { ...prev, applicableFields: [...prev.applicableFields, fieldId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
        <div>
          <h1 className="text-2xl font-bold text-primary headline-font">Voucher Management</h1>
          <p className="text-on-surface-variant text-sm mt-1">Manage discount logic for your fields</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center bg-primary hover:bg-primary-hover text-on-primary px-6 py-2.5 rounded-full font-label font-bold transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
        >
          <span className="material-symbols-outlined mr-2 text-lg">add</span>
          Create Voucher
        </button>
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/10 bg-surface-container">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-[#a0a0a0]">Code</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-[#a0a0a0]">Discount</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-[#a0a0a0]">Qty</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-[#a0a0a0]">Valid Dates</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant dark:text-[#a0a0a0] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {loading && vouchers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">Loading...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-on-surface-variant">No vouchers found</td></tr>
              ) : (
                vouchers.map((v) => (
                  <tr key={v._id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="p-4">
                      <span className="font-bold text-on-surface bg-surface-container-high px-2 py-1 rounded border border-outline-variant/20">{v.voucherName}</span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      <span className="text-secondary font-bold">{v.discountValue}%</span> (Max: {v.maxDiscount.toLocaleString()}đ)
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {v.quantity > 0 ? (
                        <span className="text-primary font-bold">{v.quantity}</span>
                      ) : (
                        <span className="text-error font-bold tracking-widest text-xs px-2 py-0.5 rounded bg-error/10 border border-error/20 inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px]">warning</span>
                          HẾT
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {new Date(v.beginDate).toLocaleDateString("vi-VN")} - {new Date(v.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                       <button onClick={() => openModal(v)} className="p-2 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors">
                         <span className="material-symbols-outlined text-sm">edit</span>
                       </button>
                       <button onClick={() => handleDelete(v._id)} className="p-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors">
                         <span className="material-symbols-outlined text-sm">delete</span>
                       </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-high rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-outline-variant/10 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-outline-variant/10">
              <h2 className="text-xl font-bold text-primary headline-font">{isEditing ? 'Edit Voucher' : 'Create Voucher'}</h2>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-full hover:bg-error/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Voucher Code</label>
                   <input required maxLength="50" type="text" value={currentVoucher.voucherName} onChange={e => setCurrentVoucher({...currentVoucher, voucherName: e.target.value.toUpperCase()})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all uppercase placeholder:normal-case" placeholder="e.g. SUMMER2026"/>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Discount (%)</label>
                   <input required type="number" min="1" max="100" value={currentVoucher.discountValue} onChange={e => setCurrentVoucher({...currentVoucher, discountValue: e.target.value})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Max Discount (VND)</label>
                   <input required type="number" min="0" max="9999999" value={currentVoucher.maxDiscount} onChange={e => setCurrentVoucher({...currentVoucher, maxDiscount: Number(e.target.value)})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Start Date</label>
                   <input required type="date" min={new Date().toISOString().split('T')[0]} value={currentVoucher.beginDate} onChange={e => setCurrentVoucher({...currentVoucher, beginDate: e.target.value})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">End Date</label>
                   <input required type="date" min={currentVoucher.beginDate || new Date().toISOString().split('T')[0]} value={currentVoucher.endDate} onChange={e => setCurrentVoucher({...currentVoucher, endDate: e.target.value})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                   <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Quantity</label>
                   <input required type="number" min="0" value={currentVoucher.quantity} onChange={e => setCurrentVoucher({...currentVoucher, quantity: e.target.value})} className="w-full bg-surface border border-outline-variant/20 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"/>
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Applicable Fields (Optional)</label>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {fields.map(field => (
                      <label key={field._id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${currentVoucher.applicableFields.includes(field._id) ? 'bg-primary/10 border-primary/30' : 'bg-surface border-outline-variant/10 hover:border-outline-variant/30'}`}>
                        <input type="checkbox" checked={currentVoucher.applicableFields.includes(field._id)} onChange={() => handleFieldToggle(field._id)} className="w-4 h-4 rounded text-primary focus:ring-primary bg-surface-container border-outline-variant/30 accent-primary"/>
                        <span className="text-sm font-medium text-on-surface">{field.fieldName}</span>
                      </label>
                    ))}
                 </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-full font-label font-bold text-on-surface-variant bg-surface hover:bg-surface-container border border-outline-variant/20 transition-all">Cancel</button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-full font-label font-bold text-on-primary bg-primary hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2">
                  {loading && <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>}
                  Save Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
