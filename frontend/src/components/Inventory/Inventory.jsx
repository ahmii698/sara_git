import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, X, Package, Tag, DollarSign, Layers, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import './Inventory.css';

const Inventory = () => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const itemsPerPage = 12;

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserRole(user.role);
      setUserBranch(user.branch);
    }
  }, []);

  const [products, setProducts] = useState([
    { id: 1, name: 'Samsung LED 55"', stock: 45, price: 55000, category: 'TV', branch: 1 },
    { id: 2, name: 'Sony Soundbar', stock: 23, price: 12000, category: 'Audio', branch: 1 },
    { id: 3, name: 'LG Refrigerator', stock: 12, price: 45000, category: 'Appliances', branch: 2 },
    { id: 4, name: 'Dell Laptop', stock: 8, price: 68000, category: 'Computers', branch: 1 },
    { id: 5, name: 'Apple iPhone 15', stock: 15, price: 85000, category: 'Mobile', branch: 2 },
    { id: 6, name: 'Samsung Galaxy S24', stock: 10, price: 75000, category: 'Mobile', branch: 1 },
    { id: 7, name: 'Sony LED 65"', stock: 5, price: 95000, category: 'TV', branch: 2 },
    { id: 8, name: 'Haier AC 1.5 Ton', stock: 18, price: 42000, category: 'Appliances', branch: 1 },
  ]);

  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    stock: '',
    price: '',
    branch: 1
  });

  const filteredProducts = products.filter(p => {
    const searchLower = search.toLowerCase();
    const searchMatch = (
      p.name.toLowerCase().includes(searchLower) ||
      p.category.toLowerCase().includes(searchLower) ||
      p.price.toString().includes(searchLower)
    );
    
    let branchMatch = true;
    if (userBranch) {
      branchMatch = p.branch === parseInt(userBranch);
    }
    
    return searchMatch && branchMatch;
  });

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const handleAddProduct = () => {
    if (!newProduct.name || !newProduct.category || !newProduct.stock || !newProduct.price) {
      alert('Please fill all fields');
      return;
    }

    const branch = userBranch ? parseInt(userBranch) : parseInt(newProduct.branch);

    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: newProduct.name, 
              category: newProduct.category, 
              stock: parseInt(newProduct.stock), 
              price: parseInt(newProduct.price),
              branch: branch
            } 
          : p
      ));
    } else {
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      setProducts([...products, {
        id: newId,
        name: newProduct.name,
        category: newProduct.category,
        stock: parseInt(newProduct.stock),
        price: parseInt(newProduct.price),
        branch: branch
      }]);
    }

    closeModal();
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNewProduct({ 
      name: '', 
      category: '', 
      stock: '', 
      price: '',
      branch: userBranch ? parseInt(userBranch) : 1 
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      category: product.category,
      stock: product.stock.toString(),
      price: product.price.toString(),
      branch: product.branch
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setNewProduct({ name: '', category: '', stock: '', price: '', branch: 1 });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const categories = ['TV', 'Audio', 'Appliances', 'Computers', 'Mobile', 'Furniture', 'Other'];

  const totalStockValue = products.filter(p => {
    if (userBranch) return p.branch === parseInt(userBranch);
    return true;
  }).reduce((sum, p) => sum + (p.stock * p.price), 0);
  
  const totalProducts = filteredProducts.length;
  const lowStockCount = filteredProducts.filter(p => p.stock < 10).length;

  const branchLabel = userBranch ? `Branch ${userBranch}` : 'All Branches';

  return (
    <div className="inventory-container">
      <div className="inventory-header">
        <div className="header-left">
          <div className="header-title-group">
            <h2>Inventory Management</h2>
            <span className="live-badge">
              <Package size={12} /> Active
            </span>
          </div>
          <div className="branch-label">
            <Building size={14} />
            <span>{branchLabel}</span>
          </div>
          <div className="header-stats">
            <span className="stat-chip">
              <Package size={14} />
              {totalProducts} Products
            </span>
            <span className="stat-chip total-stat">
              <DollarSign size={14} />
              PKR {totalStockValue.toLocaleString()}
            </span>
            {lowStockCount > 0 && (
              <span className="stat-chip warning-stat">
                <AlertTriangle size={14} />
                {lowStockCount} Low Stock
              </span>
            )}
          </div>
        </div>
        <button className="btn-accent" onClick={openAddModal}>
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="table-container">
        <div className="table-header">
          <div className="table-header-left">
            <h3>Product List</h3>
            <span className="product-count">{filteredProducts.length} items</span>
          </div>
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="table-search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        <div className="table-scroll">
          <table className="table-data">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Branch</th>
                <th>Stock</th>
                <th>Price (PKR)</th>
                <th>Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No products found in {branchLabel}</td>
                </tr>
              ) : (
                currentItems.map((product, index) => (
                  <tr key={product.id} className={product.stock < 10 ? 'low-stock-row' : ''}>
                    <td className="text-gray">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="product-name">{product.name}</td>
                    <td><span className="category-badge">{product.category}</span></td>
                    <td><span className={`branch-badge branch-${product.branch}`}>Branch {product.branch}</span></td>
                    <td>
                      <span className={product.stock < 10 ? 'stock-low' : 'stock-normal'}>
                        {product.stock < 10 && <AlertTriangle size={12} />}
                        {product.stock}
                      </span>
                    </td>
                    <td>PKR {product.price.toLocaleString()}</td>
                    <td className="total-value">PKR {(product.stock * product.price).toLocaleString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="edit" onClick={() => openEditModal(product)} title="Edit">
                          <Edit size={16} />
                        </button>
                        <button className="delete" onClick={() => handleDelete(product.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          <span className="page-info">
            {filteredProducts.length > 0 ? (
              `Showing ${startIndex + 1} - ${Math.min(startIndex + itemsPerPage, filteredProducts.length)} of ${filteredProducts.length}`
            ) : (
              'No records'
            )}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <Tag size={20} className="modal-icon" />
                <h3>{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Product Name *</label>
                <div className="input-with-icon">
                  <Package size={18} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <div className="input-with-icon">
                  <Layers size={18} />
                  <select
                    className="form-input"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="">Select Category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Branch *</label>
                  <div className="input-with-icon">
                    <Building size={18} />
                    <select
                      className="form-input"
                      value={newProduct.branch}
                      onChange={(e) => setNewProduct({ ...newProduct, branch: parseInt(e.target.value) })}
                      disabled={!!userBranch}
                      style={userBranch ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                    >
                      <option value={1}>Branch 1</option>
                      <option value={2}>Branch 2</option>
                    </select>
                  </div>
                  {userBranch && (
                    <small className="field-hint">Branch locked to {branchLabel}</small>
                  )}
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Price (PKR) *</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-save" onClick={handleAddProduct}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;