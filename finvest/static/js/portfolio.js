// Portfolio JavaScript functionality - Vanilla JS (No jQuery)

document.addEventListener('DOMContentLoaded', function() {
    // Initialize portfolio page
    initializePortfolio();

    // Search and filter functionality
    const searchInput = document.getElementById('searchInput');
    const assetTypeFilter = document.getElementById('assetTypeFilter');
    const sortBy = document.getElementById('sortBy');
    const sortOrder = document.getElementById('sortOrder');

    if (searchInput) searchInput.addEventListener('input', searchAndFilterAssets);
    if (assetTypeFilter) assetTypeFilter.addEventListener('change', searchAndFilterAssets);
    if (sortBy) sortBy.addEventListener('change', searchAndFilterAssets);
    if (sortOrder) sortOrder.addEventListener('change', searchAndFilterAssets);

    // Add asset form submission
    const addAssetForm = document.getElementById('addAssetForm');
    if (addAssetForm) {
        addAssetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addAsset();
        });
    }

    // Update price form submission
    const updatePriceForm = document.getElementById('updatePriceForm');
    if (updatePriceForm) {
        updatePriceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            updateAssetPrice();
        });
    }

    // Edit asset form submission
    const editAssetForm = document.getElementById('editAssetForm');
    if (editAssetForm) {
        editAssetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            editAsset();
        });
    }

    // Bind events for initial buttons
    bindButtonEvents();
});

function initializePortfolio() {
    console.log('Portfolio page initialized');
}

function searchAndFilterAssets() {
    const search = document.getElementById('searchInput').value;
    const assetType = document.getElementById('assetTypeFilter').value;
    const sortByVal = document.getElementById('sortBy').value;
    const sortOrderVal = document.getElementById('sortOrder').value;

    fetch('/portfolio/api/search?' + new URLSearchParams({
        search: search,
        asset_type: assetType,
        sort_by: sortByVal,
        sort_order: sortOrderVal
    }))
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateAssetsTable(data.assets);
            } else {
                showAlert('Error loading assets: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showAlert('Error loading assets. Please try again.', 'danger');
        });
}

