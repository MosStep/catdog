class WMSApp {
    constructor() {
        this.STORAGE_KEY = 'wms_data';
        this.TRANSACTION_KEY = 'wms_transactions';
        this.data = this.loadData();
        this.transactions = this.loadTransactions();
        
        // Bind UI events if on inventory page
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        const catFilter = document.getElementById('categoryFilter');
        if (catFilter) {
            catFilter.addEventListener('change', (e) => this.handleSearch(searchInput.value, e.target.value));
        }

        const productForm = document.getElementById('productForm');
        if (productForm) {
            productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }
    }

    // --- Data Management ---

    loadData() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        
        // Mock Data
        return [
            { id: 1, sku: 'PROD-001', name: 'Wireless Mouse', category: 'Electronics', qty: 45, image: 'https://placehold.co/50x50/png' },
            { id: 2, sku: 'PROD-002', name: 'Office Chair', category: 'Furniture', qty: 2, image: 'https://placehold.co/50x50/png' },
            { id: 3, sku: 'PROD-003', name: 'Mechanical Keyboard', category: 'Electronics', qty: 12, image: 'https://placehold.co/50x50/png' },
            { id: 4, sku: 'PROD-004', name: 'USB-C Cable', category: 'Electronics', qty: 0, image: 'https://placehold.co/50x50/png' }
        ];
    }

    loadTransactions() {
        const stored = localStorage.getItem(this.TRANSACTION_KEY);
        if (stored) return JSON.parse(stored);
        
        // Mock Transactions
        return [
            { date: '2023-10-25 10:30', sku: 'PROD-001', name: 'Wireless Mouse', type: 'IN', qty: 50 },
            { date: '2023-10-25 14:15', sku: 'PROD-001', name: 'Wireless Mouse', type: 'OUT', qty: 5 },
            { date: '2023-10-26 09:00', sku: 'PROD-004', name: 'USB-C Cable', type: 'OUT', qty: 20 }
        ];
    }

    saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    saveTransactions() {
        localStorage.setItem(this.TRANSACTION_KEY, JSON.stringify(this.transactions));
    }

    // --- Dashboard Logic ---

    renderDashboard() {
        const totalStockEl = document.getElementById('totalStock');
        const lowStockEl = document.getElementById('lowStock');
        const todayTransEl = document.getElementById('todayTransactions');
        const tableBody = document.getElementById('transactionTableBody');

        if (!totalStockEl) return;

        // Stats
        const total = this.data.reduce((acc, curr) => acc + parseInt(curr.qty), 0);
        const lowStock = this.data.filter(i => i.qty > 0 && i.qty < 10).length; // Low stock threshold < 10
        // Simple today check (mock logic, assumes transaction dates match today string roughly or just shows count of list)
        // For demo, we just show length of all transactions as 'Today'
        const todayCount = this.transactions.length; 

        totalStockEl.innerText = total;
        lowStockEl.innerText = lowStock;
        todayTransEl.innerText = todayCount;

        // Table
        tableBody.innerHTML = '';
        this.transactions.slice(0, 5).forEach(t => {
            const row = `
                <tr>
                    <td>${t.date}</td>
                    <td>${t.sku}</td>
                    <td>${t.name}</td>
                    <td><span class="badge ${t.type === 'IN' ? 'badge-in-stock' : 'badge-out-of-stock'}">${t.type === 'IN' ? 'รับเข้า' : 'เบิกออก'}</span></td>
                    <td>${t.qty}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    // --- Inventory Logic ---

    renderInventory(filterText = '', category = '') {
        const tableBody = document.getElementById('inventoryTableBody');
        if (!tableBody) return;

        let filtered = this.data;

        if (filterText) {
            const lower = filterText.toLowerCase();
            filtered = filtered.filter(i => 
                i.name.toLowerCase().includes(lower) || 
                i.sku.toLowerCase().includes(lower)
            );
        }

        if (category) {
            filtered = filtered.filter(i => i.category === category);
        }

        tableBody.innerHTML = '';
        
        if (filtered.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 2rem;">ไม่พบข้อมูลสินค้า</td></tr>';
            return;
        }

        filtered.forEach(item => {
            let statusBadge = '';
            if (item.qty == 0) statusBadge = '<span class="badge badge-out-of-stock">Out of Stock</span>';
            else if (item.qty < 10) statusBadge = '<span class="badge badge-low-stock">Low Stock</span>';
            else statusBadge = '<span class="badge badge-in-stock">In Stock</span>';

            const row = `
                <tr>
                    <td><img src="${item.image}" alt="img" style="width:40px; height:40px; border-radius:4px; object-fit:cover;"></td>
                    <td>${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.qty}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm" style="background:#edf2f7; color:var(--text-main)" onclick="window.app.editProduct(${item.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="window.app.deleteProduct(${item.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    handleSearch(text, category = null) {
        const cat = category !== null ? category : document.getElementById('categoryFilter').value;
        this.renderInventory(text, cat);
    }

    // --- Modal & Form Actions ---

    openAddModal() {
        document.getElementById('modalTitle').innerText = 'เพิ่มสินค้าใหม่';
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('productModal').classList.add('active');
    }

    editProduct(id) {
        const item = this.data.find(i => i.id === id);
        if (!item) return;

        document.getElementById('modalTitle').innerText = 'แก้ไขสินค้า';
        document.getElementById('productId').value = item.id;
        document.getElementById('productSku').value = item.sku;
        document.getElementById('productName').value = item.name;
        document.getElementById('productCategory').value = item.category;
        document.getElementById('productQty').value = item.qty;
        document.getElementById('productImage').value = item.image;
        
        document.getElementById('productModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('productModal').classList.remove('active');
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const sku = document.getElementById('productSku').value;
        const name = document.getElementById('productName').value;
        const cat = document.getElementById('productCategory').value;
        const qty = parseInt(document.getElementById('productQty').value);
        const img = document.getElementById('productImage').value || 'https://placehold.co/50x50/png';

        if (id) {
            // Edit
            const index = this.data.findIndex(i => i.id == id);
            if (index > -1) {
                this.data[index] = { ...this.data[index], sku, name, category: cat, qty, image: img };
            }
        } else {
            // Add
            const newId = this.data.length > 0 ? Math.max(...this.data.map(i => i.id)) + 1 : 1;
            this.data.push({ id: newId, sku, name, category: cat, qty, image: img });
        }

        this.saveData();
        this.closeModal();
        this.renderInventory();
        
        // Update stats if we were on dashboard (redirect or refresh in real app, here just save)
    }

    deleteProduct(id) {
        if(confirm('ยืนยันการลบสินค้านี้?')) {
            this.data = this.data.filter(i => i.id !== id);
            this.saveData();
            this.renderInventory();
        }
    }
}
