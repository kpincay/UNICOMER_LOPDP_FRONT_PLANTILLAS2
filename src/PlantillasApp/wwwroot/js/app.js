/* ═══════════════════════════════════════════════
   App Module — CRUD UI logic
   ═══════════════════════════════════════════════ */

const App = (() => {
    let plantillas = [];
    let editingId = null;
    let deletingId = null;

    // DOM refs
    const tbody = document.getElementById('plantillas-tbody');
    const emptyState = document.getElementById('empty-state');
    const tableLoading = document.getElementById('table-loading');
    const searchInput = document.getElementById('search-input');

    // Stats
    const statTotal = document.getElementById('stat-total');
    const statAceptacion = document.getElementById('stat-aceptacion');
    const statSolicitar = document.getElementById('stat-solicitar');

    // Modal — Create/Edit
    const plantillaModal = document.getElementById('plantilla-modal');
    const modalTitle = document.getElementById('modal-title');
    const plantillaForm = document.getElementById('plantilla-form');
    const formId = document.getElementById('form-id');
    const formNombre = document.getElementById('form-nombre');
    const formCodigo = document.getElementById('form-codigo');
    const formVersion = document.getElementById('form-version');
    const formUrl = document.getElementById('form-url');
    const formContenido = document.getElementById('form-contenido');
    const formRequiere = document.getElementById('form-requiere-aceptacion');
    const formSolicitar = document.getElementById('form-solicitar-aceptacion');
    const modalSubmit = document.getElementById('modal-submit');

    // Modal — Delete
    const deleteModal = document.getElementById('delete-modal');
    const deleteName = document.getElementById('delete-name');
    const deleteConfirmBtn = document.getElementById('delete-confirm');

    // Modal — Detail
    const detailModal = document.getElementById('detail-modal');
    const detailTitle = document.getElementById('detail-title');
    const detailBody = document.getElementById('detail-body');

    function init() {
        // New plantilla buttons
        document.getElementById('btn-new-plantilla').addEventListener('click', openCreateModal);
        document.getElementById('btn-empty-new').addEventListener('click', openCreateModal);

        // Refresh
        document.getElementById('btn-refresh').addEventListener('click', loadPlantillas);

        // Search
        searchInput.addEventListener('input', handleSearch);

        // Modal — Create/Edit
        plantillaForm.addEventListener('submit', handleSubmit);
        document.getElementById('modal-close').addEventListener('click', closeModal);
        document.getElementById('modal-cancel').addEventListener('click', closeModal);

        // Modal — Delete
        document.getElementById('delete-modal-close').addEventListener('click', closeDeleteModal);
        document.getElementById('delete-cancel').addEventListener('click', closeDeleteModal);
        deleteConfirmBtn.addEventListener('click', handleDelete);

        // Modal — Detail
        document.getElementById('detail-modal-close').addEventListener('click', closeDetailModal);
        document.getElementById('detail-close-btn').addEventListener('click', closeDetailModal);

        // Close modals on overlay click
        plantillaModal.addEventListener('click', (e) => { if (e.target === plantillaModal) closeModal(); });
        deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });
        detailModal.addEventListener('click', (e) => { if (e.target === detailModal) closeDetailModal(); });

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
                closeDeleteModal();
                closeDetailModal();
            }
        });
    }

    /* ═══════ DATA ═══════ */
    async function loadPlantillas() {
        showTableLoading(true);
        try {
            plantillas = await API.getPlantillas();
            renderTable(plantillas);
            updateStats();
        } catch (err) {
            showToast(err.message, 'error');
            plantillas = [];
            renderTable([]);
        } finally {
            showTableLoading(false);
        }
    }

    function updateStats() {
        statTotal.textContent = plantillas.length;
        statAceptacion.textContent = plantillas.filter(p => p.requiereAceptacion).length;
        statSolicitar.textContent = plantillas.filter(p => p.solicitarAceptacion).length;
    }

    /* ═══════ RENDER ═══════ */
    function renderTable(data) {
        tbody.innerHTML = '';

        if (data.length === 0) {
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        data.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${esc(p.nombre)}</strong></td>
                <td><code style="color:var(--accent);font-size:0.85rem;">${esc(p.codigo)}</code></td>
                <td>${esc(p.versionDoc || '—')}</td>
                <td>${badge(p.requiereAceptacion)}</td>
                <td>${badge(p.solicitarAceptacion)}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn btn-ghost btn-icon-view" title="Ver detalle" data-id="${p.idPlantilla}" data-action="view">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="btn btn-ghost btn-icon-edit" title="Editar" data-id="${p.idPlantilla}" data-action="edit">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="btn btn-ghost btn-icon-delete" title="Eliminar" data-id="${p.idPlantilla}" data-action="delete" data-name="${esc(p.nombre)}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Delegate click events
        tbody.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleActionClick);
        });
    }

    function badge(value) {
        return value
            ? '<span class="badge badge-yes">Sí</span>'
            : '<span class="badge badge-no">No</span>';
    }

    function esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /* ═══════ SEARCH ═══════ */
    function handleSearch() {
        const q = searchInput.value.toLowerCase().trim();
        if (!q) {
            renderTable(plantillas);
            return;
        }
        const filtered = plantillas.filter(p =>
            (p.nombre || '').toLowerCase().includes(q) ||
            (p.codigo || '').toLowerCase().includes(q) ||
            (p.versionDoc || '').toLowerCase().includes(q)
        );
        renderTable(filtered);
    }

    /* ═══════ ACTION DISPATCHER ═══════ */
    function handleActionClick(e) {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        switch (action) {
            case 'view': openDetailModal(id); break;
            case 'edit': openEditModal(id); break;
            case 'delete': openDeleteModal(id, btn.dataset.name); break;
        }
    }

    /* ═══════ CREATE / EDIT MODAL ═══════ */
    function openCreateModal() {
        editingId = null;
        modalTitle.textContent = 'Nueva Plantilla';
        plantillaForm.reset();
        formId.value = '';
        plantillaModal.classList.remove('hidden');
        formNombre.focus();
    }

    function openEditModal(id) {
        const p = plantillas.find(x => x.idPlantilla === id);
        if (!p) return;

        editingId = id;
        modalTitle.textContent = 'Editar Plantilla';
        formId.value = id;
        formNombre.value = p.nombre || '';
        formCodigo.value = p.codigo || '';
        formVersion.value = p.versionDoc || '';
        formUrl.value = p.url || '';
        formContenido.value = p.contenido || '';
        formRequiere.checked = p.requiereAceptacion;
        formSolicitar.checked = p.solicitarAceptacion;

        plantillaModal.classList.remove('hidden');
        formNombre.focus();
    }

    function closeModal() {
        plantillaModal.classList.add('hidden');
        editingId = null;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        const data = {
            nombre: formNombre.value.trim(),
            codigo: formCodigo.value.trim(),
            versionDoc: formVersion.value.trim(),
            url: formUrl.value.trim(),
            contenido: formContenido.value.trim(),
            requiereAceptacion: formRequiere.checked,
            solicitarAceptacion: formSolicitar.checked
        };

        if (!data.nombre || !data.codigo) {
            showToast('Nombre y Código son campos obligatorios', 'error');
            return;
        }

        Auth.setLoading(modalSubmit, true);

        try {
            if (editingId) {
                await API.updatePlantilla(editingId, data);
                showToast('Plantilla actualizada correctamente', 'success');
            } else {
                await API.createPlantilla(data);
                showToast('Plantilla creada correctamente', 'success');
            }
            closeModal();
            await loadPlantillas();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            Auth.setLoading(modalSubmit, false);
        }
    }

    /* ═══════ DELETE MODAL ═══════ */
    function openDeleteModal(id, name) {
        deletingId = id;
        deleteName.textContent = name;
        deleteModal.classList.remove('hidden');
    }

    function closeDeleteModal() {
        deleteModal.classList.add('hidden');
        deletingId = null;
    }

    async function handleDelete() {
        if (!deletingId) return;

        Auth.setLoading(deleteConfirmBtn, true);

        try {
            await API.deletePlantilla(deletingId);
            showToast('Plantilla eliminada correctamente', 'success');
            closeDeleteModal();
            await loadPlantillas();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            Auth.setLoading(deleteConfirmBtn, false);
        }
    }

    /* ═══════ DETAIL MODAL ═══════ */
    function openDetailModal(id) {
        const p = plantillas.find(x => x.idPlantilla === id);
        if (!p) return;

        detailTitle.textContent = p.nombre;
        detailBody.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">ID</span>
                    <span class="detail-value" style="font-size:0.8rem;color:var(--text-muted);">${esc(p.idPlantilla)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Código</span>
                    <span class="detail-value"><code style="color:var(--accent);">${esc(p.codigo)}</code></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Nombre</span>
                    <span class="detail-value">${esc(p.nombre)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Versión</span>
                    <span class="detail-value">${esc(p.versionDoc || '—')}</span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">URL</span>
                    <span class="detail-value">${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.url)}</a>` : '—'}</span>
                </div>
                <div class="detail-item full-width">
                    <span class="detail-label">Contenido</span>
                    <span class="detail-value" style="white-space:pre-wrap;">${esc(p.contenido || '—')}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Requiere Aceptación</span>
                    <span class="detail-value">${badge(p.requiereAceptacion)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Solicitar Aceptación</span>
                    <span class="detail-value">${badge(p.solicitarAceptacion)}</span>
                </div>
            </div>
        `;
        detailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        detailModal.classList.add('hidden');
    }

    /* ═══════ HELPERS ═══════ */
    function showTableLoading(show) {
        tableLoading.classList.toggle('hidden', !show);
        if (show) {
            emptyState.classList.add('hidden');
            tbody.innerHTML = '';
        }
    }

    // Initialize event listeners after DOM ready
    document.addEventListener('DOMContentLoaded', () => init());

    return { loadPlantillas };
})();