function updateAssetsTable(assets) {
    const container = document.getElementById('assetsContainer');
    container.innerHTML = '';

    if (assets.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Assets Found</h5>
                    <p class="text-muted">Try adjusting your search or filter criteria.</p>
                </div>
            </div>
        `;
        return;
    }

    assets.forEach(function(asset) {
        const plClass = asset.unrealized_pl >= 0 ? 'text-success' : 'text-danger';
        const plPercentClass = asset.unrealized_pl_percent >= 0 ? 'text-success' : 'text-danger';

        const card = `
            <div class="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4" data-asset-id="${asset.id}">
                <div class="card h-100 border-left-primary">
                    <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="card-title mb-0">${asset.name}</h6>
                            <span class="badge bg-primary">${asset.asset_type}</span>
                        </div>
                        <small class="text-muted">${asset.symbol}</small>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Current Price</small>
                                <div class="h6 mb-0">₹${parseFloat(asset.current_price).toFixed(2)}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">Quantity</small>
                                <div class="h6 mb-0">${parseFloat(asset.quantity).toFixed(4)}</div>
                            </div>
                        </div>
                        <hr>
                        <div class="row text-center">
                            <div class="col-6">
                                <small class="text-muted">Total Value</small>
                                <div class="h6 mb-0">₹${parseFloat(asset.total_value).toFixed(2)}</div>
                            </div>
                            <div class="col-6">
                                <small class="text-muted">P/L</small>
                                <div class="h6 mb-0 ${plClass}">₹${parseFloat(asset.unrealized_pl).toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="text-center mt-2">
                            <small class="text-muted">P/L %</small>
                            <div class="h5 ${plPercentClass}">${parseFloat(asset.unrealized_pl_percent).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-sm btn-outline-info update-price-btn" data-asset-id="${asset.id}">
                                <i class="fas fa-sync"></i> Update
                            </button>
                            <button class="btn btn-sm btn-outline-warning edit-asset-btn" data-asset-id="${asset.id}" data-bs-toggle="modal" data-bs-target="#editAssetModal">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-asset-btn" data-asset-id="${asset.id}">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', card);
    });

    // Update asset count badge
    const assetCountBadge = document.getElementById('assetCountBadge');
    if (assetCountBadge) assetCountBadge.textContent = assets.length + ' Assets';

    // Re-bind events for dynamically added buttons
    bindButtonEvents();
}

function bindButtonEvents() {
    // Update price button click
    document.querySelectorAll('.update-price-btn').forEach(btn => {
        btn.removeEventListener('click', updatePriceBtnHandler);
        btn.addEventListener('click', updatePriceBtnHandler);
    });

    // Edit asset button click
    document.querySelectorAll('.edit-asset-btn').forEach(btn => {
        btn.removeEventListener('click', editAssetBtnHandler);
        btn.addEventListener('click', editAssetBtnHandler);
    });

    // Delete asset buttons
    document.querySelectorAll('.delete-asset-btn').forEach(btn => {
        btn.removeEventListener('click', deleteAssetBtnHandler);
        btn.addEventListener('click', deleteAssetBtnHandler);
    });
}

function updatePriceBtnHandler(e) {
    e.preventDefault();
    e.stopPropagation();
    const assetId = this.dataset.assetId;
    const updatePriceModal = document.getElementById('updatePriceModal');
    updatePriceModal.dataset.assetId = assetId;
    document.getElementById('asset_id').value = assetId;
    document.getElementById('new_price').value = '';
    const modal = new bootstrap.Modal(updatePriceModal);
    modal.show();
    return false;
}

function editAssetBtnHandler(e) {
    const assetId = this.dataset.assetId;
    loadAssetData(assetId);
}

function deleteAssetBtnHandler(e) {
    const assetId = this.dataset.assetId;
    deleteAsset(assetId);
}

function addAsset() {
    const formData = new FormData(document.getElementById('addAssetForm'));

    fetch('/portfolio/add', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(response => {
            const addAssetModal = document.getElementById('addAssetModal');
            const modal = bootstrap.Modal.getInstance(addAssetModal);
            modal.hide();
            document.getElementById('addAssetForm').reset();
            showAlert('Asset added successfully!', 'success');
            setTimeout(() => { location.reload(); }, 1500);
        })
        .catch(error => {
            showAlert('Error adding asset. Please try again.', 'danger');
        });
}

function updateAssetPrice() {
    const updatePriceModal = document.getElementById('updatePriceModal');
    const assetId = updatePriceModal.dataset.assetId;
    const newPrice = document.getElementById('new_price').value;

    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) <= 0) {
        showAlert('Please enter a valid price greater than 0.', 'danger');
        return;
    }

    fetch('/portfolio/update-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            asset_id: assetId,
            new_price: newPrice
        })
    })
        .then(response => response.json())
        .then(response => {
            if (response.success) {
                const modal = bootstrap.Modal.getInstance(updatePriceModal);
                modal.hide();
                document.getElementById('updatePriceForm').reset();
                showAlert(response.message, 'success');
                setTimeout(() => { location.reload(); }, 1500);
            } else {
                showAlert('Error: ' + response.message, 'danger');
            }
        })
        .catch(error => {
            showAlert('Error updating price. Please try again.', 'danger');
        });
}

