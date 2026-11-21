import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Package,
  X
} from 'lucide-react';
import AdminSidebar from '../components/AdminSidebar.jsx';
import { api } from '../services/api.js';

export default function AdminInventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // New product form
  const [newProd, setNewProd] = useState({
    name_en: '',
    name_kn: '',
    description_en: '',
    description_kn: '',
    category_id: 'cat-clothes',
    price: '',
    central_stock: 30,
    image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900',
  });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await api.getProducts({ lang: 'en' });
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.createProduct({
        ...newProd,
        price: parseFloat(newProd.price),
        central_stock: parseInt(newProd.central_stock, 10),
      });
      setActionSuccess('Product added to catalog, indexed in OpenSearch, and synced to all retail stores.');
      setShowAddModal(false);
      setNewProd({
        name_en: '',
        name_kn: '',
        description_en: '',
        description_kn: '',
        category_id: 'cat-clothes',
        price: '',
        central_stock: 30,
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=900',
      });
      loadInventory();
    } catch (err) {
      setActionError(err.message || 'Failed to add product');
    }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setActionError('');
    try {
      await api.updateProduct(editingProduct.id, {
        price: parseFloat(editingProduct.price),
        central_stock: parseInt(editingProduct.central_stock, 10),
      });
      setActionSuccess('Product stock and price updated.');
      setEditingProduct(null);
      loadInventory();
    } catch (err) {
      setActionError(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the catalog?`)) return;
    try {
      await api.deleteProduct(id);
      setActionSuccess(`Deleted "${name}".`);
      loadInventory();
    } catch (err) {
      setActionError(err.message || 'Failed to delete product');
    }
  };

  const filtered = products.filter(p =>
    p.name_en.toLowerCase().includes(search.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-slate-50">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-brand-900">
              <Boxes className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold font-serif text-slate-900">
                Inventory & Catalog Management
              </h1>
              <p className="text-xs text-slate-500">
                Central warehouse stock • Store distribution • Low-stock monitoring
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-2xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Fashion Style</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-3xl border border-purple-100 p-4 shadow-soft">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search catalog by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-purple-200 text-xs bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
        </div>

        {/* Product Inventory Table */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Active Fashion Catalog ({filtered.length})
            </h3>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400 text-xs">Loading catalog...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No products match your search.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-50 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Price</th>
                    <th className="p-3">Central Stock</th>
                    <th className="p-3">Stock Health</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((prod) => {
                    const stock = parseInt(prod.central_stock, 10) || 0;
                    const isLow = stock <= 5;
                    return (
                      <tr key={prod.id} className="hover:bg-purple-50/40">
                        <td className="p-3 flex items-center gap-3">
                          <img
                            src={prod.image_url}
                            alt={prod.name_en}
                            className="w-10 h-10 rounded-xl object-cover border border-purple-100"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{prod.name_en}</p>
                            <p className="text-[10px] text-slate-400">{prod.name_kn || prod.name_en}</p>
                          </div>
                        </td>
                        <td className="p-3 uppercase text-[10px] font-bold text-slate-600">
                          {prod.category || 'Apparel'}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          ₹{Number(prod.price).toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">
                          {stock} units
                        </td>
                        <td className="p-3">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock ({stock})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              Healthy ({stock})
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setEditingProduct({ ...prod })}
                              className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                              title="Edit / Restock"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name_en)}
                              className="p-1.5 rounded-lg bg-slate-50 text-rose-600 hover:bg-rose-100 transition"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-purple-100 p-6 space-y-4 animate-scaleIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Add New Fashion Product</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Style Name (English)</label>
                  <input
                    type="text"
                    required
                    value={newProd.name_en}
                    onChange={(e) => setNewProd({ ...newProd, name_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    placeholder="e.g. Classic Oxford Cotton Shirt"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Style Name (ಕನ್ನಡ)</label>
                  <input
                    type="text"
                    value={newProd.name_kn}
                    onChange={(e) => setNewProd({ ...newProd, name_kn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    placeholder="ಉದಾ. ಕ್ಲಾಸಿಕ್ ಆಕ್ಸ್‌ಫರ್ಡ್ ಕಾಟನ್ ಶರ್ಟ್"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Category</label>
                    <select
                      value={newProd.category_id}
                      onChange={(e) => setNewProd({ ...newProd, category_id: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                    >
                      <option value="cat-watches">Watches</option>
                      <option value="cat-shoes">Shoes</option>
                      <option value="cat-clothes">Clothes</option>
                      <option value="cat-handbags">Handbags</option>
                      <option value="cat-wallets">Bags & Wallets</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200"
                      placeholder="e.g. 2499"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Central Warehouse Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={newProd.central_stock}
                    onChange={(e) => setNewProd({ ...newProd, central_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Unsplash / Image URL</label>
                  <input
                    type="url"
                    value={newProd.image_url}
                    onChange={(e) => setNewProd({ ...newProd, image_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-900 text-white font-bold hover:bg-brand-800"
                  >
                    Save & Index
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit / Restock Modal */}
        {editingProduct && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-purple-100 p-6 space-y-4 animate-scaleIn">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-base text-slate-900">Restock / Edit Price</h3>
                <button onClick={() => setEditingProduct(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-3 text-xs">
                <p className="font-bold text-slate-900">{editingProduct.name_en}</p>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Central Warehouse Stock Units</label>
                  <input
                    type="number"
                    value={editingProduct.central_stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, central_stock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200"
                  />
                </div>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-900 text-white font-bold hover:bg-brand-800"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
