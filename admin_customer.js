const CustomerManagement = {
  template: `
    <div class="container mt-4" style="max-width: 900px;">
      <h2 class="text-center mb-4">Admin Dashboard - Manage Customers</h2>

      <!-- Search Input -->
      <div class="mb-3">
        <input
          type="text"
          class="form-control"
          v-model="searchTerm"
          placeholder="Search customers by name, email, or location"
          @input="filterCustomers"
        >
      </div>

      <!-- Loading and Error Messages -->
      <div v-if="isLoading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>

      <!-- Customer Table -->
      <div class="table-responsive" v-if="!isLoading">
        <table class="table table-bordered table-hover">
          <thead class="table-primary">
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Location</th>
              <th>Pin Code</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="customer in filteredCustomers" :key="customer.id">
              <td>{{ customer.id }}</td>
              <td>{{ customer.name }}</td>
              <td>{{ customer.email }}</td>
              <td>{{ customer.location || 'N/A' }}</td>
              <td>{{ customer.pin_code || 'N/A' }}</td>
              <td>
                <span :class="customer.is_active ? 'text-success' : 'text-danger'">
                  {{ customer.is_active ? 'Active' : 'Blocked' }}
                </span>
              </td>
              <td>
                <button
                  :class="['btn btn-sm', customer.is_active ? 'btn-danger' : 'btn-success']"
                  @click="confirmToggleStatus(customer)"
                >
                  <i :class="['bi', customer.is_active ? 'bi-lock-fill' : 'bi-unlock-fill']"></i>
                  {{ customer.is_active ? 'Block' : 'Unblock' }}
                </button>
              </td>
            </tr>
            <tr v-if="filteredCustomers.length === 0">
              <td colspan="7" class="text-center">No customers found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Confirmation Modal (unchanged from previous version) -->
      <div class="modal fade" :class="{ 'show d-block': showConfirmModal }" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm Action</h5>
              <button type="button" class="btn-close" @click="showConfirmModal = false" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p v-if="selectedCustomer">
                Are you sure you want to {{ selectedCustomer.is_active ? 'block' : 'unblock' }}
                the customer "{{ selectedCustomer.name }}"?
              </p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="showConfirmModal = false">Cancel</button>
              <button
                type="button"
                :class="['btn', selectedCustomer && selectedCustomer.is_active ? 'btn-danger' : 'btn-success']"
                @click="toggleCustomerStatus"
              >
                {{ selectedCustomer && selectedCustomer.is_active ? 'Block' : 'Unblock' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-backdrop fade" :class="{ 'show': showConfirmModal }" v-if="showConfirmModal"></div>
    </div>
  `,
  data() {
    return {
      customers: [],
      filteredCustomers: [],
      searchTerm: '',
      selectedCustomer: null,
      showConfirmModal: false,
      isLoading: true,
      error: null
    };
  },
  created() {
    this.fetchCustomers();
  },
  methods: {
    fetchCustomers() {
      this.isLoading = true;
      this.error = null;

      axios.get('http://127.0.0.1:5000/customers')
        .then(response => {
          this.customers = response.data;
          this.filteredCustomers = [...this.customers];
        })
        .catch(error => {
          this.error = error.response ? error.response.data.error : "Failed to load customers";
          console.error("Error fetching customers:", error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    filterCustomers() {
      // Convert search term to lowercase for case-insensitive search
      const searchLower = this.searchTerm.toLowerCase().trim();

      // Filter customers based on name, email, or location
      this.filteredCustomers = this.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.location && customer.location.toLowerCase().includes(searchLower))
      );
    },
    confirmToggleStatus(customer) {
      this.selectedCustomer = customer;
      this.showConfirmModal = true;
    },
    toggleCustomerStatus() {
      if (!this.selectedCustomer) return;

      const userId = this.selectedCustomer.id;
      const action = this.selectedCustomer.is_active ? 'block' : 'unblock';

      axios.put(`http://127.0.0.1:5000/users/${userId}/${action}`)
        .then(response => {
          // Update the customer in both original and filtered arrays
          const originalIndex = this.customers.findIndex(c => c.id === userId);
          const filteredIndex = this.filteredCustomers.findIndex(c => c.id === userId);

          if (originalIndex !== -1) {
            this.customers[originalIndex].is_active = !this.customers[originalIndex].is_active;
          }

          if (filteredIndex !== -1) {
            this.filteredCustomers[filteredIndex].is_active = !this.filteredCustomers[filteredIndex].is_active;
          }

          // Show success message
          alert(`Customer ${action}ed successfully!`);

          // Close modal
          this.showConfirmModal = false;
          this.selectedCustomer = null;
        })
        .catch(error => {
          alert(error.response ? error.response.data.error : "An error occurred");
          console.error(`Error ${action}ing customer:`, error);
        });
    }
  }
};