function loadAssetData(assetId) {
    fetch(`/portfolio/api/assets/${assetId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const asset = data.asset;
                document.getElementById('edit_name').value = asset.name;
                document.getElementById('edit_symbol').value = asset.symbol;
                document.getElementById('edit_asset_type').value = asset.asset_type;
                document.getElementById('edit_current_price').value = parseFloat(asset.current_price).toFixed(2);
                document.getElementById('edit_quantity').value = parseFloat(asset.quantity).toFixed(4);
                document.getElementById('edit_purchase_price').value = parseFloat(asset.purchase_price).toFixed(2);
                document.getElementById('edit_purchase_date').value = asset.purchase_date;
                document.getElementById('editAssetModal').dataset.assetId = assetId;
            } else {
                showAlert('Error loading asset data: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showAlert('Error loading asset data. Please try again.', 'danger');
        });
}

function editAsset() {
    const editAssetModal = document.getElementById('editAssetModal');
    const assetId = editAssetModal.dataset.assetId;
    const formData = new FormData();
    formData.append('name', document.getElementById('edit_name').value);
    formData.append('symbol', document.getElementById('edit_symbol').value);
    formData.append('asset_type', document.getElementById('edit_asset_type').value);
    formData.append('current_price', document.getElementById('edit_current_price').value);
    formData.append('quantity', document.getElementById('edit_quantity').value);
    formData.append('purchase_price', document.getElementById('edit_purchase_price').value);
    formData.append('purchase_date', document.getElementById('edit_purchase_date').value);

    fetch(`/portfolio/edit/${assetId}`, {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(response => {
            const modal = bootstrap.Modal.getInstance(editAssetModal);
            modal.hide();
            document.getElementById('editAssetForm').reset();
            showAlert('Asset updated successfully!', 'success');
            setTimeout(() => { location.reload(); }, 1500);
        })
        .catch(error => {
            showAlert('Error updating asset. Please try again.', 'danger');
        });
}

function deleteAsset(assetId) {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
        return;
    }

    fetch(`/portfolio/api/assets/${assetId}/delete`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showAlert('Asset deleted successfully!', 'success');
                const cardElement = document.querySelector(`div[data-asset-id="${assetId}"]`);
                if (cardElement) cardElement.remove();
                updateSummaryAfterDelete();
            } else {
                showAlert('Error deleting asset: ' + data.message, 'danger');
            }
        })
        .catch(error => {
            showAlert('Error deleting asset. Please try again.', 'danger');
        });
}

function updateSummaryAfterDelete() {
    const assetsContainer = document.getElementById('assetsContainer');
    const currentCount = assetsContainer.querySelectorAll('.card').length;
    const assetCountBadge = document.getElementById('assetCountBadge');
    const assetCount = document.getElementById('assetCount');

    if (assetCountBadge) assetCountBadge.textContent = currentCount + ' Assets';
    if (assetCount) assetCount.textContent = currentCount;

    if (currentCount === 0) {
        assetsContainer.innerHTML = `
            <div class="col-12">
                <div class="text-center py-5">
                    <i class="fas fa-chart-pie fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No Assets Yet</h5>
                    <p class="text-muted">Start building your portfolio by adding your first asset.</p>
                </div>
            </div>
        `;
    }
}

function showAlert(message, type) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    const container = document.querySelector('.container-fluid');
    if (container) {
        const alertDiv = document.createElement('div');
        alertDiv.innerHTML = alertHtml;
        container.insertBefore(alertDiv.firstElementChild, container.firstChild);

        setTimeout(function() {
            const alert = document.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Fallback function for update button (called from onclick)
function openUpdateModal(assetId) {
    console.log('Fallback: Update modal opened for asset:', assetId);
    const updatePriceModal = document.getElementById('updatePriceModal');
    updatePriceModal.dataset.assetId = assetId;
    document.getElementById('asset_id').value = assetId;
    document.getElementById('new_price').value = '';
    const modal = new bootstrap.Modal(updatePriceModal);
    modal.show();
}

// Additional functions for rendering data (if needed)
function renderAssets(assets) {
    updateAssetsTable(assets);
}

function renderCharts(assets) {
    console.log('Charts rendered server-side');
}

function renderCategorySummary(assets) {
    console.log('Category summary rendered server-side');
}

function loadRiskAnalysis() {
    console.log('Risk analysis loaded');
}

function loadAlerts() {
    console.log('Alerts loaded');
}
