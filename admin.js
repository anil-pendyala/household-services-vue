const AdminDashboard = {
  template: `
    <div class="container mt-4" style="max-width: 900px;">
      <h2 class="text-center mb-4">Admin Dashboard - Manage Services</h2>

      <!-- Search Input -->
      <div class="row mb-3">
        <div class="col-md-6">
          <input
            type="text"
            class="form-control"
            v-model="searchTerm"
            placeholder="Search services by name or description"
            @input="filterServices"
          >
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-success" @click="showAddServiceModal = true">
            <i class="bi bi-plus-circle"></i> Add New Service
          </button>
        </div>
      </div>

      <!-- Service Table -->
      <div class="table-responsive">
        <table class="table table-bordered table-hover">
          <thead class="table-primary">
            <tr>
              <th>ID</th>
              <th>Service Name</th>
              <th>Base Price</th>
              <th>Time Required (min)</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="service in filteredServices" :key="service.id">
              <td>{{ service.id }}</td>
              <td>{{ service.name }}</td>
              <td>{{ service.base_price }}</td>
              <td>{{ service.time_required }}</td>
              <td>{{ service.description }}</td>
              <td>
                <button class="btn btn-sm btn-warning me-1" @click="editService(service)">
                  <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-sm btn-danger" @click="confirmDelete(service)">
                  <i class="bi bi-trash"></i> Delete
                </button>
              </td>
            </tr>
            <tr v-if="filteredServices.length === 0">
              <td colspan="6" class="text-center">No services found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Loading and Error Messages -->
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

      <!-- Add Service Modal (unchanged) -->
      <div class="modal fade" :class="{ 'show d-block': showAddServiceModal }" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ isEditing ? 'Edit Service' : 'Add New Service' }}</h5>
              <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitService">
                <div class="mb-3">
                  <label class="form-label">Service Name:</label>
                  <input type="text" v-model="currentService.name" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Base Price:</label>
                  <input type="number" v-model="currentService.base_price" class="form-control" min="0" step="0.01" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Time Required (minutes):</label>
                  <input type="number" v-model="currentService.time_required" class="form-control" min="0" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Description:</label>
                  <textarea v-model="currentService.description" class="form-control" rows="3"></textarea>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
                  <button type="submit" class="btn btn-primary">{{ isEditing ? 'Update' : 'Add' }} Service</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showAddServiceModal }" v-if="showAddServiceModal"></div>

      <!-- Delete Confirmation Modal (unchanged) -->
      <div class="modal fade" :class="{ 'show d-block': showDeleteModal }" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Delete</h5>
              <button type="button" class="btn-close" @click="showDeleteModal = false" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete the service "{{ serviceToDelete?.name }}"?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">Cancel</button>
              <button type="button" class="btn btn-danger" @click="deleteService">Delete</button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showDeleteModal }" v-if="showDeleteModal"></div>
    </div>
  `,
  data() {
    return {
      services: [],
      filteredServices: [],
      searchTerm: '',
      currentService: {
        id: null,
        name: '',
        base_price: 0,
        time_required: 0,
        description: ''
      },
      isEditing: false,
      showAddServiceModal: false,
      showDeleteModal: false,
      serviceToDelete: null,
      isLoading: true,
      error: null
    };
  },
  created() {
    this.fetchServices();
  },
  methods: {
    fetchServices() {
      this.isLoading = true;
      this.error = null;

      axios.get('http://127.0.0.1:5000/services')
        .then(response => {
          this.services = response.data;
          this.filteredServices = [...this.services];
        })
        .catch(error => {
          this.error = error.response ? error.response.data.error : "Failed to load services";
          console.error("Error fetching services:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    filterServices() {
      // Convert search term to lowercase for case-insensitive search
      const searchLower = this.searchTerm.toLowerCase().trim();

      // Filter services based on name or description
      this.filteredServices = this.services.filter(service =>
        service.name.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower)
      );
    },
    editService(service) {
      this.isEditing = true;
      this.currentService = { ...service };
      this.showAddServiceModal = true;
    },
    closeModal() {
      this.showAddServiceModal = false;
      this.isEditing = false;
      this.currentService = {
        id: null,
        name: '',
        base_price: 0,
        time_required: 0,
        description: ''
      };
    },
    submitService() {
      const endpoint = this.isEditing
        ? `http://127.0.0.1:5000/services/${this.currentService.id}`
        : 'http://127.0.0.1:5000/services';

      const method = this.isEditing ? 'put' : 'post';

      axios[method](endpoint, this.currentService)
        .then(response => {
          // Show success message
          alert(this.isEditing ? 'Service updated successfully!' : 'Service added successfully!');
          // Refresh the service list
          this.fetchServices();
          // Close the modal
          this.closeModal();
        })
        .catch(error => {
          alert(error.response ? error.response.data.error : "An error occurred");
          console.error("Error submitting service:", error);
        });
    },
    confirmDelete(service) {
      this.serviceToDelete = service;
      this.showDeleteModal = true;
    },
    deleteService() {
      if (!this.serviceToDelete) return;

      axios.delete(`http://127.0.0.1:5000/services/${this.serviceToDelete.id}`)
        .then(response => {
          // Show success message
          alert('Service deleted successfully!');
          // Refresh the service list
          this.fetchServices();
          // Close the modal
          this.showDeleteModal = false;
          this.serviceToDelete = null;
        })
        .catch(error => {
          alert(error.response ? error.response.data.error : "An error occurred");
          console.error("Error deleting service:", error);
        });
    }
  }
};
