const CustomerManagement = {
     template: `
       <div class="container mt-4" style="max-width: 900px;">
         <h2 class="text-center mb-4">Admin Dashboard - Manage Customers</h2>

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
               <tr v-for="customer in customers" :key="customer.id">
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
               <tr v-if="customers.length === 0">
                 <td colspan="7" class="text-center">No customers found.</td>
               </tr>
             </tbody>
           </table>
         </div>

         <!-- Confirmation Modal -->
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
           })
           .catch(error => {
             this.error = error.response ? error.response.data.error : "Failed to load customers";
             console.error("Error fetching customers:", error);
           })
           .finally(() => {
             this.isLoading = false;
           });
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
             // Update the customer in the local array
             const index = this.customers.findIndex(c => c.id === userId);
             if (index !== -1) {
               this.customers[index].is_active = !this.customers[index].is_active;
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
